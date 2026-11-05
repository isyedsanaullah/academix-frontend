'use client';

import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SuperAdminBillingClient from './_client';

export default function SuperAdminBillingPage() {
  return (
    <AuthGuard allowedRoles={['superAdmin']}>
      <DashboardLayout>
        <SuperAdminBillingClient />
      </DashboardLayout>
    </AuthGuard>
  );
}

