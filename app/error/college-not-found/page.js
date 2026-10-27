import ErrorPage from '@/components/common/ErrorPage';

export const metadata = {
  title: 'College Not Found — Collegeshub',
  description: 'We could not find a college at this address.'
};

export default function CollegeNotFoundPage() {
  return <ErrorPage type="college-not-found" />;
}
