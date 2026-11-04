'use client';

import AdminSubscriptionPage from './_client';
import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Page() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <AdminSubscriptionPage />
      </DashboardLayout>
    </AuthGuard>
  );
}

