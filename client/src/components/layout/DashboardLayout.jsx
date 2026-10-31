import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export function DashboardLayout({ children }) {
  const [isMinified, setIsMinified] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMinify = () => {
    setIsMinified((prev) => !prev);
  };

  return (
    <div className={`app-shell ${isMinified ? 'layout-minified' : ''}`}>
      {/* Background radiant radial glow matching prebuiltui reference photo */}
      <svg
        className="dashboard-ambient-svg"
        width="1440"
        height="676"
        viewBox="0 0 1440 676"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="-92" y="-948" width="1624" height="1624" rx="812" fill="url(#dash-glow-a)" />
        <defs>
          <radialGradient
            id="dash-glow-a"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="rotate(90 428 292) scale(812)"
          >
            <stop offset=".63" stopColor="#372AAC" stopOpacity="0" />
            <stop offset="1" stopColor="#372AAC" />
          </radialGradient>
        </defs>
      </svg>

      {/* Mobile Navigation Toggle Bar (Matches snippet's mobile toggle) */}
      <div className="mobile-nav-toggle-bar">
        <button
          type="button"
          className="mobile-toggle-btn"
          onClick={() => setMobileOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={mobileOpen}
          aria-controls="hs-sidebar-header"
          aria-label="Toggle navigation"
        >
          <Menu size={16} />
          <span>Open Menu</span>
        </button>
        <span className="mobile-brand-title">RAG Platform</span>
      </div>

      {/* Main Dashboard Frame */}
      <div className={`dashboard-frame ${isMinified ? 'frame-minified' : ''}`}>
        <Sidebar
          isMinified={isMinified}
          onToggleMinify={toggleMinify}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <main className="dashboard-main-area">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
