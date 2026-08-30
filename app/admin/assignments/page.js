'use client';

import PageComponent from '@/legacy-pages/admin/Assignments';
import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Page() {
  return (
    <AuthGuard allowedRoles={["admin", "teacher"]}>
      <DashboardLayout>
        <PageComponent />
      </DashboardLayout>
    </AuthGuard>
  );
}
