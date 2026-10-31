/**
 * Real Empty Schemas & Data Contracts for RAG Service
 * Zero fake numbers - returns clean empty telemetry states when no data is recorded.
 */

export const initialEmptyOverview = {
  apiConsumption: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    requestsPerMinute: 0,
    requestsPerDay: 0,
    requestsPerMonth: 0
  },
  tokenConsumption: {
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    avgTokensPerRequest: 0
  },
  llmPerformance: {
    avgResponseTime: 0,
    p50Latency: 0,
    p95Latency: 0,
    p99Latency: 0,
    modelConsumption: []
  },
  ragPerformance: {
    totalRetrievals: 0,
    avgChunksPerQuery: 0,
    avgRetrievalLatency: 0,
    relevantMatches: 0,
    noMatchQueries: 0
  }
};

export const emptyTimeSeries = [
  { time: '00:00', requests: 0, success: 0, failed: 0, inputTokens: 0, outputTokens: 0, avgLatency: 0 },
  { time: '04:00', requests: 0, success: 0, failed: 0, inputTokens: 0, outputTokens: 0, avgLatency: 0 },
  { time: '08:00', requests: 0, success: 0, failed: 0, inputTokens: 0, outputTokens: 0, avgLatency: 0 },
  { time: '12:00', requests: 0, success: 0, failed: 0, inputTokens: 0, outputTokens: 0, avgLatency: 0 },
  { time: '16:00', requests: 0, success: 0, failed: 0, inputTokens: 0, outputTokens: 0, avgLatency: 0 },
  { time: '20:00', requests: 0, success: 0, failed: 0, inputTokens: 0, outputTokens: 0, avgLatency: 0 }
];
