// Server component wrapper for /set-password/[token]
// Sets Referrer-Policy: no-referrer so the raw token is never leaked in referrer headers.
import SetPasswordClient from './_client';

export const metadata = {
  title: 'Set Your Password — Collegeshub',
  robots: 'noindex, nofollow'
};

export default function SetPasswordPage({ params }) {
  return <SetPasswordClient token={params.token} />;
}
