import { useState, useEffect } from 'react';
import './index.css';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import TADashboard from './components/TADashboard';
import StudentDashboard from './components/StudentDashboard';
import AdminPanel from './components/AdminPanel';

function App() {
  const [user, setUser] = useState(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const mustChange = localStorage.getItem('mustChange');

    if (token && userData) {
      setUser(JSON.parse(userData));
      setMustChangePassword(mustChange === 'true');
    }
  }, []);

  const handleLogin = (userData, token, mustChange) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('mustChange', mustChange);
    setUser(userData);
    setMustChangePassword(mustChange);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('mustChange');
    setUser(null);
    setMustChangePassword(false);
  };

  const handlePasswordChanged = () => {
    setMustChangePassword(false);
    localStorage.setItem('mustChange', 'false');
    handleLogout();
  };

  // If not logged in, show landing page with search and login
  if (!user) {
    return <LandingPage onLogin={handleLogin} />;
  }

  // If must change password, force password change
  if (mustChangePassword) {
    return (
      <Login
        forcePasswordChange={true}
        onPasswordChanged={handlePasswordChanged}
        onLogout={handleLogout}
      />
    );
  }

  // Show dashboard based on role
  return (
    <div>
      <div className="header">
        <div className="header-content">
          <h1>📚 Lab Signup System</h1>
          <div className="user-info">
            <span>Welcome, <strong>{user.username}</strong> ({user.role})</span>
            <button className="btn btn-secondary btn-small" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {user.role === 'admin' && <AdminPanel />}
        {user.role === 'ta' && <TADashboard />}
        {user.role === 'student' && <StudentDashboard />}
      </div>
    </div>
  );
}

export default App;
