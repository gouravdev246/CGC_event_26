import React from 'react';

export function Badge({
  children,
  variant = 'neutral', // 'success' | 'error' | 'warning' | 'indigo' | 'neutral'
  size = 'md', // 'sm' | 'md'
  dot = false,
  className = ''
}) {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`}>
      {dot && <span className={`badge-dot badge-dot-${variant}`} />}
      {children}
    </span>
  );
}

export default Badge;
