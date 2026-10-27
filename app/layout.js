import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "../providers/QueryProvider";
import { Toaster } from 'react-hot-toast';
import ClientInitializer from "../components/common/ClientInitializer";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "Collegeshub - Smart Campus Management System",
  description: "Collegeshub is a multi-tenant campus management platform for colleges and universities: admissions, academics, attendance, fees and more.",
  icons: { icon: "/logo-mark.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className={`${inter.className} min-h-full flex flex-col bg-surface-900 text-white/85`}>
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
