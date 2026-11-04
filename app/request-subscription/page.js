import SubscriptionRequestClient from './_client';

export const metadata = {
  title: 'Subscription Plans & Pricing',
  description: 'Explore transparent subscription plans for colleges and higher education institutions. Compare Starter, Standard, Premium and Enterprise tiers.',
  alternates: {
    canonical: '/request-subscription',
  },
  openGraph: {
    title: 'Subscription Plans & Pricing | Collegeshub',
    description: 'Explore transparent subscription plans for colleges and higher education institutions. Compare Starter, Standard, Premium and Enterprise tiers.',
    url: 'https://www.collegeshub.org/request-subscription',
    type: 'website',
  },
};

export default function RequestSubscriptionPage() {
  return <SubscriptionRequestClient />;
}
