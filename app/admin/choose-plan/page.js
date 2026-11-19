'use client';

import ChoosePlanClient from './_client';
import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ChoosePlanPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <ChoosePlanClient />
      </DashboardLayout>
    </AuthGuard>
  );
}
