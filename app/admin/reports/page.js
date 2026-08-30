'use client';

import PageComponent from '@/legacy-pages/principal/ReportCenter';
import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Page() {
  return (
    <AuthGuard allowedRoles={["admin", "principal"]}>
      <DashboardLayout>
        <PageComponent />
      </DashboardLayout>
    </AuthGuard>
  );
}
