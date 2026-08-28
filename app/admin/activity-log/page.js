'use client';

import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ActivityHistoryView from '@/components/activity/ActivityHistoryView';

export default function Page() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <DashboardLayout>
        <ActivityHistoryView role="admin" roleTitle="Administration Activity History" />
      </DashboardLayout>
    </AuthGuard>
  );
}
