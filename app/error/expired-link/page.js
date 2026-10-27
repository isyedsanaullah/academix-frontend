import ErrorPage from '@/components/common/ErrorPage';

export const metadata = {
  title: 'Link Expired — Collegeshub',
  description: 'This invitation or setup link has expired.'
};

export default function ExpiredLinkPage() {
  return <ErrorPage type="expired-link" />;
}
