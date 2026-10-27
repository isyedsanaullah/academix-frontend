import { Suspense } from 'react';
import Login from '@/legacy-pages/auth/Login';

function LoginFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-card">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <Login />
    </Suspense>
  );
}
