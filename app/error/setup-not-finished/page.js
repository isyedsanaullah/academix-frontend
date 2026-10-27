import ErrorPage from '@/components/common/ErrorPage';

export const metadata = {
  title: 'Setup Not Finished — Collegeshub',
  description: 'This institution is still completing its setup on Collegeshub.'
};

export default function SetupNotFinishedPage() {
  return <ErrorPage type="setup-not-finished" />;
}
