'use client';

import RenewSubscriptionClient from './_client';
import AuthGuard from '@/components/common/AuthGuard';

export default function RenewPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <RenewSubscriptionClient />
    </AuthGuard>
  );
}

