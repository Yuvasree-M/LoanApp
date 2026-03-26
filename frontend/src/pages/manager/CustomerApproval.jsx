import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Check, X } from 'lucide-react';

export default function CustomerApproval() {
  const [customers, setCustomers] = useState([]);
  const [displayChoices, setDisplayChoices] = useState({});

  useEffect(() => { load(); }, []);
  const load = () => api.get('/customers', { params:{ status:'Pending' } }).then(r => setCustomers(r.data.data));

  const approve = async c => {
    const choice = displayChoices[c.CustomerID] || 'FullName';
    try {
      await api.put(`/customers/${c.CustomerID}/approve`, { displayField: choice });
      toast.success('Customer approved!'); load();
    } catch(e) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const reject = async id => {
    if (!window.confirm('Reject this customer?')) return;
    try { await api.put(`/customers/${id}/reject`); toast.success('Rejected'); load(); }
    catch(e) { toast.error('Error'); }
  };

  return (
    <Layout title="Customer Approval">
      <div className="page-header">
        <h2>Pending Approvals</h2>
        <span className="badge badge-pending">{customers.length} Pending</span>
      </div>
      {!customers.length ? (
        <div className="empty-state">
          <Check size={48} /> <p>No pending customer approvals</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {customers.map(c => (
            <div key={c.CustomerID} className="panel">
              <div className="panel-body">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:20, alignItems:'start' }}>
                  <div>
                    <p className="text-muted" style={{ fontSize:11 }}>CUSTOMER DETAILS</p>
                    <strong style={{ fontFamily:'Syne', fontSize:16 }}>{c.FullName}</strong>
                    {c.ShopName && <p style={{ fontSize:13, color:'var(--muted)' }}>{c.ShopName}</p>}
                    <p style={{ fontSize:13, marginTop:4 }}>📞 {c.MobileNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted" style={{ fontSize:11 }}>AADHAAR & AREA</p>
                    <p style={{ fontFamily:'monospace', fontSize:14 }}>{c.AadhaarNumber}</p>
                    <p style={{ fontSize:13, color:'var(--accent)' }}>📍 {c.AreaName}</p>
                  </div>
                  <div>
                    <p className="text-muted" style={{ fontSize:11 }}>SUBMITTED BY</p>
                    <p style={{ fontSize:13 }}>{c.CreatedByName}</p>
                    <p style={{ fontSize:12, color:'var(--muted)' }}>{new Date(c.CreatedDate).toLocaleString('en-IN')}</p>
                    <div style={{ marginTop:10 }}>
                      <label className="form-label" style={{ marginBottom:4 }}>Display Name</label>
                      <select className="form-control" style={{ padding:'6px 10px', fontSize:13 }}
                        value={displayChoices[c.CustomerID] || 'FullName'}
                        onChange={e => setDisplayChoices(prev => ({...prev, [c.CustomerID]: e.target.value}))}>
                        <option value="FullName">{c.FullName}</option>
                        {c.ShopName && <option value="ShopName">{c.ShopName}</option>}
                        {c.NickName && <option value="NickName">{c.NickName}</option>}
                      </select>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <button className="btn btn-success" onClick={() => approve(c)}>
                      <Check size={14}/> Approve
                    </button>
                    <button className="btn btn-danger" onClick={() => reject(c.CustomerID)}>
                      <X size={14}/> Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
