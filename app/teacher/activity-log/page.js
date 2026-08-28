'use client';

import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ActivityHistoryView from '@/components/activity/ActivityHistoryView';

export default function Page() {
  return (
    <AuthGuard allowedRoles={["teacher"]}>
      <DashboardLayout>
        <ActivityHistoryView role="teacher" roleTitle="Teacher Activity History" />
      </DashboardLayout>
    </AuthGuard>
  );
}
