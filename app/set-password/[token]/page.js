// Server component wrapper for /set-password/[token]
// Static export: force-static so Next.js doesn't require generateStaticParams for real tokens.
export const dynamic = 'force-static';

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
