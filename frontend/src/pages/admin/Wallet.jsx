import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { ArrowUpRight } from 'lucide-react';

export default function AdminWallet() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, []);
  const load = () => api.get('/wallet/all').then(r => setWallets(r.data.data));

  const transfer = async (managerID, name) => {
    if (!window.confirm(`Transfer all funds from ${name} wallet to Main Wallet?`)) return;
    setLoading(true);
    try {
      const r = await api.post('/wallet/audit-transfer', { managerID });
      toast.success(r.data.message);
      load();
    } catch(e) { toast.error(e.response?.data?.message || 'Error'); }
    setLoading(false);
  };

  const main = wallets.find(w => w.WalletType === 'Main');
  const others = wallets.filter(w => w.WalletType !== 'Main');

  return (
    <Layout title="Main Wallet">
      <div className="page-header"><h2>Wallet Management</h2></div>
      {main && (
        <div className="wallet-card" style={{ marginBottom:24 }}>
          <div className="wallet-type">Main Company Wallet</div>
          <div className="wallet-balance">₹ {parseFloat(main.Balance).toLocaleString('en-IN', { minimumFractionDigits:2 })}</div>
          <div className="wallet-updated">Last updated: {new Date(main.LastUpdated).toLocaleString('en-IN')}</div>
        </div>
      )}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Manager / Area Manager Wallets</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Role</th><th>Wallet Type</th><th>Balance</th><th>Last Updated</th><th>Action</th></tr></thead>
            <tbody>
              {others.map(w => (
                <tr key={w.WalletID}>
                  <td><strong>{w.FullName}</strong></td>
                  <td><span className="badge badge-pending">{w.Role}</span></td>
                  <td>{w.WalletType}</td>
                  <td><strong style={{ color:'var(--accent)', fontFamily:'Syne' }}>₹ {parseFloat(w.Balance).toLocaleString('en-IN', { minimumFractionDigits:2 })}</strong></td>
                  <td className="text-muted">{new Date(w.LastUpdated).toLocaleString('en-IN')}</td>
                  <td>
                    <button className="btn btn-sm btn-primary" disabled={loading || w.Balance <= 0}
                      onClick={() => transfer(w.UserID, w.FullName)}>
                      <ArrowUpRight size={13}/> Transfer to Main
                    </button>
                  </td>
                </tr>
              ))}
              {!others.length && <tr><td colSpan={6} className="empty-state"><p>No wallets found</p></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
