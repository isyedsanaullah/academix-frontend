'use client';

import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BannerManager from '@/components/banners/BannerManager';

export default function SuperAdminBannersPage() {
  return (
    <AuthGuard allowedRoles={['superAdmin']}>
      <DashboardLayout>
        <BannerManager mode="platform" />
      </DashboardLayout>
    </AuthGuard>
  );
}

