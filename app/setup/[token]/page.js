// Server component wrapper for /setup/[token]
// Sets Referrer-Policy: no-referrer so the raw token is never leaked in referrer headers.
import { headers } from 'next/headers';
import SetupClient from './_client';

export const metadata = {
  title: 'Accept Invitation — Collegeshub',
  robots: 'noindex, nofollow'
};

export default function SetupPage({ params }) {
  return <SetupClient token={params.token} />;
}
