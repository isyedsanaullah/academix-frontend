'use client';

import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ActivityHistoryView from '@/components/activity/ActivityHistoryView';

export default function Page() {
  return (
    <AuthGuard allowedRoles={["superAdmin"]}>
      <DashboardLayout>
        <ActivityHistoryView role="super-admin" roleTitle="Super Admin System Activity Log" />
      </DashboardLayout>
    </AuthGuard>
  );
}
