'use client';

/**
 * StatCardWithoutChart — Core 2.0 Metric Card (Without sparkline chart)
 * Displays:
 *  - Key / Label (text-sub-title-2)
 *  - Current Value (large bold font-mono)
 *  - Capacity ratio / "out of X" indicator
 *  - Subtle progress bar / allocation bar
 *  - Raised surface styling matching UI8 Core 2.0
 */
const StatCardWithoutChart = ({
  id,
  label,
  value,
  max,
  unit = '',
  caption,
  color = 'blue', // 'blue' | 'emerald' | 'purple' | 'amber'
  className = '',
}) => {
  const numValue = Number(value) || 0;
  const numMax = Number(max) || 0;
  const percent = numMax > 0 ? Math.min(100, Math.round((numValue / numMax) * 100)) : null;

  const colorStyles = {
    blue: {
      bar: 'bg-primary-01',
      badge: 'bg-primary-01/10 text-primary-01 border-primary-01/20',
      text: 'text-primary-01',
    },
    emerald: {
      bar: 'bg-[#00a656]',
      badge: 'bg-[#00a656]/10 text-[#00a656] border-[#00a656]/20 dark:text-[#34d399]',
      text: 'text-[#00a656]',
    },
    purple: {
      bar: 'bg-[#8c62ff]',
      badge: 'bg-[#8c62ff]/10 text-[#8c62ff] border-[#8c62ff]/20 dark:text-[#a78bfa]',
      text: 'text-[#8c62ff]',
    },
    amber: {
      bar: 'bg-[#EF9D0E]',
      badge: 'bg-[#EF9D0E]/10 text-[#EF9D0E] border-[#EF9D0E]/20',
      text: 'text-[#EF9D0E]',
    },
  }[color] || {
    bar: 'bg-primary-01',
    badge: 'bg-primary-01/10 text-primary-01 border-primary-01/20',
    text: 'text-primary-01',
  };

  return (
    <div
      id={id ? `stat-card-${id}` : undefined}
      className={`group relative flex flex-col justify-between p-5 max-md:p-4 rounded-3xl bg-b-surface2 border border-s-subtle shadow-widget hover:border-s-highlight transition-all duration-200 ${className}`}
    >
      {/* Top: Label and Percent Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-caption font-semibold text-t-secondary uppercase tracking-wider truncate">
          {label}
        </span>
        {percent !== null && (
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border tabular-nums shrink-0 ${colorStyles.badge}`}
          >
            {percent}%
          </span>
        )}
      </div>

      {/* Center: Value / Out of Max */}
      <div className="mt-3 flex items-baseline gap-2 flex-wrap">
        <span className="text-h3 max-md:text-h4 font-mono font-bold tabular-nums text-t-primary leading-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && <span className="text-body-2 font-normal text-t-tertiary ml-1">{unit}</span>}
        </span>
        {numMax > 0 && (
          <span className="text-caption font-mono text-t-tertiary">
            / {numMax.toLocaleString()}
          </span>
        )}
      </div>

      {/* Bottom: Progress Bar & Optional Caption */}
      <div className="mt-3.5 space-y-1.5">
        {percent !== null && (
          <div className="w-full h-1.5 rounded-full bg-b-depth2 border border-s-subtle overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${colorStyles.bar}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
        <div className="flex items-center justify-between text-[11px] text-t-tertiary">
          <span>{caption || (numMax > 0 ? `out of ${numMax.toLocaleString()} allowed` : 'Current usage')}</span>
        </div>
      </div>
    </div>
  );
};

export default StatCardWithoutChart;

