import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';

export default function VerifyCollections() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, []);
  const load = () => api.get('/collections/pending-verify').then(r => setPending(r.data.data));

  const verify = async (agentID, agentName, date) => {
    if (!window.confirm(`Verify all collections from ${agentName} for ${date}?`)) return;
    setLoading(true);
    try {
      const r = await api.post('/collections/verify', { agentID, date });
      toast.success(r.data.message); load();
    } catch(e) { toast.error(e.response?.data?.message || 'Error'); }
    setLoading(false);
  };

  return (
    <Layout title="Verify Collections">
      <div className="page-header">
        <h2>Pending Verifications</h2>
        <span className="badge badge-pending">{pending.length} Pending</span>
      </div>
      {!pending.length ? (
        <div className="empty-state"><CheckCircle size={48}/><p>All collections verified!</p></div>
      ) : (
        <div className="panel">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Agent</th><th>Date</th><th>Entries</th><th>Total Amount</th><th>Action</th></tr></thead>
              <tbody>
                {pending.map((p, i) => (
                  <tr key={i}>
                    <td><strong>{p.AgentName}</strong></td>
                    <td>{new Date(p.CollDate).toLocaleDateString('en-IN')}</td>
                    <td><span className="badge badge-pending">{p.TotalEntries}</span></td>
                    <td style={{ fontFamily:'Syne', fontWeight:800, color:'var(--accent)', fontSize:16 }}>
                      ₹ {parseFloat(p.TotalAmount).toLocaleString('en-IN', { minimumFractionDigits:2 })}
                    </td>
                    <td>
                      <button className="btn btn-success" disabled={loading}
                        onClick={() => verify(p.AgentID, p.AgentName, p.CollDate)}>
                        <CheckCircle size={14}/> Verify & Transfer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
