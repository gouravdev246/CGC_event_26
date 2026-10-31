import React from 'react';

export function Loader({ size = 'md', text = 'Loading metrics...' }) {
  return (
    <div className={`loader-container loader-${size}`}>
      <div className="spinner" />
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
}

export default Loader;
