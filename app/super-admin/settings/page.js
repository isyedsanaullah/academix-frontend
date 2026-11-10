'use client';

import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SuperAdminSettingsView from '@/components/superAdmin/settings/SuperAdminSettingsView';

export default function Page() {
  return (
    <AuthGuard allowedRoles={["superAdmin"]}>
      <DashboardLayout>
        <SuperAdminSettingsView />
      </DashboardLayout>
    </AuthGuard>
  );
}
