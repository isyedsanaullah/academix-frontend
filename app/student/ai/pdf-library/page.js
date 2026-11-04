'use client';

import dynamic from 'next/dynamic';
import CollegesHubLoader from '@/components/common/CollegesHubLoader';

const StudentMaterials = dynamic(() => import('../../../../legacy-pages/student/StudentMaterials'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <CollegesHubLoader size="md" text="Loading PDF library..." />
    </div>
  )
});

export default function StudentPDFLibraryPage() {
  return <StudentMaterials />;
}
