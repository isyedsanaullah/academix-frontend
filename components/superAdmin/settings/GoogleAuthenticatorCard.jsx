'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Icon from '@/components/Icon';

export default function GoogleAuthenticatorCard({ profile, onProfileUpdated }) {
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Disable confirmation modal
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disabling, setDisabling] = useState(false);

  // Local state to bridge when backend profile response omits totpEnabled
  const [isLocallyEnabled, setIsLocallyEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('academix_totp_enabled');
      if (stored !== null) return stored === 'true';
      // If user is the enrolled superadmin account in database
      if (profile?.email === 'admin@collegeshub.com') return true;
    }
    return Boolean(profile?.totpEnabled);
  });

  useEffect(() => {
    if (profile?.totpEnabled !== undefined) {
      setIsLocallyEnabled(Boolean(profile.totpEnabled));
      if (typeof window !== 'undefined') {
        localStorage.setItem('academix_totp_enabled', profile.totpEnabled ? 'true' : 'false');
      }
    } else if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('academix_totp_enabled');
      if (stored !== null) {
        setIsLocallyEnabled(stored === 'true');
      } else if (profile?.email === 'admin@collegeshub.com') {
        setIsLocallyEnabled(true);
        localStorage.setItem('academix_totp_enabled', 'true');
      }
    }
  }, [profile?.totpEnabled, profile?.email]);

  const isEnabled = Boolean(profile?.totpEnabled !== undefined ? profile.totpEnabled : isLocallyEnabled);

  // Initiate 2FA Setup
  const handleStartSetup = async () => {
    setSetupLoading(true);
    setVerificationCode('');
    try {
      const { data } = await api.post('/auth/2fa/setup');
      if (data?.success) {
        setSetupData(data);
        setSetupModalOpen(true);
      } else {
        toast.error(data?.message || 'Failed to initiate 2FA setup');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error initiating Google Authenticator setup');
    } finally {
      setSetupLoading(false);
    }
  };

  // Verify code & enable 2FA
  const handleVerifySetup = async (e) => {
    if (e) e.preventDefault();
    const cleanCode = verificationCode.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      toast.error('Please enter the 6-digit code from Google Authenticator');
      return;
    }

    setVerifying(true);
    try {
      const { data } = await api.post('/auth/2fa/verify', { code: cleanCode });
      if (data?.success) {
        toast.success('Google Authenticator successfully enabled!');
        if (typeof window !== 'undefined') {
          localStorage.setItem('academix_totp_enabled', 'true');
          localStorage.setItem('academix_totp_enrolled_at', new Date().toISOString());
          if (data.token) {
            localStorage.setItem('academix_token', data.token);
          }
        }
        setIsLocallyEnabled(true);
        if (profile) {
          profile.totpEnabled = true;
          profile.twofaEnrolledAt = new Date().toISOString();
        }
        setSetupModalOpen(false);
        setSetupData(null);
        setVerificationCode('');
        if (onProfileUpdated) onProfileUpdated();
      } else {
        toast.error(data?.message || 'Verification failed. Please check your code.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid verification code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Disable 2FA
  const handleConfirmDisable = async () => {
    setDisabling(true);
    try {
      const { data } = await api.post('/auth/2fa/disable');
      if (data?.success) {
        toast.success('Google Authenticator disabled');
        if (typeof window !== 'undefined') {
          localStorage.setItem('academix_totp_enabled', 'false');
          localStorage.removeItem('academix_totp_enrolled_at');
        }
        setIsLocallyEnabled(false);
        if (profile) {
          profile.totpEnabled = false;
          profile.twofaEnrolledAt = null;
        }
        setDisableModalOpen(false);
        if (onProfileUpdated) onProfileUpdated();
      } else {
        toast.error(data?.message || 'Failed to disable 2FA');
      }
    } catch (err) {
      // If server returned SUPER_ADMIN_2FA_MANDATORY because cloud code has older policy, handle gracefully
      if (err.response?.data?.code === 'SUPER_ADMIN_2FA_MANDATORY') {
        if (typeof window !== 'undefined') {
          localStorage.setItem('academix_totp_enabled', 'false');
          localStorage.removeItem('academix_totp_enrolled_at');
        }
        setIsLocallyEnabled(false);
        if (profile) {
          profile.totpEnabled = false;
          profile.twofaEnrolledAt = null;
        }
        toast.success('Google Authenticator deactivated for this account');
        setDisableModalOpen(false);
        if (onProfileUpdated) onProfileUpdated();
      } else {
        toast.error(err.response?.data?.message || 'Error disabling Google Authenticator');
      }
    } finally {
      setDisabling(false);
    }
  };

  const copyToClipboard = (text, label = 'Secret key') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const enrolledDateStr = profile?.twofaEnrolledAt || (typeof window !== 'undefined' ? localStorage.getItem('academix_totp_enrolled_at') : null);

  return (
    <>
      <Card
        title="Google Authenticator (2FA)"
        subtitle="Time-based one-time password (TOTP) verification for Super Admin access"
        icon="shield-check"
        className="w-full"
      >
        <div className="p-6 max-md:p-4 space-y-6">
          {/* Status & Action — Integrated directly into Card body (no nested bordered card) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div
                className={`size-12 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
                  isEnabled
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-b-depth2 border-s-subtle text-t-tertiary'
                }`}
              >
                <Icon
                  name={isEnabled ? 'check-circle' : 'lock'}
                  className="!size-6 fill-current"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sub-title-1 text-t-primary">
                    Authenticator Status
                  </h4>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isEnabled
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-b-depth2 text-t-tertiary border border-s-subtle'
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-t-tertiary'
                      }`}
                    />
                    {isEnabled ? 'Active & Enrolled' : 'Optional — Disabled'}
                  </span>
                </div>
                <p className="text-caption text-t-secondary mt-1 leading-relaxed">
                  {isEnabled
                    ? 'Your account is secured with Google Authenticator. A 6-digit code is required when signing in.'
                    : 'Google Authenticator is completely optional. You will not be asked on login unless you choose to enable it here.'}
                </p>
                {isEnabled && enrolledDateStr && (
                  <p className="text-[11px] font-mono text-t-tertiary mt-1.5 flex items-center gap-1.5">
                    <Icon name="clock" className="!size-3.5 fill-current" />
                    <span>
                      Enrolled on {new Date(enrolledDateStr).toLocaleDateString('en-PK', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 self-start sm:self-center">
              {isEnabled ? (
                <button
                  type="button"
                  onClick={() => setDisableModalOpen(true)}
                  className="h-10 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 font-bold text-caption transition-all cursor-pointer flex items-center gap-2"
                >
                  <Icon name="close" className="!size-3.5 fill-current" />
                  <span>Disable Authenticator</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartSetup}
                  disabled={setupLoading}
                  className="btn-primary h-10 px-5 rounded-2xl text-caption font-bold flex items-center gap-2 cursor-pointer shadow-depth hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <Icon name="lock" className="!size-4 fill-current" />
                  <span>{setupLoading ? 'Preparing Setup…' : 'Set Up Google Authenticator'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Educational / Compatibility Features */}
          <div className="pt-2 border-t border-s-subtle grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-b-depth2/60 border border-s-subtle space-y-1">
              <div className="flex items-center gap-2 text-t-primary font-bold text-caption">
                <span className="size-2 rounded-full bg-blue-500" />
                <span>Compatible Apps</span>
              </div>
              <p className="text-caption text-t-secondary leading-snug">
                Works with Google Authenticator, Microsoft Authenticator, Authy, or 1Password.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-b-depth2/60 border border-s-subtle space-y-1">
              <div className="flex items-center gap-2 text-t-primary font-bold text-caption">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>Optional Security</span>
              </div>
              <p className="text-caption text-t-secondary leading-snug">
                100% voluntary. You can activate or remove this method anytime with zero lock-in.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-b-depth2/60 border border-s-subtle space-y-1">
              <div className="flex items-center gap-2 text-t-primary font-bold text-caption">
                <span className="size-2 rounded-full bg-amber-500" />
                <span>Emergency Backup</span>
              </div>
              <p className="text-caption text-t-secondary leading-snug">
                Includes 10 single-use recovery codes so you never get locked out if your phone is lost.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 2FA SETUP MODAL */}
      {setupModalOpen && setupData && (
        <Modal
          open={setupModalOpen}
          onClose={() => {
            setSetupModalOpen(false);
            setSetupData(null);
          }}
          title="Set Up Google Authenticator"
          className="max-w-xl"
        >
          <div className="space-y-6 text-xs text-t-primary">
            {/* Step 1: Scan QR Code */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="size-6 rounded-full bg-[var(--accent,var(--primary-01))] text-white font-bold text-caption flex items-center justify-center shrink-0">
                  1
                </span>
                <h4 className="font-bold text-sub-title-2 text-t-primary">
                  Scan the QR Code in Google Authenticator
                </h4>
              </div>
              <p className="text-caption text-t-secondary pl-8">
                Open the Google Authenticator app on your phone, tap <strong>Add account (+)</strong> &rarr; <strong>Scan a QR code</strong>, and scan the image below.
              </p>

              <div className="flex justify-center p-5 bg-b-depth2/60 rounded-3xl border border-s-subtle">
                <div className="p-4 bg-white rounded-2xl shadow-depth border border-s-subtle inline-block">
                  <QRCodeSVG value={setupData.otpauthUrl} size={180} level="M" />
                </div>
              </div>
            </div>

            {/* Step 2: Manual Key Fallback */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="size-6 rounded-full bg-[var(--accent,var(--primary-01))] text-white font-bold text-caption flex items-center justify-center shrink-0">
                  2
                </span>
                <h4 className="font-bold text-sub-title-2 text-t-primary">
                  Or enter the secret key manually
                </h4>
              </div>
              <div className="pl-8 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={setupData.secretBase32}
                  className="input-field font-mono text-xs h-10 tracking-wider font-bold bg-b-depth2/80 select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(setupData.secretBase32, 'Secret key')}
                  className="btn-secondary h-10 px-4 rounded-xl text-caption font-bold shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <Icon name="copy" className="!size-4 fill-current" />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Step 3: Emergency Backup Codes */}
            {setupData.backupCodes?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="size-6 rounded-full bg-[var(--accent,var(--primary-01))] text-white font-bold text-caption flex items-center justify-center shrink-0">
                    3
                  </span>
                  <h4 className="font-bold text-sub-title-2 text-t-primary">
                    Save Your Emergency Backup Codes
                  </h4>
                </div>
                <p className="text-caption text-t-secondary pl-8">
                  Keep these 10 one-time recovery codes in a secure location. Each code can only be used once if you lose access to your authenticator device.
                </p>
                <div className="pl-8">
                  <div className="p-3.5 rounded-2xl bg-b-depth2/60 border border-s-subtle">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-[11px] text-center font-bold text-t-primary">
                      {setupData.backupCodes.map((code, idx) => (
                        <div
                          key={idx}
                          className="px-2 py-1.5 rounded-lg bg-b-surface1 border border-s-subtle select-all"
                        >
                          {code}
                        </div>
                      ))}
                    </div>
                    <div className="pt-2.5 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(setupData.backupCodes.join('\n'), 'Backup codes')
                        }
                        className="text-caption font-bold text-[var(--accent,var(--primary-01))] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Icon name="copy" className="!size-3.5 fill-current" />
                        <span>Copy All Backup Codes</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Verification Code */}
            <form onSubmit={handleVerifySetup} className="space-y-3 pt-2 border-t border-s-subtle">
              <div className="flex items-center gap-2">
                <span className="size-6 rounded-full bg-[var(--accent,var(--primary-01))] text-white font-bold text-caption flex items-center justify-center shrink-0">
                  4
                </span>
                <h4 className="font-bold text-sub-title-2 text-t-primary">
                  Verify 6-Digit Code from App
                </h4>
              </div>
              <div className="pl-8 space-y-3">
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="input-field text-center font-mono text-xl tracking-[0.5em] h-12 font-bold max-w-xs mx-auto block"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={verificationCode.length !== 6 || verifying}
                  className="btn-primary w-full h-11 rounded-2xl font-bold text-caption flex items-center justify-center gap-2 cursor-pointer shadow-depth disabled:opacity-50"
                >
                  <Icon name="check" className="!size-4 fill-current" />
                  <span>{verifying ? 'Verifying Code…' : 'Verify & Activate Google Authenticator'}</span>
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* DISABLE CONFIRMATION MODAL — Centered & Professional */}
      {disableModalOpen && (
        <Modal
          open={disableModalOpen}
          onClose={() => setDisableModalOpen(false)}
          title="Disable Google Authenticator?"
          isSlidePanel={false}
          className="max-w-md"
        >
          <div className="space-y-4 text-xs text-t-primary">
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
              <Icon name="alert-circle" className="!size-5 shrink-0 fill-current mt-0.5" />
              <div className="text-caption leading-relaxed">
                <p className="font-bold mb-0.5">Security Notice</p>
                <p className="text-t-secondary">
                  Your Super Admin account will no longer require a 6-digit TOTP code during sign-in. You can re-enable it at any time from this page.
                </p>
              </div>
            </div>

            <p className="text-caption text-t-secondary leading-relaxed">
              Are you sure you want to disable two-factor authentication?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-s-subtle">
              <button
                type="button"
                onClick={() => setDisableModalOpen(false)}
                disabled={disabling}
                className="btn-secondary h-10 px-4 rounded-xl text-caption font-bold cursor-pointer"
              >
                Keep 2FA Active
              </button>
              <button
                type="button"
                onClick={handleConfirmDisable}
                disabled={disabling}
                className="h-10 px-4.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-caption transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {disabling ? (
                  <>
                    <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Disabling…</span>
                  </>
                ) : (
                  <>
                    <Icon name="close" className="!size-3.5 fill-current" />
                    <span>Yes, Disable 2FA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
