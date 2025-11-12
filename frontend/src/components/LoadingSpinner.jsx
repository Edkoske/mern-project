import React from 'react';

const LoadingSpinner = ({ label, className = '' }) => (
  <div className={`flex items-center gap-2 ${className}`} role="status" aria-live="polite">
    <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
    {label ? <span className="text-sm text-slate-600">{label}</span> : null}
  </div>
);

export default LoadingSpinner;
