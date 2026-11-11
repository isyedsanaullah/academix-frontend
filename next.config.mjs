import { fileURLToPath } from 'url';
import path from 'path';
import withBundleAnalyzer from '@next/bundle-analyzer';

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
  // Limit workers to 1 to prevent OOM on machines with < 8GB RAM
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
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
        turbopack: {
          // Mirror the webpack alias so Turbopack also resolves react-router-dom
          // to the Next.js-compatible shim in lib/react-router-dom-compat.js
          resolveAlias: {
            'react-router-dom': './lib/react-router-dom-compat.js',
          },
        },
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

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  webpack: (config, { webpack, isServer }) => {
    config.resolve.alias['react-router-dom'] = path.resolve(
      __dirname,
      'lib/react-router-dom-compat.js'
    );

    if (!isServer) {
      config.optimization = config.optimization || {};
      config.optimization.splitChunks = config.optimization.splitChunks || {};
      config.optimization.splitChunks.cacheGroups = {
        ...(config.optimization.splitChunks.cacheGroups || {}),
        recharts: {
          test: /[\\/]node_modules[\\/](recharts|d3-[^\\/]+)[\\/]/,
          name: 'recharts-vendor',
          chunks: 'all',
          priority: 30,
        },
      };
    }

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

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withAnalyzer(nextConfig);
