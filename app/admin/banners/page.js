'use client';

import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BannerManager from '@/components/banners/BannerManager';

export default function AdminBannersPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <BannerManager mode="college" />
      </DashboardLayout>
    </AuthGuard>
  );
}

