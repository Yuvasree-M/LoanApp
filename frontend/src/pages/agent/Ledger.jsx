import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';

export default function Ledger() {
  const [entries, setEntries] = useState([]);
  useEffect(() => { api.get('/collections/ledger').then(r => setEntries(r.data.data)); }, []);

  const todayTotal = entries.filter(e => new Date(e.CollectionDate).toDateString() === new Date().toDateString())
    .reduce((s, e) => s + parseFloat(e.Amount), 0);
  const unverified = entries.filter(e => !e.IsVerified).reduce((s, e) => s + parseFloat(e.Amount), 0);

  return (
    <Layout title="My Ledger">
      <div className="page-header"><h2>My Ledger</h2></div>
      <div className="stat-grid" style={{ marginBottom:20 }}>
        <div className="stat-card"><span className="stat-label">Today's Collection</span><span className="stat-value">₹ {todayTotal.toFixed(2)}</span></div>
        <div className="stat-card amber"><span className="stat-label">Pending Verification</span><span className="stat-value">₹ {unverified.toFixed(2)}</span></div>
      </div>
      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Account#</th><th>Customer</th><th>Amount</th><th>Reason</th><th>Date/Time</th><th>Status</th><th>Verified By</th></tr></thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.CollectionID}>
                  <td><code style={{ fontSize:12, color:'var(--accent)' }}>{e.AccountNumber}</code></td>
                  <td><strong>{e.CustomerName}</strong></td>
                  <td style={{ fontFamily:'Syne', fontWeight:800, color: parseFloat(e.Amount)>0?'var(--accent)':'var(--coral)' }}>
                    {parseFloat(e.Amount)>0 ? '₹ '+parseFloat(e.Amount).toLocaleString('en-IN') : '—'}
                  </td>
                  <td className="text-muted">{e.NoCollectionReason || '—'}</td>
                  <td className="text-muted">{new Date(e.CollectionDate).toLocaleString('en-IN')}</td>
                  <td><span className={`badge ${e.IsVerified ? 'badge-verified' : 'badge-pending'}`}>
                    {e.IsVerified ? '✓ Verified' : 'Pending'}
                  </span></td>
                  <td className="text-muted">{e.VerifiedByName || '—'}</td>
                </tr>
              ))}
              {!entries.length && <tr><td colSpan={7} className="empty-state"><p>No entries found</p></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
