'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  HiOutlineCheckCircle,
  HiOutlinePhotograph,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineX,
  HiOutlineChevronRight,
  HiOutlineSparkles
} from 'react-icons/hi';

export default function OnboardingChecklistWidget() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed previously
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('collegeshub_dismissed_setup_checklist');
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    }

    async function loadChecklist() {
      try {
        const res = await api.get('/admin/onboarding/review');
        if (res.data?.success) {
          setReviewData(res.data.data);
        }
      } catch (err) {
        // Silently catch if not an onboarding college or error
      } finally {
        setLoading(false);
      }
    }

    loadChecklist();
  }, []);

  if (loading || isDismissed || !reviewData) return null;

  const opt = reviewData.optional || {};
  if (opt.allOptionalDone) return null;

  // Compute tasks
  const tasks = [
    {
      id: 'branding',
      title: 'Add Institutional Cover & Tagline',
      desc: 'Showcase your campus with a high-resolution banner',
      done: Boolean(opt.hasCoverPhoto && opt.hasTagline),
      icon: HiOutlinePhotograph,
      step: 'profile'
    },
    {
      id: 'gallery',
      title: 'Upload Campus Gallery Photos',
      desc: 'Add labs, libraries, and facilities for prospective students',
      done: Boolean(opt.galleryCount && opt.galleryCount >= 1),
      icon: HiOutlinePhotograph,
      step: 'profile'
    },
    {
      id: 'staff',
      title: 'Invite Faculty & Administrative Staff',
      desc: `${opt.staffCount || 0} members currently invited/active`,
      done: Boolean(opt.staffCount && opt.staffCount >= 1),
      icon: HiOutlineUserGroup,
      step: 'staff'
    },
    {
      id: 'students',
      title: 'Bulk Enroll Student Admissions',
      desc: `${opt.studentCount || 0} students currently enrolled`,
      done: Boolean(opt.studentCount && opt.studentCount >= 1),
      icon: HiOutlineAcademicCap,
      step: 'students'
    }
  ];

  const completedCount = tasks.filter(t => t.done).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  // If all completed, auto-dismiss
  if (completedCount === tasks.length) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('collegeshub_dismissed_setup_checklist', 'true');
    }
  };

  const handleNavigateToStep = async (step) => {
    try {
      await api.patch('/admin/onboarding/steps/navigate', { targetStep: step });
    } catch {
      // ignore
    }
    router.push('/onboarding');
  };

  return (
    <div className="glass-card p-5 sm:p-6 mb-6 border border-indigo-500/20 bg-gradient-to-r from-surface-900/95 via-surface-900/95 to-indigo-950/20 relative overflow-hidden shadow-lg animate-fade-in">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <HiOutlineSparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Recommended Setup Checklist</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {completedCount} of {tasks.length} Completed
              </span>
            </div>
            <p className="text-xs text-white/50 mt-0.5">
              Your college workspace is live! Complete these remaining items to finish institutional profile optimization.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Progress Bar */}
          <div className="w-28 sm:w-36 bg-surface-800 rounded-full h-2 overflow-hidden border border-white/[0.06]">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400">{progressPercent}%</span>

          <button
            onClick={handleDismiss}
            className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors ml-1"
            title="Dismiss checklist"
            aria-label="Dismiss checklist"
          >
            <HiOutlineX size={16} />
          </button>
        </div>
      </div>

      {/* Task List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <div
              key={task.id}
              onClick={() => !task.done && handleNavigateToStep(task.step)}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                task.done
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-white/50'
                  : 'bg-surface-850 hover:bg-surface-800 border-white/[0.06] hover:border-indigo-500/30 cursor-pointer group text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  task.done
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-white/5 text-white/60 group-hover:bg-indigo-500/20 group-hover:text-indigo-400'
                }`}>
                  {task.done ? <HiOutlineCheckCircle size={18} /> : <Icon size={16} />}
                </div>

                <div className="min-w-0">
                  <div className={`text-xs font-semibold truncate ${task.done ? 'line-through text-white/40' : 'text-white'}`}>
                    {task.title}
                  </div>
                  <div className="text-[11px] text-white/40 truncate">
                    {task.desc}
                  </div>
                </div>
              </div>

              {!task.done && (
                <div className="text-white/30 group-hover:text-indigo-400 transition-colors pl-2 shrink-0">
                  <HiOutlineChevronRight size={16} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
