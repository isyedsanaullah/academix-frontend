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
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.replace('/unauthorized');
      }
    }
  }, [user, loading, allowedRoles, router]);

  if (loading || !user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return children;
}
