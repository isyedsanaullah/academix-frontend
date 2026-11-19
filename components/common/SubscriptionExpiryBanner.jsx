'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { apiGet } from '@/lib/api';
import Icon from '../Icon';
import {
  HiOutlineX,
  HiOutlineSpeakerphone,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineInformationCircle,
} from 'react-icons/hi';

function getPktDayKey() {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function getStorageKey(prefix, userId) {
  return `${prefix}_${userId || 'anon'}_${getPktDayKey()}`;
}

function readDismissedMap(userId, banners) {
  if (typeof window === 'undefined') return { trial: false, expiry: false, banners: {} };
  const trial = Boolean(window.localStorage.getItem(getStorageKey('ch_trial_dismiss', userId)));
  const expiry = Boolean(window.localStorage.getItem(getStorageKey('ch_expiry_dismiss', userId)));
  const bannerMap = {};
  for (const b of banners || []) {
    if (window.localStorage.getItem(getStorageKey(`ch_banner_dismiss_${b.id}`, userId))) {
      bannerMap[b.id] = true;
    }
  }
  return { trial, expiry, banners: bannerMap };
}

const BANNER_VARIANT_STYLES = {
  info: {
    bar: 'bg-[#0A4D94] border-[#083D77] text-white',
    pill: 'bg-white/15 text-white',
    cta: 'bg-white text-[#0A4D94] hover:bg-blue-50',
    icon: HiOutlineInformationCircle,
  },
  success: {
    bar: 'bg-[#1F7A3A] border-[#16622D] text-white',
    pill: 'bg-white/15 text-white',
    cta: 'bg-white text-[#1F7A3A] hover:bg-emerald-50',
    icon: HiOutlineCheckCircle,
  },
  warning: {
    bar: 'bg-amber-50 border-amber-200 text-amber-950',
    pill: 'bg-amber-600 text-white',
    cta: 'bg-[#0A4D94] text-white hover:bg-[#083D77]',
    icon: HiOutlineExclamation,
  },
  urgent: {
    bar: 'bg-red-600 border-red-700 text-white',
    pill: 'bg-white/20 text-white',
    cta: 'bg-white text-red-700 hover:bg-red-50',
    icon: HiOutlineSpeakerphone,
  },
};

export default function SubscriptionExpiryBanner() {
  const { user } = useAuth();
  const [mountNow] = useState(() => Date.now());
  const userId = user?.id || user?._id || 'anon';

  const [customBanners, setCustomBanners] = useState([]);
  const [dismissState, setDismissState] = useState(() => readDismissedMap(userId, []));

  useEffect(() => {
    if (!user) return;
    let active = true;
    apiGet('/banners/active')
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res?.data) ? res.data : [];
        setCustomBanners(list);
        setDismissState(readDismissedMap(userId, list));
      })
      .catch(() => {
        if (active) setDismissState(readDismissedMap(userId, []));
      });
    return () => { active = false; };
  }, [user, userId]);

  const dismissKeyForToday = useCallback((prefix, id = null) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(getStorageKey(prefix, userId), '1');
    }
    setDismissState((prev) => {
      if (id) return { ...prev, banners: { ...prev.banners, [id]: true } };
      if (prefix === 'ch_trial_dismiss') return { ...prev, trial: true };
      if (prefix === 'ch_expiry_dismiss') return { ...prev, expiry: true };
      return prev;
    });
  }, [userId]);

  if (!user) return null;

  const college = user.college || null;
  const isSuperAdmin = user.role === 'superAdmin';
  const isAdmin = user.role === 'admin';

  const subStatus = String(
    college?.effectiveSubStatus ||
      college?.subStatus ||
      college?.subscription_status ||
      college?.subscription?.status ||
      'ACTIVE'
  ).toUpperCase();

  const trialEndsAt = college?.trialEndsAt || college?.subscription?.trialEndsAt || null;
  const periodEnd = college?.periodEnd || college?.subscription?.periodEnd || null;

  let daysLeft = typeof college?.daysRemaining === 'number' ? college.daysRemaining : null;
  if (daysLeft === null) {
    const targetDate = subStatus === 'TRIAL' || subStatus === 'PENDING_PAYMENT' ? trialEndsAt : periodEnd;
    if (targetDate) {
      daysLeft = Math.max(0, Math.ceil((new Date(targetDate).getTime() - mountNow) / 86400000));
    }
  }

  const isTrialOrPending =
    !isSuperAdmin &&
    Boolean(college) &&
    (subStatus === 'TRIAL' || subStatus === 'PENDING_PAYMENT') &&
    !college?.isLocked &&
    Boolean(trialEndsAt);

  const isLocked =
    !isSuperAdmin &&
    Boolean(college) &&
    Boolean(
      college?.isLocked ||
        subStatus === 'EXPIRED' ||
        subStatus === 'DEACTIVATED' ||
        subStatus === 'SUSPENDED' ||
        college?.status === 'suspended' ||
        college?.subscriptionSuspended ||
        college?.forceReadOnly ||
        college?.isReadOnly
    );

  const visibleCustomBanners = customBanners.filter((b) => !dismissState.banners[b.id]);

  // Locked notice cannot be dismissed for compliance
  const showLockedBanner = isLocked;
  const showTrialBanner = !showLockedBanner && isTrialOrPending && isAdmin && !dismissState.trial;
  const showExpiryBanner =
    !showLockedBanner &&
    !showTrialBanner &&
    !isSuperAdmin &&
    Boolean(college) &&
    isAdmin &&
    daysLeft !== null &&
    daysLeft <= 30 &&
    !dismissState.expiry;

  if (!showLockedBanner && !showTrialBanner && !showExpiryBanner && visibleCustomBanners.length === 0) {
    return null;
  }

  return (
    <div data-app-banner="stack" className="no-print w-full sticky top-0 z-30 flex flex-col">
      {/* 1. Hard-Locked Subscription Banner */}
      {showLockedBanner && (
        <div
          data-app-banner="locked"
          className="w-full bg-red-600 text-white px-4 py-3 text-body-2 font-medium shadow-widget flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 max-w-6xl mx-auto w-full justify-between flex-wrap">
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
      )}

      {/* 2. Dismissible 14-Day Free Trial Countdown Banner */}
      {showTrialBanner && (() => {
        const remaining = typeof daysLeft === 'number' ? daysLeft : 0;
        const isUrgent = remaining <= 3;
        return (
          <div
            data-app-banner="trial"
            className={`w-full px-4 py-2.5 text-caption font-medium border-b flex items-center justify-between gap-3 ${
              isUrgent
                ? 'bg-amber-50 border-amber-200 text-amber-950'
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
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/admin/choose-plan"
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-sm ${
                    isUrgent
                      ? 'bg-[#0A4D94] text-white hover:bg-[#083D77]'
                      : 'bg-[#299A49] hover:bg-[#22853D] text-white'
                  }`}
                >
                  Choose plan &amp; pay
                </Link>
                <button
                  type="button"
                  onClick={() => dismissKeyForToday('ch_trial_dismiss')}
                  aria-label="Close trial banner for today"
                  title="Dismiss for today"
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    isUrgent ? 'hover:bg-amber-200/60 text-amber-900' : 'hover:bg-white/15 text-white/85 hover:text-white'
                  }`}
                >
                  <HiOutlineX size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. Active Paid Expiry Warning (<= 30 days, dismissible for today) */}
      {showExpiryBanner && (
        <div
          data-app-banner="expiring"
          className="w-full bg-b-surface2 border-b border-s-stroke2 text-t-primary px-4 py-2.5 text-caption font-medium flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <Icon name="clock" className="!size-4 shrink-0 fill-primary-01" />
            <span>
              Your CollegesHub subscription expires in{' '}
              <strong>
                {daysLeft} day{daysLeft === 1 ? '' : 's'}
              </strong>
              {periodEnd ? ` (${new Date(periodEnd).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi' })})` : ''}.{' '}
              <Link href="/admin/choose-plan" className="underline font-bold text-[#0A4D94] hover:opacity-80">
                Renew now
              </Link>
            </span>
          </div>
          <button
            type="button"
            onClick={() => dismissKeyForToday('ch_expiry_dismiss')}
            aria-label="Dismiss subscription expiry notice for today"
            title="Dismiss for today"
            className="text-t-secondary hover:text-t-primary p-1.5 rounded-full hover:bg-b-surface1 transition cursor-pointer"
          >
            <HiOutlineX size={16} />
          </button>
        </div>
      )}

      {/* 4. Universal Platform & College Announcement Banners (crossable for the day) */}
      {visibleCustomBanners.map((b) => {
        const theme = BANNER_VARIANT_STYLES[b.variant] || BANNER_VARIANT_STYLES.info;
        const BannerIcon = theme.icon;
        const isExternalCta = b.ctaUrl && /^https?:\/\//i.test(b.ctaUrl);
        return (
          <div
            key={b.id}
            data-app-banner="custom"
            className={`w-full px-4 py-2.5 border-b text-xs sm:text-sm font-medium ${theme.bar}`}
          >
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${theme.pill}`}>
                  <BannerIcon size={12} />
                  {b.scope === 'PLATFORM' ? 'Platform Notice' : 'Campus Notice'}
                </span>
                <p className="min-w-0 leading-snug">
                  {b.title && <strong className="mr-1.5">{b.title}:</strong>}
                  <span>{b.message}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {b.ctaUrl && b.ctaLabel && (
                  isExternalCta ? (
                    <a
                      href={b.ctaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${theme.cta}`}
                    >
                      {b.ctaLabel}
                    </a>
                  ) : (
                    <Link
                      href={b.ctaUrl}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${theme.cta}`}
                    >
                      {b.ctaLabel}
                    </Link>
                  )
                )}
                <button
                  type="button"
                  onClick={() => dismissKeyForToday(`ch_banner_dismiss_${b.id}`, b.id)}
                  aria-label="Close banner for today"
                  title="Close for today"
                  className="p-1.5 rounded-lg hover:bg-black/10 transition cursor-pointer"
                >
                  <HiOutlineX size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
