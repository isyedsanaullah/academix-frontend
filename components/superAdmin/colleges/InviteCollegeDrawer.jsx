'use client';

import { useState } from 'react';
import SlideOverDrawer from '@/components/common/SlideOverDrawer';
import api from '@/services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineMail,
  HiOutlineOfficeBuilding,
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineClipboardCopy,
  HiOutlineSparkles,
} from 'react-icons/hi';

export default function InviteCollegeDrawer({
  open = false,
  onClose,
  onInviteSent,
}) {
  const [inviteForm, setInviteForm] = useState({ email: '', collegeName: '' });
  const [submitting, setSubmitting] = useState(false);
  const [createdInviteUrl, setCreatedInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) {
      return toast.error('Please enter official college email address');
    }

    setSubmitting(true);
    setCopied(false);
    try {
      const payload = {
        email: inviteForm.email.trim(),
        ...(inviteForm.collegeName.trim() ? { collegeName: inviteForm.collegeName.trim() } : {}),
      };
      const { data } = await api.post('/super-admin/invitations', payload);
      toast.success(data.message || 'Invitation sent successfully!');
      setCreatedInviteUrl(data.data?.inviteUrl || '');
      if (onInviteSent) onInviteSent();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Invitation link copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDrawerClose = () => {
    setCreatedInviteUrl('');
    setInviteForm({ email: '', collegeName: '' });
    onClose();
  };

  return (
    <SlideOverDrawer
      open={open}
      onClose={handleDrawerClose}
      title="Invite College to CollegesHub"
      subtitle="Generate a secure single-use invitation link (14-day free trial included)"
      icon="mail"
      width="w-full sm:max-w-lg"
    >
      {!createdInviteUrl ? (
        <form onSubmit={handleSendInvite} className="space-y-5">
          <div>
            <label className="block text-caption font-semibold text-t-secondary uppercase tracking-wider mb-1.5">
              Official College Email *
            </label>
            <div className="relative">
              <HiOutlineMail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-t-secondary pointer-events-none"
                size={18}
              />
              <input
                type="email"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, email: e.target.value })
                }
                className="w-full h-12 pl-10 pr-4 rounded-2xl bg-b-surface1 border border-s-subtle text-body-2 text-t-primary focus:border-s-focus outline-none"
                placeholder="e.g. principal@punjabcollege.edu.pk"
                required
              />
            </div>
            <p className="text-[11px] text-t-tertiary mt-1">
              An invitation link valid for 48 hours will be generated and emailed to this address.
            </p>
          </div>

          <div>
            <label className="block text-caption font-semibold text-t-secondary uppercase tracking-wider mb-1.5">
              Institution Name (Optional)
            </label>
            <div className="relative">
              <HiOutlineOfficeBuilding
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-t-secondary pointer-events-none"
                size={18}
              />
              <input
                type="text"
                value={inviteForm.collegeName}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, collegeName: e.target.value })
                }
                className="w-full h-12 pl-10 pr-4 rounded-2xl bg-b-surface1 border border-s-subtle text-body-2 text-t-primary focus:border-s-focus outline-none"
                placeholder="e.g. Punjab College of Science"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#299A49]/10 border border-[#299A49]/25 text-caption text-t-primary leading-relaxed flex items-start gap-2.5">
            <HiOutlineSparkles size={18} className="text-[#299A49] shrink-0 mt-0.5" />
            <span>
              No plan is pre-selected. On registration, the college automatically starts a{' '}
              <strong>14-day free trial</strong> and chooses its own plan &amp; add-ons before the trial ends.
            </span>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 justify-center h-12 text-button cursor-pointer"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Link…
                </span>
              ) : (
                'Send Secure Invitation'
              )}
            </button>
            <button
              type="button"
              onClick={handleDrawerClose}
              className="btn-secondary h-12 px-5 text-button cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#00a656]/10 border border-[#00a656]/25 text-center">
            <HiOutlineCheckCircle
              size={36}
              className="text-[#00a656] mx-auto mb-2"
            />
            <h3 className="text-sub-title-1 font-bold text-t-primary">
              Invitation Link Ready!
            </h3>
            <p className="text-caption text-t-secondary mt-1">
              Single-use invitation valid for 48 hours sent to{' '}
              <strong>{inviteForm.email}</strong>.
            </p>
          </div>

          <div>
            <label className="block text-caption font-semibold text-t-secondary uppercase tracking-wider mb-1.5">
              Single-Use Invitation URL
            </label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={createdInviteUrl}
                className="w-full h-11 px-3.5 rounded-2xl bg-b-surface1 border border-s-subtle text-caption font-mono select-all text-t-primary"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(createdInviteUrl)}
                className={`h-11 px-4 rounded-2xl font-semibold text-caption shrink-0 inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  copied
                    ? 'bg-[#00a656] text-white'
                    : 'bg-primary-01 text-white hover:bg-primary-01/90'
                }`}
              >
                {copied ? (
                  <HiOutlineCheck size={16} />
                ) : (
                  <HiOutlineClipboardCopy size={16} />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDrawerClose}
            className="btn-secondary w-full justify-center h-12 text-button mt-2 cursor-pointer"
          >
            Close Window
          </button>
        </div>
      )}
    </SlideOverDrawer>
  );
}
