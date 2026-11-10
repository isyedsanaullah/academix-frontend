'use client';

import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PaymentsHistoryContent from './_client';

export default function PaymentsHistoryPage() {
  return (
    <AuthGuard allowedRoles={['superAdmin']}>
      <DashboardLayout>
        <PaymentsHistoryContent />
      </DashboardLayout>
    </AuthGuard>
  );
}
