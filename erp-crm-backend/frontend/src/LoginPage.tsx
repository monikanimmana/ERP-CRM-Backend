import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api';
import './styles.css';

export function LoginPage() {
  const [email, setEmail] = useState('sales@erp.local');
  const [password, setPassword] = useState('sales123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Test credentials for all 4 roles
  const testUsers = [
    { role: '👨‍💼 ADMIN', email: 'admin@erp.local', password: 'admin123', description: 'Full system access' },
    { role: '👨‍💻 SALES', email: 'sales@erp.local', password: 'sales123', description: 'Create customers & draft challans' },
    { role: '📦 WAREHOUSE', email: 'warehouse@erp.local', password: 'warehouse123', description: 'Manage stock & confirm challans' },
    { role: '📊 ACCOUNTS', email: 'accounts@erp.local', password: 'accounts123', description: 'Read-only access' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.login(email, password);
      localStorage.setItem('jwt_token', response.data.token);
      // Store user data (name, email, role) for display in dashboard
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (testEmail: string, testPassword: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🏢 ERP + CRM Portal</h1>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={loading}
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Test Credentials Section - All 4 Roles */}
        <div className="test-creds">
          <p><strong>🔓 Quick Login (Test Credentials)</strong></p>
          <div className="cred-buttons">
            {testUsers.map((user, idx) => (
              <button
                key={idx}
                type="button"
                className="cred-button"
                onClick={() => handleQuickLogin(user.email, user.password)}
                disabled={loading}
              >
                <div className="cred-role">{user.role}</div>
                <div className="cred-email">{user.email}</div>
                <div className="cred-desc">{user.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
