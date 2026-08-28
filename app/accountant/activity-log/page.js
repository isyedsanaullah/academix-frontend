'use client';

import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ActivityHistoryView from '@/components/activity/ActivityHistoryView';

export default function Page() {
  return (
    <AuthGuard allowedRoles={["accountant"]}>
      <DashboardLayout>
        <ActivityHistoryView role="accountant" roleTitle="Accountant Financial Activity History" />
      </DashboardLayout>
    </AuthGuard>
  );
}
