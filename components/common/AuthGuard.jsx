'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';

export default function AuthGuard({ children, allowedRoles }) {
  const { user, loading, initialize } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Run initialization once on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

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

      // Phase 4: Unverified admin is forced to /verify-email
      if (user.role === 'admin' && user.email_verified === false && pathname !== '/verify-email') {
        router.replace('/verify-email');
        return;
      }

      // Phase 5: Gating for college status 'onboarding'
      if (user.role === 'admin' && user.college?.status === 'onboarding' && pathname !== '/onboarding' && pathname !== '/verify-email') {
        router.replace('/onboarding');
        return;
      }

      // Phase 5: Active colleges never see onboarding
      if (user.role === 'admin' && user.college?.status === 'active' && pathname === '/onboarding') {
        router.replace('/admin');
        return;
      }
    }
  }, [user, loading, allowedRoles, router, pathname]);

  if (loading || !user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return children;
}
