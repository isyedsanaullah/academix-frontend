'use client';

import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PerCollegeBillingContent from './_client';

export default function PerCollegeBillingPage() {
  return (
    <AuthGuard allowedRoles={['superAdmin']}>
      <DashboardLayout>
        <PerCollegeBillingContent />
      </DashboardLayout>
    </AuthGuard>
  );
}
