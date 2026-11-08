'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../Icon';

export default function SubscriptionExpiryBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const college = user?.college;
  const status =
    college?.subStatus ||
    college?.subscription_status ||
    college?.subscription?.status ||
    'active';
  const isSuspended =
    status === 'suspended' ||
    status === 'expired' ||
    college?.status === 'suspended' ||
    college?.subscriptionSuspended ||
    college?.forceReadOnly ||
    college?.isReadOnly;
  const isGrace = status === 'grace';

  // Calculate days left
  const periodEnd = college?.periodEnd || college?.subscription?.periodEnd;
  let daysLeft = null;
  if (periodEnd) {
    const diff = new Date(periodEnd).getTime() - Date.now();
    daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // Check dismissal key for 30-day warning
  useEffect(() => {
    if (typeof window !== 'undefined' && periodEnd) {
      const todayKey = `sub_banner_dismiss_${new Date().toISOString().split('T')[0]}`;
      if (sessionStorage.getItem(todayKey)) {
        setDismissed(true);
      }
    }
  }, [periodEnd]);

  // Don't show if superAdmin or if subscription is comfortably active (> 30 days)
  if (user?.role === 'superAdmin' || !college) return null;
  if (!isSuspended && !isGrace && (daysLeft === null || daysLeft > 30)) return null;
  if (dismissed && !isSuspended && !isGrace) return null;

  const handleDismiss = () => {
    const todayKey = `sub_banner_dismiss_${new Date().toISOString().split('T')[0]}`;
    sessionStorage.setItem(todayKey, 'true');
    setDismissed(true);
  };

  if (isSuspended) {
    return (
      <div
        data-app-banner="suspended"
        className="no-print w-full bg-primary-03 text-white px-4 py-3 text-body-2 font-medium shadow-widget flex items-center justify-between gap-3 sticky top-0 z-30"
      >
        <div className="flex items-center gap-2.5 max-w-4xl mx-auto">
          <Icon name="ban" className="!size-5 shrink-0 fill-white" />
          <span>
            <strong>Subscription Expired:</strong> Access to institutional features is suspended. Non-admin staff and students are currently blocked. Please contact{' '}
            <a
              href="mailto:support@collegeshub.org"
              className="underline font-bold hover:opacity-90"
            >
              support@collegeshub.org
            </a>{' '}
            to restore your subscription immediately.
          </span>
        </div>
      </div>
    );
  }

  if (isGrace) {
    const graceUntil = college?.grace_until
      ? new Date(college.grace_until).toLocaleDateString()
      : '7 days';
    return (
      <div
        data-app-banner="grace"
        className="no-print w-full bg-primary-05 text-[#0F1B2D] px-4 py-2.5 text-body-2 font-semibold shadow-widget flex items-center justify-between gap-3 sticky top-0 z-30"
      >
        <div className="flex items-center gap-2.5 max-w-4xl mx-auto">
          <Icon name="alert" className="!size-5 shrink-0 fill-[#0F1B2D]" />
          <span>
            <strong>Grace Period Active:</strong> Your subscription has expired and is in a temporary grace period until {graceUntil}. Contact{' '}
            <a
              href="mailto:support@collegeshub.org"
              className="underline font-bold hover:opacity-80"
            >
              support@collegeshub.org
            </a>{' '}
            to renew before service suspension.
          </span>
        </div>
      </div>
    );
  }

  // 30-day expiry warning window
  return (
    <div
      data-app-banner="expiring"
      className="no-print w-full bg-b-surface2 border-b border-s-stroke2 text-t-primary px-4 py-2.5 text-caption font-medium flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2 max-w-4xl mx-auto">
        <Icon name="clock" className="!size-4 shrink-0 fill-primary-01" />
        <span>
          Your Collegeshub subscription expires in{' '}
          <strong>
            {daysLeft} day{daysLeft === 1 ? '' : 's'}
          </strong>{' '}
          ({new Date(periodEnd).toLocaleDateString()}). Contact administration or{' '}
          <a
            href="mailto:support@collegeshub.org"
            className="underline font-bold text-t-blue hover:opacity-80"
          >
            support@collegeshub.org
          </a>{' '}
          to renew.
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
