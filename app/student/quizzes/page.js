'use client';

import StudentQuizPortal from '@/components/quiz/StudentQuizPortal';
import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Page() {
  return (
    <AuthGuard allowedRoles={["student"]}>
      <DashboardLayout>
        <StudentQuizPortal />
      </DashboardLayout>
    </AuthGuard>
  );
}

