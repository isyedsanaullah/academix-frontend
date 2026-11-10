'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Icon from '@/components/Icon';
import CollegesHubLoader from '@/components/common/CollegesHubLoader';
import { useAuthStore } from '@/store/authStore';

const ApiKeyManager = dynamic(
  () => import('@/components/ai/ApiKeyManager'),
  { ssr: false }
);
const GoogleAuthenticatorCard = dynamic(
  () => import('./GoogleAuthenticatorCard'),
  { ssr: false }
);
const KnownDevicesCard = dynamic(
  () => import('./KnownDevicesCard'),
  { ssr: false }
);

/* ── Password Validation Rules ── */
const PW_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'upper', label: 'At least 1 uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'number', label: 'At least 1 number', test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'At least 1 special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const getPwStrength = (pw) => {
  if (!pw) return { score: 0, label: '', color: '', textColor: '' };
  const passed = PW_RULES.filter((r) => r.test(pw)).length;
  if (passed <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-500' };
  if (passed === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-500' };
  if (passed === 3) return { score: 3, label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-500' };
  return { score: 4, label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400' };
};

/* ── Crop Modal for Profile Picture / Logo ── */
function ImageSquareCropModal({ open, imageSrc, onCancel, onSave, uploading }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleCropSave = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');

    const img = imgRef.current;
    if (!img) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 500, 500);

    const scale = (zoom * 500) / Math.min(img.naturalWidth, img.naturalHeight || 500);
    const drawWidth = img.naturalWidth * scale;
    const drawHeight = img.naturalHeight * scale;

    const centerX = 250 + offset.x * (500 / 224);
    const centerY = 250 + offset.y * (500 / 224);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 500, 500);
    ctx.clip();
    ctx.drawImage(img, centerX - drawWidth / 2, centerY - drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9);
    onSave(croppedBase64);
  };

  return (
    <Modal open={open} onClose={onCancel} title="Update Profile Picture / Logo" className="max-w-md">
      <div className="space-y-5">
        <div className="p-3.5 rounded-2xl bg-blue-500/10 text-caption text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <Icon name="info" className="!size-4 shrink-0 fill-current" />
          <span>
            Recommended size: <strong>500 &times; 500 px</strong> (Square 1:1, Max 2MB)
          </span>
        </div>

        <div
          className="relative size-56 mx-auto rounded-3xl overflow-hidden bg-b-surface1 border-2 border-[var(--accent,var(--primary-01))] flex items-center justify-center cursor-move select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Crop target"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              maxHeight: 'none',
              maxWidth: 'none',
              width: '100%',
              height: 'auto',
            }}
            className="pointer-events-none transition-transform duration-75 object-cover"
            draggable={false}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-caption font-bold text-t-secondary">
            <span>Zoom</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full accent-[var(--accent,var(--primary-01))] cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            className="btn-secondary h-10 px-4 rounded-xl text-caption font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCropSave}
            disabled={uploading}
            className="btn-primary h-10 px-5 rounded-xl text-caption font-bold flex items-center gap-2"
          >
            <Icon name="check" className="!size-4 fill-current" />
            <span>{uploading ? 'Saving…' : 'Crop & Save'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Inline Editable Field ── */
function EditableField({
  icon,
  label,
  value,
  editKey,
  editingField,
  editValue,
  setEditValue,
  onStartEdit,
  onSave,
  onCancel,
  saving,
  hint,
}) {
  const isEditing = editingField === editKey;

  return (
    <div className="flex items-start gap-3.5 py-4 border-b border-s-subtle last:border-0">
      <div className="size-10 rounded-2xl bg-b-depth2 border border-s-subtle flex items-center justify-center shrink-0 mt-0.5 text-t-secondary">
        <Icon name={icon} className="!size-4.5 fill-current" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-t-tertiary uppercase tracking-wider mb-0.5">
          {label}
        </p>
        {isEditing ? (
          <div className="flex items-center gap-2 mt-1.5">
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="input-field flex-1 min-w-0 h-10 text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSave();
                if (e.key === 'Escape') onCancel();
              }}
            />
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="btn-primary size-10 rounded-xl flex items-center justify-center shrink-0 cursor-pointer"
              title="Save"
            >
              <Icon name="check" className="!size-4 fill-current" />
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary size-10 rounded-xl flex items-center justify-center shrink-0 cursor-pointer"
              title="Cancel"
            >
              <Icon name="close" className="!size-4 fill-current" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sub-title-2 font-semibold text-t-primary truncate">
              {value || <span className="italic text-t-tertiary font-normal">Not set</span>}
            </p>
            <button
              type="button"
              onClick={() => onStartEdit(editKey, value || '')}
              className="size-8 rounded-lg hover:bg-b-depth2 flex items-center justify-center text-t-tertiary hover:text-t-primary transition-colors cursor-pointer"
              title={`Edit ${label}`}
            >
              <Icon name="edit" className="!size-4 fill-current" />
            </button>
          </div>
        )}
        {hint && !isEditing && (
          <p className="text-[11px] text-t-tertiary mt-0.5">{hint}</p>
        )}
      </div>
    </div>
  );
}

export default function SuperAdminSettingsView() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  // Inline editing state
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [savingField, setSavingField] = useState(false);

  // Avatar crop & upload state
  const fileInputRef = useRef(null);
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Password state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // Email verification state
  const [codeSent, setCodeSent] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifySaving, setVerifySaving] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [newEmail, setNewEmail] = useState('');
  const [emailPw, setEmailPw] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const cooldownRef = useRef(null);

  const { updateUser } = useAuthStore();

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/profile/me');
      if (data?.success) {
        const profileData = { ...data.data };
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('academix_totp_enabled');
          if (profileData.totpEnabled !== undefined) {
            localStorage.setItem('academix_totp_enabled', profileData.totpEnabled ? 'true' : 'false');
          } else if (stored !== null) {
            profileData.totpEnabled = stored === 'true';
          } else if (profileData.email === 'admin@collegeshub.com') {
            profileData.totpEnabled = true;
            localStorage.setItem('academix_totp_enabled', 'true');
          }
        }
        setProfile(profileData);
      }
    } catch {
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Email verification cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownRef.current);
  }, [cooldown]);

  // Avatar file handling
  const handleAvatarFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WebP)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawImageSrc(ev.target.result);
      setIsCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCroppedAvatarSave = async (croppedBase64) => {
    setAvatarUploading(true);
    try {
      await api.put('/profile/me', { avatar: croppedBase64 });
      toast.success('Profile logo updated successfully!');
      updateUser({ avatar: croppedBase64 });
      setIsCropOpen(false);
      setRawImageSrc(null);
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update logo');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Field edit actions
  const startEdit = (field, val) => {
    setEditingField(field);
    setEditValue(val);
  };
  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveField = async (field) => {
    setSavingField(true);
    try {
      if (field === 'username') {
        if (!editValue || editValue.length < 3)
          return toast.error('Username must be 3+ characters');
        if (!/^[a-zA-Z0-9_]+$/.test(editValue))
          return toast.error('Letters, numbers, and underscores only');
        await api.put('/profile/username', { username: editValue });
        toast.success('Username updated!');
      } else if (field === 'name') {
        if (!editValue.trim()) return toast.error('Name cannot be empty');
        await api.put('/profile/me', { name: editValue.trim() });
        toast.success('Name updated!');
      } else if (field === 'phone') {
        await api.put('/profile/me', { phone: editValue.trim() });
        toast.success('Phone updated!');
      }
      cancelEdit();
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSavingField(false);
    }
  };

  // Password change actions
  const pwStrength = getPwStrength(newPw);
  const pwRulesPassed = PW_RULES.map((r) => ({ ...r, passed: r.test(newPw) }));
  const pwValid =
    pwRulesPassed.every((r) => r.passed) && newPw === confirmPw && currentPw.length > 0;

  const handleChangePassword = async (e) => {
    if (e) e.preventDefault();
    if (!pwValid) return;
    setPwSaving(true);
    try {
      await api.put('/profile/password', { currentPassword: currentPw, newPassword: newPw });
      toast.success('Password changed successfully!');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  // Email verification actions
  const handleSendVerification = async () => {
    if (cooldown > 0) return;
    setVerifySaving(true);
    try {
      const { data } = await api.post('/profile/email/verify/send');
      toast.success(data?.message || 'Verification code sent to your email');
      setCodeSent(true);
      setCooldown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setVerifySaving(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    if (e) e.preventDefault();
    if (!verifyCode || verifyCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    setVerifySaving(true);
    try {
      await api.post('/profile/email/verify', { code: verifyCode });
      toast.success('Email verified successfully!');
      setVerifyCode('');
      setCodeSent(false);
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired verification code');
    } finally {
      setVerifySaving(false);
    }
  };

  const handleChangeEmail = async (e) => {
    if (e) e.preventDefault();
    if (!newEmail || !emailPw) return toast.error('Please fill in both email and password');
    setEmailSaving(true);
    try {
      await api.put('/profile/email', { newEmail, password: emailPw });
      toast.success('Email updated. Please check your new inbox for verification.');
      setNewEmail('');
      setEmailPw('');
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update email');
    } finally {
      setEmailSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <CollegesHubLoader size="md" text="Loading settings &amp; security configuration…" />
      </div>
    );
  }

  if (!profile) return null;

  const TABS = [
    { id: 'info', name: 'Personal Info', icon: 'profile' },
    { id: 'security', name: 'Security', icon: 'lock' },
    { id: 'email', name: 'Email', icon: 'envelope' },
    { id: 'ai', name: 'AI Settings', icon: 'sparkles' },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* ── 1. Hero Header: Big Logo with Update Icon & Identity Details (No Super Administrator Badge) ── */}
      <Card className="p-6 max-md:p-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Big Logo / Avatar with floating update icon */}
          <div className="relative shrink-0 group">
            <div className="size-28 sm:size-32 rounded-3xl overflow-hidden bg-b-depth2 border-2 border-s-stroke2 shadow-depth flex items-center justify-center">
              {profile.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-[var(--accent,var(--primary-01))] to-blue-600 flex items-center justify-center text-white text-4xl font-extrabold select-none">
                  {profile.name?.[0]?.toUpperCase() || 'SA'}
                </div>
              )}
            </div>

            {/* Update Logo Action Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              aria-label="Update logo / profile photo"
              title="Click to update logo / profile photo"
              className="absolute -bottom-1.5 -right-1.5 size-10 rounded-full bg-[var(--accent,var(--primary-01))] border-2 border-b-surface1 text-white flex items-center justify-center shadow-depth hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Icon name="camera" className="!size-5 fill-current" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileSelect}
            />
          </div>

          {/* Identity details (Notice: badge "Super Administrator" is completely removed) */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 justify-center sm:justify-start flex-wrap">
              <h1 className="text-h4 font-bold text-t-primary">{profile.name}</h1>
              {profile.emailVerified && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <Icon name="check-circle" className="!size-3.5 fill-current" />
                  <span>Verified Email</span>
                </span>
              )}
            </div>

            <p className="text-sub-title-2 text-t-secondary mt-1">{profile.email}</p>

            {profile.username && (
              <p className="text-caption font-mono font-bold text-[var(--accent,var(--primary-01))] mt-0.5">
                @{profile.username}
              </p>
            )}

            <div className="flex items-center gap-5 mt-4 flex-wrap justify-center sm:justify-start text-caption text-t-tertiary">
              <div className="flex items-center gap-1.5">
                <Icon name="clock" className="!size-3.5 fill-current" />
                <span>
                  Member since{' '}
                  {new Date(profile.createdAt).toLocaleDateString('en-PK', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {profile.lastLogin && (
                <div className="flex items-center gap-1.5">
                  <Icon name="check-circle" className="!size-3.5 fill-current" />
                  <span>
                    Last active{' '}
                    {new Date(profile.lastLogin).toLocaleDateString('en-PK', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* ── 2. Full Available Width Tabs: 4x1 Single Row (Icons Only on Phone, Icons + Labels on Tablet/Desktop) ── */}
      <div
        role="tablist"
        aria-label="Settings sections"
        className="w-full p-1.5 rounded-3xl bg-b-depth2 border border-s-subtle grid grid-cols-4 gap-1.5 sm:gap-2 shadow-sm"
      >
        {TABS.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-label={t.name}
              title={t.name}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center justify-center gap-2 h-11 sm:h-12 w-full rounded-2xl font-bold text-sub-title-2 transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-b-surface1 text-t-primary shadow-sm border border-s-stroke2 ring-1 ring-black/5 dark:ring-white/5'
                  : 'text-t-secondary hover:text-t-primary hover:bg-b-surface1/50 border border-transparent'
              }`}
            >
              <Icon
                name={t.icon}
                className={`!size-5 sm:!size-4.5 shrink-0 ${
                  isActive ? 'fill-[var(--accent,var(--primary-01))]' : 'fill-current'
                }`}
              />
              <span className="hidden sm:inline truncate">{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3. Tab Panels ── */}

      {/* TAB 1: Personal Info */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
          <Card title="Personal Details" subtitle="Primary contact and identity attributes" icon="profile">
            <div className="p-6 max-md:p-4">
              <EditableField
                icon="profile"
                label="Full Name"
                value={profile.name}
                editKey="name"
                editingField={editingField}
                editValue={editValue}
                setEditValue={setEditValue}
                onStartEdit={startEdit}
                onSave={() => saveField('name')}
                onCancel={cancelEdit}
                saving={savingField}
              />
              <EditableField
                icon="phone"
                label="Phone Number"
                value={profile.phone}
                editKey="phone"
                editingField={editingField}
                editValue={editValue}
                setEditValue={setEditValue}
                onStartEdit={startEdit}
                onSave={() => saveField('phone')}
                onCancel={cancelEdit}
                saving={savingField}
                hint="Used for critical recovery and security alerts."
              />
              <EditableField
                icon="at-sign"
                label="Username Handle"
                value={profile.username ? `@${profile.username}` : ''}
                editKey="username"
                editingField={editingField}
                editValue={editValue}
                setEditValue={setEditValue}
                onStartEdit={(key) => startEdit(key, profile.username || '')}
                onSave={() => saveField('username')}
                onCancel={cancelEdit}
                saving={savingField}
                hint="Letters, numbers &amp; underscores only. Can be used for logging in."
              />
              {profile.cnic && (
                <div className="flex items-start gap-3.5 py-4 border-b border-s-subtle last:border-0">
                  <div className="size-10 rounded-2xl bg-b-depth2 border border-s-subtle flex items-center justify-center shrink-0 mt-0.5 text-t-secondary">
                    <Icon name="id-card" className="!size-4.5 fill-current" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-t-tertiary uppercase tracking-wider mb-0.5">
                      National ID (CNIC)
                    </p>
                    <p className="text-sub-title-2 font-mono text-t-primary">{profile.cnic}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card title="Account Overview" subtitle="Platform authorization parameters" icon="layers">
            <div className="p-6 max-md:p-4 space-y-4">
              <div className="p-4.5 rounded-3xl bg-b-depth2/50 border border-s-subtle space-y-2">
                <p className="text-sub-title-1 font-bold text-t-primary">
                  Global Platform Access
                </p>
                <p className="text-caption text-t-secondary leading-relaxed">
                  This master account possesses unconditional access to multi-college provisioning, financial settlements, platform configuration, and system-wide telemetry.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between py-2.5 border-b border-s-subtle text-caption">
                  <span className="font-semibold text-t-tertiary">User Account ID</span>
                  <span className="font-mono text-t-primary font-bold">{profile._id}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-s-subtle text-caption">
                  <span className="font-semibold text-t-tertiary">Registration Timestamp</span>
                  <span className="font-medium text-t-primary">
                    {new Date(profile.createdAt).toLocaleDateString('en-PK', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 text-caption">
                  <span className="font-semibold text-t-tertiary">Current Authentication</span>
                  <span className="font-medium text-t-primary capitalize">
                    {profile.authProvider || 'Local Password'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: Security */}
      {activeTab === 'security' && (
        <div className="space-y-6 w-full">
          {/* Change Password & Google Authenticator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full items-start">
            <Card title="Change Password" subtitle="Keep your Super Admin master password protected" icon="lock">
              <form onSubmit={handleChangePassword} className="p-6 max-md:p-4 space-y-4.5">
                <div>
                  <label className="block text-sub-title-2 font-bold text-t-primary mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      placeholder="Enter current password"
                      className="input-field pr-12 text-xs h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw((v) => !v)}
                      aria-label={showCurrentPw ? 'Hide current password' : 'Show current password'}
                      title={showCurrentPw ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 size-9 rounded-xl flex items-center justify-center text-t-tertiary hover:text-t-primary hover:bg-b-depth2 transition-colors cursor-pointer"
                    >
                      <Icon
                        name={showCurrentPw ? 'eye-off' : 'eye'}
                        className="!size-4 fill-current"
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sub-title-2 font-bold text-t-primary mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="Create a strong password"
                      className="input-field pr-12 text-xs h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw((v) => !v)}
                      aria-label={showNewPw ? 'Hide new password' : 'Show new password'}
                      title={showNewPw ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 size-9 rounded-xl flex items-center justify-center text-t-tertiary hover:text-t-primary hover:bg-b-depth2 transition-colors cursor-pointer"
                    >
                      <Icon
                        name={showNewPw ? 'eye-off' : 'eye'}
                        className="!size-4 fill-current"
                      />
                    </button>
                  </div>

                  {newPw.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {/* 4-segment strength meter */}
                      <div className="p-3 rounded-2xl bg-b-depth2/50 border border-s-subtle space-y-2">
                        <div className="flex items-center justify-between text-caption">
                          <span className="font-semibold text-t-secondary">Password Strength</span>
                          <span className={`font-bold ${pwStrength.textColor}`}>
                            {pwStrength.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                          {[1, 2, 3, 4].map((seg) => (
                            <div
                              key={seg}
                              className={`h-full rounded-full transition-all duration-300 ${
                                seg <= pwStrength.score ? pwStrength.color : 'bg-b-surface1'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Requirements checklist */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                        {pwRulesPassed.map((rule) => (
                          <div
                            key={rule.id}
                            className={`flex items-center gap-2 text-caption font-medium transition-colors ${
                              rule.passed
                                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                : 'text-t-tertiary'
                            }`}
                          >
                            <div
                              className={`size-4 rounded-full flex items-center justify-center shrink-0 ${
                                rule.passed
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-b-depth2 text-t-tertiary'
                              }`}
                            >
                              <Icon
                                name={rule.passed ? 'check' : 'circle'}
                                className="!size-2.5 fill-current"
                              />
                            </div>
                            <span>{rule.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sub-title-2 font-bold text-t-primary mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder="Repeat new password"
                      className="input-field pr-12 text-xs h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw((v) => !v)}
                      aria-label={showConfirmPw ? 'Hide confirmation password' : 'Show confirmation password'}
                      title={showConfirmPw ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 size-9 rounded-xl flex items-center justify-center text-t-tertiary hover:text-t-primary hover:bg-b-depth2 transition-colors cursor-pointer"
                    >
                      <Icon
                        name={showConfirmPw ? 'eye-off' : 'eye'}
                        className="!size-4 fill-current"
                      />
                    </button>
                  </div>

                  {confirmPw.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-caption font-medium">
                      {newPw === confirmPw ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Icon name="check-circle" className="!size-3.5 fill-current" />
                          <span>Passwords match</span>
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Icon name="alert-circle" className="!size-3.5 fill-current" />
                          <span>Passwords do not match yet</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!pwValid || pwSaving}
                    className="btn-primary h-11 px-6 rounded-2xl font-bold text-caption flex items-center gap-2 cursor-pointer shadow-depth disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    {pwSaving ? (
                      <>
                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Updating Password…</span>
                      </>
                    ) : (
                      <>
                        <Icon name="key" className="!size-4 fill-current" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </Card>

            <GoogleAuthenticatorCard profile={profile} onProfileUpdated={fetchProfile} />
          </div>

          {/* 3. Known Devices Card */}
          <KnownDevicesCard />
        </div>
      )}

      {/* TAB 3: Email */}
      {activeTab === 'email' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
          <Card title="Email Verification Status" subtitle="Verified status and dispatch verification" icon="envelope">
            <div className="p-6 max-md:p-4 space-y-5">
              <div
                className={`flex items-start gap-3 p-4 rounded-2xl border ${
                  profile.emailVerified
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-amber-500/10 border-amber-500/20'
                }`}
              >
                <Icon
                  name={profile.emailVerified ? 'check-circle' : 'info'}
                  className={`!size-5 shrink-0 mt-0.5 fill-current ${
                    profile.emailVerified ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sub-title-2 font-bold text-t-primary truncate">{profile.email}</p>
                  <p
                    className={`text-caption font-semibold mt-0.5 ${
                      profile.emailVerified
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {profile.emailVerified
                      ? 'Email address is verified and active'
                      : 'Email address is currently unverified'}
                  </p>
                </div>
              </div>

              {!profile.emailVerified && (
                <div className="space-y-4 pt-1">
                  {!codeSent ? (
                    <button
                      type="button"
                      onClick={handleSendVerification}
                      disabled={verifySaving}
                      className="btn-primary h-10 px-5 rounded-xl font-bold text-caption flex items-center gap-2 cursor-pointer"
                    >
                      <Icon name="envelope" className="!size-4 fill-current" />
                      <span>{verifySaving ? 'Sending…' : 'Send Verification Code'}</span>
                    </button>
                  ) : (
                    <form onSubmit={handleVerifyEmail} className="space-y-3">
                      <p className="text-caption text-t-secondary">
                        Enter the 6-digit code sent to your inbox:
                      </p>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={verifyCode}
                          onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="● ● ● ● ● ●"
                          className="input-field w-40 text-center font-mono tracking-widest text-sm h-10 font-bold"
                        />
                        <button
                          type="submit"
                          disabled={verifySaving || verifyCode.length !== 6}
                          className="btn-primary h-10 px-5 rounded-xl font-bold text-caption"
                        >
                          {verifySaving ? 'Verifying…' : 'Verify'}
                        </button>
                      </div>
                      {cooldown > 0 && (
                        <p className="text-[11px] text-t-tertiary">
                          Resend available in {cooldown}s
                        </p>
                      )}
                    </form>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card title="Change Email Address" subtitle="Update your primary login email address" icon="mail">
            <form onSubmit={handleChangeEmail} className="p-6 max-md:p-4 space-y-4">
              <div>
                <label className="block text-sub-title-2 font-bold text-t-primary mb-1.5">
                  New Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@collegeshub.org"
                  className="input-field text-xs h-11"
                />
              </div>

              <div>
                <label className="block text-sub-title-2 font-bold text-t-primary mb-1.5">
                  Current Password (Confirmation)
                </label>
                <input
                  type="password"
                  value={emailPw}
                  onChange={(e) => setEmailPw(e.target.value)}
                  placeholder="Enter your current password"
                  className="input-field text-xs h-11"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={emailSaving || !newEmail || !emailPw}
                  className="btn-primary h-11 px-6 rounded-2xl font-bold text-caption flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Icon name="envelope" className="!size-4 fill-current" />
                  <span>{emailSaving ? 'Updating…' : 'Update Email Address'}</span>
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* TAB 4: AI Settings */}
      {activeTab === 'ai' && (
        <div className="w-full">
          <ApiKeyManager />
        </div>
      )}

      {/* ── 4. Crop Modal ── */}
      {isCropOpen && rawImageSrc && (
        <ImageSquareCropModal
          open={isCropOpen}
          imageSrc={rawImageSrc}
          onCancel={() => {
            setIsCropOpen(false);
            setRawImageSrc(null);
          }}
          onSave={handleCroppedAvatarSave}
          uploading={avatarUploading}
        />
      )}
    </div>
  );
}

