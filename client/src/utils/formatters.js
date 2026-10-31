/**
 * Formatting utility functions for metrics, timestamps, and numbers
 */

export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatTokens(tokens) {
  if (!tokens && tokens !== 0) return '0';
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}k`;
  }
  return formatNumber(tokens);
}

export function formatDuration(secondsOrMs) {
  if (secondsOrMs === null || secondsOrMs === undefined) return '0s';
  const val = Number(secondsOrMs);
  if (val < 10) {
    return `${val.toFixed(2)}s`;
  }
  if (val < 60) {
    return `${val.toFixed(1)}s`;
  }
  return `${(val / 60).toFixed(1)}m`;
}

export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 30) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export function formatPercentage(rate) {
  if (rate === null || rate === undefined) return '0%';
  return `${Number(rate).toFixed(2)}%`;
}
