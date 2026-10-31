import React from 'react';
import { BarChart3, Radio } from 'lucide-react';
import UsageStats from './UsageStats';
import UsageChart from './UsageChart';
import Loader from '../common/Loader';

export function UsageMonitoring({
  apiConsumption,
  tokenConsumption,
  llmPerformance,
  ragPerformance,
  requestsTimeSeries = [],
  timeframe = '24h',
  setTimeframe,
  loading = false
}) {
  return (
    <section className="dashboard-section usage-matrix-container" aria-label="Usage Matrix Monitoring">
      {/* Clean Top Header matching sketch */}
      <div className="section-header">
        <div className="section-title-wrapper">
          <div className="section-icon-badge">
            <BarChart3 size={20} className="section-icon text-indigo" />
          </div>
          <div>
            <h2 className="section-heading">Usage matrix monitoring</h2>
            <p className="section-subtext">Real-time throughput, token analytics, and system latency</p>
          </div>
        </div>

        <div className="section-status-tag">
          <Radio size={13} className="pulse-icon text-emerald" />
          <span>Active</span>
        </div>
      </div>

      {/* Content inside single rounded card */}
      {loading ? (
        <Loader text="Loading metrics..." />
      ) : (
        <div className="usage-matrix-content">
          <UsageStats
            apiConsumption={apiConsumption}
            tokenConsumption={tokenConsumption}
            llmPerformance={llmPerformance}
            ragPerformance={ragPerformance}
          />

          <UsageChart
            requestsData={requestsTimeSeries}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
          />
        </div>
      )}
    </section>
  );
}

export default UsageMonitoring;
