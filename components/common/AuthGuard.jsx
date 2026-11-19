'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import CollegesHubLoader from './CollegesHubLoader';

const ADMIN_LOCKED_ALLOWED_PATHS = [
  '/admin/renew',
  '/admin/choose-plan',
  '/admin/subscription',
];

function isPathAllowedWhileLocked(pathname = '') {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return ADMIN_LOCKED_ALLOWED_PATHS.some(
    (p) => clean === p || clean.startsWith(`${p}/`)
  );
}

function isCollegeSubscriptionLocked(college) {
  if (!college) return false;
  if (college.isLocked === true) return true;
  const st = String(college.effectiveSubStatus || college.subStatus || '').toUpperCase();
  if (['EXPIRED', 'DEACTIVATED', 'SUSPENDED'].includes(st)) return true;
  if (st === 'TRIAL' && college.trialEndsAt && new Date(college.trialEndsAt).getTime() <= Date.now()) {
    return true;
  }
  if (st === 'ACTIVE' && college.periodEnd && new Date(college.periodEnd).getTime() <= Date.now()) {
    return true;
  }
  return false;
}

export default function AuthGuard({ children, allowedRoles }) {
  const { user, loading, initialize } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Run initialization once on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  const locked = Boolean(user && user.role !== 'superAdmin' && isCollegeSubscriptionLocked(user.college));

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
        return;
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.replace('/unauthorized');
        return;
      }

      // Subscription Access Lock enforcement
      if (locked) {
        if (user.role === 'admin') {
          if (!isPathAllowedWhileLocked(pathname)) {
            router.replace('/admin/renew');
            return;
          }
        } else {
          if (pathname !== '/subscription-inactive') {
            router.replace('/subscription-inactive');
            return;
          }
        }
      }

      // Phase 4: Unverified admin is forced to /verify-email
      if (user.role === 'admin' && user.email_verified === false && pathname !== '/verify-email') {
        router.replace('/verify-email');
        return;
      }

      // Phase 5: Gating for college status 'onboarding' (when unlocked)
      if (!locked && user.role === 'admin' && user.college?.status === 'onboarding' && pathname !== '/onboarding' && pathname !== '/verify-email') {
        router.replace('/onboarding');
        return;
      }

      // Phase 5: Active colleges never see onboarding
      if (user.role === 'admin' && user.college?.status === 'active' && pathname === '/onboarding') {
        router.replace('/admin');
        return;
      }
    }
  }, [user, loading, allowedRoles, router, pathname, locked]);

  if (
    loading ||
    !user ||
    (allowedRoles && !allowedRoles.includes(user.role)) ||
    (locked && user.role !== 'admin' && pathname !== '/subscription-inactive') ||
    (locked && user.role === 'admin' && !isPathAllowedWhileLocked(pathname))
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <CollegesHubLoader size="md" text="Verifying session…" />
      </div>
    );
  }

  return children;
}
