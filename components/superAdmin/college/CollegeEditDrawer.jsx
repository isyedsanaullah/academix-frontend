'use client';

import { useState } from 'react';
import SlideOverDrawer from '@/components/common/SlideOverDrawer';
import Icon from '@/components/Icon';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function CollegeEditDrawer({
  open = false,
  onClose,
  collegeId,
  collegeName,
  initialData = {},
  onSaved,
}) {
  const [form, setForm] = useState({
    code: initialData.code || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    city: initialData.city || '',
    website: initialData.website || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        website: form.website.trim(),
      };
      await api.put(`/super-admin/colleges/${collegeId}`, payload);
      toast.success('College directory record updated');
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update college details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlideOverDrawer
      open={open}
      onClose={() => {
        if (!saving) onClose();
      }}
      title="Edit Institution Details"
      subtitle={`Directory management for ${collegeName || 'Institution'}`}
      icon="edit"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-sub-title-2 font-semibold text-t-secondary hover:text-t-primary hover:bg-b-depth2 border border-s-subtle transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sub-title-2 font-bold text-white bg-primary-01 hover:bg-primary-01/90 shadow-widget transition-all cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon name="check" className="size-4" />
            )}
            <span>Save Record Changes</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Disclaimer Banner */}
        <div className="p-4 rounded-2xl bg-primary-01/10 border border-primary-01/20 text-caption text-t-secondary space-y-1.5">
          <p className="font-bold text-primary-01 flex items-center gap-1.5 text-sub-title-2">
            <Icon name="shield-check" className="size-4 text-primary-01" />
            SuperAdmin Directory Records Only
          </p>
          <p className="leading-relaxed">
            Updating these administrative contact coordinates updates platform directory records for SuperAdmin management only. It does <strong className="text-t-primary font-semibold">not</strong> alter tenant administrator login credentials or user account passwords.
          </p>
        </div>

        {/* Institution Code */}
        <div className="space-y-1.5">
          <label className="text-caption font-semibold text-t-secondary uppercase tracking-wider block">
            Institution Code
          </label>
          <input
            type="text"
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
            placeholder="e.g. GCET"
            className="w-full px-4 py-2.5 rounded-2xl bg-b-depth2 border border-s-subtle focus:border-primary-01 text-t-primary font-mono text-sub-title-2 uppercase outline-none transition-colors"
          />
        </div>

        {/* Official Email */}
        <div className="space-y-1.5">
          <label className="text-caption font-semibold text-t-secondary uppercase tracking-wider block">
            Official Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="admin@college.edu"
            className="w-full px-4 py-2.5 rounded-2xl bg-b-depth2 border border-s-subtle focus:border-primary-01 text-t-primary text-sub-title-2 outline-none transition-colors"
          />
        </div>

        {/* Phone Number */}
        <div className="space-y-1.5">
          <label className="text-caption font-semibold text-t-secondary uppercase tracking-wider block">
            Phone Number
          </label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="+92 300 1234567"
            className="w-full px-4 py-2.5 rounded-2xl bg-b-depth2 border border-s-subtle focus:border-primary-01 text-t-primary font-mono text-sub-title-2 outline-none transition-colors"
          />
        </div>

        {/* City / Region */}
        <div className="space-y-1.5">
          <label className="text-caption font-semibold text-t-secondary uppercase tracking-wider block">
            City / Region
          </label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            placeholder="e.g. Lahore, Punjab"
            className="w-full px-4 py-2.5 rounded-2xl bg-b-depth2 border border-s-subtle focus:border-primary-01 text-t-primary text-sub-title-2 outline-none transition-colors"
          />
        </div>

        {/* Website Portal */}
        <div className="space-y-1.5">
          <label className="text-caption font-semibold text-t-secondary uppercase tracking-wider block">
            Website Portal
          </label>
          <input
            type="url"
            value={form.website}
            onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
            placeholder="https://www.college.edu"
            className="w-full px-4 py-2.5 rounded-2xl bg-b-depth2 border border-s-subtle focus:border-primary-01 text-t-primary text-sub-title-2 outline-none transition-colors"
          />
        </div>
      </form>
    </SlideOverDrawer>
  );
}

