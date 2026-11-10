'use client';

import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AccountingOverviewContent from './_client';

export default function AccountingOverviewPage() {
  return (
    <AuthGuard allowedRoles={['superAdmin']}>
      <DashboardLayout>
        <AccountingOverviewContent />
      </DashboardLayout>
    </AuthGuard>
  );
}
