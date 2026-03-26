import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit } from 'lucide-react';

export default function Areas() {
  const [areas, setAreas] = useState([]);
  const [form, setForm] = useState({ areaName:'', areaCode:'', status:'Active' });
  const [editID, setEditID] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);
  const load = () => api.get('/areas').then(r => setAreas(r.data.data));

  const submit = async () => {
    if (!form.areaName) { toast.error('Area name required'); return; }
    try {
      if (editID) await api.put(`/areas/${editID}`, form);
      else await api.post('/areas', form);
      toast.success(editID ? 'Area updated' : 'Area added');
      setShowForm(false); setEditID(null);
      setForm({ areaName:'', areaCode:'', status:'Active' }); load();
    } catch(e) { toast.error(e.response?.data?.message || 'Error'); }
  };

  return (
    <Layout title="Area Management">
      <div className="page-header">
        <h2>Areas</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={15}/> Add Area</button>
      </div>
      {showForm && (
        <div className="form-section" style={{ marginBottom:20, border:'1px solid rgba(0,212,170,0.3)' }}>
          <div className="form-section-title">{editID ? 'Edit Area' : 'Add New Area'}</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Area Name <span className="req">*</span></label>
              <input className="form-control" value={form.areaName} onChange={e => setForm({...form, areaName:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Area Code</label>
              <input className="form-control" value={form.areaCode} onChange={e => setForm({...form, areaCode:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm({...form, status:e.target.value})}>
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
          </div>
          <div className="mt-4" style={{ display:'flex', gap:8 }}>
            <button className="btn btn-primary" onClick={submit}>Save</button>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}
      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Area Name</th><th>Code</th><th>Accounts</th><th>Agents</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {areas.map(a => (
                <tr key={a.AreaID}>
                  <td>{a.AreaID}</td>
                  <td><strong>{a.AreaName}</strong></td>
                  <td><code style={{ fontSize:12 }}>{a.AreaCode}</code></td>
                  <td><span className="badge badge-active">{a.AccountCount}</span></td>
                  <td><span className="badge badge-pending">{a.AgentCount}</span></td>
                  <td><span className={`badge badge-${a.Status?.toLowerCase()}`}>{a.Status}</span></td>
                  <td><button className="btn btn-sm btn-secondary"
                    onClick={() => { setEditID(a.AreaID); setForm({ areaName:a.AreaName, areaCode:a.AreaCode||'', status:a.Status }); setShowForm(true); }}>
                    <Edit size={12}/> Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
