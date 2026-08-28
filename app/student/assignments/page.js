'use client';

import StudentAssignmentList from '@/components/assignment/StudentAssignmentList';
import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Page() {
  return (
    <AuthGuard allowedRoles={["student"]}>
      <DashboardLayout>
        <StudentAssignmentList />
      </DashboardLayout>
    </AuthGuard>
  );
}
