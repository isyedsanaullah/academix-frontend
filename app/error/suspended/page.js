import ErrorPage from '@/components/common/ErrorPage';

export const metadata = {
  title: 'Access Temporarily Unavailable — Collegeshub',
  description: 'This institution\'s Collegeshub subscription has expired.'
};

export default function SuspendedPage() {
  return <ErrorPage type="suspended" />;
}
