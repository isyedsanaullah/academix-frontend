'use client';

import Icon from '../Icon';

const Percentage = ({ className = '', value = 0, large = false }) => {
  const num = Number(value) || 0;
  const isPositive = num >= 0;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 rounded-lg font-semibold ${
        isPositive ? 'label-green' : 'label-red'
      } ${
        large
          ? 'h-9 text-body-1 max-md:h-7 max-md:text-button'
          : 'h-7 text-caption'
      } ${className}`}
    >
      <Icon
        className={`!size-3.5 ${
          isPositive ? 'fill-current rotate-180' : 'fill-current'
        }`}
        name="arrow-percent"
      />
      <span>{Math.abs(num)}%</span>
    </span>
  );
};

export default Percentage;

