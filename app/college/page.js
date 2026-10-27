'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CollegeDirectoryPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the college directory section on root
    router.replace('/#college-directory');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-card">
      <div className="skeleton h-12 w-48 rounded-lg" />
    </div>
  );
}
