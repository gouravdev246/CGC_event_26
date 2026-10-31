import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/landing.css';

export function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = Boolean(localStorage.getItem('rag_auth_token'));

  const handleGetStarted = () => navigate(isAuthenticated ? '/dashboard' : '/login');
  const handleLogin = () => navigate(isAuthenticated ? '/dashboard' : '/login');

  return (
    <div className="landing-root">
      {/* Background Radial Glow Arc */}
      <svg
        className="landing-bg-svg"
        width="1440"
        height="676"
        viewBox="0 0 1440 676"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="-92" y="-948" width="1624" height="1624" rx="812" fill="url(#landing-glow)" />
        <defs>
          <radialGradient
            id="landing-glow"
            cx="0" cy="0" r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="rotate(90 428 292) scale(812)"
          >
            <stop offset=".63" stopColor="#372AAC" stopOpacity="0" />
            <stop offset="1" stopColor="#372AAC" />
          </radialGradient>
        </defs>
      </svg>

      {/* Navbar */}
      <nav className="landing-nav">
        <a href="/" className="landing-logo" aria-label="Home">
          <span className="landing-logo-text">RAG Platform</span>
        </a>

        <div className="landing-nav-actions">
          <button type="button" onClick={handleLogin} className="btn-nav-ghost">
            Sign In
          </button>
          <button type="button" onClick={handleGetStarted} className="btn-nav-primary">
            Get Started
          </button>
        </div>

        <button
          type="button"
          className="landing-mobile-toggle"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="landing-mobile-drawer">
          <button className="landing-mobile-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <button type="button" onClick={() => { setMobileMenuOpen(false); handleLogin(); }} className="btn-nav-ghost w-full">Sign In</button>
          <button type="button" onClick={() => { setMobileMenuOpen(false); handleGetStarted(); }} className="btn-nav-primary w-full">Get Started</button>
        </div>
      )}

      {/* Hero */}
      <main className="landing-hero">
        {/* Status pill */}
        <div className="landing-hero-pill">
          <span className="hero-pill-dot" />
          <span>Now in public beta</span>
        </div>

        <h1 className="landing-hero-title">
          Your Data. Your AI.
        </h1>

        <p className="landing-hero-sub">
          Turn documents into intelligent, searchable knowledge.
        </p>

        <div className="landing-hero-btns">
          <button type="button" onClick={handleGetStarted} className="btn-hero-primary">
            Get Started
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M4.166 10h11.667m0 0L9.999 4.165m5.834 5.833-5.834 5.834" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Hero showcase */}
        <div className="landing-hero-showcase">
          <div className="showcase-inner">
            {/* Fake terminal / dashboard preview */}
            <div className="showcase-topbar">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
              <span className="showcase-url">rag-platform.app/dashboard</span>
            </div>
            <div className="showcase-body">
              <div className="showcase-sidebar">
                <div className="sb-item active" />
                <div className="sb-item" />
                <div className="sb-item" />
                <div className="sb-item" />
                <div className="sb-item" />
              </div>
              <div className="showcase-content">
                <div className="sc-row">
                  <div className="sc-card" />
                  <div className="sc-card" />
                  <div className="sc-card" />
                </div>
                <div className="sc-chart" />
                <div className="sc-list">
                  <div className="sc-line" />
                  <div className="sc-line short" />
                  <div className="sc-line" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <span className="landing-footer-tagline">Knowledge, Connected.</span>
        <p className="landing-footer-sub">RAG infrastructure for developers and organisations.</p>
      </footer>
    </div>
  );
}

export default Landing;
