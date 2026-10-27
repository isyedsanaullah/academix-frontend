import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In production (static export), all API calls go directly to the backend URL.
// Set NEXT_PUBLIC_API_URL in .env.production to your Render backend, e.g.:
//   NEXT_PUBLIC_API_URL=https://academix-backend.onrender.com/api
const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_LOCALHOST_API_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:5000');

const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Static export for Hostinger (Apache shared hosting) ──────────────────
  ...(isStaticExport
    ? {
        output: 'export',
        // Trailing slashes generate index.html per route, needed for Apache
        trailingSlash: true,
        // Disable image optimisation (not available in static export)
        images: { unoptimized: true },
      }
    : {
        turbopack: {},
        images: {
          remotePatterns: [
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: 'res.cloudinary.com' },
            { protocol: 'https', hostname: '**' },
            { protocol: 'http',  hostname: 'localhost' },
          ],
        },
        // Dev/SSR rewrites proxy /api → backend (not used in static export)
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: `${BACKEND_URL}/api/:path*`,
            },
            {
              source: '/uploads/:path*',
              destination: `${BACKEND_URL}/uploads/:path*`,
            },
          ];
        },
      }),

  webpack: (config, { webpack }) => {
    config.resolve.alias['react-router-dom'] = path.resolve(
      __dirname,
      'lib/react-router-dom-compat.js'
    );

    config.plugins.push(
      new webpack.DefinePlugin({
        'import.meta.env': JSON.stringify({
          VITE_API_URL:                       process.env.NEXT_PUBLIC_API_URL || '',
          VITE_FIREBASE_API_KEY:              process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
          VITE_FIREBASE_AUTH_DOMAIN:          process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
          VITE_FIREBASE_PROJECT_ID:           process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
          VITE_FIREBASE_STORAGE_BUCKET:       process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
          VITE_FIREBASE_MESSAGING_SENDER_ID:  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
          VITE_FIREBASE_APP_ID:               process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
          VITE_FIREBASE_MEASUREMENT_ID:       process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
        }),
      })
    );

    return config;
  },
};

export default nextConfig;
