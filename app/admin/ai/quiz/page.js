'use client';

import PageComponent from '@/legacy-pages/ai/AIQuizGenerator';
import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Page() {
  return (
    <AuthGuard allowedRoles={["admin", "teacher", "principal"]}>
      <DashboardLayout>
        <PageComponent />
      </DashboardLayout>
    </AuthGuard>
  );
}
