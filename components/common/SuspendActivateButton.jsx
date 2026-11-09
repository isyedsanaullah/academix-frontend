'use client';

/**
 * SuspendActivateButton — Animated SVG button for Suspend / Activate Institution
 * - When Active: Circular icon with an animated crossline that draws across on hover.
 * - When Suspended: Crossed icon that animates the crossline away on hover, transitioning to an active checkmark.
 */
const SuspendActivateButton = ({ isActive = true, onClick, disabled = false }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={isActive ? 'Suspend Institution' : 'Activate Institution'}
      aria-label={isActive ? 'Suspend Institution' : 'Activate Institution'}
      className={`group relative flex items-center justify-center size-11 rounded-full border transition-all cursor-pointer shadow-widget shrink-0 ${
        isActive
          ? 'bg-b-surface1 border-s-subtle text-t-secondary hover:text-rose-600 hover:border-rose-500/40 hover:bg-rose-500/10 dark:hover:bg-rose-500/15'
          : 'bg-rose-500/10 border-rose-500/30 text-rose-600 hover:text-[#00a656] hover:border-[#00a656]/40 hover:bg-[#00a656]/10 dark:hover:bg-[#00a656]/15'
      }`}
    >
      {isActive ? (
        /* Suspend SVG: Hover draws the slash/crossline across */
        <svg
          viewBox="0 0 24 24"
          className="size-5 transition-transform duration-200 group-hover:scale-105"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" className="transition-colors" />
          <line
            x1="5.6"
            y1="5.6"
            x2="18.4"
            y2="18.4"
            className="transition-all duration-300 ease-out origin-center stroke-current group-hover:stroke-rose-600"
            style={{
              strokeDasharray: 22,
              strokeDashoffset: 22,
            }}
          />
        </svg>
      ) : (
        /* Activate SVG: Starts crossed, on hover removes crossline and reveals checkmark */
        <svg
          viewBox="0 0 24 24"
          className="size-5 transition-transform duration-200 group-hover:scale-105"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" className="transition-colors group-hover:stroke-[#00a656]" />
          <line
            x1="5.6"
            y1="5.6"
            x2="18.4"
            y2="18.4"
            className="transition-all duration-300 ease-out origin-center stroke-current group-hover:opacity-0 group-hover:scale-0"
          />
          <path
            d="M8.5 12.5l2.5 2.5 5-5"
            className="transition-all duration-300 ease-out stroke-[#00a656] opacity-0 group-hover:opacity-100"
            style={{
              strokeDasharray: 14,
              strokeDashoffset: 14,
            }}
          />
        </svg>
      )}

      {/* Embedded CSS rules for hover stroke animations */}
      <style jsx>{`
        button:hover line {
          stroke-dashoffset: 0 !important;
        }
        button:hover path {
          stroke-dashoffset: 0 !important;
        }
      `}</style>
    </button>
  );
};

export default SuspendActivateButton;

