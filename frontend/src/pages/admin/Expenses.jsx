import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Check, X } from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ expenseType:'Rent', amount:'', description:'' });

  useEffect(() => { load(); }, []);
  const load = () => api.get('/expenses').then(r => setExpenses(r.data.data));

  const submit = async () => {
    try {
      await api.post('/expenses', { ...form, amount: parseFloat(form.amount) });
      toast.success('Expense submitted'); setShowForm(false);
      setForm({ expenseType:'Rent', amount:'', description:'' }); load();
    } catch(e) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const approve = async id => { await api.put(`/expenses/${id}/approve`); toast.success('Approved'); load(); };
  const reject = async id => { await api.put(`/expenses/${id}/reject`); toast.success('Rejected'); load(); };

  return (
    <Layout title="Office Expenses">
      <div className="page-header">
        <h2>Office Expenses</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={15}/> Add Expense</button>
      </div>
      {showForm && (
        <div className="form-section" style={{ marginBottom:20 }}>
          <div className="form-section-title">New Expense</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-control" value={form.expenseType} onChange={e => setForm({...form, expenseType:e.target.value})}>
                {['Rent','EB','Petrol','Salary','Other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount <span className="req">*</span></label>
              <input className="form-control" type="number" value={form.amount} onChange={e => setForm({...form, amount:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-control" value={form.description} onChange={e => setForm({...form, description:e.target.value})} />
            </div>
          </div>
          <div className="mt-4" style={{ display:'flex', gap:8 }}>
            <button className="btn btn-primary" onClick={submit}>Submit</button>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}
      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Type</th><th>Amount</th><th>Description</th><th>By</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.ExpenseID}>
                  <td><strong>{e.ExpenseType}</strong></td>
                  <td style={{ color:'var(--amber)', fontFamily:'Syne', fontWeight:700 }}>₹ {parseFloat(e.Amount).toLocaleString('en-IN')}</td>
                  <td className="text-muted">{e.Description || '-'}</td>
                  <td>{e.CreatedByName}</td>
                  <td className="text-muted">{new Date(e.ExpenseDate).toLocaleDateString('en-IN')}</td>
                  <td><span className={`badge badge-${e.Status?.toLowerCase()}`}>{e.Status}</span></td>
                  <td>
                    {e.Status === 'Pending' && (
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-sm btn-success" onClick={() => approve(e.ExpenseID)}><Check size={12}/></button>
                        <button className="btn btn-sm btn-danger" onClick={() => reject(e.ExpenseID)}><X size={12}/></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
