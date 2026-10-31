import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  MessageSquareText,
  CreditCard,
  Key,
  Settings,
  X,
  LogOut
} from 'lucide-react';

export function Sidebar({ isMinified, onToggleMinify, mobileOpen, onCloseMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Usage matrix',
      icon: LayoutDashboard,
      path: '/dashboard'
    },
    {
      id: 'file-upload',
      label: 'File upload',
      icon: UploadCloud,
      path: '/file-upload'
    },
    {
      id: 'user-query',
      label: 'user query',
      icon: MessageSquareText,
      path: '/user-query'
    },
    {
      id: 'manage-subscription',
      label: 'Manage subscription',
      icon: CreditCard,
      path: '/subscription'
    },
    {
      id: 'api-key',
      label: 'API key',
      icon: Key,
      path: '/api-keys'
    },
    {
      id: 'settings',
      label: 'settings',
      icon: Settings,
      path: '/settings'
    }
  ];

  const handleNavClick = (path) => {
    navigate(path);
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rag_auth_token');
    localStorage.removeItem('rag_user_email');
    navigate('/login');
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        id="hs-sidebar-header"
        className={`sidebar-container ${isMinified ? 'is-minified' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
        role="dialog"
        tabIndex="-1"
        aria-label="Sidebar"
      >
        <div className="sidebar-inner-flex">
          {/* =================================================================
              HEADER: Brand + Mobile Close + Minify Toggle (Preline Style)
             ================================================================= */}
          <header className="sidebar-preline-header">
            {/* Brand Name */}
            <button
              type="button"
              className="brand-link-btn"
              onClick={() => handleNavClick('/dashboard')}
              aria-label="Brand"
            >
              <div className="brand-text">
                <span className="brand-title">{isMinified ? 'RAG' : 'RAG Platform'}</span>
              </div>
            </button>

            {/* Mobile Close Button */}
            <div className="mobile-close-wrap">
              <button
                type="button"
                className="sidebar-close-btn"
                onClick={onCloseMobile}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Minify Navigation Toggle Button */}
            <div className="minify-toggle-wrap">
              <button
                type="button"
                className="sidebar-minify-btn"
                onClick={onToggleMinify}
                aria-label="Minify navigation"
                title={isMinified ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isMinified ? (
                  <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2"/>
                    <path d="M15 3v18"/>
                    <path d="m8 9 3 3-3 3"/>
                  </svg>
                ) : (
                  <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2"/>
                    <path d="M15 3v18"/>
                    <path d="m10 15-3-3 3-3"/>
                  </svg>
                )}
              </button>
            </div>
          </header>

          {/* =================================================================
              NAVIGATION BODY: Only the actual RAG platform items
             ================================================================= */}
          <nav className="sidebar-nav-body">
            <ul className="preline-nav-list">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`preline-nav-link ${isActive ? 'active' : ''}`}
                      onClick={() => handleNavClick(item.path)}
                      title={item.label}
                    >
                      <Icon size={18} className="nav-svg-icon" />
                      {!isMinified && <span className="nav-text">{item.label}</span>}
                      {!isMinified && isActive && <span className="nav-live-dot" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* =================================================================
              FOOTER: Status Indicator + Sign Out Button
             ================================================================= */}
          <div className="sidebar-footer-preline">
            {!isMinified && (
              <div className="system-status-box">
                <div className="status-indicator">
                  <span className="pulse-dot" />
                  <span className="status-label">Knowledge, Connected.</span>
                </div>
                <span className="status-info">RAG infrastructure for developers and organisations.</span>
              </div>
            )}

            <button
              type="button"
              className={isMinified ? 'sidebar-minify-btn' : 'sidebar-logout-btn'}
              onClick={handleLogout}
              title="Sign out of tenant session"
              style={isMinified ? { margin: '8px auto 0 auto' } : {}}
            >
              <LogOut size={16} />
              {!isMinified && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
