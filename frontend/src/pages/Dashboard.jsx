import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { Users, TrendingUp, Clock, Wallet, CheckSquare, AlertCircle, IndianRupee } from 'lucide-react';

const FMT = v => {
  if (v === undefined || v === null) return '0';
  const n = parseFloat(v);
  if (isNaN(n)) return '0';
  if (n >= 100000) return '₹' + (n/100000).toFixed(1) + 'L';
  if (n >= 1000) return '₹' + (n/1000).toFixed(1) + 'K';
  return n % 1 === 0 ? String(n) : '₹' + n.toFixed(2);
};

function StatCard({ label, value, icon: Icon, sub, color = '' }) {
  return (
    <div className={`stat-card ${color}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
      {Icon && <Icon className="stat-icon" size={48} />}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => {
      setStats(r.data.stats || {});
      setChart(r.data.chartData || []);
    }).finally(() => setLoading(false));
  }, []);

  const role = user?.role;

  return (
    <Layout title="Dashboard">
      <div style={{ marginBottom:8 }}>
        <h2 style={{ fontFamily:'Syne', fontSize:20 }}>
          Welcome back, <span style={{ color:'var(--accent)' }}>{user?.fullName}</span> 👋
        </h2>
        <p className="text-muted" style={{ fontSize:13 }}>{new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
      </div>

      {loading ? <div className="loading">Loading dashboard...</div> : (
        <>
          <div className="stat-grid">
            <StatCard label="Active Accounts" value={stats.ActiveAccounts || 0} icon={Users} />
            <StatCard label="Today's Collection" value={FMT(stats.TodayCollection)} icon={IndianRupee} color="amber" />
            <StatCard label="Pending Verification" value={stats.PendingVerifications || 0} icon={Clock} color="coral" />
            {(role !== 'AGENT') && <StatCard label="Wallet Balance" value={FMT(stats.WalletBalance || stats.MainWalletBalance)} icon={Wallet} color="sky" />}
            {role === 'AGENT' && <StatCard label="Pending Amount" value={FMT(stats.PendingAmount)} icon={Clock} color="amber" />}
            {role === 'ADMIN' && <>
              <StatCard label="Total Users" value={stats.TotalUsers || 0} icon={Users} />
              <StatCard label="Total Customers" value={stats.TotalCustomers || 0} icon={Users} color="sky" />
              <StatCard label="Pending Approvals" value={stats.PendingApprovals || 0} icon={AlertCircle} color="amber" />
              <StatCard label="Pending Audits" value={stats.PendingAudits || 0} icon={CheckSquare} color="coral" />
            </>}
            {(role === 'MANAGER' || role === 'AREAMANAGER') && (
              <StatCard label="Pending Approvals" value={stats.PendingApprovals || 0} icon={AlertCircle} color="amber" />
            )}
          </div>

          {chart.length > 0 && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title"><TrendingUp size={16} /> Collections - Last 7 Days</span>
              </div>
              <div className="panel-body" style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart} margin={{ top:5, right:10, bottom:0, left:0 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00d4aa" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill:'#8899aa', fontSize:11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:'#8899aa', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => '₹'+v} />
                    <Tooltip
                      contentStyle={{ background:'#1b2e45', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, fontSize:12 }}
                      formatter={v => ['₹'+parseFloat(v).toFixed(2), 'Collection']}
                    />
                    <Area type="monotone" dataKey="total" stroke="#00d4aa" strokeWidth={2} fill="url(#grad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
