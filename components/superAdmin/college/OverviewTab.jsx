'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '@/services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineMail,
  HiOutlineCheck,
  HiOutlineDocumentDuplicate,
} from 'react-icons/hi';

/* ── Custom Tooltip for College Activity Chart ── */
const CollegeActivityTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-2xl border border-s-stroke2 bg-b-surface2 p-3 text-caption shadow-depth min-w-40">
      <p className="mb-1.5 font-semibold text-t-primary border-b border-s-subtle pb-1">
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-3">
            <span className="text-t-secondary">{entry.name}</span>
            <span className="font-mono font-bold tabular-nums text-t-primary">
              {entry.value?.toLocaleString() ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function OverviewTab({
  collegeId,
  college,
  stats = {},
  dynamicStats = {},
  activityData = [],
  subdomainLive,
  subdomainVerifiedAt,
  pollingSubdomain,
  setPollingSubdomain,
  setSubdomainLive,
  setSubdomainVerifiedAt,
  onRefresh,
}) {
  const [creatingSubdomain, setCreatingSubdomain] = useState(false);
  const [subdomainResult, setSubdomainResult] = useState(null);
  const [resendingInvite, setResendingInvite] = useState(false);
  const [lastInviteData, setLastInviteData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const c = college;
  if (!c) return null;

  const isVerified = subdomainLive === true || !!c.subdomain_verified_at;
  const isPending = !isVerified && (pollingSubdomain || subdomainLive === false);
  const domainUrl = c.slug ? `https://${c.slug}.collegeshub.org` : '';

  const onboardingDone = c.onboardingCompleted === true || c.onboardingStatus === 'completed';
  const hasAdmin = !!(c.adminEmail || c.admin_email);
  const showResend = !onboardingDone || !hasAdmin;

  return (
    <div className="space-y-6">
      {/* ── 1. 30-Day Activity & Sessions Telemetry Chart ── */}
      <div className="p-6 rounded-3xl bg-b-surface2 border border-s-subtle shadow-widget space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-h6 font-bold text-t-primary">
              30-Day Activity & Sessions Telemetry
            </h3>
            <p className="text-caption text-t-secondary">
              Authenticated user logins and interactive portal sessions across campus
            </p>
          </div>
          <div className="flex items-center gap-4 text-caption font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#0B4D94]" />
              <span className="text-t-secondary">Portal Sessions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#00a656]" />
              <span className="text-t-secondary">Active Users</span>
            </div>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B4D94" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0B4D94" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00a656" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#00a656" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-s-subtle opacity-40" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'currentColor', fontSize: 11 }}
                className="text-t-secondary"
                minTickGap={24}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'currentColor', fontSize: 11 }}
                className="text-t-secondary"
              />
              <Tooltip content={<CollegeActivityTooltip />} />
              <Area
                type="monotone"
                dataKey="sessions"
                name="Portal Sessions"
                stroke="#0B4D94"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorSessions)"
              />
              <Area
                type="monotone"
                dataKey="activeUsers"
                name="Active Users"
                stroke="#00a656"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorUsers)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 2. Resource Capacity & Allocation Meters ── */}
      <div className="p-6 rounded-3xl bg-b-surface2 border border-s-subtle shadow-widget space-y-5">
        <div>
          <h3 className="text-h6 font-bold text-t-primary">Campus Resource Allocation</h3>
          <p className="text-caption text-t-secondary">Operational limits, seat usage, and capability coverage</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Students Quota Meter */}
          <div className="p-4 rounded-2xl bg-b-depth2 border border-s-subtle space-y-2.5">
            <div className="flex items-center justify-between text-caption font-semibold">
              <span className="text-t-secondary">Student Quota</span>
              <span className="text-t-primary font-mono font-bold">
                {stats.totalStudents || 0} / {c.subscription?.studentLimit || 1000}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-b-depth1 overflow-hidden">
              <div
                className="h-full bg-primary-01 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round(((stats.totalStudents || 0) / (c.subscription?.studentLimit || 1000)) * 100))}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-t-secondary">
              {Math.round(((stats.totalStudents || 0) / (c.subscription?.studentLimit || 1000)) * 100)}% capacity allocated
            </p>
          </div>

          {/* Staff Quota Meter */}
          <div className="p-4 rounded-2xl bg-b-depth2 border border-s-subtle space-y-2.5">
            <div className="flex items-center justify-between text-caption font-semibold">
              <span className="text-t-secondary">Faculty & Staff Quota</span>
              <span className="text-t-primary font-mono font-bold">
                {stats.totalStaff || stats.totalTeachers || 0} / {c.subscription?.staffLimit || 100}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-b-depth1 overflow-hidden">
              <div
                className="h-full bg-[#8c62ff] rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round(((stats.totalStaff || stats.totalTeachers || 0) / (c.subscription?.staffLimit || 100)) * 100))}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-t-secondary">
              {Math.round(((stats.totalStaff || stats.totalTeachers || 0) / (c.subscription?.staffLimit || 100)) * 100)}% faculty quota utilized
            </p>
          </div>

          {/* Admin Seats Quota Meter */}
          <div className="p-4 rounded-2xl bg-b-depth2 border border-s-subtle space-y-2.5">
            <div className="flex items-center justify-between text-caption font-semibold">
              <span className="text-t-secondary">Institution Admin Seats</span>
              <span className="text-t-primary font-mono font-bold">
                {stats.totalAdmins || (c.adminEmail ? 1 : 0)} / {c.subscription?.adminLimit || 5}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-b-depth1 overflow-hidden">
              <div
                className="h-full bg-[#EF9D0E] rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round(((stats.totalAdmins || (c.adminEmail ? 1 : 0)) / (c.subscription?.adminLimit || 5)) * 100))}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-t-secondary">
              {c.subscription?.adminLimit || 5} maximum administrator accounts
            </p>
          </div>

          {/* Feature Modules Meter */}
          <div className="p-4 rounded-2xl bg-b-depth2 border border-s-subtle space-y-2.5">
            <div className="flex items-center justify-between text-caption font-semibold">
              <span className="text-t-secondary">Active Modules</span>
              <span className="text-t-primary font-mono font-bold">
                {dynamicStats.effectiveActive || 0} / {dynamicStats.totalFeatures || 1}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-b-depth1 overflow-hidden">
              <div
                className="h-full bg-[#00a656] rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round(((dynamicStats.effectiveActive || 0) / (dynamicStats.totalFeatures || 1)) * 100))}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-t-secondary">
              {Math.round(((dynamicStats.effectiveActive || 0) / (dynamicStats.totalFeatures || 1)) * 100)}% platform capabilities unlocked
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. Hostinger Subdomain Management Card ── */}
      {c.slug && (
        <div className="p-6 rounded-3xl bg-b-surface2 border border-s-subtle shadow-widget space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`size-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 border ${
                  isVerified
                    ? 'bg-emerald-500/10 text-[#00a656] border-emerald-500/20'
                    : isPending
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    : 'bg-primary-01/10 text-primary-01 border-primary-01/20'
                }`}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sub-title-2 font-bold text-t-primary">
                    Hostinger Subdomain Routing
                  </h4>
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00a656]/15 text-[#00a656] border border-[#00a656]/25">
                      <span className="size-1.5 rounded-full bg-[#00a656]" />
                      ACTIVE & LIVE
                    </span>
                  ) : isPending ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/25">
                      <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                      PROPAGATING DNS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-s-subtle text-t-secondary border border-s-stroke2">
                      NOT CONFIGURED
                    </span>
                  )}
                </div>
                <a
                  href={domainUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-caption font-mono text-primary-01 hover:underline break-all block mt-1"
                >
                  {c.slug}.collegeshub.org
                </a>
              </div>
            </div>

            {/* Subdomain action buttons on the right side */}
            <div className="flex items-center gap-3 shrink-0">
              {isPending && !isVerified && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const { data } = await api.get(`/super-admin/colleges/${collegeId}/subdomain/status`);
                      if (data.active) {
                        setSubdomainLive(true);
                        setSubdomainVerifiedAt(data.verifiedAt);
                        setPollingSubdomain(false);
                        toast.success('🎉 Subdomain is now live!');
                        if (onRefresh) onRefresh();
                      } else {
                        toast('Still propagating… checking again shortly.', { icon: '⏳' });
                      }
                    } catch {
                      toast.error('Could not check subdomain status.');
                    }
                  }}
                  className="px-3.5 py-2 text-caption font-semibold rounded-xl bg-b-depth2 border border-s-stroke2 text-amber-600 dark:text-amber-400 hover:bg-b-depth1 transition cursor-pointer"
                >
                  Check DNS Status
                </button>
              )}

              <button
                type="button"
                disabled={creatingSubdomain}
                onClick={async () => {
                  setCreatingSubdomain(true);
                  setSubdomainResult(null);
                  try {
                    const { data } = await api.post(`/super-admin/colleges/${collegeId}/subdomain`);
                    setSubdomainResult({
                      success: true,
                      message: data.message || 'Subdomain request sent!',
                    });
                    toast.success(data.message || 'Subdomain created!');
                    setSubdomainLive(false);
                    setPollingSubdomain(true);
                  } catch (err) {
                    const msg = err.response?.data?.message || 'Failed to create subdomain';
                    setSubdomainResult({ success: false, message: msg });
                    toast.error(msg);
                  } finally {
                    setCreatingSubdomain(false);
                  }
                }}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-caption font-bold rounded-xl disabled:opacity-60 text-white shadow-depth transition cursor-pointer ${
                  isVerified
                    ? 'bg-b-depth2 text-t-secondary hover:text-t-primary border border-s-subtle'
                    : 'bg-primary-01 hover:bg-primary-01/90'
                }`}
              >
                {creatingSubdomain ? (
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : null}
                {creatingSubdomain
                  ? 'Creating…'
                  : isVerified
                  ? 'Re-create Subdomain'
                  : 'Create Subdomain on Hostinger'}
              </button>
            </div>
          </div>

          {/* Live status banner */}
          {isVerified && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#00a656]/10 border border-[#00a656]/20">
              <div className="flex items-center gap-3 min-w-0">
                <svg className="size-5 text-[#00a656] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-caption font-bold text-[#00a656]">
                    DNS Verified & Live on Hostinger
                  </p>
                  <p className="text-[11px] text-t-secondary font-mono truncate">{domainUrl}</p>
                </div>
              </div>
              <a
                href={domainUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00a656]/15 hover:bg-[#00a656]/25 text-[#00a656] text-caption font-bold transition"
              >
                Visit Portal →
              </a>
            </div>
          )}

          {/* Pending / propagating banner */}
          {isPending && !isVerified && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <div className="size-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0 mt-0.5" />
              <div>
                <p className="text-caption font-bold text-amber-700 dark:text-amber-400">
                  DNS Propagating
                </p>
                <p className="text-caption text-t-secondary leading-relaxed mt-0.5">
                  DNS records are propagating across edge nameservers (usually 2–15 minutes). Automatic verification is active.
                </p>
              </div>
            </div>
          )}

          {/* Action result message */}
          {subdomainResult && (
            <div
              className={`text-caption px-4 py-2.5 rounded-xl ${
                subdomainResult.success
                  ? 'bg-[#00a656]/10 text-[#00a656] border border-[#00a656]/20'
                  : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
              }`}
            >
              {subdomainResult.message}
            </div>
          )}
        </div>
      )}

      {/* ── 4. Admin Onboarding / Registration Card (Below all content of that tab) ── */}
      {showResend && (
        <div className="p-6 rounded-3xl bg-b-surface2 border border-s-subtle shadow-widget space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="size-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/20">
                <HiOutlineMail size={20} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sub-title-2 font-bold text-t-primary">
                    {!hasAdmin ? 'Admin Not Yet Registered' : 'Onboarding Incomplete'}
                  </h4>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    PENDING SETUP
                  </span>
                </div>
                <p className="text-caption text-t-secondary leading-relaxed max-w-2xl">
                  {!hasAdmin
                    ? 'The college admin has not yet accepted the invitation and registered. Resend the onboarding email to give them a new setup link.'
                    : 'The college admin has registered but has not completed onboarding setup. You can resend the invite if needed.'}
                </p>
              </div>
            </div>

            {/* Right side: Resend Onboarding Email button */}
            <div className="shrink-0 sm:self-center">
              <button
                type="button"
                id="resend-onboarding-invite-btn"
                disabled={resendingInvite}
                onClick={async () => {
                  setResendingInvite(true);
                  try {
                    const { data } = await api.post(`/super-admin/colleges/${collegeId}/invite/resend`);
                    if (data?.setupUrl || data?.directSetupUrl) {
                      setLastInviteData(data);
                    }
                    if (data?.success !== false) {
                      toast.success(data?.message || 'Onboarding invite resent successfully!');
                    } else {
                      toast.error(data?.message || 'Failed to dispatch email');
                    }
                  } catch (err) {
                    const errData = err.response?.data;
                    if (errData?.setupUrl || errData?.directSetupUrl) {
                      setLastInviteData(errData);
                    }
                    toast.error(errData?.message || 'Failed to resend invite');
                  } finally {
                    setResendingInvite(false);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-caption font-bold rounded-xl bg-primary-01 hover:bg-primary-01/90 disabled:opacity-60 text-white shadow-depth transition cursor-pointer"
              >
                {resendingInvite ? (
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <HiOutlineMail size={16} />
                )}
                <span>{resendingInvite ? 'Sending…' : 'Resend Onboarding Email'}</span>
              </button>
            </div>
          </div>

          {/* Setup Link if resent */}
          {lastInviteData && (lastInviteData.directSetupUrl || lastInviteData.setupUrl) && (
            <div className="pt-4 border-t border-s-subtle space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-caption font-semibold text-t-primary">
                  Direct Setup Link:
                </span>
                <span className="text-[11px] text-t-secondary font-medium">
                  Expires in 7 days
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={lastInviteData.directSetupUrl || lastInviteData.setupUrl}
                  className="w-full text-caption font-mono px-3.5 py-2 rounded-xl bg-b-depth2 border border-s-stroke2 text-t-primary select-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const url = lastInviteData.directSetupUrl || lastInviteData.setupUrl;
                    navigator.clipboard.writeText(url);
                    setCopiedLink(true);
                    toast.success('Setup link copied to clipboard!');
                    setTimeout(() => setCopiedLink(false), 2500);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-caption font-bold rounded-xl bg-b-surface2 border border-s-stroke2 hover:bg-b-depth1 text-t-primary shrink-0 shadow-sm transition cursor-pointer"
                >
                  {copiedLink ? <HiOutlineCheck size={15} className="text-[#00a656]" /> : <HiOutlineDocumentDuplicate size={15} />}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
              <p className="text-[11px] text-t-secondary">
                You can share this link directly with the college administrator if they did not receive the automated email.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

