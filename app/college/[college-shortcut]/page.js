// Server component wrapper — required for Next.js static export.
// generateStaticParams returns [] so no pages are pre-rendered;
// the .htaccess SPA fallback handles all dynamic routes client-side.
export const dynamic = 'force-static';
import ClientPage from './_client';

export const metadata = {
  title: 'College Profile',
  description: 'View college details, academic programs, facilities, and admission requirements on Collegeshub.',
};

export function generateStaticParams() {
  return [{"college-shortcut":"_"}];
}

export default function Page(props) {
  return <ClientPage {...props} />;
}
