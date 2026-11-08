'use client';

import Icon from '../Icon';

const Spinner = ({ className = '', label = 'Loading...' }) => (
  <div
    role="status"
    aria-label={label}
    className={`flex flex-col items-center justify-center gap-2.5 py-6 ${className}`}
  >
    <div className="flex justify-center items-center w-12 h-12 bg-b-surface2 border border-s-subtle rounded-full shadow-widget">
      <Icon
        name="loader"
        className="!size-6 fill-primary-01 animate-spin"
      />
    </div>
    {label && <span className="text-caption text-t-secondary">{label}</span>}
  </div>
);

export default Spinner;

