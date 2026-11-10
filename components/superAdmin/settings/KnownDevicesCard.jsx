'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Icon from '@/components/Icon';

/* ── SVG Icons for Recognizable Browsers & Operating Systems ── */
function BrowserIcon({ name, className = 'size-5' }) {
  const n = (name || '').toLowerCase();

  if (n.includes('chrome')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 2.5l6.5 11.25M12 21.5l6.5-11.25M2.5 12h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (n.includes('edge')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19.5 15.5c-.8 2.5-3 4.5-6.5 4.5-4.5 0-8-3.5-8-8 0-4.5 3.5-8 8-8 2.5 0 4.5 1 5.5 2.5" />
        <path d="M12 8c2.5 0 4.5 1.5 4.5 4s-2 4-4.5 4-4.5-1.5-4.5-4" />
      </svg>
    );
  }

  if (n.includes('firefox')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 3a9 9 0 0 1 7.8 13.5c-1.5-1.5-2.8-2.5-4.8-2.5-2.5 0-4 2-3 4.5-3-1-4.5-3.5-4.5-6.5a7 7 0 0 1 7-7z" fill="currentColor" fillOpacity="0.2" />
      </svg>
    );
  }

  if (n.includes('safari')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9.5" />
        <polygon points="15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5 15.5 8.5" fill="currentColor" fillOpacity="0.25" />
      </svg>
    );
  }

  // Fallback Web Browser / Monitor icon
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M2.5 12h19M12 2.5a15 15 0 0 1 0 19M12 2.5a15 15 0 0 0 0 19" />
    </svg>
  );
}

function OsBadgeIcon({ os, className = 'size-3.5' }) {
  const o = (os || '').toLowerCase();

  if (o.includes('windows')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 5.5l7-1v6.5H3V5.5zm8-1.15l10-1.35v9H11V4.35zM3 13h7v6.5l-7-1V13zm8 0h10v9l-10-1.4V13z" />
      </svg>
    );
  }

  if (o.includes('mac') || o.includes('ios') || o.includes('iphone') || o.includes('ipad') || o.includes('apple')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.57.65-.99 1.72-.88 2.74 1.01.08 2.03-.53 2.58-1.24z" />
      </svg>
    );
  }

  if (o.includes('android')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v6c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-6C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-6c0-.83-.67-1.5-1.5-1.5zm-4.97-5.59l1.24-1.24c.2-.2.2-.51 0-.71a.495.495 0 0 0-.71 0l-1.39 1.39C13.88 1.33 12.97 1.06 12 1.06s-1.88.27-2.67.79L7.94.46a.495.495 0 0 0-.71 0c-.2.2-.2.51 0 .71l1.24 1.24C6.54 3.4 5.37 5.05 5.12 7h13.76c-.25-1.95-1.42-3.6-3.35-4.59zM9 5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
      </svg>
    );
  }

  if (o.includes('linux')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="8" fillOpacity="0.25" />
        <path d="M12 4c-2 0-3.5 2-3.5 4.5S10 13 10 15c-1 0-2 1-2 2s1.5 2 4 2 4-1 4-2-1-2-2-2c0-2 1.5-4 1.5-6.5S14 4 12 4z" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M8 20h8M12 18v2" />
    </svg>
  );
}

/* ── Intelligent User-Agent String Parser ── */
function parseUserAgent(uaString = '') {
  const ua = uaString.trim();
  if (!ua) {
    return {
      browser: 'Web Browser',
      browserVersion: '',
      os: 'Unknown System',
      deviceType: 'Desktop',
      iconName: 'desktop',
    };
  }

  // Detect Browser
  let browser = 'Web Browser';
  let browserVersion = '';

  if (/edg(?:e)?\/([0-9.]+)/i.test(ua)) {
    browser = 'Microsoft Edge';
    browserVersion = RegExp.$1.split('.')[0];
  } else if (/chrome|crios/i.test(ua) && !/opr|opera/i.test(ua)) {
    browser = 'Google Chrome';
    const match = ua.match(/(?:chrome|crios)\/([0-9.]+)/i);
    if (match) browserVersion = match[1].split('.')[0];
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Mozilla Firefox';
    const match = ua.match(/(?:firefox|fxios)\/([0-9.]+)/i);
    if (match) browserVersion = match[1].split('.')[0];
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'Apple Safari';
    const match = ua.match(/version\/([0-9.]+)/i);
    if (match) browserVersion = match[1].split('.')[0];
  } else if (/opr|opera/i.test(ua)) {
    browser = 'Opera Browser';
  } else if (/brave/i.test(ua)) {
    browser = 'Brave Browser';
  }

  // Detect Operating System
  let os = 'Unknown OS';
  if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
  else if (/windows/i.test(ua)) os = 'Windows PC';
  else if (/iphone/i.test(ua)) os = 'iPhone (iOS)';
  else if (/ipad/i.test(ua)) os = 'iPad (iPadOS)';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/linux/i.test(ua)) os = 'Linux';

  // Device Form Factor
  let deviceType = 'Desktop';
  let iconName = 'desktop';

  if (/mobile|iphone|android.*mobile/i.test(ua)) {
    deviceType = 'Mobile';
    iconName = 'mobile';
  } else if (/ipad|tablet|android(?!.*mobile)/i.test(ua)) {
    deviceType = 'Tablet';
    iconName = 'mobile';
  } else if (/macintosh|windows|x11/i.test(ua)) {
    deviceType = 'Desktop / Laptop';
    iconName = 'desktop';
  }

  return { browser, browserVersion, os, deviceType, iconName };
}

/* ── Friendly Relative Date Formatter ── */
function formatRelativeTime(dateString) {
  if (!dateString) return 'Active now';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) return 'Active now';
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-PK', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function KnownDevicesCard() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [targetDevice, setTargetDevice] = useState(null);
  const [revoking, setRevoking] = useState(false);

  const fetchDevices = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const { data } = await api.get('/auth/known-devices');
      if (data?.success) {
        setDevices(data.devices || []);
      }
    } catch {
      // silently fail if endpoint unavailable
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const openRevokeConfirm = (device) => {
    setTargetDevice(device);
    setRevokeModalOpen(true);
  };

  const handleConfirmRevoke = async () => {
    if (!targetDevice) return;
    setRevoking(true);
    try {
      const { data } = await api.delete(`/auth/known-devices/${targetDevice.id}`);
      if (data?.success) {
        toast.success('Device session revoked successfully');
        setDevices((prev) => prev.filter((d) => d.id !== targetDevice.id));
        setRevokeModalOpen(false);
        setTargetDevice(null);
      } else {
        toast.error(data?.message || 'Failed to revoke device session');
      }
    } catch {
      toast.error('Failed to revoke device session');
    } finally {
      setRevoking(false);
    }
  };

  const clientUserAgent = typeof window !== 'undefined' ? navigator.userAgent : '';

  return (
    <>
      <Card
        title="Recognized Browsers &amp; Devices"
        subtitle="Active browsers and client environments authorized for your account"
        icon="desktop"
        className="w-full"
        headContent={
          <button
            type="button"
            onClick={() => fetchDevices(true)}
            disabled={loading || refreshing}
            className="size-9 rounded-xl flex items-center justify-center text-t-tertiary hover:text-t-primary hover:bg-b-depth2 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh device sessions"
            aria-label="Refresh device sessions"
          >
            <Icon
              name="refresh"
              className={`!size-4 fill-current ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
        }
      >
        <div className="p-6 max-md:p-4 space-y-4">
          {loading ? (
            <div className="py-10 flex flex-col items-center justify-center gap-3 text-t-tertiary">
              <span className="size-6 border-2 border-t-transparent border-[var(--accent,var(--primary-01))] rounded-full animate-spin" />
              <p className="text-caption font-medium">Loading recognized security sessions…</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="p-6 rounded-3xl bg-b-depth2/50 border border-s-subtle text-center space-y-2">
              <div className="size-10 mx-auto rounded-2xl bg-b-surface1 border border-s-subtle flex items-center justify-center text-t-tertiary">
                <Icon name="shield-check" className="!size-5 fill-current" />
              </div>
              <p className="text-sub-title-2 font-bold text-t-primary">No Remembered Devices</p>
              <p className="text-caption text-t-secondary max-w-sm mx-auto leading-relaxed">
                Your current browser and IP address are registered whenever you sign in to Colleges Hub Super Admin.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-s-subtle">
              {devices.map((device, idx) => {
                const info = parseUserAgent(device.userAgent);
                const isCurrent =
                  clientUserAgent && device.userAgent === clientUserAgent && idx === 0;

                return (
                  <div
                    key={device.id}
                    className="py-4.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
                  >
                    {/* Device & Browser Description */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="size-11 rounded-2xl bg-b-depth2 border border-s-subtle flex items-center justify-center shrink-0 text-t-primary mt-0.5">
                        <BrowserIcon name={info.browser} className="size-5" />
                      </div>

                      <div className="min-w-0 space-y-1">
                        {/* Title & Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sub-title-2 text-t-primary leading-tight">
                            {info.browser} {info.browserVersion ? `v${info.browserVersion}` : ''}
                          </h4>

                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-b-depth2 text-t-secondary border border-s-subtle">
                            <OsBadgeIcon os={info.os} className="size-3 text-t-tertiary shrink-0" />
                            <span>{info.os}</span>
                          </span>

                          {isCurrent && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Current Session</span>
                            </span>
                          )}
                        </div>

                        {/* Metadata row: IP, Last active, First seen */}
                        <div className="flex items-center gap-2.5 flex-wrap text-caption text-t-secondary">
                          <span className="font-mono text-[11px] font-medium text-t-primary bg-b-depth2/80 px-2 py-0.5 rounded-md border border-s-subtle">
                            {device.lastIp || '127.0.0.1'}
                          </span>

                          <span className="text-t-tertiary">&bull;</span>

                          <span className="flex items-center gap-1 text-[11px]">
                            <Icon name="clock" className="!size-3 fill-t-tertiary" />
                            <span>{formatRelativeTime(device.lastSeenAt)}</span>
                          </span>

                          {device.firstSeenAt && (
                            <>
                              <span className="text-t-tertiary hidden md:inline">&bull;</span>
                              <span className="text-[11px] text-t-tertiary hidden md:inline">
                                Added on{' '}
                                {new Date(device.firstSeenAt).toLocaleDateString('en-PK', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Revoke Button with accessible touch target */}
                    <div className="shrink-0 flex items-center justify-end self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => openRevokeConfirm(device)}
                        className="h-9 px-3.5 rounded-xl bg-b-depth2 hover:bg-red-500/10 text-t-tertiary hover:text-red-600 dark:hover:text-red-400 border border-s-subtle hover:border-red-500/20 font-bold text-caption transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                        title={`Revoke session for ${info.browser}`}
                        aria-label={`Revoke session for ${info.browser} on ${info.os}`}
                      >
                        <Icon name="trash" className="!size-3.5 fill-current" />
                        <span>Revoke</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* REVOKE SESSION CONFIRMATION MODAL */}
      {revokeModalOpen && targetDevice && (
        <Modal
          open={revokeModalOpen}
          onClose={() => {
            setRevokeModalOpen(false);
            setTargetDevice(null);
          }}
          title="Revoke Device Session?"
          isSlidePanel={false}
          className="max-w-md"
        >
          {(() => {
            const parsed = parseUserAgent(targetDevice.userAgent);
            return (
              <div className="space-y-4 text-xs text-t-primary">
                <div className="p-4 rounded-2xl bg-b-depth2/70 border border-s-subtle space-y-2">
                  <div className="flex items-center gap-2.5">
                    <BrowserIcon name={parsed.browser} className="size-5 text-t-primary" />
                    <div>
                      <p className="font-bold text-sub-title-2 text-t-primary">
                        {parsed.browser} {parsed.browserVersion ? `v${parsed.browserVersion}` : ''}
                      </p>
                      <p className="text-caption text-t-secondary">{parsed.os}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-s-subtle flex items-center justify-between text-[11px] text-t-secondary">
                    <span>IP Address</span>
                    <span className="font-mono font-bold text-t-primary">
                      {targetDevice.lastIp || '127.0.0.1'}
                    </span>
                  </div>
                </div>

                <p className="text-caption text-t-secondary leading-relaxed">
                  Are you sure you want to disconnect this device? The user session will be terminated immediately, and access will require signing in again.
                </p>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-s-subtle">
                  <button
                    type="button"
                    onClick={() => {
                      setRevokeModalOpen(false);
                      setTargetDevice(null);
                    }}
                    disabled={revoking}
                    className="btn-secondary h-10 px-4 rounded-xl text-caption font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRevoke}
                    disabled={revoking}
                    className="h-10 px-4.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-caption transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {revoking ? (
                      <>
                        <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Revoking…</span>
                      </>
                    ) : (
                      <>
                        <Icon name="trash" className="!size-3.5 fill-current" />
                        <span>Revoke Session</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </>
  );
}
