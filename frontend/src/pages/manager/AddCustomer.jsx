import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { MapPin } from 'lucide-react';

export default function AddCustomer() {
  const [areas, setAreas] = useState([]);
  const [gps, setGps] = useState({ lat:'', lng:'', captured:false });
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName:'', shopName:'', nickName:'', mobileNumber:'', altMobileNumber:'',
    aadhaarNumber:'', businessType:'', maritalStatus:'', numberOfChildren:'',
    presentAddress:'', permanentAddress:'', areaID:'', reference:'',
    aadhaarXerox:false, promissoryNote:false, cheque:false,
    otherDocuments:false, otherDocComment:''
  });

  useEffect(() => { api.get('/areas').then(r => setAreas(r.data.data.filter(a => a.Status === 'Active'))); }, []);

  const captureGPS = () => {
    if (!navigator.geolocation) { toast.error('GPS not available'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setGps({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6), captured:true }); toast.success('GPS captured!'); },
      () => toast.error('Location access denied')
    );
  };

  const submit = async e => {
    e.preventDefault();
    if (!form.aadhaarXerox) { toast.error('Aadhaar Xerox is mandatory'); return; }
    if (!form.promissoryNote) { toast.error('Promissory Note is mandatory'); return; }
    if (!gps.captured) { toast.error('GPS location required'); return; }
    setLoading(true);
    try {
      await api.post('/customers', { ...form, latitude: gps.lat, longitude: gps.lng });
      toast.success('Customer submitted for approval!');
      setForm({ fullName:'', shopName:'', nickName:'', mobileNumber:'', altMobileNumber:'', aadhaarNumber:'', businessType:'', maritalStatus:'', numberOfChildren:'', presentAddress:'', permanentAddress:'', areaID:'', reference:'', aadhaarXerox:false, promissoryNote:false, cheque:false, otherDocuments:false, otherDocComment:'' });
      setGps({ lat:'', lng:'', captured:false });
    } catch(e) { toast.error(e.response?.data?.message || 'Error'); }
    setLoading(false);
  };

  const F = (label, key, opts={}) => (
    <div className="form-group">
      <label className="form-label">{label}{opts.req && <span className="req"> *</span>}</label>
      {opts.type === 'select' ? (
        <select className="form-control" value={form[key]} onChange={e => setForm({...form, [key]:e.target.value})}>
          <option value="">-- Select --</option>
          {opts.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : opts.type === 'textarea' ? (
        <textarea className="form-control" value={form[key]} onChange={e => setForm({...form, [key]:e.target.value})} />
      ) : (
        <input className="form-control" type={opts.type || 'text'} value={form[key]}
          maxLength={opts.max} onChange={e => setForm({...form, [key]:e.target.value})} />
      )}
    </div>
  );

  return (
    <Layout title="Add Customer">
      <div className="page-header"><h2>Add New Customer</h2></div>
      <form onSubmit={submit}>
        <div className="form-section">
          <div className="form-section-title">👤 Basic Identity</div>
          <div className="form-grid">
            {F('Full Name', 'fullName', { req:true })}
            {F('Shop Name', 'shopName')}
            {F('Nick Name', 'nickName')}
          </div>
          <div className="alert alert-info" style={{ marginTop:8 }}>
            ℹ Manager will select the Display Name (Full Name / Shop Name / Nick Name) after approval
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">📞 Contact Details</div>
          <div className="form-grid">
            {F('Mobile Number (Primary)', 'mobileNumber', { req:true, max:15 })}
            {F('Alternative Mobile', 'altMobileNumber', { max:15 })}
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">🪪 Government ID</div>
          <div className="form-grid">
            {F('Aadhaar Number', 'aadhaarNumber', { req:true, max:12 })}
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">💼 Business & Personal</div>
          <div className="form-grid">
            {F('Business Type', 'businessType', { type:'select', options:['Retail Shop','Wholesale','Manufacturing','Service','Agriculture','Other'] })}
            {F('Marital Status', 'maritalStatus', { type:'select', options:['Single','Married','Widowed','Divorced'] })}
            {F('Number of Children', 'numberOfChildren', { type:'number' })}
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">🏠 Address & Location</div>
          <div className="form-grid">
            {F('Present Address', 'presentAddress', { type:'textarea' })}
            {F('Permanent Address', 'permanentAddress', { type:'textarea' })}
          </div>
          <div className="form-grid" style={{ marginTop:12 }}>
            <div className="form-group">
              <label className="form-label">Area <span className="req">*</span></label>
              <select className="form-control" value={form.areaID} onChange={e => setForm({...form, areaID:e.target.value})} required>
                <option value="">-- Select Area --</option>
                {areas.map(a => <option key={a.AreaID} value={a.AreaID}>📍 {a.AreaName} ({a.AccountCount} accounts)</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">GPS Location <span className="req">*</span></label>
              <button type="button" className={`btn ${gps.captured ? 'btn-success' : 'btn-secondary'}`} onClick={captureGPS}>
                <MapPin size={15}/> {gps.captured ? `✓ ${gps.lat}, ${gps.lng}` : 'Capture GPS Location'}
              </button>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">📄 Document Checklist</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
            {[['aadhaarXerox','Aadhaar Xerox *'],['promissoryNote','Promissory Note *'],['cheque','Cheque'],['otherDocuments','Other Documents']].map(([key, label]) => (
              <label key={key} className="checkbox-group">
                <input type="checkbox" checked={form[key]} onChange={e => setForm({...form, [key]:e.target.checked})} />
                <span style={{ fontSize:14 }}>{label}</span>
              </label>
            ))}
          </div>
          {form.otherDocuments && (
            <div className="form-group" style={{ marginTop:12 }}>
              <label className="form-label">Other Documents Description <span className="req">*</span></label>
              <input className="form-control" value={form.otherDocComment} onChange={e => setForm({...form, otherDocComment:e.target.value})} />
            </div>
          )}
        </div>

        <div className="form-section">
          <div className="form-group" style={{ marginBottom:16 }}>
            <label className="form-label">Reference (Name + Mobile)</label>
            <input className="form-control" value={form.reference} onChange={e => setForm({...form, reference:e.target.value})} />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : '✓ Submit Customer'}
          </button>
          <p className="text-muted" style={{ marginTop:8, fontSize:12 }}>
            After submission, Manager must approve before loan accounts can be created.
          </p>
        </div>
      </form>
    </Layout>
  );
}
