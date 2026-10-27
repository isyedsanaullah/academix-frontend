// Server component wrapper for /setup/[token]
// Static export: force-static so Next.js doesn't require generateStaticParams for real tokens.
export const dynamic = 'force-static';
export const dynamicParams = false;

import SetupClient from './_client';

export const metadata = {
  title: 'Accept Invitation — Collegeshub',
  robots: 'noindex, nofollow'
};

export function generateStaticParams() {
  return [{ token: '_' }];
}

export default function SetupPage({ params }) {
  return <SetupClient token={params.token} />;
}
