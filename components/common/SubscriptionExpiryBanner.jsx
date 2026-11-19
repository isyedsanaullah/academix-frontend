'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import Icon from '../Icon';

export default function SubscriptionExpiryBanner() {
  const { user } = useAuth();
  const [mountNow] = useState(() => Date.now());
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const todayKey = `sub_banner_dismiss_${new Date().toISOString().split('T')[0]}`;
    return Boolean(sessionStorage.getItem(todayKey));
  });

  const college = user?.college;
  const subStatus = String(
    college?.effectiveSubStatus ||
      college?.subStatus ||
      college?.subscription_status ||
      college?.subscription?.status ||
      'ACTIVE'
  ).toUpperCase();

  const trialEndsAt = college?.trialEndsAt || college?.subscription?.trialEndsAt || null;
  const periodEnd = college?.periodEnd || college?.subscription?.periodEnd || null;

  // Prefer server-computed daysRemaining; fall back to mount timestamp only if absent
  let daysLeft =
    typeof college?.daysRemaining === 'number' ? college.daysRemaining : null;

  if (daysLeft === null) {
    const targetDate = subStatus === 'TRIAL' || subStatus === 'PENDING_PAYMENT' ? trialEndsAt : periodEnd;
    if (targetDate) {
      const diff = new Date(targetDate).getTime() - mountNow;
      daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
  }

  const isTrialOrPending =
    (subStatus === 'TRIAL' || subStatus === 'PENDING_PAYMENT') &&
    !college?.isLocked &&
    Boolean(trialEndsAt);

  const isLocked = Boolean(
    college?.isLocked ||
      subStatus === 'EXPIRED' ||
      subStatus === 'DEACTIVATED' ||
      subStatus === 'SUSPENDED' ||
      college?.status === 'suspended' ||
      college?.subscriptionSuspended ||
      college?.forceReadOnly ||
      college?.isReadOnly
  );

  // Never show for Super Admin or missing college
  if (!user || user.role === 'superAdmin' || !college) return null;

  const isAdmin = user.role === 'admin';

  // 1. Locked / Expired / Deactivated banner
  if (isLocked) {
    return (
      <div
        data-app-banner="locked"
        className="no-print w-full bg-red-600 text-white px-4 py-3 text-body-2 font-medium shadow-widget flex items-center justify-between gap-3 sticky top-0 z-30"
      >
        <div className="flex items-center gap-2.5 max-w-5xl mx-auto w-full justify-between flex-wrap">
          <div className="flex items-center gap-2.5">
            <Icon name="ban" className="!size-5 shrink-0 fill-white" />
            <span>
              {isAdmin ? (
                <>
                  <strong>Subscription Inactive:</strong> Your trial or subscription has ended. Non-admin users cannot access the portal until you renew.
                </>
              ) : (
                <strong>College subscription inactive, contact your administration.</strong>
              )}
            </span>
          </div>
          {isAdmin && (
            <Link
              href="/admin/renew"
              className="px-4 py-1.5 rounded-xl bg-white text-red-700 font-bold text-xs hover:bg-red-50 transition-colors shrink-0"
            >
              Renew Subscription →
            </Link>
          )}
        </div>
      </div>
    );
  }

  // 2. Trial Countdown Banner for College Admin (CollegesHub Blue + Green)
  if (isTrialOrPending && isAdmin) {
    const remaining = typeof daysLeft === 'number' ? daysLeft : 0;
    const isUrgent = remaining <= 3;
    return (
      <div
        data-app-banner="trial"
        className={`no-print w-full px-4 py-2.5 text-caption font-medium border-b flex items-center justify-between gap-3 sticky top-0 z-30 ${
          isUrgent
            ? 'bg-amber-50 border-amber-200 text-amber-950 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-100'
            : 'bg-gradient-to-r from-[#0A4D94] to-[#1262B5] border-[#083D77] text-white'
        }`}
      >
        <div className="flex items-center justify-between gap-3 max-w-6xl mx-auto w-full flex-wrap">
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isUrgent ? 'bg-amber-600 text-white' : 'bg-[#299A49] text-white'
              }`}
            >
              {subStatus === 'PENDING_PAYMENT' ? 'Payment Pending' : 'Free Trial'}
            </span>
            <span className="text-xs sm:text-sm font-semibold">
              {remaining} day{remaining === 1 ? '' : 's'} left in your free trial
              {trialEndsAt
                ? ` · Ends ${new Date(trialEndsAt).toLocaleDateString('en-PK', {
                    timeZone: 'Asia/Karachi',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}`
                : ''}
            </span>
          </div>
          <Link
            href="/admin/choose-plan"
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 shadow-sm ${
              isUrgent
                ? 'bg-[#0A4D94] text-white hover:bg-[#083D77]'
                : 'bg-[#299A49] hover:bg-[#22853D] text-white'
            }`}
          >
            Choose plan &amp; pay
          </Link>
        </div>
      </div>
    );
  }

  // 3. Active paid subscription expiry warning (<= 30 days)
  if (!isAdmin || daysLeft === null || daysLeft > 30 || dismissed) return null;

  const handleDismiss = () => {
    const todayKey = `sub_banner_dismiss_${new Date().toISOString().split('T')[0]}`;
    sessionStorage.setItem(todayKey, 'true');
    setDismissed(true);
  };

  return (
    <div
      data-app-banner="expiring"
      className="no-print w-full bg-b-surface2 border-b border-s-stroke2 text-t-primary px-4 py-2.5 text-caption font-medium flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2 max-w-4xl mx-auto">
        <Icon name="clock" className="!size-4 shrink-0 fill-primary-01" />
        <span>
          Your CollegesHub subscription expires in{' '}
          <strong>
            {daysLeft} day{daysLeft === 1 ? '' : 's'}
          </strong>
          {periodEnd ? ` (${new Date(periodEnd).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi' })})` : ''}.{' '}
          <Link href="/admin/subscription" className="underline font-bold text-[#0A4D94] hover:opacity-80">
            Renew now
          </Link>
        </span>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss subscription expiry notice for today"
        className="text-t-secondary hover:text-t-primary p-1.5 rounded-full hover:bg-b-surface1 transition"
        title="Dismiss for today"
      >
        <Icon name="close" className="!size-4 fill-current" />
      </button>
    </div>
  );
}
