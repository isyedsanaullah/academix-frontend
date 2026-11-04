export const dynamic = 'force-static';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/super-admin/',
          '/admin/',
          '/teacher/',
          '/student/',
          '/principal/',
          '/registrar/',
          '/accountant/',
          '/employee/',
          '/onboarding/',
          '/setup/',
          '/set-password/',
          '/verify/',
          '/verify-email',
          '/api/',
          '/_next/',
        ],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: [
          '/favicon.ico',
          '/favicon.svg',
          '/logo-mark.svg',
          '/logo.svg',
          '/logo-horizontal.svg',
          '/icon.svg',
          '/og-image.png',
          '/apple-touch-icon.png',
        ],
      },
    ],
    sitemap: 'https://www.collegeshub.org/sitemap.xml',
    host: 'https://www.collegeshub.org',
  };
}
