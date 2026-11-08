'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Icon from '@/components/Icon';

export default function OnboardingChecklistWidget() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
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
      } catch {
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

  const tasks = [
    {
      id: 'branding',
      title: 'Add Institutional Cover & Tagline',
      desc: 'Showcase your campus with a high-resolution banner',
      done: Boolean(opt.hasCoverPhoto && opt.hasTagline),
      icon: 'image',
      step: 'profile',
    },
    {
      id: 'gallery',
      title: 'Upload Campus Gallery Photos',
      desc: 'Add labs, libraries, and facilities for prospective students',
      done: Boolean(opt.galleryCount && opt.galleryCount >= 1),
      icon: 'image',
      step: 'profile',
    },
    {
      id: 'staff',
      title: 'Invite Faculty & Administrative Staff',
      desc: `${opt.staffCount || 0} members currently invited/active`,
      done: Boolean(opt.staffCount && opt.staffCount >= 1),
      icon: 'users',
      step: 'staff',
    },
    {
      id: 'students',
      title: 'Bulk Enroll Student Admissions',
      desc: `${opt.studentCount || 0} students currently enrolled`,
      done: Boolean(opt.studentCount && opt.studentCount >= 1),
      icon: 'graduation-cap',
      step: 'students',
    },
  ];

  const completedCount = tasks.filter((t) => t.done).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

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
    <div className="card mb-4 border border-s-stroke2 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-s-subtle">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[var(--brand-blue-soft)] text-[var(--brand-blue)] flex items-center justify-center shrink-0">
            <Icon name="sparkles" size={20} className="fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sub-title-1 text-t-primary">Recommended Setup Checklist</h3>
              <span className="label label-blue">
                {completedCount} of {tasks.length} Completed
              </span>
            </div>
            <p className="text-caption text-t-secondary mt-0.5">
              Your college workspace is live! Complete these remaining items to finish institutional profile optimization.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="w-28 sm:w-36 bg-b-surface1 rounded-full h-2 overflow-hidden border border-s-subtle">
            <div
              className="bg-linear-to-r from-[var(--brand-blue)] to-[var(--brand-green)] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-caption font-mono font-bold text-[var(--brand-green-text)]">
            {progressPercent}%
          </span>

          <button
            type="button"
            onClick={handleDismiss}
            className="text-t-tertiary hover:text-t-primary p-1.5 rounded-full hover:bg-b-surface1 transition-colors ml-1"
            title="Dismiss checklist"
            aria-label="Dismiss checklist"
          >
            <Icon name="close" size={16} className="fill-current" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => !task.done && handleNavigateToStep(task.step)}
            className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
              task.done
                ? 'bg-[var(--brand-green-soft)] border-[var(--brand-green)]/20 text-t-secondary'
                : 'bg-b-surface1 hover:bg-b-highlight border-s-subtle hover:border-s-highlight cursor-pointer group text-t-primary'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  task.done
                    ? 'bg-[var(--brand-green-soft)] text-[var(--brand-green-text)]'
                    : 'bg-b-surface2 text-t-secondary group-hover:bg-[var(--brand-blue-soft)] group-hover:text-[var(--brand-blue)]'
                }`}
              >
                <Icon
                  name={task.done ? 'check-circle' : task.icon}
                  size={18}
                  className="fill-current"
                />
              </div>

              <div className="min-w-0">
                <div
                  className={`text-sub-title-2 truncate ${
                    task.done ? 'line-through text-t-tertiary' : 'text-t-primary'
                  }`}
                >
                  {task.title}
                </div>
                <div className="text-caption text-t-secondary truncate">{task.desc}</div>
              </div>
            </div>

            {!task.done && (
              <div className="text-t-tertiary group-hover:text-[var(--brand-blue)] transition-colors pl-2 shrink-0">
                <Icon name="chevron" size={16} className="-rotate-90 fill-current" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
