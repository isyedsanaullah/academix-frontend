import "./globals.css";
import QueryProvider from "../providers/QueryProvider";
import ThemeProvider from "../providers/ThemeProvider";
import ClientInitializer from "../components/common/ClientInitializer";

export const metadata = {
  metadataBase: new URL('https://www.collegeshub.org'),
  title: {
    default: 'Collegeshub | Smart College Management System',
    template: '%s | Collegeshub',
  },
  description: 'Collegeshub is an integrated college management platform for admissions, academics, attendance, fees, examinations and student records.',
  applicationName: 'Collegeshub',
  authors: [{ name: 'Collegeshub' }],
  generator: 'Next.js',
  keywords: [
    'college management system',
    'campus management software',
    'student information system',
    'college portal',
    'higher education ERP',
    'attendance management',
    'admissions management',
    'college examination software',
    'fee collection system'
  ],
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/logo-mark.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
  },
  openGraph: {
    title: 'Collegeshub | Smart College Management System',
    description: 'Collegeshub is an integrated college management platform for admissions, academics, attendance, fees, examinations and student records.',
    url: 'https://www.collegeshub.org',
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
  twitter: {
    card: 'summary_large_image',
    title: 'Collegeshub | Smart College Management System',
    description: 'Collegeshub is an integrated college management platform for admissions, academics, attendance, fees, examinations and student records.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://www.collegeshub.org/#website',
      url: 'https://www.collegeshub.org/',
      name: 'Collegeshub',
      alternateName: 'CollegesHub',
      description: 'Integrated college management platform for admissions, academics, attendance, fees, examinations and student records.',
      publisher: {
        '@id': 'https://www.collegeshub.org/#organization',
      },
      inLanguage: 'en-US',
    },
    {
      '@type': 'Organization',
      '@id': 'https://www.collegeshub.org/#organization',
      name: 'Collegeshub',
      alternateName: 'CollegesHub',
      url: 'https://www.collegeshub.org/',
      logo: {
        '@type': 'ImageObject',
        '@id': 'https://www.collegeshub.org/#logo',
        url: 'https://www.collegeshub.org/logo-mark.svg',
        caption: 'Collegeshub Logo',
      },
      image: {
        '@id': 'https://www.collegeshub.org/#logo',
      },
      sameAs: [],
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased dark" suppressHydrationWarning>
      <head>
        {/* CollegesHub Official Animated Loader Library */}
        <script src="/collegeshub-loader.js" data-auto="false"></script>

        {/* Google Fonts — loaded via standard <link> instead of next/font to avoid
            webpack loader failures during static export builds */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Bricolage+Grotesque:wght@600;700;800&family=Figtree:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="font-sans min-h-full flex flex-col bg-surface-900 text-white/85" suppressHydrationWarning>
        <QueryProvider>
          <ClientInitializer />
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
