import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';

export default function MyWallet() {
  const [wallet, setWallet] = useState(null);
  const [txns, setTxns] = useState([]);

  useEffect(() => { api.get('/wallet/my').then(r => { setWallet(r.data.wallet); setTxns(r.data.transactions); }); }, []);

  const TXN_COLOR = { Credit: 'var(--accent)', Debit: 'var(--coral)', Transfer: 'var(--amber)' };

  return (
    <Layout title="My Wallet">
      <div className="page-header"><h2>Wallet</h2></div>
      {wallet && (
        <div className="wallet-card" style={{ marginBottom:24, maxWidth:460 }}>
          <div className="wallet-type">{wallet.WalletType} Wallet</div>
          <div className="wallet-balance">₹ {parseFloat(wallet.Balance).toLocaleString('en-IN', { minimumFractionDigits:2 })}</div>
          <div className="wallet-updated">Last updated: {new Date(wallet.LastUpdated).toLocaleString('en-IN')}</div>
        </div>
      )}
      <div className="panel">
        <div className="panel-header"><span className="panel-title">Transaction History</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>From</th><th>To</th><th>Description</th></tr></thead>
            <tbody>
              {txns.map(t => (
                <tr key={t.TransactionID}>
                  <td className="text-muted">{new Date(t.TransactionDate).toLocaleString('en-IN')}</td>
                  <td><span style={{ color: TXN_COLOR[t.TransactionType] || 'var(--muted)', fontWeight:600 }}>{t.TransactionType}</span></td>
                  <td style={{ fontFamily:'Syne', fontWeight:800, color: TXN_COLOR[t.TransactionType] }}>
                    ₹ {parseFloat(t.Amount).toLocaleString('en-IN', { minimumFractionDigits:2 })}
                  </td>
                  <td className="text-muted">{t.FromName || '-'}</td>
                  <td className="text-muted">{t.ToName || '-'}</td>
                  <td className="text-muted">{t.Description || '-'}</td>
                </tr>
              ))}
              {!txns.length && <tr><td colSpan={6} className="empty-state"><p>No transactions</p></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
