'use client';

import Link from 'next/link';
import PlanCheckoutWizard from '@/components/subscription/PlanCheckoutWizard';
import { HiArrowLeft } from 'react-icons/hi';

export default function ChoosePlanClient() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0E2238] tracking-tight">
            Choose Your Subscription Plan
          </h1>
          <p className="text-xs text-[#52657C] mt-0.5">
            Select a plan, billing term, and optional add-ons to generate your 3-copy UBL bank pay voucher and upload transfer proof.
          </p>
        </div>
        <Link
          href="/admin/subscription"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#DDE6F0] bg-white text-xs font-bold text-[#0E2238] hover:bg-slate-50 transition-colors"
        >
          <HiArrowLeft size={14} />
          Subscription &amp; Usage
        </Link>
      </div>

      <PlanCheckoutWizard />
    </div>
  );
}

