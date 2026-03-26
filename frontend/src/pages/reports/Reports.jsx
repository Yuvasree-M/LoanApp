import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import { Download } from 'lucide-react';

export default function Reports() {
  const [tab, setTab] = useState('collections');
  const [data, setData] = useState([]);
  const [agents, setAgents] = useState([]);
  const [areas, setAreas] = useState([]);
  const [filters, setFilters] = useState({ startDate:'', endDate:'', agentID:'', areaID:'', loanType:'' });

  useEffect(() => {
    api.get('/users/by-role/AGENT').then(r => setAgents(r.data.data));
    api.get('/areas').then(r => setAreas(r.data.data));
  }, []);

  useEffect(() => { load(); }, [tab]);

  const load = () => {
    if (tab === 'collections') api.get('/reports/collections', { params: filters }).then(r => setData(r.data.data));
    else if (tab === 'aging') api.get('/reports/aging').then(r => setData(r.data.data));
    else if (tab === 'efficiency') api.get('/reports/agent-efficiency').then(r => setData(r.data.data));
  };

  const BUCKET_COLOR = { 'Current':'var(--accent)', '1-30 Days':'var(--amber)', '31-60 Days':'var(--coral)', '61-90 Days':'var(--coral)', '90+ Days':'#e74c3c' };

  return (
    <Layout title="Reports">
      <div className="page-header">
        <h2>Reports</h2>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[['collections','Collection Report'],['aging','Aging Due Report'],['efficiency','Agent Efficiency']].map(([id,label]) => (
          <button key={id} className={`btn ${tab===id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'collections' && (
        <div className="form-section" style={{ marginBottom:16 }}>
          <div className="form-section-title">Filters</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">From Date</label>
              <input className="form-control" type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">To Date</label>
              <input className="form-control" type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Agent</label>
              <select className="form-control" value={filters.agentID} onChange={e => setFilters({...filters, agentID:e.target.value})}>
                <option value="">All Agents</option>
                {agents.map(a => <option key={a.UserID} value={a.UserID}>{a.FullName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Area</label>
              <select className="form-control" value={filters.areaID} onChange={e => setFilters({...filters, areaID:e.target.value})}>
                <option value="">All Areas</option>
                {areas.map(a => <option key={a.AreaID} value={a.AreaID}>{a.AreaName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Loan Type</label>
              <select className="form-control" value={filters.loanType} onChange={e => setFilters({...filters, loanType:e.target.value})}>
                <option value="">All</option><option>Daily</option><option>Weekly</option><option>Monthly</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop:12 }} onClick={load}>Apply Filters</button>
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Results — {data.length} records</span>
          <button className="btn btn-sm btn-secondary"><Download size={13}/> Export CSV</button>
        </div>
        <div className="table-wrap">
          {tab === 'collections' && (
            <table>
              <thead><tr><th>Date</th><th>Customer</th><th>Account#</th><th>Type</th><th>Agent</th><th>Area</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {data.map((d,i) => (
                  <tr key={i}>
                    <td className="text-muted">{new Date(d.CollectionDate).toLocaleDateString('en-IN')}</td>
                    <td><strong>{d.CustomerName}</strong><br/><span style={{ fontSize:11, color:'var(--muted)' }}>{d.MobileNumber}</span></td>
                    <td><code style={{ fontSize:12, color:'var(--accent)' }}>{d.AccountNumber}</code></td>
                    <td><span className={`badge badge-${d.LoanType?.toLowerCase()}`}>{d.LoanType}</span></td>
                    <td>{d.AgentName}</td>
                    <td className="text-muted">{d.AreaName}</td>
                    <td style={{ fontFamily:'Syne', fontWeight:800, color:parseFloat(d.Amount)>0?'var(--accent)':'var(--coral)' }}>
                      {parseFloat(d.Amount)>0 ? '₹ '+parseFloat(d.Amount).toLocaleString('en-IN') : '—'}
                    </td>
                    <td><span className={`badge ${d.IsVerified ? 'badge-verified' : 'badge-pending'}`}>{d.IsVerified ? 'Verified' : 'Pending'}</span></td>
                  </tr>
                ))}
                {!data.length && <tr><td colSpan={8} className="empty-state"><p>No records found</p></td></tr>}
              </tbody>
            </table>
          )}
          {tab === 'aging' && (
            <table>
              <thead><tr><th>Account#</th><th>Customer</th><th>Area</th><th>Type</th><th>Balance</th><th>Overdue Days</th><th>Bucket</th></tr></thead>
              <tbody>
                {data.map((d,i) => (
                  <tr key={i}>
                    <td><code style={{ fontSize:12, color:'var(--accent)' }}>{d.AccountNumber}</code></td>
                    <td><strong>{d.CustomerName}</strong><br/><span style={{ fontSize:11, color:'var(--muted)' }}>{d.MobileNumber}</span></td>
                    <td className="text-muted">{d.AreaName}</td>
                    <td><span className={`badge badge-${d.LoanType?.toLowerCase()}`}>{d.LoanType}</span></td>
                    <td style={{ fontFamily:'Syne', fontWeight:700, color:'var(--amber)' }}>₹ {parseFloat(d.BalanceAmount).toLocaleString('en-IN')}</td>
                    <td style={{ color: d.DaysOverdue > 0 ? 'var(--coral)' : 'var(--accent)' }}>{d.DaysOverdue > 0 ? d.DaysOverdue + ' days' : 'Current'}</td>
                    <td><span style={{ color: BUCKET_COLOR[d.AgingBucket], fontWeight:700 }}>{d.AgingBucket}</span></td>
                  </tr>
                ))}
                {!data.length && <tr><td colSpan={7} className="empty-state"><p>No aging data</p></td></tr>}
              </tbody>
            </table>
          )}
          {tab === 'efficiency' && (
            <table>
              <thead><tr><th>Agent</th><th>Mobile</th><th>Assigned</th><th>Today Collected</th><th>Today Amount</th><th>Total Collected</th><th>Verified</th><th>Pending</th></tr></thead>
              <tbody>
                {data.map((d,i) => (
                  <tr key={i}>
                    <td><strong>{d.AgentName}</strong></td>
                    <td className="text-muted">{d.MobileNumber}</td>
                    <td>{d.AssignedAccounts}</td>
                    <td><span className="badge badge-active">{d.CollectedToday}</span></td>
                    <td style={{ fontFamily:'Syne', fontWeight:700, color:'var(--accent)' }}>₹ {parseFloat(d.TodayAmount).toLocaleString('en-IN')}</td>
                    <td>₹ {parseFloat(d.TotalCollected).toLocaleString('en-IN')}</td>
                    <td><span className="badge badge-verified">{d.VerifiedEntries}</span></td>
                    <td><span className="badge badge-pending">{d.PendingEntries}</span></td>
                  </tr>
                ))}
                {!data.length && <tr><td colSpan={8} className="empty-state"><p>No data</p></td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
