'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ApiKeyManager from '../../components/ai/ApiKeyManager';
import CollegesHubLoader from '../../components/common/CollegesHubLoader';
import MyQRCode from '../../components/common/MyQRCode';
import { useAuthStore } from '../../store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';
import Icon from '@/components/Icon';

const PW_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'upper', label: 'At least 1 uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'number', label: 'At least 1 number', test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'At least 1 special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const getPwStrength = (pw) => {
  if (!pw) return { score: 0, label: '', color: '' };
  const passed = PW_RULES.filter((r) => r.test(pw)).length;
  if (passed <= 1) return { score: 1, label: 'Weak', color: 'bg-[var(--danger)]' };
  if (passed === 2) return { score: 2, label: 'Fair', color: 'bg-[var(--warning)]' };
  if (passed === 3) return { score: 3, label: 'Good', color: 'bg-[var(--brand-blue)]' };
  return { score: 4, label: 'Strong', color: 'bg-[var(--brand-green)]' };
};

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
  disabled,
  hint,
  validate,
}) {
  const isEditing = editingField === editKey;

  return (
    <div className="flex items-start gap-3.5 py-4 border-b border-s-subtle last:border-0">
      <div className="w-10 h-10 rounded-2xl bg-b-surface1 border border-s-subtle flex items-center justify-center shrink-0 mt-0.5 text-t-secondary">
        <Icon name={icon} size={18} className="fill-current" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-caption font-bold text-t-tertiary uppercase tracking-wider mb-0.5">
          {label}
        </p>
        {isEditing ? (
          <div className="flex items-center gap-2 mt-1.5">
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="input-field flex-1 min-w-0 h-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSave();
                if (e.key === 'Escape') onCancel();
              }}
            />
            <Button
              isPrimary
              isCircle
              size="sm"
              icon="check"
              onClick={onSave}
              disabled={saving || (validate && !validate(editValue))}
              aria-label="Save field"
            />
            <Button
              isStroke
              isCircle
              size="sm"
              icon="close"
              onClick={onCancel}
              aria-label="Cancel edit"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sub-title-2 text-t-primary truncate">
              {value || <span className="italic text-t-tertiary font-normal">Not set</span>}
            </p>
            {!disabled && (
              <Button
                isGhost
                isCircle
                size="sm"
                icon="edit"
                onClick={() => onStartEdit(editKey, value || '')}
                aria-label={`Edit ${label}`}
              />
            )}
          </div>
        )}
        {hint && !isEditing && <p className="text-caption text-t-tertiary mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

function StaticField({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3.5 py-4 border-b border-s-subtle last:border-0">
      <div className="w-10 h-10 rounded-2xl bg-b-surface1 border border-s-subtle flex items-center justify-center shrink-0 mt-0.5 text-t-secondary">
        <Icon name={icon} size={18} className="fill-current" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-caption font-bold text-t-tertiary uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className="text-sub-title-2 text-t-secondary">{value || '—'}</p>
      </div>
      <div
        className="w-8 h-8 rounded-xl bg-b-surface1 border border-s-subtle flex items-center justify-center shrink-0 mt-1 text-t-tertiary"
        title="System-controlled"
      >
        <Icon name="lock" size={14} className="fill-current" />
      </div>
    </div>
  );
}

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
    <Modal open={open} onClose={onCancel} title="Crop Profile Picture" classWrapper="max-w-md">
      <div className="space-y-5">
        <div className="p-3.5 rounded-2xl bg-[var(--brand-blue-soft)] text-caption text-[var(--brand-blue)] flex items-center gap-2">
          <Icon name="info-circle" size={16} className="shrink-0 fill-current" />
          <span>
            Recommended size: <strong>500 × 500 px</strong> (1:1 ratio, Max 2MB)
          </span>
        </div>

        <div
          className="relative w-56 h-56 mx-auto rounded-3xl overflow-hidden bg-b-surface1 border-2 border-[var(--brand-blue)] flex items-center justify-center cursor-move select-none"
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
            <span className="flex items-center gap-1">
              <Icon name="zoom-in" size={14} className="fill-current" /> Zoom
            </span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full accent-[var(--brand-blue)] cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button isStroke onClick={onCancel} disabled={uploading}>
            Cancel
          </Button>
          <Button isPrimary icon="check" onClick={handleCropSave} disabled={uploading}>
            {uploading ? 'Saving…' : 'Crop & Save'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const ROLE_LABELS = {
  superAdmin: 'Super Administrator',
  admin: 'Campus Administrator',
  registrar: 'Registrar',
  accountant: 'Finance Accountant',
  principal: 'Campus Principal',
  teacher: 'Faculty / Teacher',
  student: 'Enrolled Student',
  employee: 'Campus Staff / Employee',
};

const ROLE_DESCRIPTIONS = {
  superAdmin:
    'This account possesses global access to college management, analytics, system subscriptions, and platform configuration.',
  admin:
    'This account manages institutional academic setup, employee & student records, finance records, and daily campus operations.',
  registrar:
    'This account handles admissions, student records, enrollment lists, timetable scheduling, and verification records.',
  accountant:
    'This account oversees student tuition fee collection, vouchers, payment logs, and finance transactions.',
  principal:
    'This account provides academic oversight, staff reviews, early-exit authorizations, and campus management reports.',
  teacher:
    'This account manages classroom attendance, student grading, quizzes, assignments, and academic timetables.',
  student:
    'This account accesses study timetables, assignments, attendance records, exam results, and fee payment details.',
  employee:
    'This account coordinates campus logistics, gate attendance, visitor logging, and campus facility operations.',
};

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('info');

  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const [codeSent, setCodeSent] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifySaving, setVerifySaving] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [dailySent, setDailySent] = useState(0);
  const cooldownRef = useRef(null);

  const [newEmail, setNewEmail] = useState('');
  const [emailPw, setEmailPw] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);

  const fileInputRef = useRef(null);
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const { updateUser } = useAuthStore();

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/profile/me');
      setProfile(data.data);
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

  const startEdit = (field, value) => {
    setEditingField(field);
    setEditValue(value);
  };
  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveField = async (field) => {
    setSaving(true);
    try {
      if (field === 'username') {
        if (!editValue || editValue.length < 3)
          return toast.error('Username must be 3+ characters');
        if (!/^[a-zA-Z0-9_]+$/.test(editValue))
          return toast.error('Only letters, numbers, and underscores');
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
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Select a valid image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image file must be under 2MB');
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
      toast.success('Profile picture updated!');
      updateUser({ avatar: croppedBase64 });
      setIsCropOpen(false);
      setRawImageSrc(null);
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update picture');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const pwStrength = getPwStrength(newPw);
  const pwRulesPassed = PW_RULES.map((r) => ({ ...r, passed: r.test(newPw) }));
  const pwValid =
    pwRulesPassed.every((r) => r.passed) && newPw === confirmPw && currentPw.length > 0;

  const handleChangePassword = async () => {
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

  const handleSendVerification = async () => {
    if (dailySent >= 3) {
      toast.error('Maximum 3 attempts per day reached');
      return;
    }
    if (cooldown > 0) return;
    setVerifySaving(true);
    try {
      const { data } = await api.post('/profile/email/verify/send');
      toast.success(data.message);
      setCodeSent(true);
      setCooldown(60);
      setDailySent((d) => d + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send code');
    } finally {
      setVerifySaving(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast.error('Enter the 6-digit code');
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
      toast.error(err.response?.data?.message || 'Invalid or expired code');
    } finally {
      setVerifySaving(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !emailPw) return toast.error('Fill all fields');
    setEmailSaving(true);
    try {
      await api.put('/profile/email', { newEmail, password: emailPw });
      toast.success('Email changed. Check new inbox for verification.');
      setNewEmail('');
      setEmailPw('');
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setEmailSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-16">
        <CollegesHubLoader size="md" text="Loading profile…" minHeight="min-h-[200px]" />
      </div>
    );
  if (!profile) return null;

  const TAB_ITEMS = [
    { id: 'info', name: 'Personal Info' },
    { id: 'security', name: 'Security' },
    { id: 'email', name: 'Email' },
    { id: 'ai', name: 'AI Settings' },
    ...(profile?.qrCode ? [{ id: 'qr', name: 'My ID / QR' }] : []),
  ];

  return (
    <div className="page">
      {/* Hero Profile Header */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative shrink-0 group">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-[var(--accent)] shadow-depth">
              {profile.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-[var(--brand-blue)] to-[var(--accent)] flex items-center justify-center text-white text-3xl font-bold">
                  {profile.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              aria-label="Upload profile picture"
              className="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-full bg-[var(--brand-blue)] border-2 border-b-surface2 text-[var(--brand-blue-contrast)] flex items-center justify-center shadow-md hover:opacity-90 transition cursor-pointer disabled:opacity-60"
            >
              <Icon name="camera" size={16} className="fill-current" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileSelect}
            />
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 justify-center sm:justify-start flex-wrap">
              <h1 className="text-h4 text-t-primary">{profile.name}</h1>
              {profile.emailVerified && (
                <span className="label label-green">
                  <Icon name="badge-check" size={14} className="fill-current" /> Verified Email
                </span>
              )}
              <span className="label label-blue uppercase">
                <Icon name="shield" size={14} className="fill-current" />{' '}
                {ROLE_LABELS[profile.role] || profile.role || 'Member'}
              </span>
              {profile.college?.name && (
                <span className="label label-gray">{profile.college.name}</span>
              )}
            </div>

            <p className="text-body-2 text-t-secondary mt-1.5">{profile.email}</p>
            {profile.username && (
              <p className="text-caption text-[var(--brand-blue)] font-mono mt-0.5">
                @{profile.username}
              </p>
            )}

            <div className="flex items-center gap-5 mt-3.5 flex-wrap justify-center sm:justify-start text-caption text-t-tertiary">
              <div className="flex items-center gap-1.5">
                <Icon name="clock" size={14} className="fill-current" />
                Joined{' '}
                {new Date(profile.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
              {profile.lastLogin && (
                <div className="flex items-center gap-1.5">
                  <Icon name="check-circle" size={14} className="fill-current" />
                  Last login {new Date(profile.lastLogin).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs items={TAB_ITEMS} value={tab} setValue={setTab} />

      {/* Tab 1: Personal Info */}
      {tab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
          <Card title="Personal Details">
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
              saving={saving}
              validate={(v) => v.trim().length > 0}
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
              saving={saving}
            />
            <StaticField
              icon="shield"
              label="System Role"
              value={ROLE_LABELS[profile.role] || profile.role || 'Member'}
            />
            {profile.rollNumber && (
              <StaticField
                icon="id-card"
                label="Roll Number / Admission #"
                value={profile.rollNumber}
              />
            )}
            {profile.registrationNumber && (
              <StaticField
                icon="id-card"
                label="Registration Number"
                value={profile.registrationNumber}
              />
            )}
            {profile.class && (
              <StaticField
                icon="graduation-cap"
                label="Class & Section"
                value={profile.class + (profile.section ? ' (' + profile.section + ')' : '')}
              />
            )}
            {profile.group && (
              <StaticField icon="book-open" label="Academic Group" value={profile.group} />
            )}
            <EditableField
              icon="at-sign"
              label="Username"
              value={profile.username ? `@${profile.username}` : ''}
              editKey="username"
              editingField={editingField}
              editValue={editValue}
              setEditValue={setEditValue}
              onStartEdit={(key) => startEdit(key, profile.username || '')}
              onSave={() => saveField('username')}
              onCancel={cancelEdit}
              saving={saving}
              hint="Letters, numbers & underscores only. Use this to log in instead of email."
              validate={(v) => v.length >= 3 && /^[a-zA-Z0-9_]+$/.test(v)}
            />
          </Card>

          <Card title="Account Overview">
            <div className="space-y-4 text-body-2 text-t-secondary">
              <div className="p-4 rounded-3xl bg-b-surface1 border border-s-subtle space-y-2">
                <p className="text-sub-title-1 text-t-primary">
                  {ROLE_LABELS[profile.role] || 'Account Access Level'}
                </p>
                <p className="leading-relaxed text-caption text-t-secondary">
                  {ROLE_DESCRIPTIONS[profile.role] ||
                    'You are logged in with authenticated campus access.'}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between py-2.5 border-b border-s-subtle">
                  <span className="text-caption font-semibold text-t-tertiary">User ID</span>
                  <span className="font-mono text-caption text-t-primary font-bold">
                    {profile._id}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-s-subtle">
                  <span className="text-caption font-semibold text-t-tertiary">
                    Account Created
                  </span>
                  <span className="text-caption font-bold text-t-primary">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-caption font-semibold text-t-tertiary">Last Activity</span>
                  <span className="text-caption font-bold text-t-primary">
                    {profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'Now'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Security */}
      {tab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
          <Card title="Change Password">
            <div className="space-y-4">
              <div>
                <label className="block text-sub-title-2 text-t-primary mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="Enter current password"
                    className="input-field pr-11"
                  />
                  <button
                    type="button"
                    aria-label={showCurrentPw ? 'Hide password' : 'Show password'}
                    onClick={() => setShowCurrentPw((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-t-tertiary hover:text-t-primary"
                  >
                    <Icon
                      name={showCurrentPw ? 'eye-hide' : 'eye'}
                      size={18}
                      className="fill-current"
                    />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sub-title-2 text-t-primary mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Create a strong password"
                    className="input-field pr-11"
                  />
                  <button
                    type="button"
                    aria-label={showNewPw ? 'Hide password' : 'Show password'}
                    onClick={() => setShowNewPw((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-t-tertiary hover:text-t-primary"
                  >
                    <Icon
                      name={showNewPw ? 'eye-hide' : 'eye'}
                      size={18}
                      className="fill-current"
                    />
                  </button>
                </div>

                {newPw.length > 0 && (
                  <div className="mt-2.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-b-surface1 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${pwStrength.color}`}
                          style={{ width: `${(pwStrength.score / 4) * 100}%` }}
                        />
                      </div>
                      <span className="text-caption font-bold text-t-primary">
                        {pwStrength.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {pwRulesPassed.map((rule) => (
                        <div
                          key={rule.id}
                          className={`flex items-center gap-1.5 text-caption font-medium ${
                            rule.passed ? 'text-[var(--brand-green-text)]' : 'text-t-tertiary'
                          }`}
                        >
                          <Icon
                            name={rule.passed ? 'check-circle' : 'info-circle'}
                            size={14}
                            className="shrink-0 fill-current"
                          />
                          {rule.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sub-title-2 text-t-primary mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Repeat new password"
                    className="input-field pr-11"
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                    onClick={() => setShowConfirmPw((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-t-tertiary hover:text-t-primary"
                  >
                    <Icon
                      name={showConfirmPw ? 'eye-hide' : 'eye'}
                      size={18}
                      className="fill-current"
                    />
                  </button>
                </div>
              </div>

              <Button
                isPrimary
                icon="key"
                onClick={handleChangePassword}
                disabled={!pwValid || pwSaving}
              >
                {pwSaving ? 'Changing Password…' : 'Change Password'}
              </Button>
            </div>
          </Card>

          <Card title="Password Requirements & Info">
            <div className="space-y-4 text-caption text-t-secondary">
              <div className="p-4 rounded-3xl bg-b-surface1 border border-s-subtle space-y-2">
                <p className="text-sub-title-2 text-t-primary">Security Best Practices</p>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>Use a combination of upper/lowercase letters, numbers, and symbols.</li>
                  <li>Avoid using predictable patterns or personal information.</li>
                  <li>Ensure your password is unique and not reused across other services.</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Email */}
      {tab === 'email' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
          <Card title="Email Verification">
            <div
              className={`flex items-start gap-3 p-4 rounded-2xl border mb-4 ${
                profile.emailVerified
                  ? 'bg-[var(--brand-green-soft)] border-[var(--brand-green)]/25'
                  : 'bg-[var(--warning-soft)] border-[var(--warning)]/25'
              }`}
            >
              <Icon
                name={profile.emailVerified ? 'badge-check' : 'alert'}
                size={20}
                className={`shrink-0 mt-0.5 fill-current ${
                  profile.emailVerified ? 'text-[var(--brand-green-text)]' : 'text-[var(--warning)]'
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sub-title-2 text-t-primary truncate">{profile.email}</p>
                <p
                  className={`text-caption font-semibold mt-0.5 ${
                    profile.emailVerified
                      ? 'text-[var(--brand-green-text)]'
                      : 'text-[var(--warning)]'
                  }`}
                >
                  {profile.emailVerified ? 'Email is verified' : 'Email is not verified'}
                </p>
              </div>
            </div>

            {!profile.emailVerified && (
              <div className="space-y-4">
                {!codeSent ? (
                  <Button
                    isPrimary
                    icon="mail"
                    onClick={handleSendVerification}
                    disabled={verifySaving || dailySent >= 3}
                  >
                    {verifySaving ? 'Sending…' : 'Send Verification Code'}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="● ● ● ● ● ●"
                        className="input-field w-44 text-center font-mono tracking-widest"
                      />
                      <Button
                        isSecondary
                        icon="check-circle"
                        onClick={handleVerifyEmail}
                        disabled={verifySaving || verifyCode.length !== 6}
                      >
                        Verify
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card title="Change Email Address">
            <div className="space-y-4">
              <div>
                <label className="block text-sub-title-2 text-t-primary mb-2">
                  New Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="newaddress@example.com"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sub-title-2 text-t-primary mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={emailPw}
                  onChange={(e) => setEmailPw(e.target.value)}
                  placeholder="Enter password to confirm"
                  className="input-field"
                />
              </div>
              <Button
                isPrimary
                icon="mail"
                onClick={handleChangeEmail}
                disabled={emailSaving || !newEmail || !emailPw}
              >
                {emailSaving ? 'Updating…' : 'Update Email Address'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: AI Settings */}
      {tab === 'ai' && <ApiKeyManager />}

      {/* Tab 5: My ID / QR Code */}
      {tab === 'qr' && profile.qrCode && (
        <Card className="flex flex-col items-center gap-6 max-w-lg mx-auto text-center">
          <div>
            <h2 className="text-h5 text-t-primary flex items-center justify-center gap-2">
              <Icon name="id-card" size={22} className="fill-[var(--brand-blue)]" />
              Digital Campus ID & QR Code
            </h2>
            <p className="text-caption text-t-secondary mt-1">
              Present this QR code at campus entry gates, scanning terminals, or libraries.
            </p>
          </div>

          <MyQRCode
            value={profile.qrCode}
            name={profile.name}
            subtitle={
              (ROLE_LABELS[profile.role] || profile.role) +
              (profile.rollNumber ? ' • ' + profile.rollNumber : '')
            }
            size={220}
          />
        </Card>
      )}

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
};

export default ProfilePage;
