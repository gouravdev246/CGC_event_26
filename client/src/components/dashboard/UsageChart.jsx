import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { formatNumber } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-custom-tooltip">
        <p className="tooltip-time">{label}</p>
        <div className="tooltip-items-list">
          {payload.map((item, idx) => (
            <div key={idx} className="tooltip-data-row">
              <span className="tooltip-dot" style={{ backgroundColor: item.color }} />
              <span className="tooltip-metric">{item.name}:</span>
              <span className="tooltip-val">{formatNumber(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function UsageChart({
  requestsData = [],
  timeframe = '24h',
  onTimeframeChange
}) {
  return (
    <div className="usage-chart-card">
      <div className="chart-header">
        <div>
          <h3 className="chart-heading">Activity Stream</h3>
          <p className="chart-subheading">API throughput and request frequency</p>
        </div>

        <div className="timeframe-pill-group">
          {[
            { id: '24h', label: '24h' },
            { id: '7d', label: '7d' },
            { id: '30d', label: '30d' }
          ].map((tf) => (
            <button
              key={tf.id}
              type="button"
              className={`timeframe-btn ${timeframe === tf.id ? 'active' : ''}`}
              onClick={() => onTimeframeChange && onTimeframeChange(tf.id)}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-canvas-wrapper" style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={requestsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="aiReqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 12, fontFamily: 'Poppins' }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 12, fontFamily: 'Poppins' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              name="Requests"
              dataKey="requests"
              stroke="#4F46E5"
              strokeWidth={2.4}
              fill="url(#aiReqGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default UsageChart;
