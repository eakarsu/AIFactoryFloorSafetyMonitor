import React, { useState } from 'react';
import { authAPI } from '../services/api';

const demoPassword = import.meta.env.VITE_ENABLE_DEMO_CREDENTIAL_AUTOFILL === 'true'
  ? import.meta.env.VITE_DEMO_PASSWORD || ''
  : '';

const quickLogins = [
  { label: 'Admin', email: 'admin@factory.com' },
  { label: 'Manager', email: 'manager@factory.com' },
  { label: 'Supervisor', email: 'supervisor@factory.com' },
  { label: 'Worker', email: 'worker@factory.com' }
];

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.login(email, password);
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  const handleQuickLogin = (creds) => {
    setEmail(creds.email);
    setPassword(demoPassword);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Factory Safety AI</h1>
        <p className="subtitle">OSHA Compliance Monitoring System</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" className="form-control" placeholder="Enter your email"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-control" placeholder="Enter your password"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="quick-login">
          <p>Quick Login (Demo Accounts)</p>
          <div className="quick-login-btns">
            {quickLogins.map(q => (
              <button key={q.label} disabled={!demoPassword} className="quick-login-btn" onClick={() => handleQuickLogin(q)}>
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
