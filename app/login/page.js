import { Suspense } from 'react';
import Login from '@/legacy-pages/auth/Login';
import CollegesHubLoader from '@/components/common/CollegesHubLoader';

export const metadata = {
  title: 'Sign In',
  description: 'Sign in to your college administrative, faculty or student portal on Collegeshub.',
  alternates: {
    canonical: '/login',
  },
};

function LoginFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-card">
      <CollegesHubLoader size="lg" text="Loading CollegesHub sign-in…" />
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
