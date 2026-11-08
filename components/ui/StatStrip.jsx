'use client';

import Icon from '../Icon';
import Percentage from './Percentage';
import Tooltip from './Tooltip';

/**
 * Core 2.0 Horizontal KPI Stat Strip
 * Replicates templates/Products/OverviewPage/Overview/Item/index.tsx from UI8 Core 2.0
 */
const StatStrip = ({ items = [], className = '' }) => {
  return (
    <div
      className={`card p-6 max-md:p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-s-subtle ${className}`}
    >
      {items.map((item, idx) => (
        <div
          key={item.id ?? item.label ?? idx}
          className={`${
            idx > 0 ? 'pt-4 sm:pt-0 sm:pl-6' : ''
          } flex items-start justify-between gap-4`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sub-title-2 text-t-secondary truncate">
                {item.label || item.title}
              </span>
              {item.tooltip && <Tooltip content={item.tooltip} />}
            </div>
            <div className="text-h3 max-md:text-h4 text-t-primary tabular-nums">
              {item.value ?? item.counter}
            </div>
            {(item.percentage !== undefined || item.subtitle) && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {item.percentage !== undefined && item.percentage !== null && (
                  <Percentage value={item.percentage} />
                )}
                {item.subtitle && (
                  <span className="text-caption text-t-tertiary">
                    {item.subtitle}
                  </span>
                )}
              </div>
            )}
          </div>
          {item.icon && (
            <div className="flex items-center justify-center size-13 shrink-0 rounded-full bg-b-surface1 border border-s-subtle">
              <Icon
                name={item.icon}
                className="!size-5.5 fill-primary-01"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StatStrip;

