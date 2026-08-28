import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import MyQRCode from '../../components/common/MyQRCode';
import ApiKeyManager from '../../components/ai/ApiKeyManager';
import { HiOutlineUser, HiOutlineKey, HiOutlineMail, HiOutlineShieldCheck, HiOutlineSparkles, HiOutlineBadgeCheck, HiOutlineEye, HiOutlineEyeOff, HiOutlineIdentification } from 'react-icons/hi';

const lbl = { fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 };
const planColors = { basic: '#94a3b8', standard: '#60a5fa', premium: '#a78bfa', enterprise: '#fbbf24' };

const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('info');

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPw, setEmailPw] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/profile/me');
      setProfile(data.data);
      setName(data.data.name || '');
      setPhone(data.data.phone || '');
      setUsername(data.data.username || '');
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  };

  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      await api.put('/profile/me', { name, phone });
      toast.success('Profile updated');
      fetchProfile();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleSetUsername = async () => {
    if (!username || username.length < 3) return toast.error('Username must be 3+ characters');
    setSaving(true);
    try {
      await api.put('/profile/username', { username });
      toast.success('Username set!');
      fetchProfile();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) return toast.error('Fill all fields');
    if (newPw.length < 6) return toast.error('Min 6 characters');
    if (newPw !== confirmPw) return toast.error('Passwords don\'t match');
    setSaving(true);
    try {
      await api.put('/profile/password', { currentPassword: currentPw, newPassword: newPw });
      toast.success('Password changed!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleSendVerification = async () => {
    setSaving(true);
    try {
      const { data } = await api.post('/profile/email/verify/send');
      toast.success(data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleVerifyEmail = async () => {
    if (!verifyCode) return toast.error('Enter the code');
    setSaving(true);
    try {
      await api.post('/profile/email/verify', { code: verifyCode });
      toast.success('Email verified! ✅');
      setVerifyCode('');
      fetchProfile();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !emailPw) return toast.error('Fill all fields');
    setSaving(true);
    try {
      await api.put('/profile/email', { newEmail, password: emailPw });
      toast.success('Email changed. Check new email for verification.');
      setNewEmail(''); setEmailPw('');
      fetchProfile();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}><div className="animate-spin" style={{ width: 32, height: 32, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} /></div>;
  if (!profile) return null;

  const tabs = [
    { id: 'info', label: 'Profile', icon: <HiOutlineUser size={14} /> },
    { id: 'security', label: 'Security', icon: <HiOutlineKey size={14} /> },
    { id: 'email', label: 'Email', icon: <HiOutlineMail size={14} /> },
    { id: 'ai', label: 'AI Settings', icon: <HiOutlineSparkles size={14} /> },
    { id: 'qr', label: 'My QR Code', icon: <HiOutlineIdentification size={14} /> },
  ];

  const planColor = planColors[profile.planInfo?.plan] || '#94a3b8';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Card */}
      <div className="glass-card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color:'var(--text-primary)', flexShrink: 0 }}>
          {profile.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{profile.name}</h1>
            {profile.emailVerified && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 4, background: 'rgba(74,222,128,0.12)', color: '#4ade80', fontSize: 9, fontWeight: 700 }}><HiOutlineBadgeCheck size={12} /> VERIFIED</span>}
            <span style={{ padding: '2px 10px', borderRadius: 4, background: `${planColor}15`, color: planColor, fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>⭐ {profile.planInfo?.name}</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{profile.email} • {profile.role}</p>
          {profile.username && <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>@{profile.username}</p>}
        </div>
        {profile.qrCode && tab !== 'qr' && (
          <div style={{ padding: 8, background: '#fff', borderRadius: 8, flexShrink: 0 }}>
            <MyQRCode value={profile.qrCode} size={60} />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
            border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            background: tab === t.id ? 'rgba(99,102,241,0.1)' : 'transparent',
            color: tab === t.id ? '#818cf8' : 'var(--text-secondary)',
            borderColor: tab === t.id ? 'rgba(99,102,241,0.2)' : 'var(--border-color)'
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'info' && (
        <div className="glass-card" style={{ padding: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>👤 Personal Information</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div><label style={lbl}>Full Name</label><input value={name} onChange={e => setName(e.target.value)} className="form-input" /></div>
            <div><label style={lbl}>Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} className="form-input" placeholder="+92..." /></div>
            <div><label style={lbl}>Role</label><input value={profile.role} disabled className="form-input" style={{ opacity: 0.5 }} /></div>
            {profile.rollNumber && <div><label style={lbl}>Roll Number</label><input value={profile.rollNumber} disabled className="form-input" style={{ opacity: 0.5 }} /></div>}
            {profile.registrationNumber && <div><label style={lbl}>Reg. Number</label><input value={profile.registrationNumber} disabled className="form-input" style={{ opacity: 0.5 }} /></div>}
            {profile.class && <div><label style={lbl}>Class</label><input value={`${profile.class} ${profile.section || ''}`} disabled className="form-input" style={{ opacity: 0.5 }} /></div>}
            {profile.employeeCode && <div><label style={lbl}>Employee Code</label><input value={profile.employeeCode} disabled className="form-input" style={{ opacity: 0.5 }} /></div>}
          </div>
          <div style={{ marginTop: 20 }}>
            <label style={lbl}>Username (for easy login)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={username} onChange={e => setUsername(e.target.value)} className="form-input" placeholder="Set a unique username..." style={{ flex: 1 }} />
              <button onClick={handleSetUsername} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color:'var(--text-primary)', fontWeight: 600, fontSize: 11, border: 'none', cursor: 'pointer' }}>Set</button>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>Letters, numbers & underscores only. You can login with this instead of email.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button onClick={handleSaveInfo} disabled={saving} style={{ padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color:'var(--text-primary)', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="glass-card" style={{ padding: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>🔐 Change Password</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
            <div>
              <label style={lbl}>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)} className="form-input" />
                <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                  {showPw ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                </button>
              </div>
            </div>
            <div><label style={lbl}>New Password</label><input type={showPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} className="form-input" placeholder="Min 6 characters" /></div>
            <div><label style={lbl}>Confirm New Password</label><input type={showPw ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="form-input" /></div>
            <button onClick={handleChangePassword} disabled={saving} style={{ padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #ef4444, #f87171)', color:'var(--text-primary)', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', alignSelf: 'flex-start' }}>{saving ? '...' : 'Change Password'}</button>
          </div>
        </div>
      )}

      {tab === 'email' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email Verification Status */}
          <div className="glass-card" style={{ padding: 20, borderLeft: `4px solid ${profile.emailVerified ? '#4ade80' : '#fbbf24'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>📧 Email: {profile.email}</p>
                <p style={{ fontSize: 12, color: profile.emailVerified ? '#4ade80' : '#fbbf24', fontWeight: 600, marginTop: 4 }}>
                  {profile.emailVerified ? '✅ Email Verified' : '⚠️ Email Not Verified'}
                </p>
              </div>
              {!profile.emailVerified && (
                <button onClick={handleSendVerification} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color:'var(--text-primary)', fontWeight: 600, fontSize: 11, border: 'none', cursor: 'pointer' }}>
                  {saving ? '...' : 'Send Verification Code'}
                </button>
              )}
            </div>
            {!profile.emailVerified && (
              <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
                <input value={verifyCode} onChange={e => setVerifyCode(e.target.value)} placeholder="Enter 6-digit code" className="form-input" style={{ width: 180, fontSize: 18, letterSpacing: 4, textAlign: 'center', fontWeight: 700 }} maxLength={6} />
                <button onClick={handleVerifyEmail} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, background: '#22c55e', color:'var(--text-primary)', fontWeight: 600, fontSize: 11, border: 'none', cursor: 'pointer' }}>Verify</button>
              </div>
            )}
          </div>

          {/* Change Email */}
          <div className="glass-card" style={{ padding: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>📬 Change Email</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
              <div><label style={lbl}>New Email</label><input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="form-input" placeholder="newemail@example.com" /></div>
              <div><label style={lbl}>Current Password (for verification)</label><input type="password" value={emailPw} onChange={e => setEmailPw(e.target.value)} className="form-input" /></div>
              <button onClick={handleChangeEmail} disabled={saving} style={{ padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color:'var(--text-primary)', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', alignSelf: 'flex-start' }}>{saving ? '...' : 'Change Email'}</button>
              <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>A verification code will be sent to the new email.</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'ai' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Per-user AI API Key Manager */}
          <ApiKeyManager />

          {/* Plan Badge */}
          <div className="glass-card" style={{ padding: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>⭐ Your Plan</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: `${planColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                {profile.planInfo?.plan === 'premium' ? '💎' : profile.planInfo?.plan === 'enterprise' ? '🏢' : profile.planInfo?.plan === 'standard' ? '🌟' : '📦'}
              </div>
              <div>
                <p style={{ fontSize: 20, fontWeight: 800, color: planColor }}>{profile.planInfo?.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {profile.planInfo?.plan === 'premium' ? 'All features unlocked including AI' : profile.planInfo?.plan === 'standard' ? 'Core features + limited AI' : 'Basic features included'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'qr' && (
        <div className="glass-card" style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>📱 My ID Card</p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>Show this QR code at the gate for entry / exit</p>
          </div>
          {profile.qrCode ? (
            <MyQRCode value={profile.qrCode} name={profile.name} subtitle={`${profile.role}${profile.rollNumber ? ' • ' + profile.rollNumber : ''}`} size={200} />
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No QR code assigned to your account yet.</p>
          )}
          <div className="glass-card" style={{ padding: 16, maxWidth: 400, width: '100%' }}>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <b>Instructions:</b><br />
              • Show this QR to the security guard when entering / exiting the campus<br />
              • Your attendance is automatically marked when you scan at entry<br />
              • For early exit, request approval from the principal first<br />
              • Keep your physical ID card with this QR code at all times
            </p>
          </div>
        </div>
      )}

      {/* Account Info */}
      <div className="glass-card" style={{ padding: 16, display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-tertiary)' }}>
        <span>Joined: {new Date(profile.createdAt).toLocaleDateString()}</span>
        <span>Last Login: {profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : '—'}</span>
        <span>User ID: <code style={{ fontSize: 10 }}>{profile._id}</code></span>
      </div>
    </div>
  );
};

export default ProfilePage;
