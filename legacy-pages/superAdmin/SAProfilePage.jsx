'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ApiKeyManager from '../../components/ai/ApiKeyManager';
import { useAuthStore } from '../../store/authStore';
import {
  HiOutlineUser,
  HiOutlineKey,
  HiOutlineMail,
  HiOutlineSparkles,
  HiOutlineBadgeCheck,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineCamera,
  HiOutlinePhone,
  HiOutlineAtSymbol,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlineLockClosed,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle,
  HiOutlineZoomIn,
} from 'react-icons/hi';

// ─── Password Strength Helpers ───────────────────────────────────────────────
const PW_RULES = [
  { id: 'length',   label: 'At least 8 characters',       test: (p) => p.length >= 8 },
  { id: 'upper',    label: 'At least 1 uppercase letter',  test: (p) => /[A-Z]/.test(p) },
  { id: 'number',   label: 'At least 1 number',            test: (p) => /[0-9]/.test(p) },
  { id: 'special',  label: 'At least 1 special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const getPwStrength = (pw) => {
  if (!pw) return { score: 0, label: '', color: '' };
  const passed = PW_RULES.filter((r) => r.test(pw)).length;
  if (passed <= 1) return { score: 1, label: 'Weak',    color: 'bg-rose-500' };
  if (passed === 2) return { score: 2, label: 'Fair',   color: 'bg-amber-500' };
  if (passed === 3) return { score: 3, label: 'Good',   color: 'bg-blue-500' };
  return              { score: 4, label: 'Strong',  color: 'bg-emerald-500' };
};

// ─── Reusable Field Row with inline edit ─────────────────────────────────────
function EditableField({ icon: Icon, label, value, editKey, editingField, editValue, setEditValue, onStartEdit, onSave, onCancel, saving, disabled, hint, validate }) {
  const isEditing = editingField === editKey;

  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-slate-100 dark:border-white/[0.05] last:border-0">
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-slate-500 dark:text-white/40" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mb-0.5">{label}</p>
        {isEditing ? (
          <div className="flex items-center gap-2 mt-1">
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 min-w-0 px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.10] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
            />
            <button
              onClick={onSave}
              disabled={saving || (validate && !validate(editValue))}
              className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40 transition shrink-0 cursor-pointer"
            >
              <HiOutlineCheck size={14} />
            </button>
            <button
              onClick={onCancel}
              className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-white/[0.08] text-slate-600 dark:text-white/60 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-white/[0.12] transition shrink-0 cursor-pointer"
            >
              <HiOutlineX size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{value || <span className="italic text-slate-400 dark:text-white/30 font-normal">Not set</span>}</p>
            {!disabled && (
              <button
                onClick={() => onStartEdit(editKey, value || '')}
                className="w-7 h-7 rounded-lg text-slate-400 dark:text-white/30 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 flex items-center justify-center transition shrink-0 cursor-pointer"
              >
                <HiOutlinePencil size={14} />
              </button>
            )}
          </div>
        )}
        {hint && !isEditing && <p className="text-[11px] text-slate-400 dark:text-white/30 mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

// ─── Static (read-only) Field Row ─────────────────────────────────────────────
function StaticField({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-slate-100 dark:border-white/[0.05] last:border-0">
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-slate-500 dark:text-white/40" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-slate-500 dark:text-white/50">{value || '—'}</p>
      </div>
      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] flex items-center justify-center shrink-0 mt-0.5" title="System-controlled">
        <HiOutlineLockClosed size={12} className="text-slate-400 dark:text-white/20" />
      </div>
    </div>
  );
}

// ─── Section Card wrapper ──────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, children, className = '' }) {
  return (
    <div className={`glass-card p-5 sm:p-6 ${className}`}>
      {title && (
        <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Icon size={16} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Tab Button ──────────────────────────────────────────────────────────────
function TabBtn({ id, label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap border transition-all duration-200 cursor-pointer w-full ${
        active
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
          : 'bg-white dark:bg-white/[0.03] text-slate-600 dark:text-white/50 border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      <Icon size={15} />
      <span>{label}</span>
    </button>
  );
}

// ─── 1:1 Square Crop Modal Component ──────────────────────────────────────────
function ImageSquareCropModal({ imageSrc, onCancel, onSave, uploading }) {
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

    // Fill white/dark background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 500, 500);

    const scale = (zoom * 500) / Math.min(img.naturalWidth, img.naturalHeight || 500);
    const drawWidth = img.naturalWidth * scale;
    const drawHeight = img.naturalHeight * scale;

    const centerX = 250 + offset.x * (500 / 224); // scale factor for canvas resolution
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#0f1721] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <HiOutlineCamera className="text-indigo-600 dark:text-indigo-400" size={20} />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Crop Profile Picture</h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition">
            <HiOutlineX size={18} />
          </button>
        </div>

        {/* Spec info banner */}
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/[0.08] border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
          <HiOutlineInformationCircle size={16} className="shrink-0" />
          <span>Recommended size: <strong>500 × 500 px</strong> (1:1 ratio, Max 2MB)</span>
        </div>

        {/* Interactive Crop Viewport */}
        <div
          className="relative w-56 h-56 mx-auto rounded-2xl overflow-hidden bg-slate-900 border-2 border-indigo-500 shadow-inner flex items-center justify-center cursor-move select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
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
          <div className="absolute inset-0 border border-white/20 rounded-2xl pointer-events-none" />
        </div>

        {/* Zoom Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-white/60">
            <span className="flex items-center gap-1"><HiOutlineZoomIn size={14} /> Zoom</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={uploading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/[0.06] text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCropSave}
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
            ) : (
              <><HiOutlineCheck size={15} /> Crop & Save</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const SAProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('info');

  // Inline edit state
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  // Password form
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // Email verification flow
  const [codeSent, setCodeSent] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifySaving, setVerifySaving] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [dailySent, setDailySent] = useState(0);
  const cooldownRef = useRef(null);

  // Change email
  const [newEmail, setNewEmail] = useState('');
  const [emailPw, setEmailPw] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);

  // Profile picture & Crop modal
  const fileInputRef = useRef(null);
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // ── Fetch Profile ────────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/profile/me');
      setProfile(data.data);
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Cooldown Tick ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(cooldownRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownRef.current);
  }, [cooldown]);

  // ── Inline Edit Helpers ──────────────────────────────────────────────────────
  const startEdit = (field, value) => { setEditingField(field); setEditValue(value); };
  const cancelEdit = () => { setEditingField(null); setEditValue(''); };

  const saveField = async (field) => {
    setSaving(true);
    try {
      if (field === 'username') {
        if (!editValue || editValue.length < 3) return toast.error('Username must be 3+ characters');
        if (!/^[a-zA-Z0-9_]+$/.test(editValue)) return toast.error('Only letters, numbers, and underscores');
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
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  // ── Avatar Image Selection & Crop ─────────────────────────────────────────────
  const { updateUser } = useAuthStore();

  const handleAvatarFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Select a valid image file'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image file must be under 2MB'); return; }

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

  // ── Password Change ──────────────────────────────────────────────────────────
  const pwStrength = getPwStrength(newPw);
  const pwRulesPassed = PW_RULES.map((r) => ({ ...r, passed: r.test(newPw) }));
  const pwValid = pwRulesPassed.every((r) => r.passed) && newPw === confirmPw && currentPw.length > 0;

  const handleChangePassword = async () => {
    if (!pwValid) return;
    setPwSaving(true);
    try {
      await api.put('/profile/password', { currentPassword: currentPw, newPassword: newPw });
      toast.success('Password changed successfully!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    finally { setPwSaving(false); }
  };

  // ── Email Verification ───────────────────────────────────────────────────────
  const handleSendVerification = async () => {
    if (dailySent >= 3) { toast.error('Maximum 3 attempts per day reached'); return; }
    if (cooldown > 0) return;
    setVerifySaving(true);
    try {
      const { data } = await api.post('/profile/email/verify/send');
      toast.success(data.message);
      setCodeSent(true);
      setCooldown(60);
      setDailySent((d) => d + 1);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send code'); }
    finally { setVerifySaving(false); }
  };

  const handleVerifyEmail = async () => {
    if (!verifyCode || verifyCode.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setVerifySaving(true);
    try {
      await api.post('/profile/email/verify', { code: verifyCode });
      toast.success('Email verified successfully!');
      setVerifyCode('');
      setCodeSent(false);
      fetchProfile();
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid or expired code'); }
    finally { setVerifySaving(false); }
  };

  // ── Change Email ─────────────────────────────────────────────────────────────
  const handleChangeEmail = async () => {
    if (!newEmail || !emailPw) return toast.error('Fill all fields');
    setEmailSaving(true);
    try {
      await api.put('/profile/email', { newEmail, password: emailPw });
      toast.success('Email changed. Check new inbox for verification.');
      setNewEmail(''); setEmailPw('');
      fetchProfile();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setEmailSaving(false); }
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-60">
      <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
  if (!profile) return null;

  const TABS = [
    { id: 'info',     label: 'Personal Info', icon: HiOutlineUser },
    { id: 'security', label: 'Security',       icon: HiOutlineKey },
    { id: 'email',    label: 'Email',           icon: HiOutlineMail },
    { id: 'ai',       label: 'AI Settings',    icon: HiOutlineSparkles },
  ];

  return (
    <div className="animate-fade-in w-full space-y-6">

      {/* ─── Hero Profile Header (Full-Width, No Plan UI) ───────────────────── */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

          {/* Avatar with Camera Trigger */}
          <div className="relative shrink-0 group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-indigo-500/30 shadow-lg">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-black">
                  {profile.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-indigo-600 border-2 border-white dark:border-[#0d1117] text-white flex items-center justify-center shadow-md hover:bg-indigo-700 transition cursor-pointer disabled:opacity-60"
              title="Upload profile picture (Recommended: 500x500 px)"
            >
              {avatarUploading
                ? <div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                : <HiOutlineCamera size={15} />
              }
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileSelect}
            />
          </div>

          {/* User Meta Information */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 justify-center sm:justify-start flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">{profile.name}</h1>
              {profile.emailVerified && (
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  <HiOutlineBadgeCheck size={13} /> Verified Email
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
                <HiOutlineShieldCheck size={13} /> Super Administrator
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-white/50 mt-1.5">{profile.email}</p>
            {profile.username && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">@{profile.username}</p>
            )}

            {/* Account Metadata Row */}
            <div className="flex items-center gap-5 mt-3.5 flex-wrap justify-center sm:justify-start">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-white/40">
                <HiOutlineClock size={13} />
                Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              {profile.lastLogin && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-white/40">
                  <HiOutlineCheckCircle size={13} />
                  Last login {new Date(profile.lastLogin).toLocaleString()}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ─── Full-Width Tab Navigation ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
        {TABS.map((t) => (
          <TabBtn key={t.id} id={t.id} label={t.label} icon={t.icon} active={tab === t.id} onClick={setTab} />
        ))}
      </div>

      {/* ─── TAB 1: Personal Info (2 Columns) ─────────────────────────────────── */}
      {tab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          
          {/* Left Column: Editable Details */}
          <SectionCard title="Personal Details" icon={HiOutlineUser}>
            <EditableField
              icon={HiOutlineUser}
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
              icon={HiOutlinePhone}
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
              icon={HiOutlineShieldCheck}
              label="System Role"
              value="Super Administrator"
            />
            <EditableField
              icon={HiOutlineAtSymbol}
              label="Username"
              value={profile.username ? `@${profile.username}` : ''}
              editKey="username"
              editingField={editingField}
              editValue={editValue}
              setEditValue={setEditValue}
              onStartEdit={(key, val) => startEdit(key, profile.username || '')}
              onSave={() => saveField('username')}
              onCancel={cancelEdit}
              saving={saving}
              hint="Letters, numbers & underscores only. Use this to log in instead of email."
              validate={(v) => v.length >= 3 && /^[a-zA-Z0-9_]+$/.test(v)}
            />
          </SectionCard>

          {/* Right Column: Account Metadata & Scope */}
          <SectionCard title="Account Overview" icon={HiOutlineInformationCircle}>
            <div className="space-y-4 text-xs text-slate-600 dark:text-white/70">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] space-y-2">
                <p className="font-bold text-slate-900 dark:text-white text-sm">System Access Level</p>
                <p className="leading-relaxed text-slate-500 dark:text-white/50">
                  You are logged in as a <strong>Super Administrator</strong>. This account possesses global access to college management, analytics, system subscriptions, and platform configuration.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/[0.05]">
                  <span className="font-semibold text-slate-500 dark:text-white/40">User ID</span>
                  <span className="font-mono text-slate-900 dark:text-white font-bold">{profile._id}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/[0.05]">
                  <span className="font-semibold text-slate-500 dark:text-white/40">Account Created</span>
                  <span className="font-bold text-slate-900 dark:text-white">{new Date(profile.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/[0.05]">
                  <span className="font-semibold text-slate-500 dark:text-white/40">Last Activity</span>
                  <span className="font-bold text-slate-900 dark:text-white">{profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'Now'}</span>
                </div>
              </div>
            </div>
          </SectionCard>

        </div>
      )}

      {/* ─── TAB 2: Security (2 Columns) ──────────────────────────────────────── */}
      {tab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          
          {/* Left Column: Change Password Form */}
          <SectionCard title="Change Password" icon={HiOutlineKey}>
            <div className="space-y-4">

              {/* Current Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mb-1.5">Current Password</label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none" size={15} />
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition cursor-pointer"
                  >
                    {showCurrentPw ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password + Strength */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mb-1.5">New Password</label>
                <div className="relative">
                  <HiOutlineKey className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none" size={15} />
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition cursor-pointer"
                  >
                    {showNewPw ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                  </button>
                </div>

                {/* Strength Bar */}
                {newPw.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-white/[0.08] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${pwStrength.color}`}
                          style={{ width: `${(pwStrength.score / 4) * 100}%` }}
                        />
                      </div>
                      <span className={`text-[11px] font-bold ${
                        pwStrength.score <= 1 ? 'text-rose-500' :
                        pwStrength.score === 2 ? 'text-amber-500' :
                        pwStrength.score === 3 ? 'text-blue-500' : 'text-emerald-500'
                      }`}>{pwStrength.label}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1">
                      {pwRulesPassed.map((rule) => (
                        <div key={rule.id} className={`flex items-center gap-1.5 text-[11px] font-medium ${rule.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-white/30'}`}>
                          {rule.passed
                            ? <HiOutlineCheckCircle size={13} className="shrink-0" />
                            : <HiOutlineExclamationCircle size={13} className="shrink-0" />
                          }
                          {rule.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <HiOutlineKey className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none" size={15} />
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Repeat new password"
                    className={`w-full pl-9 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-white/[0.04] border text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${
                      confirmPw && newPw !== confirmPw
                        ? 'border-rose-400 dark:border-rose-500/50 focus:ring-rose-500/30'
                        : confirmPw && newPw === confirmPw
                        ? 'border-emerald-400 dark:border-emerald-500/50 focus:ring-emerald-500/30'
                        : 'border-slate-200 dark:border-white/[0.08] focus:border-indigo-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition cursor-pointer"
                  >
                    {showConfirmPw ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                  </button>
                </div>
                {confirmPw && newPw !== confirmPw && (
                  <p className="mt-1.5 text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1">
                    <HiOutlineExclamationCircle size={12} /> Passwords do not match
                  </p>
                )}
                {confirmPw && newPw === confirmPw && newPw.length > 0 && (
                  <p className="mt-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <HiOutlineCheckCircle size={12} /> Passwords match
                  </p>
                )}
              </div>

              <button
                onClick={handleChangePassword}
                disabled={!pwValid || pwSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm mt-2"
              >
                {pwSaving
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Changing Password…</>
                  : <><HiOutlineKey size={15} /> Change Password</>
                }
              </button>
            </div>
          </SectionCard>

          {/* Right Column: Password Guidelines & Security Summary */}
          <SectionCard title="Password Requirements & Info" icon={HiOutlineShieldCheck}>
            <div className="space-y-4 text-xs text-slate-600 dark:text-white/70">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] space-y-2">
                <p className="font-bold text-slate-900 dark:text-white text-sm">Security Best Practices</p>
                <ul className="space-y-1.5 text-slate-500 dark:text-white/50 list-disc list-inside">
                  <li>Use a combination of upper/lowercase letters, numbers, and symbols.</li>
                  <li>Avoid using predictable patterns or personal information.</li>
                  <li>Ensure your password is unique and not reused across other services.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/[0.05] border border-indigo-100 dark:border-indigo-500/10 space-y-2">
                <p className="font-bold text-indigo-900 dark:text-indigo-300 text-xs flex items-center gap-1.5">
                  <HiOutlineInformationCircle size={14} /> Account Status
                </p>
                <div className="space-y-1 text-indigo-700/80 dark:text-indigo-400/80 text-[11px]">
                  <p>• Super Admin account credentials are encrypted with bcrypt.</p>
                  <p>• Last login recorded: {profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'Active now'}</p>
                </div>
              </div>
            </div>
          </SectionCard>

        </div>
      )}

      {/* ─── TAB 3: Email (2 Columns) ─────────────────────────────────────────── */}
      {tab === 'email' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          
          {/* Left Column: Email Verification Card */}
          <SectionCard title="Email Verification" icon={HiOutlineMail}>
            <div className={`flex items-start gap-3 p-4 rounded-xl border mb-4 transition-colors ${
              profile.emailVerified
                ? 'bg-emerald-50 dark:bg-emerald-500/[0.06] border-emerald-200 dark:border-emerald-500/20'
                : 'bg-amber-50 dark:bg-amber-500/[0.06] border-amber-200 dark:border-amber-500/20'
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                profile.emailVerified
                  ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}>
                {profile.emailVerified ? <HiOutlineBadgeCheck size={18} /> : <HiOutlineExclamationCircle size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{profile.email}</p>
                <p className={`text-xs font-semibold mt-0.5 ${
                  profile.emailVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-500'
                }`}>
                  {profile.emailVerified ? 'Email is verified' : 'Email is not verified'}
                </p>
              </div>
            </div>

            {!profile.emailVerified && (
              <div className="space-y-4">
                {!codeSent ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 dark:text-white/60">
                      Click below to send a 6-digit verification code to your email.
                      {dailySent > 0 && (
                        <span className="block mt-1 text-amber-600 dark:text-amber-400 font-semibold">
                          Attempts today: {dailySent}/3
                        </span>
                      )}
                    </p>
                    <button
                      onClick={handleSendVerification}
                      disabled={verifySaving || dailySent >= 3}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                    >
                      {verifySaving
                        ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                        : <><HiOutlineMail size={15} /> Send Verification Code</>
                      }
                    </button>
                    {dailySent >= 3 && (
                      <p className="text-xs text-rose-500 dark:text-rose-400 flex items-center gap-1">
                        <HiOutlineExclamationCircle size={13} /> Maximum 3 attempts per day reached. Try again tomorrow.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/[0.08] border border-indigo-200 dark:border-indigo-500/20">
                      <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                        <HiOutlineMail size={13} /> Code sent to {profile.email}
                      </p>
                      <p className="text-[11px] text-indigo-600/70 dark:text-indigo-400/70 mt-0.5">
                        Check your inbox. Code expires in 10 minutes.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mb-1.5">6-Digit Code</label>
                      <div className="flex items-center gap-3 flex-wrap">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={verifyCode}
                          onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="● ● ● ● ● ●"
                          className="w-40 px-3 py-2 text-center text-lg font-black tracking-[0.4em] rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                        />
                        <button
                          onClick={handleVerifyEmail}
                          disabled={verifySaving || verifyCode.length !== 6}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {verifySaving
                            ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <HiOutlineCheckCircle size={15} />
                          }
                          Verify
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap pt-1">
                      <button
                        onClick={handleSendVerification}
                        disabled={cooldown > 0 || dailySent >= 3 || verifySaving}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                      >
                        <HiOutlineRefresh size={13} />
                        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                      </button>
                      <span className="text-[11px] text-slate-400 dark:text-white/30">
                        Attempts today: {dailySent}/3
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {profile.emailVerified && (
              <p className="text-xs text-slate-500 dark:text-white/40">
                Your email address is verified. System notifications will be sent here.
              </p>
            )}
          </SectionCard>

          {/* Right Column: Change Email Address Card */}
          <SectionCard title="Change Email Address" icon={HiOutlineMail}>
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-white/50 leading-relaxed">
                Enter your new email address and current password to update your email. A verification link/code will be sent to the new email address.
              </p>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mb-1.5">New Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="newaddress@example.com"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={emailPw}
                  onChange={(e) => setEmailPw(e.target.value)}
                  placeholder="Enter password to confirm"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                />
              </div>
              <button
                onClick={handleChangeEmail}
                disabled={emailSaving || !newEmail || !emailPw}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm mt-1"
              >
                {emailSaving
                  ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating…</>
                  : <><HiOutlineMail size={15} /> Update Email Address</>
                }
              </button>
            </div>
          </SectionCard>

        </div>
      )}

      {/* ─── TAB 4: AI Settings (Full-Width, No Plan Card) ───────────────────── */}
      {tab === 'ai' && (
        <div className="w-full space-y-5">
          <ApiKeyManager />
        </div>
      )}

      {/* ─── Crop Modal ───────────────────────────────────────────────────────── */}
      {isCropOpen && rawImageSrc && (
        <ImageSquareCropModal
          imageSrc={rawImageSrc}
          onCancel={() => { setIsCropOpen(false); setRawImageSrc(null); }}
          onSave={handleCroppedAvatarSave}
          uploading={avatarUploading}
        />
      )}

      {/* ─── Footer Details ────────────────────────────────────────────────────── */}
      <div className="glass-card px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-white/30">
        <div className="flex items-center gap-4 flex-wrap">
          <span>User ID: <code className="font-mono text-[10px] text-slate-600 dark:text-white/40">{profile._id}</code></span>
          <span>Joined: {new Date(profile.createdAt).toLocaleDateString()}</span>
        </div>
        {profile.lastLogin && <span>Last login: {new Date(profile.lastLogin).toLocaleString()}</span>}
      </div>

    </div>
  );
};

export default SAProfilePage;
