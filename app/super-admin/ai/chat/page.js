'use client';

import SuperAdminAIChatView from '@/components/superAdmin/ai/SuperAdminAIChatView';
import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Page() {
  return (
    <AuthGuard allowedRoles={["superAdmin"]}>
      <DashboardLayout>
        <SuperAdminAIChatView />
      </DashboardLayout>
    </AuthGuard>
  );
}
