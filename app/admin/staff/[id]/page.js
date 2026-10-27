// Server component wrapper — required for Next.js static export.
// generateStaticParams returns [] so no pages are pre-rendered;
// the .htaccess SPA fallback handles all dynamic routes client-side.
export const dynamic = 'force-static';
export const dynamicParams = false;
import ClientPage from './_client';

export function generateStaticParams() {
  return [{"id":"_"}];
}

export default function Page(props) {
  return <ClientPage {...props} />;
}
