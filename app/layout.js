import "./globals.css";
import QueryProvider from "../providers/QueryProvider";
import { Toaster } from 'react-hot-toast';
import ClientInitializer from "../components/common/ClientInitializer";

export const metadata = {
  title: "Collegeshub - Smart Campus Management System",
  description: "Collegeshub is a multi-tenant campus management platform for colleges and universities: admissions, academics, attendance, fees and more.",
  icons: { icon: "/logo-mark.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <head>
        {/* Google Fonts — loaded via standard <link> instead of next/font to avoid
            webpack loader failures during static export builds */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Bricolage+Grotesque:wght@600;700;800&family=Figtree:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans min-h-full flex flex-col bg-surface-900 text-white/85">
        <QueryProvider>
          <ClientInitializer />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a2230',
                color: '#e2e8f0',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                fontSize: '13px'
              }
            }}
          />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
