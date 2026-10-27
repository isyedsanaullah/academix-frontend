'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import LottieLoader from '@/components/common/LottieLoader';
import PublicFooter from '@/components/common/PublicFooter';
import CollegePublicProfileView from '@/components/college/CollegePublicProfileView';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';

export default function CollegeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const shortcut = params['college-shortcut'];

  const [data, setData] = useState(null);
  const [similarColleges, setSimilarColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shortcut) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch current college details
        const collegeRes = await api.get(`/public/college/${shortcut}`);
        if (collegeRes.data?.success) {
          setData(collegeRes.data.data);
        } else {
          throw new Error('College not found');
        }

        // Fetch all colleges to render similar colleges
        const allRes = await api.get('/public/colleges');
        if (allRes.data?.success) {
          const currentCode = collegeRes.data.data.college.code;
          const filtered = allRes.data.data.filter(c => c.code !== currentCode);
          setSimilarColleges(filtered.slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching college profile:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load college profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shortcut]);

  if (loading) {
    return <LottieLoader fullScreen text="Loading College Profile..." />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950 p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card max-w-md w-full p-8 text-center"
        >
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <HiOutlineOfficeBuilding size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Failed to Load Profile</h2>
          <p className="text-sm text-white/60 mb-6">{error || 'The requested college profile could not be found.'}</p>
          <button 
            onClick={() => router.push('/')}
            className="btn-primary w-full justify-center"
          >
            Go Back Home
          </button>
        </motion.div>
      </div>
    );
  }

  const { college, admissionSeason, announcements } = data;

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-between">
      <CollegePublicProfileView
        college={college}
        admissionSeason={admissionSeason}
        announcements={announcements}
        similarColleges={similarColleges}
        onNavigateApply={() => router.push(`/apply/${(college.slug || college.code).toLowerCase()}`)}
        onNavigateLogin={() => router.push('/login')}
      />
      <PublicFooter />
    </div>
  );
}
