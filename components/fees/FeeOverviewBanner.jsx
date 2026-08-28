import React from 'react';
import { HiOutlineCurrencyDollar, HiOutlineShieldCheck, HiOutlineReceiptTax, HiOutlineExclamationCircle } from 'react-icons/hi';

export default function FeeOverviewBanner({ structure, totalFee, totalPaid, totalDue, onConfigureClick }) {
  const isConfigured = Boolean(structure);
  const mode = structure?.mode || 'N/A';
  const grossFee = structure?.yearlyFee || 0;
  const scholarship = structure?.scholarship || 0;
  const netFee = structure?.netYearlyFee || 0;

  return (
    <div className="glass-card p-6 border border-white/10 bg-gradient-to-br from-surface-900/90 to-surface-950/90 shadow-xl rounded-2xl relative overflow-hidden">
      {/* Background Accent glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        {/* Left Side: Fee Config Meta */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              <HiOutlineCurrencyDollar className="text-emerald-400" size={22} />
              Fee Structure Overview
            </h3>
            {isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <HiOutlineShieldCheck size={14} />
                Configured ({mode.toUpperCase()})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <HiOutlineExclamationCircle size={14} />
                Structure Not Configured
              </span>
            )}
          </div>

          {isConfigured && mode === 'yearly' && (
            <div className="flex items-center gap-4 text-xs text-surface-400 flex-wrap">
              <span>Gross Fee: <strong className="text-surface-200">Rs. {Number(grossFee).toLocaleString()}</strong></span>
              <span>•</span>
              <span>Scholarship/Concession: <strong className="text-emerald-400">Rs. {Number(scholarship).toLocaleString()}</strong></span>
              <span>•</span>
              <span>Net Fee: <strong className="text-white font-semibold">Rs. {Number(netFee).toLocaleString()}</strong></span>
            </div>
          )}

          {isConfigured && mode === 'monthly' && (
            <div className="text-xs text-surface-400">
              Monthly Base Fee: <strong className="text-white">Rs. {Number(structure.monthlyFee || 0).toLocaleString()} / month</strong>
            </div>
          )}
        </div>

        {/* Middle/Right: Summary KPI Stats */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <div className="bg-surface-900/60 p-3.5 rounded-xl border border-white/5 text-center min-w-[110px]">
            <p className="text-xs text-surface-400 uppercase tracking-wider font-medium mb-1">Total Fee</p>
            <p className="text-lg font-bold text-white">Rs. {Number(totalFee).toLocaleString()}</p>
          </div>

          <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20 text-center min-w-[110px]">
            <p className="text-xs text-emerald-400/90 uppercase tracking-wider font-medium mb-1">Total Paid</p>
            <p className="text-lg font-bold text-emerald-400">Rs. {Number(totalPaid).toLocaleString()}</p>
          </div>

          <div className="bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/20 text-center min-w-[110px]">
            <p className="text-xs text-rose-400/90 uppercase tracking-wider font-medium mb-1">Total Due</p>
            <p className="text-lg font-bold text-rose-400">Rs. {Number(totalDue).toLocaleString()}</p>
          </div>

          {onConfigureClick && (
            <button
              onClick={onConfigureClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-primary-600/20 transition-all border border-primary-500/30 shrink-0"
            >
              <HiOutlineReceiptTax size={16} />
              {isConfigured ? 'Edit Fee Structure' : 'Configure Fee Structure'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
