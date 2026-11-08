'use client';

const Switch = ({
  className = '',
  checked = false,
  onChange,
  disabled = false,
  ariaLabel = 'Toggle setting',
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        if (!disabled && onChange) onChange(!checked);
      }}
      className={`group relative inline-flex w-11 h-6 shrink-0 items-center rounded-full border transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${
        checked
          ? 'bg-primary-01 border-primary-01'
          : 'bg-b-surface1 border-s-stroke2'
      } ${className}`}
    >
      <span
        className={`size-4.5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-5.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
};

export default Switch;

