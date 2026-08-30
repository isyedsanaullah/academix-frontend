'use client';

import PageComponent from '@/legacy-pages/employee/GuardDashboard';
import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Page() {
  return (
    <AuthGuard allowedRoles={["admin", "employee"]}>
      <DashboardLayout>
        <PageComponent />
      </DashboardLayout>
    </AuthGuard>
  );
}
