'use strict';
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineExclamation, HiOutlineClock, HiOutlineBan, HiOutlineX } from 'react-icons/hi';

export default function SubscriptionExpiryBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const college = user?.college;
  const status = college?.subscription_status || college?.subscription?.status || 'active';
  const isSuspended = status === 'suspended' || college?.status === 'suspended' || college?.subscriptionSuspended;
  const isGrace = status === 'grace';

  // Calculate days left
  const periodEnd = college?.subscription?.periodEnd;
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
      <div className="w-full bg-rose-600 text-white px-4 py-3 text-xs sm:text-sm font-medium shadow-md flex items-center justify-between gap-3 sticky top-0 z-40">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <HiOutlineBan size={18} className="shrink-0 text-white" />
          <span>
            <strong>Subscription Expired:</strong> Access to institutional features is suspended. Non-admin staff and students are currently blocked. Please contact{' '}
            <a href="mailto:support@collegeshub.org" className="underline font-bold hover:text-rose-100">
              support@collegeshub.org
            </a>{' '}
            to restore your subscription immediately.
          </span>
        </div>
      </div>
    );
  }

  if (isGrace) {
    const graceUntil = college?.grace_until ? new Date(college.grace_until).toLocaleDateString() : '7 days';
    return (
      <div className="w-full bg-amber-500 text-slate-950 px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-md flex items-center justify-between gap-3 sticky top-0 z-40">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <HiOutlineExclamation size={18} className="shrink-0 text-slate-950" />
          <span>
            <strong>Grace Period Active:</strong> Your subscription has expired and is in a temporary grace period until {graceUntil}. Contact{' '}
            <a href="mailto:support@collegeshub.org" className="underline font-bold hover:text-slate-800">
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
    <div className="w-full bg-indigo-900/90 text-indigo-100 border-b border-indigo-700/50 px-4 py-2 text-xs font-medium flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 max-w-4xl mx-auto">
        <HiOutlineClock size={16} className="shrink-0 text-indigo-300" />
        <span>
          Your Collegeshub subscription expires in <strong>{daysLeft} day{daysLeft === 1 ? '' : 's'}</strong> ({new Date(periodEnd).toLocaleDateString()}). Contact administration or{' '}
          <a href="mailto:support@collegeshub.org" className="underline font-bold text-white hover:text-indigo-200">
            support@collegeshub.org
          </a>{' '}
          to renew.
        </span>
      </div>
      <button
        onClick={handleDismiss}
        className="text-indigo-300 hover:text-white p-1 rounded transition"
        title="Dismiss for today"
      >
        <HiOutlineX size={15} />
      </button>
    </div>
  );
}
