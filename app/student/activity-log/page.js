'use client';

import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ActivityHistoryView from '@/components/activity/ActivityHistoryView';

export default function Page() {
  return (
    <AuthGuard allowedRoles={["student"]}>
      <DashboardLayout>
        <ActivityHistoryView role="student" roleTitle="Student Activity History" />
      </DashboardLayout>
    </AuthGuard>
  );
}
