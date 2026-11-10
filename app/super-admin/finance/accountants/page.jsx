'use client';

import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AccountantsContent from './_client';

export default function AccountantDetailsPage() {
  return (
    <AuthGuard allowedRoles={['superAdmin']}>
      <DashboardLayout>
        <AccountantsContent />
      </DashboardLayout>
    </AuthGuard>
  );
}
