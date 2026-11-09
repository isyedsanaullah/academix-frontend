'use client';

import { useState } from 'react';
import SlideOverDrawer from '@/components/common/SlideOverDrawer';
import Icon from '@/components/Icon';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function PlanMigrationDrawer({
  open = false,
  onClose,
  collegeId,
  collegeName,
  currentPlan,
  targetPlan,
  onConfirmed,
}) {
  const [switching, setSwitching] = useState(false);

  const handleConfirm = async () => {
    if (!targetPlan) return;
    setSwitching(true);
    try {
      try {
        await api.put(`/super-admin/colleges/${collegeId}/plan`, { plan: targetPlan });
      } catch (primaryErr) {
        // Fallback to subscription assign if plan route encounters legacy server error
        if (primaryErr.response?.status === 500) {
          const nowStr = new Date().toISOString().split('T')[0];
          const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          await api.post(`/super-admin/colleges/${collegeId}/subscription/assign`, {
            plan: targetPlan,
            startsAt: nowStr,
            expiresAt: nextYear,
            reason: `SuperAdmin baseline plan migration to ${targetPlan}`,
          });
        } else {
          throw primaryErr;
        }
      }
      toast.success(`Plan updated to ${targetPlan.toUpperCase()}`);
      if (onConfirmed) onConfirmed();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update plan');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <SlideOverDrawer
      open={open}
      onClose={() => {
        if (!switching) onClose();
      }}
      title="Confirm Plan Migration"
      subtitle={`Update baseline subscription tier for ${collegeName || 'Institution'}`}
      icon="payment"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            disabled={switching}
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-sub-title-2 font-semibold text-t-secondary hover:text-t-primary hover:bg-b-depth2 border border-s-subtle transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={switching}
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sub-title-2 font-bold text-white bg-primary-01 hover:bg-primary-01/90 shadow-widget transition-all cursor-pointer disabled:opacity-60"
          >
            {switching ? (
              <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon name="check" className="size-4" />
            )}
            <span>Confirm & Apply Plan</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Plan Comparison */}
        <div className="p-5 rounded-2xl bg-b-depth2 border border-s-subtle space-y-4">
          <div className="flex items-center justify-between text-sub-title-2">
            <div>
              <span className="text-caption text-t-secondary block uppercase">Current Baseline</span>
              <span className="text-h6 font-bold text-t-primary capitalize">{currentPlan}</span>
            </div>
            <Icon name="arrow-right" className="size-5 text-t-secondary" />
            <div className="text-right">
              <span className="text-caption text-t-secondary block uppercase">Target Baseline</span>
              <span className="text-h6 font-bold text-primary-01 capitalize">{targetPlan}</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-sub-title-2 text-amber-600 dark:text-amber-400 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5">
            <Icon name="alert-triangle" className="size-4 text-amber-500" />
            Feature Entitlement Impact
          </p>
          <p className="text-caption text-t-secondary leading-relaxed">
            Changing the baseline subscription tier updates standard feature entitlements for this college workspace. Any features previously active that are not included in the new tier will be disabled unless preserved via Feature Controls overrides.
          </p>
        </div>
      </div>
    </SlideOverDrawer>
  );
}

