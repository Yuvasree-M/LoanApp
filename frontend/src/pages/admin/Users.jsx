import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit, ToggleLeft, Search, X } from 'lucide-react';

const ROLES = ['ADMIN','MANAGER','AREAMANAGER','AGENT','OFFICESTAFF'];
const ROLE_LABELS = { ADMIN:'Admin', MANAGER:'Manager', AREAMANAGER:'Area Manager', AGENT:'Agent', OFFICESTAFF:'Office Staff' };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [managers, setManagers] = useState([]);
  const [areaMgrs, setAreaMgrs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editID, setEditID] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [form, setForm] = useState({ fullName:'', mobileNumber:'', username:'', password:'', role:'', status:'Active', reportingTo:'', areas:[] });
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (showForm) {
      api.get('/areas').then(r => setAreas(r.data.data));
      api.get('/users/by-role/MANAGER').then(r => setManagers(r.data.data));
      api.get('/users/by-role/AREAMANAGER').then(r => setAreaMgrs(r.data.data));
    }
  }, [showForm]);

  const load = () => {
    api.get('/users', { params: { search, role: filterRole } }).then(r => setUsers(r.data.data));
  };

  const handleAreaMgrChange = async (amID) => {
    setForm(f => ({ ...f, reportingTo: amID, areas: [] }));
    if (amID) {
      const r = await api.get(`/users/manager-areas/${amID}`);
      setAreas(r.data.data);
    }
  };

  const submit = async () => {
    if (!form.fullName || !form.mobileNumber || !form.username || !form.role) {
      toast.error('Fill all required fields'); return;
    }
    if (!editID && !form.password) { toast.error('Password required'); return; }
    setLoading(true);
    try {
      const payload = { ...form, areas: form.areas.map(Number) };
      if (editID) await api.put(`/users/${editID}`, payload);
      else await api.post('/users', payload);
      toast.success(editID ? 'User updated' : 'User created');
      setShowForm(false); setEditID(null);
      setForm({ fullName:'', mobileNumber:'', username:'', password:'', role:'', status:'Active', reportingTo:'', areas:[] });
      load();
    } catch(e) { toast.error(e.response?.data?.message || 'Error'); }
    setLoading(false);
  };

  const toggleStatus = async (u) => {
    await api.put(`/users/${u.UserID}`, { ...u, fullName:u.FullName, mobileNumber:u.MobileNumber, username:u.Username,
      role:u.Role, status: u.Status === 'Active' ? 'Hold' : 'Active' });
    toast.success('Status updated'); load();
  };

  const statusBadge = s => <span className={`badge badge-${s?.toLowerCase()}`}>{s}</span>;

  return (
    <Layout title="User Management">
      <div className="page-header">
        <h2>Users</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={15}/> Add User</button>
      </div>

      <div className="search-bar">
        <input className="form-control" placeholder="Search name, username, mobile..." value={search}
          onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==='Enter' && load()} />
        <select className="form-control" style={{ maxWidth:180 }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <button className="btn btn-secondary" onClick={load}><Search size={15}/></button>
      </div>

      {showForm && (
        <div className="form-section" style={{ marginBottom:20, border:'1px solid rgba(0,212,170,0.3)' }}>
          <div className="form-section-title">
            {editID ? 'Edit User' : 'Add New User'}
            <button className="btn btn-sm btn-secondary" style={{ marginLeft:'auto' }} onClick={() => setShowForm(false)}><X size={14}/></button>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name <span className="req">*</span></label>
              <input className="form-control" value={form.fullName} onChange={e => setForm({...form, fullName:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile <span className="req">*</span></label>
              <input className="form-control" value={form.mobileNumber} onChange={e => setForm({...form, mobileNumber:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Username <span className="req">*</span></label>
              <input className="form-control" value={form.username} onChange={e => setForm({...form, username:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Password {!editID && <span className="req">*</span>}</label>
              <input className="form-control" type="password" placeholder={editID ? 'Leave blank to keep' : ''}
                value={form.password} onChange={e => setForm({...form, password:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Role <span className="req">*</span></label>
              <select className="form-control" value={form.role} onChange={e => setForm({...form, role:e.target.value, areas:[], reportingTo:''})}>
                <option value="">-- Select Role --</option>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm({...form, status:e.target.value})}>
                <option>Active</option><option>Hold</option><option>Blocked</option>
              </select>
            </div>
          </div>

          {(form.role === 'AREAMANAGER') && (
            <div className="form-grid" style={{ marginTop:16 }}>
              <div className="form-group">
                <label className="form-label">Reporting Manager <span className="req">*</span></label>
                <select className="form-control" value={form.reportingTo} onChange={e => setForm({...form, reportingTo:e.target.value})}>
                  <option value="">-- Select Manager --</option>
                  {managers.map(m => <option key={m.UserID} value={m.UserID}>{m.FullName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assign Areas (Multi)</label>
                <select className="form-control" multiple style={{ height:120 }} value={form.areas.map(String)}
                  onChange={e => setForm({...form, areas: Array.from(e.target.selectedOptions, o => o.value)})}>
                  {areas.map(a => <option key={a.AreaID} value={a.AreaID}>{a.AreaName} ({a.AccountCount} accounts)</option>)}
                </select>
              </div>
            </div>
          )}

          {form.role === 'AGENT' && (
            <div className="form-grid" style={{ marginTop:16 }}>
              <div className="form-group">
                <label className="form-label">Area Manager <span className="req">*</span></label>
                <select className="form-control" value={form.reportingTo}
                  onChange={e => { setForm({...form, reportingTo:e.target.value}); handleAreaMgrChange(e.target.value); }}>
                  <option value="">-- Select Area Manager --</option>
                  {areaMgrs.map(m => <option key={m.UserID} value={m.UserID}>{m.FullName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assign Areas (under selected AM)</label>
                <select className="form-control" multiple style={{ height:120 }} value={form.areas.map(String)}
                  onChange={e => setForm({...form, areas: Array.from(e.target.selectedOptions, o => o.value)})}>
                  {areas.map(a => <option key={a.AreaID} value={a.AreaID}>{a.AreaName} ({a.AccountCount} accounts)</option>)}
                </select>
              </div>
            </div>
          )}

          {form.role === 'MANAGER' && (
            <div className="form-grid" style={{ marginTop:16 }}>
              <div className="form-group">
                <label className="form-label">Assign Areas (Optional)</label>
                <select className="form-control" multiple style={{ height:120 }} value={form.areas.map(String)}
                  onChange={e => setForm({...form, areas: Array.from(e.target.selectedOptions, o => o.value)})}>
                  {areas.map(a => <option key={a.AreaID} value={a.AreaID}>{a.AreaName}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="mt-4" style={{ display:'flex', gap:8 }}>
            <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? 'Saving...' : 'Save User'}</button>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>ID</th><th>Name</th><th>Username</th><th>Mobile</th>
              <th>Role</th><th>Reports To</th><th>Areas</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.UserID}>
                  <td>{u.UserID}</td>
                  <td><strong>{u.FullName}</strong></td>
                  <td><code style={{ fontSize:12, color:'var(--muted)' }}>{u.Username}</code></td>
                  <td>{u.MobileNumber}</td>
                  <td><span className="badge badge-pending">{ROLE_LABELS[u.Role] || u.Role}</span></td>
                  <td className="text-muted">{u.ReportingName || '-'}</td>
                  <td style={{ maxWidth:160, fontSize:12, color:'var(--muted)' }}>{u.Areas || '-'}</td>
                  <td>{statusBadge(u.Status)}</td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-sm btn-secondary"
                        onClick={() => { setEditID(u.UserID); setForm({ fullName:u.FullName, mobileNumber:u.MobileNumber, username:u.Username, password:'', role:u.Role, status:u.Status, reportingTo:'', areas:[] }); setShowForm(true); }}>
                        <Edit size={12}/>
                      </button>
                      <button className="btn btn-sm btn-warning" onClick={() => toggleStatus(u)}>
                        <ToggleLeft size={12}/> {u.Status === 'Active' ? 'Hold' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan={9} className="empty-state"><p>No users found</p></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
