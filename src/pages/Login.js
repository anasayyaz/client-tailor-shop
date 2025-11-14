import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Small delay for better UX
    setTimeout(() => {
      const success = login(username, password, rememberMe);
      
      if (success) {
        navigate('/');
      } else {
        setError('غلط صارف نام یا پاس ورڈ');
      }
      
      setLoading(false);
    }, 300);
  };

  return (
    <div className="login-container" dir="rtl">
      <div className="login-rotating-border"></div>
      <div className="login-bg-shape login-bg-shape-1"></div>
      <div className="login-bg-shape login-bg-shape-2"></div>
      <div className="login-bg-shape login-bg-shape-3"></div>
      <div className="login-bg-shape login-bg-shape-4"></div>
      <div className="login-bg-shape login-bg-shape-5"></div>
      <div className="login-bg-shape login-bg-shape-6"></div>
      <div className="login-bg-grid"></div>
      <div className="login-bg-dots"></div>
      <div className="login-bg-shimmer"></div>
      <div className="login-wave"></div>
      <div className="login-particle login-particle-1" style={{ top: '20%', left: '10%' }}></div>
      <div className="login-particle login-particle-2" style={{ top: '40%', left: '20%', animationDelay: '2s' }}></div>
      <div className="login-particle login-particle-3" style={{ top: '60%', left: '15%', animationDelay: '4s' }}></div>
      <div className="login-particle login-particle-4" style={{ top: '30%', left: '80%', animationDelay: '1s' }}></div>
      <div className="login-particle login-particle-5" style={{ top: '70%', left: '85%', animationDelay: '3s' }}></div>
      <div className="login-particle login-particle-6" style={{ top: '15%', left: '50%', animationDelay: '0.5s' }}></div>
      <div className="login-particle login-particle-7" style={{ top: '50%', left: '70%', animationDelay: '2.5s' }}></div>
      <div className="login-particle login-particle-8" style={{ top: '80%', left: '30%', animationDelay: '1.5s' }}></div>
      <div className="login-particle login-particle-9" style={{ top: '25%', left: '60%', animationDelay: '3.5s' }}></div>
      <div className="login-particle login-particle-10" style={{ top: '65%', left: '40%', animationDelay: '4.5s' }}></div>
      <div className="login-card">
        <div className="login-card-decoration login-card-decoration-1"></div>
        <div className="login-card-decoration login-card-decoration-2"></div>
        
        <div className="login-header">
          <h2>لاگ ان</h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <div className="login-form-group">
            <label htmlFor="username">صارف نام</label>
            <input
              id="username"
              type="text"
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="صارف نام درج کریں"
              required
              autoFocus
            />
          </div>

          <div className="login-form-group">
            <label htmlFor="password">پاس ورڈ</label>
            <div className="password-input-container">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="پاس ورڈ درج کریں"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'پاس ورڈ چھپائیں' : 'پاس ورڈ دکھائیں'}
                aria-label={showPassword ? 'پاس ورڈ چھپائیں' : 'پاس ورڈ دکھائیں'}
              >
                {showPassword ? (
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="remember-me-container">
            <input
              type="checkbox"
              id="rememberMe"
              className="remember-me-checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="rememberMe" className="remember-me-label">
              مجھے یاد رکھیں
            </label>
          </div>

          <button 
            type="submit" 
            className="login-submit-btn"
            disabled={loading}
          >
            {loading ? 'لاگ ان ہو رہا ہے...' : 'لاگ ان'}
          </button>
        </form>

        <div className="credentials-info">
          <p>صارف نام: <strong>admin</strong></p>
          <p>پاس ورڈ: <strong>Q1w2e3r4@</strong></p>
        </div>
      </div>
    </div>
  );
}

export default Login;

