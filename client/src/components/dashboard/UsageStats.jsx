import React from 'react';
import { Activity, Cpu, Clock, Sparkles } from 'lucide-react';
import { formatNumber, formatTokens } from '../../utils/formatters';

export function UsageStats({
  apiConsumption,
  tokenConsumption,
  llmPerformance,
  ragPerformance
}) {
  const stats = [
    {
      id: 'requests',
      label: 'Total Requests',
      value: formatNumber(apiConsumption?.totalRequests || 0),
      sublabel: `${formatNumber(apiConsumption?.successfulRequests || 0)} successful`,
      icon: Activity,
      accent: 'indigo'
    },
    {
      id: 'tokens',
      label: 'Tokens Consumed',
      value: formatTokens(tokenConsumption?.totalTokens || 0),
      sublabel: `Prompt & completion`,
      icon: Cpu,
      accent: 'purple'
    },
    {
      id: 'latency',
      label: 'Average Latency',
      value: llmPerformance?.avgResponseTime
        ? `${(llmPerformance.avgResponseTime * 1000).toFixed(0)} ms`
        : '0 ms',
      sublabel: 'Turnaround speed',
      icon: Clock,
      accent: 'cyan'
    },
    {
      id: 'retrieval',
      label: 'Retrieval Match Rate',
      value: ragPerformance?.relevantMatchesRate
        ? `${ragPerformance.relevantMatchesRate}%`
        : '100%',
      sublabel: 'Semantic hit accuracy',
      icon: Sparkles,
      accent: 'emerald'
    }
  ];

  return (
    <div className="usage-stats-grid">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.id} className={`stat-tile stat-accent-${stat.accent}`}>
            <div className="stat-tile-header">
              <span className="stat-label">{stat.label}</span>
              <div className={`stat-icon-wrapper stat-icon-${stat.accent}`}>
                <Icon size={16} />
              </div>
            </div>
            <div className="stat-tile-body">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-sublabel">{stat.sublabel}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default UsageStats;
