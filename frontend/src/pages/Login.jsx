import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IndianRupee, Lock, User, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, verifyOTP } = useAuth(); // these should call your backend
  const navigate = useNavigate();

  const [step, setStep] = useState('login'); // login | otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [devOTP, setDevOTP] = useState('');
  const [form, setForm] = useState({ username: '', password: '' });
  const [otp, setOtp] = useState(['','','','','','']);
  const otpRefs = useRef([]);

  // Login button handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); 
    setLoading(true);
    try {
      const res = await login(form.username, form.password); // API call to backend
      if (res.success) {
        setTempToken(res.tempToken);
        if (res.devOTP) setDevOTP(res.devOTP); // show dev OTP in dev mode
        setStep('otp');
        toast.success('OTP sent!');
      } else setError(res.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // OTP input change handler
  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return; // only allow 1 digit
    const newOtp = [...otp];
    newOtp[i] = val;
    setOtp(newOtp);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  // OTP backspace handler
  const handleOtpKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  // Verify OTP handler
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const otpStr = otp.join('');
    if (otpStr.length < 6) { 
      setError('Enter 6-digit OTP'); 
      setLoading(false); 
      return; 
    }
    try {
      const res = await verifyOTP(tempToken, otpStr); // API call to backend
      if (res.success) {
        toast.success('Login successful!');
        navigate('/dashboard'); // redirect after successful OTP
      } else setError(res.message);
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">
          <div className="login-icon">💰</div>
          <h1>Loan Management</h1>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="alert alert-error">⚠ {error}</div>}

        {step === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group mb-4">
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position:'absolute', left:12, top:12, color:'var(--muted)' }} />
                <input className="form-control" style={{ paddingLeft: 36 }}
                  placeholder="Enter username"
                  value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
              </div>
            </div>
            <div className="form-group mb-4">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position:'absolute', left:12, top:12, color:'var(--muted)' }} />
                <input className="form-control" style={{ paddingLeft: 36 }}
                  type="password" placeholder="Enter password"
                  value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
              </div>
            </div>
            <button className="btn btn-primary btn-lg" style={{ width:'100%' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div style={{ textAlign:'center', marginBottom: 8 }}>
              <Shield size={32} style={{ color: 'var(--accent)' }} />
              <p style={{ color:'var(--muted)', fontSize:13, marginTop:8 }}>
                Enter the 6-digit OTP sent to your mobile
              </p>
            </div>
            {devOTP && (
              <div className="alert alert-info">
                🔑 <strong>DEV OTP:</strong> <span style={{fontSize:20,fontWeight:800,fontFamily:'monospace'}}>{devOTP}</span>
              </div>
            )}
            <div className="otp-container">
              {otp.map((d,i) => (
                <input key={i} ref={el => otpRefs.current[i] = el}
                  className="otp-input" maxLength={1} value={d}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKey(i, e)} inputMode="numeric" />
              ))}
            </div>
            <button className="btn btn-primary btn-lg" style={{ width:'100%' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP →'}
            </button>
            <button type="button" className="btn btn-secondary" style={{ width:'100%', marginTop:8 }}
              onClick={() => { setStep('login'); setOtp(['','','','','','']); setError(''); }}>
              ← Back to Login
            </button>
          </form>
        )}

        <p style={{ textAlign:'center', marginTop:20, fontSize:12, color:'var(--muted)' }}>
          Loan Management System v1.0 © 2026
        </p>
      </div>
    </div>
  );
}