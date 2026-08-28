'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import {
  HiOutlineOfficeBuilding, HiOutlineMail, HiOutlinePhone,
  HiOutlineLocationMarker, HiOutlineGlobe, HiOutlineCalendar,
  HiOutlineExternalLink, HiOutlineMap, HiArrowRight, HiChevronRight
} from 'react-icons/hi';
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';

// Fallback images
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80';

export default function CollegeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const shortcut = params['college-shortcut'];

  const [data, setData] = useState(null);
  const [similarColleges, setSimilarColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readMore, setReadMore] = useState(false);

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
          // Filter out the current college from similar colleges
          const currentCode = collegeRes.data.data.college.code;
          const filtered = allRes.data.data.filter(c => c.code !== currentCode);
          setSimilarColleges(filtered.slice(0, 3)); // Show top 3
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
    return <ProfileSkeleton />;
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
  const settings = college.settings || {};
  const isAdmissionsOpen = admissionSeason?.status === 'open';

  // Format date nicely
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Get social icon
  const renderSocialIcon = (platform, url) => {
    if (!url) return null;
    const icons = {
      facebook: <FaFacebook size={18} />,
      twitter: <FaTwitter size={18} />,
      linkedin: <FaLinkedin size={18} />,
      instagram: <FaInstagram size={18} />
    };
    return (
      <a 
        key={platform} 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-xl bg-surface-800 border border-white/[0.06] flex items-center justify-center text-white/50 hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all duration-200"
        title={platform}
      >
        {icons[platform]}
      </a>
    );
  };

  const hasSocials = settings.socialLinks && Object.values(settings.socialLinks).some(Boolean);

  return (
    <div className="min-h-screen bg-surface-950 text-white/85 selection:bg-indigo-500/30 selection:text-white pb-20">
      
      {/* 1. Hero Section */}
      <div className="relative w-full h-[320px] lg:h-[400px] bg-surface-900 overflow-hidden">
        {/* Cover Photo */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 scale-105"
          style={{ backgroundImage: `url(${settings.coverPhoto || DEFAULT_COVER})` }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/50 to-transparent" />
        
        {/* Hero Content Container */}
        <div className="absolute inset-x-0 bottom-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 flex flex-col md:flex-row md:items-end gap-6">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-24 h-24 sm:w-32 sm:h-32 bg-surface-800 border-4 border-surface-950 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 flex items-center justify-center"
          >
            {college.logo ? (
              <img src={college.logo} alt={college.name} className="w-full h-full object-cover animate-fade-in" />
            ) : (
              <span className="text-3xl sm:text-4xl font-extrabold text-indigo-400">
                {college.name.charAt(0)}
              </span>
            )}
          </motion.div>

          {/* Title Info */}
          <div className="flex-1 min-w-0">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-wrap items-center gap-3 mb-2"
            >
              {/* Admission Badge */}
              {isAdmissionsOpen ? (
                <span className="badge badge-success font-semibold px-3 py-1 rounded-full text-xs">Admissions Open</span>
              ) : (
                <span className="badge badge-danger font-semibold px-3 py-1 rounded-full text-xs">Admissions Closed</span>
              )}

              {/* Established Year */}
              {settings.establishedYear && (
                <span className="badge badge-primary font-semibold px-3 py-1 rounded-full text-xs">
                  Est. {settings.establishedYear}
                </span>
              )}
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight"
            >
              {college.name}
            </motion.h1>

            {/* Tagline */}
            {settings.tagline && (
              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="text-white/60 text-sm sm:text-base mt-1 max-w-2xl font-medium"
              >
                {settings.tagline}
              </motion.p>
            )}

            {/* City & Province */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="flex items-center gap-1.5 mt-3 text-white/50 text-xs sm:text-sm font-semibold"
            >
              <HiOutlineLocationMarker size={16} className="text-indigo-400" />
              <span>{college.city}</span>
              <span className="text-white/30">•</span>
              <span>Punjab</span>
            </motion.div>
          </div>

          {/* Action Button */}
          {isAdmissionsOpen && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex-shrink-0 animate-fade-in"
            >
              <button 
                onClick={() => router.push(`/apply/${college.code.toLowerCase()}`)}
                className="btn-primary px-8 py-3.5 shadow-lg shadow-indigo-600/30 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
              >
                Apply Now <HiArrowRight size={16} />
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* 2. Main Columns Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT: Compact Information Card (Sticky on desktop) */}
          <div className="hidden lg:block lg:sticky lg:top-8 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass-card p-6"
            >
              <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-4">College Directory</h3>
              
              <div className="space-y-4">
                {/* Email */}
                {college.email && (
                  <div className="flex items-start gap-3">
                    <HiOutlineMail className="text-indigo-400 mt-1 flex-shrink-0" size={18} />
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase">Email Address</p>
                      <a href={`mailto:${college.email}`} className="text-sm font-medium text-white hover:text-indigo-400 transition-colors">
                        {college.email}
                      </a>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {college.phone && (
                  <div className="flex items-start gap-3">
                    <HiOutlinePhone className="text-indigo-400 mt-1 flex-shrink-0" size={18} />
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase">Phone Number</p>
                      <span className="text-sm font-medium text-white">{college.phone}</span>
                    </div>
                  </div>
                )}

                {/* Address */}
                {college.address && (
                  <div className="flex items-start gap-3">
                    <HiOutlineLocationMarker className="text-indigo-400 mt-1 flex-shrink-0" size={18} />
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase">Campus Address</p>
                      <span className="text-sm font-medium text-white">
                        {college.address}, {college.city}
                      </span>
                    </div>
                  </div>
                )}

                {/* Website */}
                {college.website && (
                  <div className="flex items-start gap-3">
                    <HiOutlineGlobe className="text-indigo-400 mt-1 flex-shrink-0" size={18} />
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase">Website</p>
                      <a 
                        href={college.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm font-medium text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 transition-colors"
                      >
                        {college.website.replace(/^https?:\/\//i, '')} <HiOutlineExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                )}

                {/* Admission Deadline */}
                {isAdmissionsOpen && admissionSeason?.endDate && (
                  <div className="flex items-start gap-3 border-t border-white/[0.06] pt-4 mt-2">
                    <HiOutlineCalendar className="text-emerald-400 mt-1 flex-shrink-0" size={18} />
                    <div>
                      <p className="text-[10px] text-emerald-400/60 font-bold uppercase">Application Deadline</p>
                      <span className="text-sm font-semibold text-white">
                        {formatDate(admissionSeason.endDate)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {hasSocials && (
                <div className="border-t border-white/[0.06] pt-4 mt-6">
                  <p className="text-[10px] text-white/40 font-bold uppercase mb-3">Connect With Us</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(settings.socialLinks).map(([platform, url]) => 
                      renderSocialIcon(platform, url)
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* RIGHT: Main Details (About, Programs, Maps) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* About Section */}
            {settings.about && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-card p-6 sm:p-8"
              >
                <h2 className="text-lg sm:text-xl font-extrabold text-white mb-4 flex items-center gap-2">
                  <HiOutlineOfficeBuilding className="text-indigo-400" /> About {college.name}
                </h2>
                <div className="text-white/70 text-sm leading-relaxed whitespace-pre-line font-medium">
                  {settings.about.length > 300 && !readMore ? (
                    <>
                      {settings.about.slice(0, 300)}...
                      <button 
                        onClick={() => setReadMore(true)} 
                        className="text-indigo-400 hover:text-indigo-300 font-bold ml-1 inline-flex items-center gap-0.5 hover:underline"
                      >
                        Read More <HiChevronRight size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      {settings.about}
                      {settings.about.length > 300 && (
                        <button 
                          onClick={() => setReadMore(false)} 
                          className="text-indigo-400 hover:text-indigo-300 font-bold ml-2 inline-flex items-center gap-0.5 hover:underline"
                        >
                          Show Less
                        </button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* Programs Section */}
            {settings.programs && settings.programs.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="glass-card p-6 sm:p-8"
              >
                <h2 className="text-lg sm:text-xl font-extrabold text-white mb-4">Offered Programs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settings.programs.map((program, idx) => (
                    <div 
                      key={idx}
                      className="p-5 rounded-2xl bg-surface-900 border border-white/[0.04] hover:border-indigo-500/20 hover:bg-surface-800 transition-all duration-200"
                    >
                      <h3 className="font-bold text-white mb-1.5">{program.name}</h3>
                      {program.description && (
                        <p className="text-xs text-white/50 leading-relaxed font-medium">{program.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Mobile-Only Contact Information Section */}
            <div className="block lg:hidden">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="glass-card p-6 sm:p-8"
              >
                <h2 className="text-lg sm:text-xl font-extrabold text-white mb-4">Contact Information</h2>
                <div className="space-y-4">
                  {college.email && (
                    <div className="flex items-center gap-3">
                      <HiOutlineMail className="text-indigo-400 flex-shrink-0" size={18} />
                      <div>
                        <p className="text-[9px] text-white/40 font-bold uppercase">Email Address</p>
                        <a href={`mailto:${college.email}`} className="text-sm text-white font-medium hover:text-indigo-400 transition-colors">
                          {college.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {college.phone && (
                    <div className="flex items-center gap-3">
                      <HiOutlinePhone className="text-indigo-400 flex-shrink-0" size={18} />
                      <div>
                        <p className="text-[9px] text-white/40 font-bold uppercase">Phone Number</p>
                        <span className="text-sm text-white font-medium">{college.phone}</span>
                      </div>
                    </div>
                  )}
                  {college.address && (
                    <div className="flex items-start gap-3">
                      <HiOutlineLocationMarker className="text-indigo-400 mt-0.5 flex-shrink-0" size={18} />
                      <div>
                        <p className="text-[9px] text-white/40 font-bold uppercase">Campus Address</p>
                        <span className="text-sm text-white font-medium">{college.address}, {college.city}</span>
                      </div>
                    </div>
                  )}
                  {college.website && (
                    <div className="flex items-center gap-3">
                      <HiOutlineGlobe className="text-indigo-400 flex-shrink-0" size={18} />
                      <div>
                        <p className="text-[9px] text-white/40 font-bold uppercase">Website</p>
                        <a href={college.website} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 font-medium hover:underline">
                          {college.website}
                        </a>
                      </div>
                    </div>
                  )}

                  {hasSocials && (
                    <div className="border-t border-white/[0.06] pt-4 mt-2">
                      <p className="text-[10px] text-white/40 font-bold uppercase mb-3">Connect With Us</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(settings.socialLinks).map(([platform, url]) => 
                          renderSocialIcon(platform, url)
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Google Map Section */}
            {settings.googleMap && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="glass-card p-6 sm:p-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                    <HiOutlineMap className="text-indigo-400" /> Location Map
                  </h2>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(college.name + ', ' + college.city)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-secondary w-fit text-xs font-semibold py-2 px-4 inline-flex items-center gap-1.5"
                  >
                    Get Directions <HiOutlineExternalLink size={14} />
                  </a>
                </div>
                
                {/* Embed Map */}
                <div className="relative w-full h-[280px] sm:h-[350px] rounded-2xl overflow-hidden border border-white/[0.06]">
                  <iframe 
                    src={settings.googleMap} 
                    className="w-full h-full border-none"
                    allowFullScreen="" 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </motion.div>
            )}

          </div>
        </div>

        {/* 3. Similar Colleges Section */}
        {similarColleges.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="border-t border-white/[0.06] pt-12 mt-12"
          >
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-6">Discover Other Colleges</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarColleges.map((otherCollege) => (
                <div 
                  key={otherCollege.id || otherCollege._id}
                  className="glass-card p-5 hover:border-indigo-500/20 transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="flex items-start gap-4">
                    {/* Other College Logo */}
                    <div className="w-12 h-12 rounded-xl bg-surface-900 border border-white/[0.06] overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {otherCollege.logo ? (
                        <img src={otherCollege.logo} alt={otherCollege.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-indigo-400">
                          {otherCollege.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-sm sm:text-base leading-tight truncate">
                        {otherCollege.name}
                      </h3>
                      <p className="text-xs text-white/50 font-semibold mt-1 inline-flex items-center gap-1">
                        <HiOutlineLocationMarker size={12} className="text-indigo-400" />
                        {otherCollege.city}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => router.push(`/college/${otherCollege.slug || otherCollege.code.toLowerCase()}`)}
                    className="btn-secondary w-full justify-center mt-6 text-xs font-semibold py-2"
                  >
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}

// Loading Skeleton UI Component
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-surface-950 pb-20 animate-pulse">
      {/* Cover skeleton */}
      <div className="relative w-full h-[320px] lg:h-[400px] bg-surface-900 flex items-end">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-8 flex flex-col md:flex-row md:items-end gap-6">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-surface-800 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="flex gap-2">
              <div className="w-24 h-6 bg-surface-800 rounded-full" />
              <div className="w-16 h-6 bg-surface-800 rounded-full" />
            </div>
            <div className="w-2/3 h-8 bg-surface-800 rounded-lg" />
            <div className="w-1/2 h-4 bg-surface-800 rounded-md" />
            <div className="w-32 h-4 bg-surface-800 rounded-md" />
          </div>
          <div className="w-32 h-12 bg-surface-800 rounded-xl" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sticky left card skeleton */}
          <div className="hidden lg:block space-y-6">
            <div className="glass-card p-6 h-[300px] bg-surface-900 border border-white/[0.04]" />
          </div>

          {/* Right main column skeletons */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 h-[180px] bg-surface-900 border border-white/[0.04]" />
            <div className="glass-card p-6 h-[220px] bg-surface-900 border border-white/[0.04]" />
            <div className="glass-card p-6 h-[260px] bg-surface-900 border border-white/[0.04]" />
          </div>
        </div>
      </div>
    </div>
  );
}
