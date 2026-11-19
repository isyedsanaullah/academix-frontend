'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import BrandLogo from '@/components/common/BrandLogo';
import CollegesHubLoader from '@/components/common/CollegesHubLoader';
import PlanCheckoutWizard from '@/components/subscription/PlanCheckoutWizard';
import {
  HiOutlineLockClosed,
  HiOutlineLogout,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

export default function RenewSubscriptionClient() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGet('/subscription/current');
        if (cancelled) return;
        if (res?.success && res?.data) {
          setSub(res.data);
          // If Super Admin unlocked/activated the college, refresh session and send to dashboard
          if (res.data.isLocked === false && user?.college?.isLocked) {
            updateUser({
              college: {
                ...user.college,
                isLocked: false,
                subStatus: res.data.effectiveSubStatus || res.data.subStatus,
              },
            });
            router.replace('/admin');
          }
        }
      } catch {
        // fallback to user.college info
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router, updateUser, user?.college]);

  const handleStatusSync = useCallback((nextSub) => {
    if (!nextSub) return;
    setSub(nextSub);
    if (nextSub.isLocked === false && user?.college?.isLocked) {
      updateUser({
        college: {
          ...user.college,
          isLocked: false,
          subStatus: nextSub.effectiveSubStatus || nextSub.subStatus,
        },
      });
      router.replace('/admin');
    }
  }, [router, updateUser, user]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <CollegesHubLoader size="md" text="Checking subscription status…" />
      </div>
    );
  }

  const status = sub?.effectiveSubStatus || sub?.subStatus || user?.college?.subStatus || 'EXPIRED';
  const lockReason = sub?.lockReason || user?.college?.lockReason || 'TRIAL_EXPIRED';
  const isDeactivated = status === 'DEACTIVATED' || lockReason === 'DEACTIVATED';
  const collegeName = sub?.collegeName || user?.college?.name || 'Your Institution';

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0E2238] flex flex-col">
      {/* Minimal top header for locked admins */}
      <header className="bg-white border-b border-[#DDE6F0] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <BrandLogo variant="horizontal" theme="light" size="sm" />
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs font-semibold text-[#52657C]">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#DDE6F0] text-xs font-semibold text-[#52657C] hover:text-[#0E2238] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <HiOutlineLogout size={15} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Lock Notice Card */}
        <div className="bg-white border border-red-200 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
              <HiOutlineLockClosed size={24} className="text-red-600" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-100 text-red-700">
                  {status}
                </span>
                <span className="text-xs text-[#52657C] font-medium">{collegeName}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#0E2238]">
                Renew your subscription
              </h1>
              <p className="text-sm text-[#52657C] leading-relaxed">
                {isDeactivated
                  ? 'Your institution workspace has been deactivated by CollegesHub administration. Students, teachers, and staff are currently blocked.'
                  : lockReason === 'TRIAL_EXPIRED'
                  ? 'Your 14-day free trial has ended without an approved payment. Students, teachers, and staff cannot log in until a subscription is activated.'
                  : 'Your subscription term has expired. Students, teachers, and staff cannot log in until renewal payment is approved.'}
              </p>
            </div>
          </div>

          {/* Status summary strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-[#DDE6F0]">
            <div className="p-3.5 rounded-xl bg-[#F4F7FB] border border-[#DDE6F0]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#52657C]">
                Current Status
              </p>
              <p className="text-sm font-extrabold text-[#0E2238] mt-1 flex items-center gap-1.5">
                <HiOutlineExclamationCircle size={16} className="text-red-600" />
                {status}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F4F7FB] border border-[#DDE6F0]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#52657C]">
                Trial / Term End
              </p>
              <p className="text-sm font-extrabold text-[#0E2238] mt-1 flex items-center gap-1.5">
                <HiOutlineClock size={16} className="text-[#0A4D94]" />
                {sub?.periodEnd || sub?.trialEndsAt
                  ? new Date(sub.periodEnd || sub.trialEndsAt).toLocaleDateString('en-PK', {
                      timeZone: 'Asia/Karachi',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Ended'}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F4F7FB] border border-[#DDE6F0]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#52657C]">
                Data Safety
              </p>
              <p className="text-sm font-extrabold text-[#1F7A3A] mt-1 flex items-center gap-1.5">
                <HiOutlineCheckCircle size={16} className="text-[#299A49]" />
                All Records Preserved
              </p>
            </div>
          </div>

        </div>

        {/* Interactive Plan Selection, 3-Copy UBL Pay Voucher PDF & R2 Proof Upload */}
        <PlanCheckoutWizard lockedMode onStatusChange={handleStatusSync} />
      </main>
    </div>
  );
}

