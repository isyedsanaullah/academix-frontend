'use client';

import {
  HiOutlineEye,
  HiOutlineX,
  HiOutlineSave,
  HiOutlineExclamation,
} from 'react-icons/hi';

export default function FeaturePreviewModal({
  open = false,
  onClose,
  previewData,
  overrideReason,
  setOverrideReason,
  savingFeatures,
  onSave,
}) {
  if (!open || !previewData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <HiOutlineEye size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                What Will Change: Entitlement Impact Preview
              </h3>
              <p className="text-xs text-slate-500 dark:text-white/40">
                Calculated reactive impact before saving modifications to the database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition cursor-pointer"
          >
            <HiOutlineX size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-center">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Turning ON</p>
              <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                +{previewData.turnedOn?.length || 0}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-center">
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">Turning OFF</p>
              <p className="text-xl font-black text-rose-700 dark:text-rose-400 mt-0.5">
                -{previewData.turnedOff?.length || 0}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-center">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Plan B Switched</p>
              <p className="text-xl font-black text-amber-700 dark:text-amber-400 mt-0.5">
                {previewData.switched?.length || 0}
              </p>
            </div>
          </div>

          {/* Switched / Degraded Capabilities Warning */}
          {previewData.switched && previewData.switched.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                <HiOutlineExclamation size={16} />
                <span>Capabilities Switching to Plan B Fallback:</span>
              </div>
              <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-400 pl-5 list-disc">
                {previewData.switched.map((sw, i) => (
                  <li key={i}>
                    <code className="font-bold">{sw.capability}</code> switches method from{' '}
                    <span className="font-semibold">{sw.from}</span> to{' '}
                    <span className="font-semibold underline">{sw.to}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Turning Off List */}
          {previewData.turnedOff && previewData.turnedOff.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-white/70">
                Features turning OFF ({previewData.turnedOff.length}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {previewData.turnedOff.map(fKey => (
                  <span
                    key={fKey}
                    className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
                  >
                    {fKey}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Turning On List */}
          {previewData.turnedOn && previewData.turnedOn.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-white/70">
                Features turning ON ({previewData.turnedOn.length}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {previewData.turnedOn.map(fKey => (
                  <span
                    key={fKey}
                    className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                  >
                    {fKey}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(!previewData.turnedOn?.length && !previewData.turnedOff?.length && !previewData.switched?.length) && (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-white/40">
              No net functional changes detected in capabilities or feature flags.
            </div>
          )}

          {/* Reason for Audit Log */}
          <div className="pt-2 border-t border-slate-200 dark:border-white/[0.06] space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-white/80">
              Audit Reason (Recommended)
            </label>
            <input
              type="text"
              placeholder="e.g. Approved trial for semester 2, or requested fee waiver"
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-white/[0.02]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition cursor-pointer"
          >
            Close Preview
          </button>
          <button
            onClick={onSave}
            disabled={savingFeatures}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {savingFeatures ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <HiOutlineSave size={15} />
            )}
            Confirm & Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

