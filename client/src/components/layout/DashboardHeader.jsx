import React from 'react';
import { RefreshCw, Activity, Layers, Bell } from 'lucide-react';
import Button from '../common/Button';

export function DashboardHeader({ onRefresh, refreshing }) {
  return (
    <header className="dashboard-header">
      <div className="header-left">
        <div className="header-breadcrumbs">
          <span className="breadcrumb-muted">RAG Service</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-active">Dashboard Overview</span>
        </div>
        <h1 className="header-page-title">Usage Overview</h1>
        <p className="header-page-subtitle">Track your RAG activity.</p>
      </div>

      <div className="header-right">
        <div className="live-pill">
          <span className="live-dot" />
          <span>Live</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={onRefresh}
          className={refreshing ? 'rotating' : ''}
          title="Refresh metrics and request stream"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
    </header>
  );
}

export default DashboardHeader;
