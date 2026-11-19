'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import CollegesHubLoader from '@/components/common/CollegesHubLoader';
import {
  HiOutlineSpeakerphone,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineBan,
} from 'react-icons/hi';

const PANEL_ROLE_OPTIONS = [
  { id: 'admin', label: 'College Admin' },
  { id: 'principal', label: 'Principal' },
  { id: 'registrar', label: 'Registrar' },
  { id: 'accountant', label: 'Accountant' },
  { id: 'employee', label: 'Employee' },
  { id: 'teacher', label: 'Teacher' },
  { id: 'student', label: 'Student' },
];

const COLLEGE_AUDIENCE_OPTIONS = [
  {
    id: 'ALL_COLLEGE_USERS',
    label: 'All College Users (including Admin)',
    desc: 'Visible to everyone inside your college: Admin, Staff, Teachers, and Students.',
  },
  {
    id: 'ADMINISTRATION_ONLY',
    label: 'Administration Accounts Only',
    desc: 'Visible only to Admin, Principal, Registrar, Accountant, and Staff Employees.',
  },
  {
    id: 'TEACHERS_AND_STUDENTS',
    label: 'Teachers & Students Only',
    desc: 'Visible only to Faculty/Teachers and Students in your college.',
  },
];

const VARIANT_OPTIONS = [
  { id: 'info', label: 'CollegesHub Blue (Info)', pill: 'bg-[#0A4D94] text-white' },
  { id: 'success', label: 'CollegesHub Green (Success)', pill: 'bg-[#1F7A3A] text-white' },
  { id: 'warning', label: 'Amber (Notice)', pill: 'bg-amber-100 text-amber-900' },
  { id: 'urgent', label: 'Red (Urgent)', pill: 'bg-red-600 text-white' },
];

export default function BannerManager({ mode = 'college' }) {
  const isSuper = mode === 'platform';
  const endpointBase = isSuper ? '/super-admin/banners' : '/colleges/banners';

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [variant, setVariant] = useState('info');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [targetAudience, setTargetAudience] = useState(isSuper ? 'ALL_USERS' : 'ALL_COLLEGE_USERS');
  const [targetRoles, setTargetRoles] = useState(['admin']);
  const [endsAt, setEndsAt] = useState('');

  const loadBanners = useCallback(async () => {
    try {
      const res = await apiGet(endpointBase);
      if (res?.success) setBanners(res.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load banners.');
    } finally {
      setLoading(false);
    }
  }, [endpointBase]);

  useEffect(() => {
    let active = true;
    apiGet(endpointBase)
      .then((res) => {
        if (active && res?.success) setBanners(res.data || []);
      })
      .catch((err) => {
        if (active) toast.error(err?.response?.data?.message || 'Failed to load banners.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [endpointBase]);

  const toggleRole = (roleId) => {
    setTargetRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (message.trim().length < 2) {
      toast.error('Please enter a banner message.');
      return;
    }
    if (isSuper && targetAudience === 'ROLE_PANEL' && targetRoles.length === 0) {
      toast.error('Select at least one role panel.');
      return;
    }

    setSaving(true);
    try {
      const res = await apiPost(endpointBase, {
        title: title.trim() || null,
        message: message.trim(),
        variant,
        ctaLabel: ctaLabel.trim() || null,
        ctaUrl: ctaUrl.trim() || null,
        targetAudience,
        targetRoles: isSuper && targetAudience === 'ROLE_PANEL' ? targetRoles : [],
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      });

      if (res?.success) {
        toast.success('Announcement banner published!');
        setTitle('');
        setMessage('');
        setCtaLabel('');
        setCtaUrl('');
        setEndsAt('');
        await loadBanners();
      } else {
        throw new Error(res?.message || 'Failed to create banner');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to publish banner.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      const res = await apiPut(`${endpointBase}/${banner.id}`, { isActive: !banner.isActive });
      if (res?.success) {
        toast.success(banner.isActive ? 'Banner paused.' : 'Banner activated.');
        await loadBanners();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update banner.');
    }
  };

  const handleDelete = async (banner) => {
    try {
      await apiDelete(`${endpointBase}/${banner.id}`);
      toast.success('Banner deleted.');
      await loadBanners();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete banner.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0A4D94]">
          <HiOutlineSpeakerphone size={14} /> {isSuper ? 'Platform-Wide Universal Banners' : 'Campus Announcement Banners'}
        </span>
        <h1 className="text-2xl font-black text-[#0E2238] tracking-tight mt-0.5">
          {isSuper ? 'Manage Platform Banners' : 'Manage College Banners'}
        </h1>
        <p className="text-xs text-[#52657C] mt-0.5">
          {isSuper
            ? 'Publish dismissible top banners for all CollegesHub users or target specific role panels.'
            : 'Publish dismissible top banners strictly for your own college users. Users can close a banner once per day.'}
        </p>
      </div>

      {/* Create Form */}
      <form onSubmit={handleCreate} className="bg-white border border-[#DDE6F0] rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-extrabold text-[#0E2238]">Create New Banner</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#52657C] mb-1">
              Badge / Short Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Exam Schedule Update"
              maxLength={140}
              className="w-full rounded-xl border border-[#DDE6F0] bg-[#F4F7FB] px-3 py-2.5 text-xs text-[#0E2238] focus:bg-white focus:border-[#0A4D94] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-[#52657C] mb-1">
              Banner Style / Color
            </label>
            <select
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              className="w-full rounded-xl border border-[#DDE6F0] bg-white px-3 py-2.5 text-xs font-semibold text-[#0E2238]"
            >
              {VARIANT_OPTIONS.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-[#52657C] mb-1">
            Message *
          </label>
          <textarea
            rows={2}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write the notice displayed across the top of the selected dashboard panels..."
            maxLength={600}
            className="w-full rounded-xl border border-[#DDE6F0] bg-[#F4F7FB] px-3 py-2.5 text-xs text-[#0E2238] focus:bg-white focus:border-[#0A4D94] focus:outline-none"
          />
        </div>

        {/* Audience Targeting */}
        {isSuper ? (
          <div className="space-y-3 rounded-xl border border-[#DDE6F0] bg-[#F4F7FB] p-4">
            <label className="block text-[11px] font-bold uppercase text-[#52657C]">
              Target Audience *
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'ALL_USERS', label: 'All Platform Users' },
                { id: 'ROLE_PANEL', label: 'Specific Role Panels Only' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTargetAudience(opt.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    targetAudience === opt.id
                      ? 'bg-[#0A4D94] border-[#0A4D94] text-white'
                      : 'bg-white border-[#DDE6F0] text-[#0E2238]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {targetAudience === 'ROLE_PANEL' && (
              <div className="pt-2 flex flex-wrap gap-2">
                {PANEL_ROLE_OPTIONS.map((r) => {
                  const active = targetRoles.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleRole(r.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        active
                          ? 'bg-[#299A49] border-[#299A49] text-white'
                          : 'bg-white border-[#DDE6F0] text-[#52657C]'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}{r.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 rounded-xl border border-[#DDE6F0] bg-[#F4F7FB] p-4">
            <label className="block text-[11px] font-bold uppercase text-[#52657C]">
              College Audience Scope *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {COLLEGE_AUDIENCE_OPTIONS.map((opt) => {
                const selected = targetAudience === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTargetAudience(opt.id)}
                    className={`text-left rounded-xl border-2 p-3 transition cursor-pointer ${
                      selected
                        ? 'border-[#0A4D94] bg-white shadow-sm'
                        : 'border-[#DDE6F0] bg-white/70 hover:border-[#0A4D94]/40'
                    }`}
                  >
                    <p className="text-xs font-extrabold text-[#0E2238]">{opt.label}</p>
                    <p className="text-[11px] text-[#52657C] mt-1 leading-snug">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#52657C] mb-1">
              Action Button Label (Optional)
            </label>
            <input
              type="text"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="e.g. View Datesheet"
              maxLength={60}
              className="w-full rounded-xl border border-[#DDE6F0] bg-[#F4F7FB] px-3 py-2 text-xs text-[#0E2238]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#52657C] mb-1">
              Action Link (Optional)
            </label>
            <input
              type="text"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="/admin/exams or https://..."
              maxLength={300}
              className="w-full rounded-xl border border-[#DDE6F0] bg-[#F4F7FB] px-3 py-2 text-xs text-[#0E2238]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#52657C] mb-1">
              Auto-Expire Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full rounded-xl border border-[#DDE6F0] bg-[#F4F7FB] px-3 py-2 text-xs text-[#0E2238]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0A4D94] hover:bg-[#083D77] text-white text-xs font-extrabold shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            <HiOutlinePlus size={15} />
            {saving ? 'Publishing…' : 'Publish Banner'}
          </button>
        </div>
      </form>

      {/* Active & Past Banners List */}
      <div className="bg-white border border-[#DDE6F0] rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-extrabold text-[#0E2238]">Published Banners</h2>
        {loading ? (
          <CollegesHubLoader size="sm" text="Loading banners…" />
        ) : banners.length === 0 ? (
          <p className="text-xs text-[#52657C] py-6 text-center">No banners created yet.</p>
        ) : (
          <div className="space-y-3">
            {banners.map((b) => {
              const styleMeta = VARIANT_OPTIONS.find((v) => v.id === b.variant) || VARIANT_OPTIONS[0];
              const rolesList = Array.isArray(b.targetRoles) ? b.targetRoles : [];
              return (
                <div key={b.id} className="rounded-xl border border-[#DDE6F0] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${styleMeta.pill}`}>
                        {b.variant.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[#0E2238] text-[10px] font-bold">
                        {b.targetAudience === 'ROLE_PANEL'
                          ? `Panels: ${rolesList.join(', ')}`
                          : b.targetAudience.replace(/_/g, ' ')}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.isActive ? 'bg-emerald-50 text-[#1F7A3A]' : 'bg-slate-100 text-slate-500'}`}>
                        {b.isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <p className="text-xs text-[#0E2238]">
                      {b.title && <strong className="mr-1.5">{b.title}:</strong>}
                      {b.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(b)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#DDE6F0] text-xs font-bold text-[#0E2238] hover:bg-slate-50 cursor-pointer"
                    >
                      {b.isActive ? <><HiOutlineBan size={14} /> Pause</> : <><HiOutlineCheckCircle size={14} /> Activate</>}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(b)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-100 cursor-pointer"
                    >
                      <HiOutlineTrash size={14} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
