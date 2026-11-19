import ServicesClient from './_client';

export const metadata = {
  title: '162 Services · Academix by Collegeshub',
  description: 'Explore all 162 academic management services across Starter, Standard, and Premium tiers — from admissions and fees to AI-powered analytics.',
  alternates: {
    canonical: '/services',
  },
  openGraph: {
    title: '162 Services · Academix by Collegeshub',
    description: 'Explore all 162 academic management services across Starter, Standard, and Premium tiers.',
    url: 'https://www.collegeshub.org/services',
    type: 'website',
  },
};

export default function ServicesPage() {
  return <ServicesClient />;
}

