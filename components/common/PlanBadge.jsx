/**
 * PlanBadge — Displays the subscription plan with appropriate color coding
 * Usage: <PlanBadge plan="premium" /> or <PlanBadge plan="basic" size="lg" />
 */
const PLAN_CONFIG = {
  basic:    { label: 'Basic',    color: 'bg-slate-500/12 text-slate-300',   dot: 'bg-slate-400' },
  standard: { label: 'Standard', color: 'bg-amber-500/12 text-amber-300',   dot: 'bg-amber-400' },
  premium:  { label: 'Premium',  color: 'bg-violet-500/12 text-violet-300', dot: 'bg-violet-400' },
};

const STATUS_CONFIG = {
  active:    { label: 'Active',    color: 'bg-emerald-500/12 text-emerald-300' },
  trial:     { label: 'Trial',     color: 'bg-sky-500/12 text-sky-300' },
  suspended: { label: 'Suspended', color: 'bg-red-500/12 text-red-300' },
  expired:   { label: 'Expired',   color: 'bg-white/8 text-white/40' },
};

const PlanBadge = ({ plan, status, size = 'sm', showDot = true }) => {
  if (status) {
    const sc = STATUS_CONFIG[status] || STATUS_CONFIG.active;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold tracking-tight whitespace-nowrap ${sc.color} ${size === 'lg' ? 'text-xs px-3 py-1' : 'text-[11px]'}`}>
        {sc.label}
      </span>
    );
  }

  const pc = PLAN_CONFIG[plan] || PLAN_CONFIG.basic;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold tracking-tight whitespace-nowrap ${pc.color} ${size === 'lg' ? 'text-xs px-3 py-1' : 'text-[11px]'}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />}
      {pc.label}
    </span>
  );
};

export default PlanBadge;
