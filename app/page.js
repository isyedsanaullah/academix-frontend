import HomePageClient from './_client';

export const metadata = {
  title: 'Collegeshub | Smart College Management System',
  description: 'Collegeshub is an integrated college management platform for admissions, academics, attendance, fees, examinations and student records.',
  alternates: {
    canonical: 'https://www.collegeshub.org/',
  },
  openGraph: {
    title: 'Collegeshub | Smart College Management System',
    description: 'Collegeshub is an integrated college management platform for admissions, academics, attendance, fees, examinations and student records.',
    url: 'https://www.collegeshub.org/',
    siteName: 'Collegeshub',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Collegeshub — Smart College Management System',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
