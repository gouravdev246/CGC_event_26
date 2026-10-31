import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import '../styles/auth.css';

export function Login() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isSignup && (!name || name.trim().length < 2)) {
      setMessage('Please enter your full name (at least 2 characters).');
      setIsError(true);
      return;
    }

    setSubmitting(true);
    setMessage('');
    setIsError(false);

    try {
      const endpoint = isSignup ? '/auth/register' : '/auth/login';
      const body = isSignup
        ? { name: name.trim(), email: email.trim().toLowerCase(), password }
        : { email: email.trim().toLowerCase(), password };

      const res = await apiClient.post(endpoint, body);

      if (res.data?.success && res.data?.token) {
        localStorage.setItem('rag_auth_token', res.data.token);
        localStorage.setItem('rag_user_email', res.data.user?.email || email);
        if (res.data.user?.name) localStorage.setItem('rag_user_name', res.data.user.name);
        setTimeout(() => navigate('/dashboard'), 300);
        return;
      }

      setMessage(res.data?.message || 'Something went wrong. Please try again.');
      setIsError(true);
    } catch (err) {
      if (!isSignup && err.response?.data?.notRegistered) {
        setIsSignup(true);
        setMessage('Email not registered — fill in your name to create an account.');
        setIsError(false);
        setSubmitting(false);
        return;
      }
      const msg = err.response?.data?.message || (err.code === 'ERR_NETWORK' ? 'Cannot reach server. Is it running?' : err.message);
      setMessage(msg || 'Authentication failed.');
      setIsError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background arc */}
      <svg className="auth-bg-svg" width="1440" height="676" viewBox="0 0 1440 676" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="-92" y="-948" width="1624" height="1624" rx="812" fill="url(#auth-arc)" />
        <defs>
          <radialGradient id="auth-arc" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="rotate(90 428 292) scale(812)">
            <stop offset=".63" stopColor="#372AAC" stopOpacity="0" />
            <stop offset="1" stopColor="#372AAC" />
          </radialGradient>
        </defs>
      </svg>

      <div className="auth-card">
        <h1 className="auth-title">{isSignup ? 'Build Your Knowledge Base.' : 'Welcome Back.'}</h1>
        <p className="auth-sub">{isSignup ? 'Get your data AI-ready in minutes.' : 'Your knowledge workspace awaits.'}</p>

        {message && (
          <div className={`auth-message ${isError ? 'auth-message-error' : 'auth-message-info'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignup && (
            <div className="form-field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isSignup}
                autoFocus={isSignup}
              />
            </div>
          )}

          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder={isSignup ? 'Min 8 characters' : '••••••••'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Verifying…' : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}
          {' '}
          <button
            type="button"
            className="auth-switch-btn"
            onClick={() => { setIsSignup(!isSignup); setMessage(''); }}
          >
            {isSignup ? 'Sign In' : 'Create Account'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
