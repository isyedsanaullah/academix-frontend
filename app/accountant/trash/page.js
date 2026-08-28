'use client';

import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TrashView from '@/components/trash/TrashView';

export default function Page() {
  return (
    <AuthGuard allowedRoles={["accountant"]}>
      <DashboardLayout>
        <TrashView role="accountant" />
      </DashboardLayout>
    </AuthGuard>
  );
}
