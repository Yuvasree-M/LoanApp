import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AddAccount() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    loanType:'Daily', loanAmount:'', givenAmount:'', numberOfDues:'',
    dueAmount:'', startDate: new Date().toISOString().split('T')[0], assignedAgentID:''
  });

  useEffect(() => { api.get('/users/by-role/AGENT').then(r => setAgents(r.data.data)); }, []);

  useEffect(() => {
    const dues = parseInt(form.numberOfDues) || 0;
    const loan = parseFloat(form.loanAmount) || 0;
    if (dues > 0 && loan > 0) setForm(f => ({ ...f, dueAmount: (loan / dues).toFixed(2) }));
  }, [form.numberOfDues, form.loanAmount]);

  const calcEndDate = () => {
    if (!form.startDate || !form.numberOfDues) return '';
    const d = new Date(form.startDate);
    const n = parseInt(form.numberOfDues);
    if (form.loanType === 'Daily') d.setDate(d.getDate() + n);
    else if (form.loanType === 'Weekly') d.setDate(d.getDate() + n * 7);
    else d.setMonth(d.getMonth() + n);
    return d.toLocaleDateString('en-IN');
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    const r = await api.get('/customers', { params:{ search, status:'Active' } });
    setResults(r.data.data);
  };

  const submit = async () => {
    if (!selected) { toast.error('Select a customer'); return; }
    if (!form.loanAmount || !form.givenAmount || !form.numberOfDues) { toast.error('Fill all required fields'); return; }
    setLoading(true);
    try {
      const r = await api.post('/accounts', { ...form, customerID: selected.CustomerID,
        loanAmount:parseFloat(form.loanAmount), givenAmount:parseFloat(form.givenAmount),
        numberOfDues:parseInt(form.numberOfDues), dueAmount:parseFloat(form.dueAmount),
        assignedAgentID: form.assignedAgentID || null });
      toast.success(`Account ${r.data.accountNumber} created!`);
      setSelected(null); setSearch(''); setResults([]);
      setForm({ loanType:'Daily', loanAmount:'', givenAmount:'', numberOfDues:'', dueAmount:'', startDate:new Date().toISOString().split('T')[0], assignedAgentID:'' });
    } catch(e) { toast.error(e.response?.data?.message || 'Error'); }
    setLoading(false);
  };

  const DUE_LABEL = { Daily:'Number of Days', Weekly:'Number of Weeks', Monthly:'Number of Months' };

  return (
    <Layout title="Create Loan Account">
      <div className="page-header"><h2>Create Loan Account</h2></div>

      <div className="form-section">
        <div className="form-section-title">👤 Customer Selection</div>
        <div style={{ display:'flex', gap:10, marginBottom:14 }}>
          <input className="form-control" style={{ maxWidth:360 }} placeholder="Search by name, mobile, Aadhaar..."
            value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==='Enter' && handleSearch()} />
          <button className="btn btn-secondary" onClick={handleSearch}>Search</button>
        </div>
        {results.length > 0 && (
          <div className="panel" style={{ marginBottom:14 }}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Mobile</th><th>Area</th><th>Select</th></tr></thead>
                <tbody>
                  {results.map(c => (
                    <tr key={c.CustomerID}>
                      <td><strong>{c.DisplayName || c.FullName}</strong></td>
                      <td>{c.MobileNumber}</td>
                      <td>{c.AreaName}</td>
                      <td><button className="btn btn-sm btn-primary" onClick={() => { setSelected(c); setResults([]); }}>Select</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {selected && (
          <div className="alert alert-success">
            ✓ Selected: <strong>{selected.DisplayName || selected.FullName}</strong> &nbsp;|&nbsp;
            📞 {selected.MobileNumber} &nbsp;|&nbsp; 📍 {selected.AreaName}
            <button className="btn btn-sm btn-secondary" style={{ marginLeft:12 }} onClick={() => setSelected(null)}>Change</button>
          </div>
        )}
      </div>

      <div className="form-section">
        <div className="form-section-title">📄 Loan Details</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Loan Type <span className="req">*</span></label>
            <select className="form-control" value={form.loanType} onChange={e => setForm({...form, loanType:e.target.value})}>
              <option>Daily</option><option>Weekly</option><option>Monthly</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Loan Amount ₹ <span className="req">*</span></label>
            <input className="form-control" type="number" value={form.loanAmount} onChange={e => setForm({...form, loanAmount:e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Given Amount ₹ <span className="req">*</span></label>
            <input className="form-control" type="number" value={form.givenAmount} onChange={e => setForm({...form, givenAmount:e.target.value})} />
          </div>
        </div>
        <div className="form-grid" style={{ marginTop:12 }}>
          <div className="form-group">
            <label className="form-label">{DUE_LABEL[form.loanType]} <span className="req">*</span></label>
            <input className="form-control" type="number" value={form.numberOfDues} onChange={e => setForm({...form, numberOfDues:e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Due Amount ₹ (per collection)</label>
            <input className="form-control" type="number" value={form.dueAmount} onChange={e => setForm({...form, dueAmount:e.target.value})} />
            <span style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>Auto-calculated from Loan ÷ Dues</span>
          </div>
          <div className="form-group">
            <label className="form-label">Start Date <span className="req">*</span></label>
            <input className="form-control" type="date" value={form.startDate} onChange={e => setForm({...form, startDate:e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Expected Completion</label>
            <input className="form-control" value={calcEndDate()} readOnly style={{ background:'rgba(255,255,255,0.03)', cursor:'default' }} />
          </div>
        </div>
        <div className="form-grid" style={{ marginTop:12 }}>
          <div className="form-group">
            <label className="form-label">Assign Agent</label>
            <select className="form-control" value={form.assignedAgentID} onChange={e => setForm({...form, assignedAgentID:e.target.value})}>
              <option value="">-- Unassigned --</option>
              {agents.map(a => <option key={a.UserID} value={a.UserID}>{a.FullName}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <button className="btn btn-primary btn-lg" onClick={submit} disabled={loading || !selected}>
          {loading ? 'Creating...' : '✓ Create Account'}
        </button>
      </div>
    </Layout>
  );
}
