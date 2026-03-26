import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Phone, Plus, Eye, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MyAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [areas, setAreas] = useState([]);
  const [filterArea, setFilterArea] = useState('');
  const [search, setSearch] = useState('');
  const [collectModal, setCollectModal] = useState(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [gps, setGps] = useState({ lat:'', lng:'', captured:false });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { load(); }, [filterArea, search]);
  const load = () => api.get('/collections/agent-accounts', { params:{ areaID:filterArea, search } })
    .then(r => {
      setAccounts(r.data.data);
      const unique = [...new Map(r.data.data.map(a => [a.AreaID, { AreaID:a.AreaID, AreaName:a.AreaName }])).values()];
      setAreas(unique);
    });

  const captureGPS = () => {
    if (!navigator.geolocation) { toast.error('GPS not available'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setGps({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6), captured:true }),
      () => toast.error('Location access denied')
    );
  };

  const saveCollection = async () => {
    const amt = parseFloat(amount) || 0;
    if (amt === 0 && !reason) { toast.error('Enter reason for no collection'); return; }
    if (!gps.captured) { toast.error('GPS location required'); return; }
    setSaving(true);
    try {
      await api.post('/collections', {
        accountID: collectModal.AccountID, amount: amt,
        noCollectionReason: amt === 0 ? reason : null,
        latitude: gps.lat, longitude: gps.lng
      });
      toast.success('Collection saved!');
      setCollectModal(null); setAmount(''); setReason('');
      setGps({ lat:'', lng:'', captured:false }); load();
    } catch(e) { toast.error(e.response?.data?.message || 'Error'); }
    setSaving(false);
  };

  return (
    <Layout title="My Accounts">
      <div className="page-header"><h2>My Accounts</h2></div>

      <div className="search-bar">
        <input className="form-control" placeholder="Search account, customer, mobile..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-control" style={{ maxWidth:180 }} value={filterArea} onChange={e => setFilterArea(e.target.value)}>
          <option value="">All Areas</option>
          {areas.map(a => <option key={a.AreaID} value={a.AreaID}>📍 {a.AreaName}</option>)}
        </select>
      </div>

      <div className="account-grid">
        {accounts.map(a => (
          <div key={a.AccountID} className="account-card">
            <a className="phone-btn" href={`tel:${a.MobileNumber}`}>
              <Phone size={15}/>
            </a>
            <div className="ac-number">{a.AccountNumber}</div>
            <div className="ac-name">{a.CustomerName}</div>
            <div className="ac-area"><MapPin size={10}/> {a.AreaName}</div>
            <div className="ac-due">₹ {parseFloat(a.DueAmount).toLocaleString('en-IN')}</div>
            <div className="ac-balance">Balance: ₹ {parseFloat(a.BalanceAmount).toLocaleString('en-IN')}</div>
            <div style={{ display:'flex', gap:6, marginTop:8 }}>
              <span className="badge badge-active">✓ Paid: {a.DuesPaid}</span>
              <span className="badge badge-blocked">✗ Crossed: {a.DuesCrossed}</span>
              <span className={`badge badge-${a.LoanType?.toLowerCase()}`}>{a.LoanType}</span>
            </div>
            {a.TodayCollected > 0 && (
              <div className="alert alert-success" style={{ marginTop:10, padding:'6px 10px', fontSize:12 }}>
                ✓ Collected today: ₹{parseFloat(a.TodayCollected).toLocaleString('en-IN')}
              </div>
            )}
            <div className="ac-footer">
              <button className="btn btn-primary" style={{ flex:2 }}
                onClick={() => { setCollectModal(a); setAmount(a.DueAmount?.toString()); }}>
                <Plus size={14}/> Add Collection
              </button>
              <button className="btn btn-secondary" style={{ flex:1 }}
                onClick={() => navigate(`/accounts/${a.AccountID}`)}>
                <Eye size={14}/>
              </button>
            </div>
          </div>
        ))}
        {!accounts.length && <div className="empty-state"><p>No accounts assigned</p></div>}
      </div>

      {/* COLLECTION MODAL */}
      {collectModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'var(--navy2)', border:'1px solid var(--border)', borderRadius:16, padding:28, width:420, maxWidth:'95vw' }}>
            <h3 style={{ fontFamily:'Syne', marginBottom:4 }}>Enter Collection</h3>
            <p className="text-muted" style={{ fontSize:13, marginBottom:20 }}>
              {collectModal.CustomerName} — {collectModal.AccountNumber}
            </p>

            <div className="form-group" style={{ marginBottom:14 }}>
              <label className="form-label">Collection Amount ₹</label>
              <input className="form-control" type="number" value={amount}
                onChange={e => setAmount(e.target.value)} style={{ fontSize:22, fontFamily:'Syne', fontWeight:800 }} autoFocus />
            </div>

            {(parseFloat(amount) === 0 || amount === '') && (
              <div className="form-group" style={{ marginBottom:14 }}>
                <label className="form-label">Reason for No Collection <span className="req">*</span></label>
                <select className="form-control" value={reason} onChange={e => setReason(e.target.value)}>
                  <option value="">-- Select Reason --</option>
                  {['Customer Not Available','Shop Closed','Account Transfer Later','Tomorrow','Hospital','Festival','Other'].map(r => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group" style={{ marginBottom:20 }}>
              <label className="form-label">GPS Location <span className="req">*</span></label>
              <button type="button" className={`btn ${gps.captured ? 'btn-success' : 'btn-secondary'}`} onClick={captureGPS}>
                <MapPin size={14}/> {gps.captured ? `✓ ${gps.lat}, ${gps.lng}` : 'Capture GPS'}
              </button>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-primary" style={{ flex:1 }} onClick={saveCollection} disabled={saving}>
                {saving ? 'Saving...' : '✓ Save Collection'}
              </button>
              <button className="btn btn-secondary" onClick={() => { setCollectModal(null); setAmount(''); setReason(''); setGps({ lat:'', lng:'', captured:false }); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
