'use client';

import AccountantSubscriptionPage from './_client';
import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Page() {
  return (
    <AuthGuard allowedRoles={['accountant', 'admin']}>
      <DashboardLayout>
        <AccountantSubscriptionPage />
      </DashboardLayout>
    </AuthGuard>
  );
}

