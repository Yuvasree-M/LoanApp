import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import { Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [loanType, setLoanType] = useState('');
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);
  const load = () => api.get('/accounts', { params:{ search, loanType } }).then(r => setAccounts(r.data.data));

  return (
    <Layout title="Loan Accounts">
      <div className="page-header">
        <h2>Accounts</h2>
        <button className="btn btn-primary" onClick={() => navigate('/accounts/add')}>+ Create Loan</button>
      </div>
      <div className="search-bar">
        <input className="form-control" placeholder="Search account, customer, mobile..." value={search}
          onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==='Enter' && load()} />
        <select className="form-control" style={{ maxWidth:160 }} value={loanType} onChange={e => setLoanType(e.target.value)}>
          <option value="">All Types</option><option>Daily</option><option>Weekly</option><option>Monthly</option>
        </select>
        <button className="btn btn-secondary" onClick={load}><Search size={15}/></button>
      </div>
      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Account#</th><th>Customer</th><th>Type</th><th>Area</th>
              <th>Loan Amt</th><th>Balance</th><th>Due Amt</th>
              <th>Dues Paid</th><th>Dues Crossed</th><th>Status</th><th>Agent</th><th>Action</th>
            </tr></thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a.AccountID}>
                  <td><code style={{ fontSize:12, color:'var(--accent)' }}>{a.AccountNumber}</code></td>
                  <td><strong>{a.CustomerName}</strong><br/><span style={{ fontSize:11, color:'var(--muted)' }}>{a.MobileNumber}</span></td>
                  <td><span className={`badge badge-${a.LoanType?.toLowerCase()}`}>{a.LoanType}</span></td>
                  <td className="text-muted">{a.AreaName}</td>
                  <td style={{ color:'var(--sky)', fontFamily:'Syne' }}>₹{parseFloat(a.LoanAmount).toLocaleString('en-IN')}</td>
                  <td style={{ color:'var(--amber)', fontFamily:'Syne', fontWeight:700 }}>₹{parseFloat(a.BalanceAmount).toLocaleString('en-IN')}</td>
                  <td style={{ color:'var(--coral)' }}>₹{parseFloat(a.DueAmount).toLocaleString('en-IN')}</td>
                  <td><span className="badge badge-active">{a.DuesPaid}</span></td>
                  <td><span className="badge badge-blocked">{a.DuesCrossed}</span></td>
                  <td><span className={`badge badge-${a.Status?.toLowerCase()}`}>{a.Status}</span></td>
                  <td className="text-muted">{a.AgentName || '-'}</td>
                  <td><button className="btn btn-sm btn-secondary" onClick={() => navigate(`/accounts/${a.AccountID}`)}><Eye size={13}/></button></td>
                </tr>
              ))}
              {!accounts.length && <tr><td colSpan={12} className="empty-state"><p>No accounts found</p></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
