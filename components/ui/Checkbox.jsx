'use client';

import Icon from '../Icon';

const Checkbox = ({
  className = '',
  classTick = '',
  label,
  checked = false,
  onChange,
  disabled = false,
}) => {
  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label || 'Select item'}
      disabled={disabled}
      onClick={handleToggle}
      className={`group inline-flex items-center gap-3 cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${className}`}
    >
      <span
        className={`relative flex items-center justify-center shrink-0 size-5.5 rounded-[6px] border-2 transition-colors ${
          checked
            ? 'bg-primary-01 border-primary-01 text-t-light'
            : 'bg-b-surface2 border-s-stroke2 group-hover:border-primary-01/50'
        } ${classTick}`}
      >
        {checked && (
          <Icon name="check" className="!size-3.5 fill-t-light stroke-t-light" />
        )}
      </span>
      {label && <span className="text-button text-t-primary">{label}</span>}
    </button>
  );
};

export default Checkbox;

