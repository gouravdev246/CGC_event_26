import React from 'react';
import { CreditCard } from 'lucide-react';
import Badge from '../components/common/Badge';

export function Subscription() {
  return (
    <div className="dashboard-page-container">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-breadcrumbs">
            <span className="breadcrumb-muted">RAG Service</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-active">Subscription</span>
          </div>
          <h1 className="header-page-title">Simple Plans. Flexible Scale.</h1>
          <p className="header-page-subtitle">Choose a plan that fits your usage.</p>
        </div>
      </header>

      <div className="dashboard-vertical-sections">
        <section className="dashboard-section">
          <div className="section-header">
            <div className="section-title-wrapper">
              <div className="section-icon-badge">
                <CreditCard size={20} className="section-icon text-indigo" />
              </div>
              <div>
                <h2 className="section-heading">Simple Plans. Flexible Scale.</h2>
                <p className="section-subtext">Choose a plan that fits your usage.</p>
              </div>
            </div>
            <Badge variant="indigo" size="md">
              Active Tier
            </Badge>
          </div>

          <div style={{ padding: '16px 0' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Billing renews November 30, 2026</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Invoice charged to Visa ending in 4242</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Subscription;
