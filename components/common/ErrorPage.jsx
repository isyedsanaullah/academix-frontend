'use client';

import Link from 'next/link';

/**
 * Phase 8 — Collegeshub Error Pages
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable branded error page component used for all onboarding/status errors:
 *   - expired-link      : invite or set-password link has expired
 *   - link-used         : invite was already used
 *   - link-revoked      : invite was revoked
 *   - college-not-found : unknown slug
 *   - setup-not-finished: college is still in onboarding (non-admin access)
 *   - suspended         : college subscription has been suspended
 *   - unauthorized      : general access denied
 *
 * Usage:
 *   <ErrorPage type="expired-link" />
 *   <ErrorPage type="college-not-found" collegeName="FMC" />
 */

const ERROR_CONFIGS = {
  'expired-link': {
    icon: '⏰',
    iconBg: 'from-amber-500/20 to-orange-500/20',
    iconBorder: 'border-amber-500/30',
    iconColor: 'text-amber-400',
    title: 'This link has expired',
    description: 'The invitation or setup link you followed is no longer valid. Invitation links expire after 7 days for security.',
    helpText: 'Please contact your Collegeshub administrator to request a new invitation link.',
    primaryAction: { label: 'Contact Support', href: 'mailto:support@collegeshub.org' },
    secondaryAction: { label: 'Go to Login', href: '/login' },
    badge: 'Expired',
    badgeColor: 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
  },
  'link-used': {
    icon: '✓',
    iconBg: 'from-green-500/20 to-emerald-500/20',
    iconBorder: 'border-green-500/30',
    iconColor: 'text-green-400',
    title: 'This link has already been used',
    description: "Your account has already been set up using this link. Each setup link can only be used once for security.",
    helpText: 'If you need to access your account, please log in with your credentials.',
    primaryAction: { label: 'Go to Login', href: '/login' },
    badge: 'Already Used',
    badgeColor: 'bg-green-500/15 text-green-400 border border-green-500/30'
  },
  'link-revoked': {
    icon: '🚫',
    iconBg: 'from-red-500/20 to-rose-500/20',
    iconBorder: 'border-red-500/30',
    iconColor: 'text-red-400',
    title: 'This link has been revoked',
    description: 'The invitation link you followed has been revoked by the Collegeshub administrator.',
    helpText: 'Please contact your institution administrator to request a new invitation.',
    primaryAction: { label: 'Contact Support', href: 'mailto:support@collegeshub.org' },
    secondaryAction: { label: 'Go to Home', href: '/' },
    badge: 'Revoked',
    badgeColor: 'bg-red-500/15 text-red-400 border border-red-500/30'
  },
  'college-not-found': {
    icon: '🏫',
    iconBg: 'from-blue-500/20 to-indigo-500/20',
    iconBorder: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    title: 'College not found',
    description: "We couldn't find a college associated with this address. The institution may not be registered on Collegeshub yet, or the URL may be incorrect.",
    helpText: 'Check the address in your browser or browse the Collegeshub college directory.',
    primaryAction: { label: 'Browse Colleges', href: 'https://collegeshub.org/colleges' },
    secondaryAction: { label: 'Go to Collegeshub', href: 'https://collegeshub.org' },
    badge: 'Not Found',
    badgeColor: 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
  },
  'setup-not-finished': {
    icon: '⚙️',
    iconBg: 'from-violet-500/20 to-purple-500/20',
    iconBorder: 'border-violet-500/30',
    iconColor: 'text-violet-400',
    title: 'College setup is not finished yet',
    description: 'This institution is still being set up on Collegeshub. Staff and students can log in once the administrator completes the setup process.',
    helpText: 'If you are the college administrator, log in to complete the setup.',
    primaryAction: { label: 'Admin Login', href: '/login' },
    secondaryAction: { label: 'Contact Administrator', href: 'mailto:support@collegeshub.org' },
    badge: 'Setup Pending',
    badgeColor: 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
  },
  'suspended': {
    icon: '⏸',
    iconBg: 'from-slate-500/20 to-gray-500/20',
    iconBorder: 'border-slate-500/30',
    iconColor: 'text-slate-400',
    title: 'College access temporarily unavailable',
    description: "This institution's Collegeshub subscription has expired. Access is temporarily restricted while the subscription is renewed.",
    helpText: 'If you are the college administrator, please contact Collegeshub to renew your subscription.',
    primaryAction: { label: 'Contact Collegeshub', href: 'mailto:support@collegeshub.org' },
    badge: 'Subscription Expired',
    badgeColor: 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
  },
  'unauthorized': {
    icon: '🔒',
    iconBg: 'from-red-500/20 to-rose-500/20',
    iconBorder: 'border-red-500/30',
    iconColor: 'text-red-400',
    title: 'Access denied',
    description: "You don't have permission to view this page. This area may require a different role or login.",
    helpText: 'Please log in with an account that has the required permissions.',
    primaryAction: { label: 'Go to Login', href: '/login' },
    secondaryAction: { label: 'Go Back', href: -1, isBack: true },
    badge: 'Unauthorized',
    badgeColor: 'bg-red-500/15 text-red-400 border border-red-500/30'
  }
};

export default function ErrorPage({
  type = 'unauthorized',
  collegeName,
  customTitle,
  customDescription,
  customHelpText
}) {
  const config = ERROR_CONFIGS[type] || ERROR_CONFIGS['unauthorized'];

  const title = customTitle || config.title;
  const description = customDescription || config.description;
  const helpText = customHelpText || config.helpText;

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4 py-16">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-brand-blue-700/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Collegeshub Brand */}
        <div className="text-center mb-8">
          <a
            href="https://collegeshub.org"
            className="inline-flex items-center gap-2.5 no-underline"
            aria-label="Collegeshub home"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue-700 to-brand-green-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              C
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Collegeshub<span className="text-brand-green-500">.org</span>
            </span>
          </a>
        </div>

        {/* Error Card */}
        <div className="card rounded-2xl border border-line shadow-2xl p-8 text-center">
          {/* Status Badge */}
          <div className="flex justify-center mb-5">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${config.badgeColor}`}>
              {config.badge}
            </span>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div
              className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${config.iconBg} border ${config.iconBorder} flex items-center justify-center text-4xl shadow-lg`}
              aria-hidden="true"
            >
              <span role="img">{config.icon}</span>
            </div>
          </div>

          {/* College Name (if provided) */}
          {collegeName && (
            <p className="text-xs font-medium text-fg-muted uppercase tracking-widest mb-2">
              {collegeName}
            </p>
          )}

          {/* Title */}
          <h1 className="text-xl font-bold text-fg mb-3">
            {title}
          </h1>

          {/* Description */}
          <p className="text-sm text-fg-muted leading-relaxed mb-4">
            {description}
          </p>

          {/* Help Text */}
          <div className="bg-card-2 rounded-xl px-4 py-3 mb-6 border border-line">
            <p className="text-xs text-fg-muted leading-relaxed">
              💡 {helpText}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {config.primaryAction && (
              <a
                href={config.primaryAction.href}
                className="btn-primary rounded-xl text-sm font-semibold py-3 text-center no-underline block"
                id={`error-primary-action-${type}`}
              >
                {config.primaryAction.label}
              </a>
            )}
            {config.secondaryAction && (
              config.secondaryAction.isBack ? (
                <button
                  onClick={() => window.history.back()}
                  className="btn-secondary rounded-xl text-sm font-medium py-3 w-full"
                  id={`error-secondary-action-${type}`}
                >
                  {config.secondaryAction.label}
                </button>
              ) : (
                <a
                  href={config.secondaryAction.href}
                  className="btn-secondary rounded-xl text-sm font-medium py-3 text-center no-underline block"
                  id={`error-secondary-action-${type}`}
                >
                  {config.secondaryAction.label}
                </a>
              )
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-fg-faint mt-6">
          Need help?{' '}
          <a
            href="mailto:support@collegeshub.org"
            className="text-brand-blue-400 hover:text-brand-blue-300 underline"
          >
            support@collegeshub.org
          </a>
        </p>
      </div>
    </div>
  );
}
