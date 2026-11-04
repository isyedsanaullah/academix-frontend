export const dynamic = 'force-static';
import CollegesPageClient from './_client';

export const metadata = {
  title: 'Colleges Directory | Collegeshub',
  description: 'Explore registered colleges, intermediate institutions, and higher education academies on Collegeshub.',
  alternates: {
    canonical: 'https://www.collegeshub.org/colleges',
  },
};

export default function CollegesPage() {
  return <CollegesPageClient />;
}

