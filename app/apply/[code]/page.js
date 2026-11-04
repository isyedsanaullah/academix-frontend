// Server component wrapper — required for Next.js static export.
// generateStaticParams returns [] so no pages are pre-rendered;
// the .htaccess SPA fallback handles all dynamic routes client-side.
export const dynamic = 'force-static';
import ClientPage from './_client';

export const metadata = {
  title: 'Online Admission Application',
  description: 'Apply for admission online through the official Collegeshub portal.',
};

export function generateStaticParams() {
  return [{"code":"_"}];
}

export default function Page(props) {
  return <ClientPage {...props} />;
}
