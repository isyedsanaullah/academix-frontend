'use strict';
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineOfficeBuilding, HiOutlineMail, HiOutlinePhone,
  HiOutlineLocationMarker, HiOutlineGlobe, HiOutlineCalendar,
  HiOutlineExternalLink, HiOutlineMap, HiArrowRight, HiChevronRight,
  HiOutlinePhotograph, HiOutlineSparkles, HiOutlineCheckCircle, HiOutlineClock
} from 'react-icons/hi';
import {
  FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaYoutube, FaWhatsapp
} from 'react-icons/fa';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80';

export default function CollegePublicProfileView({
  college = {},
  admissionSeason = null,
  announcements = [],
  similarColleges = [],
  isPreview = false,
  onNavigateApply = null,
  onNavigateLogin = null,
}) {
  const [readMore, setReadMore] = useState(false);
  const [activeGalleryIdx, setActiveGalleryIdx] = useState(null);

  // If not active and not in preview, show "Getting ready" screen
  if (!isPreview && college.status && college.status !== 'active') {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card max-w-lg w-full p-8 border border-white/[0.08]"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <HiOutlineClock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {college.name || 'This College'} is Getting Ready!
          </h2>
          <p className="text-sm text-white/60 mb-6 leading-relaxed">
            The administration is currently preparing their digital campus, academic programs, and admission portals. Please check back soon or contact the institution directly.
          </p>
          {college.city && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] text-white/50 text-xs font-medium">
              <HiOutlineLocationMarker size={14} className="text-indigo-400" />
              <span>{college.city}</span>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  const settings = college.settings || {};
  const coverUrl = college.coverPhoto || settings.coverPhoto || DEFAULT_COVER;
  const logoUrl = college.logo || '';
  const collegeName = college.name || 'College Name';
  const tagline = college.tagline || settings.tagline || '';
  const about = college.about || settings.about || '';
  const city = college.city || '';
  const address = college.address || '';
  const phone = college.phone || '';
  const email = college.email || '';
  const website = college.website || '';
  const establishedYear = college.establishedYear || college.established_year || settings.establishedYear;
  const affiliation = college.affiliation || settings.affiliation || '';
  const socialLinks = college.socialLinks || college.social_links || settings.socialLinks || {};
  const gallery = Array.isArray(college.gallery) ? college.gallery : [];
  const programs = college.programs || settings.programs || [];

  const isAdmissionsOpen = admissionSeason?.status === 'open' || college.admissionsOpen;

  const renderSocialIcon = (platform, url) => {
    if (!url) return null;
    const icons = {
      facebook: <FaFacebook size={16} />,
      twitter: <FaTwitter size={16} />,
      x: <FaTwitter size={16} />,
      linkedin: <FaLinkedin size={16} />,
      instagram: <FaInstagram size={16} />,
      youtube: <FaYoutube size={16} />,
      whatsapp: <FaWhatsapp size={16} />,
    };

    const icon = icons[platform.toLowerCase()];
    if (!icon) return null;

    return (
      <a
        key={platform}
        href={isPreview ? '#' : url}
        target={isPreview ? '_self' : '_blank'}
        rel="noopener noreferrer"
        onClick={(e) => isPreview && e.preventDefault()}
        className="w-9 h-9 rounded-xl bg-surface-800 border border-white/[0.06] flex items-center justify-center text-white/50 hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all"
        title={platform}
      >
        {icon}
      </a>
    );
  };

  const hasSocials = Object.values(socialLinks).some(Boolean);

  return (
    <div className={`text-white/85 selection:bg-indigo-500/30 selection:text-white ${isPreview ? 'rounded-2xl overflow-hidden border border-white/[0.08] bg-surface-950 pb-10' : 'min-h-screen bg-surface-950 pb-20'}`}>

      {/* Preview Notification Banner */}
      {isPreview && (
        <div className="bg-indigo-600/90 backdrop-blur-md px-4 py-2 flex items-center justify-between text-xs font-semibold text-white">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Public Profile Preview</span>
          </div>
          <span className="text-white/70 text-[11px]">Updates live as you type</span>
        </div>
      )}

      {/* 1. Hero Section */}
      <div className="relative w-full h-[240px] sm:h-[300px] lg:h-[360px] bg-surface-900 overflow-hidden">
        {/* Cover Photo */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/60 to-transparent" />

        {/* Hero Content Container */}
        <div className="absolute inset-x-0 bottom-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 flex flex-col md:flex-row md:items-end gap-5">
          {/* Logo */}
          <div className="w-20 h-20 sm:w-28 sm:h-28 bg-surface-800 border-4 border-surface-950 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 flex items-center justify-center">
            {logoUrl ? (
              <img src={logoUrl} alt={collegeName} className="w-full h-full object-cover animate-fade-in" />
            ) : (
              <span className="text-2xl sm:text-4xl font-extrabold text-indigo-400">
                {collegeName ? collegeName.charAt(0) : 'C'}
              </span>
            )}
          </div>

          {/* Title Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {isAdmissionsOpen ? (
                <span className="badge badge-success font-semibold px-2.5 py-0.5 rounded-full text-xs">
                  Admissions Open
                </span>
              ) : (
                <span className="badge badge-neutral font-semibold px-2.5 py-0.5 rounded-full text-xs text-white/50">
                  Admissions Closed
                </span>
              )}

              {establishedYear && (
                <span className="badge badge-primary font-semibold px-2.5 py-0.5 rounded-full text-xs">
                  Est. {establishedYear}
                </span>
              )}

              {affiliation && (
                <span className="badge badge-warning font-semibold px-2.5 py-0.5 rounded-full text-xs">
                  {affiliation}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {collegeName}
            </h1>

            {tagline && (
              <p className="text-white/65 text-xs sm:text-sm mt-1 max-w-2xl font-medium line-clamp-2">
                {tagline}
              </p>
            )}

            {city && (
              <div className="flex items-center gap-1.5 mt-2 text-white/50 text-xs font-semibold">
                <HiOutlineLocationMarker size={14} className="text-indigo-400" />
                <span>{city}</span>
                {address && (
                  <>
                    <span className="text-white/30">•</span>
                    <span className="truncate max-w-xs">{address}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isAdmissionsOpen && (
              <button
                type="button"
                onClick={() => onNavigateApply?.()}
                className="btn-primary px-5 py-2.5 text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              >
                Apply Now <HiArrowRight size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigateLogin?.()}
              className="btn-secondary px-4 py-2.5 text-xs sm:text-sm"
            >
              Portal Login
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Columns Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* LEFT: Directory & Contact Card */}
          <div className="space-y-6">
            <div className="glass-card p-5 sm:p-6">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">
                Directory & Information
              </h3>

              <div className="space-y-3.5">
                {email && (
                  <div className="flex items-start gap-3">
                    <HiOutlineMail className="text-indigo-400 mt-0.5 flex-shrink-0" size={16} />
                    <div className="min-w-0">
                      <p className="text-[10px] text-white/40 font-bold uppercase">Public Email</p>
                      <a href={`mailto:${email}`} className="text-xs font-medium text-white hover:text-indigo-400 transition-colors break-all">
                        {email}
                      </a>
                    </div>
                  </div>
                )}

                {phone && (
                  <div className="flex items-start gap-3">
                    <HiOutlinePhone className="text-indigo-400 mt-0.5 flex-shrink-0" size={16} />
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase">Phone Number</p>
                      <span className="text-xs font-medium text-white">{phone}</span>
                    </div>
                  </div>
                )}

                {address && (
                  <div className="flex items-start gap-3">
                    <HiOutlineLocationMarker className="text-indigo-400 mt-0.5 flex-shrink-0" size={16} />
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase">Campus Address</p>
                      <span className="text-xs font-medium text-white">
                        {address}{city ? `, ${city}` : ''}
                      </span>
                    </div>
                  </div>
                )}

                {website && (
                  <div className="flex items-start gap-3">
                    <HiOutlineGlobe className="text-indigo-400 mt-0.5 flex-shrink-0" size={16} />
                    <div className="min-w-0">
                      <p className="text-[10px] text-white/40 font-bold uppercase">Website</p>
                      <a
                        href={isPreview ? '#' : website}
                        target={isPreview ? '_self' : '_blank'}
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 transition-colors truncate max-w-full"
                      >
                        {website.replace(/^https?:\/\//i, '')} <HiOutlineExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {hasSocials && (
                <div className="border-t border-white/[0.06] pt-4 mt-5">
                  <p className="text-[10px] text-white/40 font-bold uppercase mb-2.5">Connect With Us</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(socialLinks).map(([platform, url]) =>
                      renderSocialIcon(platform, url)
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Gallery Section */}
            {gallery.length > 0 && (
              <div className="glass-card p-5 sm:p-6">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <HiOutlinePhotograph className="text-indigo-400" /> Campus Gallery ({gallery.length})
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {gallery.slice(0, 4).map((img, i) => (
                    <div
                      key={i}
                      className="aspect-video rounded-lg overflow-hidden bg-surface-900 border border-white/[0.06] relative group cursor-pointer"
                      onClick={() => setActiveGalleryIdx(i)}
                    >
                      <img src={img.url || img.key} alt={img.caption || `Campus ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      {img.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-surface-950/80 p-1 text-[10px] text-white truncate">
                          {img.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: About & Academic Programs */}
          <div className="lg:col-span-2 space-y-6">

            {/* About Card */}
            {about ? (
              <div className="glass-card p-5 sm:p-7">
                <h2 className="text-base sm:text-lg font-extrabold text-white mb-3 flex items-center gap-2">
                  <HiOutlineOfficeBuilding className="text-indigo-400" /> About {collegeName}
                </h2>
                <div className="text-white/70 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium">
                  {about.length > 300 && !readMore ? (
                    <>
                      {about.slice(0, 300)}...
                      <button
                        type="button"
                        onClick={() => setReadMore(true)}
                        className="text-indigo-400 hover:text-indigo-300 font-bold ml-1 inline-flex items-center gap-0.5 hover:underline"
                      >
                        Read More <HiChevronRight size={13} />
                      </button>
                    </>
                  ) : (
                    <>
                      {about}
                      {about.length > 300 && (
                        <button
                          type="button"
                          onClick={() => setReadMore(false)}
                          className="text-indigo-400 hover:text-indigo-300 font-bold ml-2 inline-flex items-center gap-0.5 hover:underline"
                        >
                          Show Less
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-card p-6 border-dashed border-white/[0.1] text-center">
                <p className="text-xs text-white/40 italic">About description will appear here once entered.</p>
              </div>
            )}

            {/* Programs Section */}
            {programs.length > 0 && (
              <div className="glass-card p-5 sm:p-7">
                <h2 className="text-base sm:text-lg font-extrabold text-white mb-4 flex items-center gap-2">
                  <HiOutlineSparkles className="text-indigo-400" /> Offered Programs & Academic Tracks
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {programs.map((program, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-surface-900 border border-white/[0.04] hover:border-indigo-500/25 transition-all"
                    >
                      <h3 className="text-xs sm:text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        {program.name || program}
                      </h3>
                      {program.description && (
                        <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                          {program.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Google Map Section */}
            {settings.googleMap && (
              <div className="glass-card p-5 sm:p-6">
                <h2 className="text-sm font-extrabold text-white mb-3 flex items-center gap-2">
                  <HiOutlineMap className="text-indigo-400" /> Campus Location Map
                </h2>
                <div className="w-full h-[220px] rounded-xl overflow-hidden border border-white/[0.06]">
                  <iframe
                    src={settings.googleMap}
                    className="w-full h-full border-none"
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
