'use client';

import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ActivityHistoryView from '@/components/activity/ActivityHistoryView';

export default function Page() {
  return (
    <AuthGuard allowedRoles={["registrar"]}>
      <DashboardLayout>
        <ActivityHistoryView role="registrar" roleTitle="Registrar Academic Activity History" />
      </DashboardLayout>
    </AuthGuard>
  );
}
