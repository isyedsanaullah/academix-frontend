'use client';

import dynamic from 'next/dynamic';

const StudentMaterials = dynamic(() => import('../../../../legacy-pages/student/StudentMaterials'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
});

export default function StudentPDFLibraryPage() {
  return <StudentMaterials />;
}
