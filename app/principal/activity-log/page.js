'use client';

import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ActivityHistoryView from '@/components/activity/ActivityHistoryView';

export default function Page() {
  return (
    <AuthGuard allowedRoles={["principal"]}>
      <DashboardLayout>
        <ActivityHistoryView role="principal" roleTitle="Principal Institutional Activity Log" />
      </DashboardLayout>
    </AuthGuard>
  );
}
