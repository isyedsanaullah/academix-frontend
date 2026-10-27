// Server component wrapper for /set-password/[token]
// Static export: force-static so Next.js doesn't require generateStaticParams for real tokens.
export const dynamic = 'force-static';
export const dynamicParams = false;

import SetPasswordClient from './_client';

export const metadata = {
  title: 'Set Your Password — Collegeshub',
  robots: 'noindex, nofollow'
};

export function generateStaticParams() {
  return [{ token: '_' }];
}

export default function SetPasswordPage({ params }) {
  return <SetPasswordClient token={params.token} />;
}
