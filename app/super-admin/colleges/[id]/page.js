// Server component wrapper — required for Next.js static export.
// generateStaticParams returns ["_"] so the static build only pre-renders the
// placeholder; the .htaccess SPA fallback maps real UUIDs → _/index.html on prod.
// dynamicParams = true allows the dev server to serve real IDs without a 404.
export const dynamic = 'force-static';
import ClientPage from './_client';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function Page(props) {
  return <ClientPage {...props} />;
}
