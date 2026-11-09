'use client';

import { ResponsiveContainer, LineChart, Line } from 'recharts';
import Percentage from '../ui/Percentage';

/**
 * StatCardWithChart — Core 2.0 Segmented Overview Metric Card
 * Displays:
 *  - Left: Key/Label, Value, and Caption (NO ICON)
 *  - Right: Percentage delta badge + small borderless vector sparkline
 *  - Dynamic theme tinting: subtle green for upgrade, subtle red for downgrade
 *  - Active state: raised clay-like depth shadow + brand accent ring
 */
const StatCardWithChart = ({
  id,
  label,
  value,
  caption,
  delta,
  sparkline = [],
  isUpgrade = true,
  isSelected = false,
  onClick,
  onKeyDown,
  ariaControls,
  className = '',
}) => {
  return (
    <div
      id={id ? `stat-card-${id}` : undefined}
      role="tab"
      tabIndex={0}
      aria-selected={isSelected}
      aria-controls={ariaControls}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={`group relative flex items-center justify-between gap-3 p-4.5 max-xl:p-3.5 rounded-3xl border transition-all duration-200 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-s-focus ${
        isUpgrade
          ? 'bg-[#00a656]/[0.05] border-[#00a656]/20 hover:bg-[#00a656]/[0.09] dark:bg-[#00a656]/[0.08] dark:border-[#00a656]/30 dark:hover:bg-[#00a656]/[0.12]'
          : 'bg-[#ff381c]/[0.05] border-[#ff381c]/20 hover:bg-[#ff381c]/[0.09] dark:bg-[#ff381c]/[0.08] dark:border-[#ff381c]/30 dark:hover:bg-[#ff381c]/[0.12]'
      } ${
        isSelected
          ? 'ring-2 ring-[var(--accent,var(--primary-01))] shadow-depth-toggle !bg-b-surface2'
          : ''
      } ${className}`}
    >
      {/* Left Side: Key (label) + Value + Caption (NO ICON) */}
      <div className="min-w-0 flex-1">
        <span className="text-sub-title-2 text-t-secondary truncate block font-medium">
          {label}
        </span>
        <div className="mt-1 text-h3 max-xl:text-h4 font-mono font-bold tabular-nums text-t-primary leading-tight">
          {value}
        </div>
        {caption && (
          <span className="mt-1 text-caption text-t-tertiary truncate block">
            {caption}
          </span>
        )}
      </div>

      {/* Right Side: Percentage Delta Badge + Sparkline Chart */}
      <div className="flex flex-col items-end justify-between gap-1.5 shrink-0 w-28 max-sm:w-22">
        {typeof delta === 'number' && <Percentage value={delta} />}
        {sparkline && sparkline.length > 0 && (
          <div className="h-8 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={sparkline}
                margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
              >
                <Line
                  type="monotone"
                  dataKey="val"
                  stroke={isUpgrade ? 'var(--primary-02)' : 'var(--primary-03)'}
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCardWithChart;

