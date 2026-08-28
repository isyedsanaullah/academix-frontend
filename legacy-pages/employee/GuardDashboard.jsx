import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineQrcode, HiOutlineUserGroup, HiOutlineRefresh, HiOutlineCamera } from 'react-icons/hi';

const GuardDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({ totalEntries: 0, totalExits: 0, students: 0, teachers: 0, employees: 0 });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [lastScan, setLastScan] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const inputRef = useRef(null);
  const html5QrcodeRef = useRef(null);

  const isInitializingRef = useRef(false);

  useEffect(() => {
    fetchLogs();
    initScanner();

    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
        await html5QrcodeRef.current.clear();
      } catch (err) {
        console.error("Failed to stop camera:", err);
      }
    }
    const container = document.getElementById("qr-reader");
    if (container) container.innerHTML = "";
    setCameraActive(false);
  };

  const initScanner = async () => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    try {
      // 1. Stop any existing instance & clear container
      await stopCamera();

      const container = document.getElementById("qr-reader");
      if (!container) {
        isInitializingRef.current = false;
        return;
      }
      container.innerHTML = "";

      // 2. Load html5-qrcode
      const { Html5Qrcode } = await import('html5-qrcode');

      const html5Qrcode = new Html5Qrcode("qr-reader");
      html5QrcodeRef.current = html5Qrcode;

      setCameraError(null);
      await html5Qrcode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 }
        },
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {
          // ignore scan errors
        }
      );
      setCameraActive(true);
    } catch (err) {
      console.error("Webcam access failed:", err);
      setCameraError(err.message || "Camera access denied or unavailable");
      setCameraActive(false);
    } finally {
      isInitializingRef.current = false;
    }
  };

  const retryCamera = () => {
    initScanner();
  };

  const fetchLogs = async () => {
    try {
      const { data } = await api.get('/gate/logs/today');
      setLogs(data.data || []);
      setSummary(data.summary || {});
    } catch {} finally { setLoading(false); }
  };

  const handleScan = async (code) => {
    if (!code || scanning) return;
    setScanning(true);
    try {
      const { data } = await api.post('/gate/scan', { 
        identifier: code, 
        verificationMethod: 'QR', 
        deviceId: 'LAPTOP_CAMERA' 
      });
      setLastScan(data);
      toast.success(data.message);
      fetchLogs();
    } catch (err) {
      const msg = err.response?.data?.message || 'Scan failed';
      const errCode = err.response?.data?.errorCode;
      if (errCode === 'DUPLICATE_SCAN') {
        toast.error("Duplicate scan ignored");
      } else {
        toast.error(msg);
      }
      setLastScan({ 
        success: false, 
        message: msg, 
        person: err.response?.data?.person, 
        requiresApproval: err.response?.data?.requiresApproval 
      });
    } finally {
      // Cooldown window of 3 seconds
      setTimeout(() => {
        setScanning(false);
      }, 3000);
      setQrInput('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && qrInput.trim()) {
      handleScan(qrInput.trim());
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>🛡️ Security Gate Panel</h1>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Scan QR codes for entry/exit. Attendance is dynamically determined by the backend.</p>
        </div>
        <button onClick={fetchLogs} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <HiOutlineRefresh size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        {[
          { label: 'Entries', value: summary.totalEntries, color: '#4ade80', icon: '✅' },
          { label: 'Exits', value: summary.totalExits, color: '#f87171', icon: '🚪' },
          { label: 'Students Inside', value: summary.currentlyInsideStudents || 0, color: '#818cf8', icon: '🎓' },
          { label: 'Staff Inside', value: summary.currentlyInsideStaff || 0, color: '#fbbf24', icon: '👨‍🏫' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{s.icon} {s.label}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</p>
            <p style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 2 }}>Today's gate activity</p>
          </div>
        ))}
      </div>

      {/* Camera & Scanner Container */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* QR Scanner Feed */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <HiOutlineCamera size={18} /> Camera Scanner
            </span>
            <span style={{ 
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
              background: cameraActive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              color: cameraActive ? '#4ade80' : '#f87171' 
            }}>
              {cameraActive ? '● Scanner Active' : '○ Camera Offline'}
            </span>
          </div>

          <div style={{ 
            width: '100%', minHeight: '260px', background: 'rgba(0,0,0,0.2)', 
            borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
          }}>
            {/* The html5-qrcode reader div */}
            <style>{`
              #qr-reader {
                width: 100% !important;
                height: 100% !important;
                position: relative !important;
                overflow: hidden !important;
                border: none !important;
              }
              #qr-reader video {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                border-radius: 12px;
              }
              #qr-reader canvas {
                display: none !important;
              }
              #qr-reader__scan_region {
                width: 100% !important;
                height: 100% !important;
              }
              #qr-reader__dashboard {
                display: none !important;
              }
            `}</style>
            <div id="qr-reader" style={{ width: '100%', height: '100%' }}></div>
            
            {!cameraActive && (
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 20, textAlign: 'center' }}>
                <span style={{ fontSize: 32 }}>📷</span>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{cameraError || 'Camera is not running'}</p>
                <button onClick={retryCamera} className="btn-secondary" style={{ fontSize: 11, padding: '6px 12px' }}>
                  Try Accessing Camera
                </button>
              </div>
            )}
          </div>

          {/* Manual Input Fallback */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <HiOutlineQrcode size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input ref={inputRef} value={qrInput} onChange={e => setQrInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Scan QR code or type ID..." autoFocus disabled={scanning}
                className="form-input" style={{ paddingLeft: 38, fontSize: 14, padding: '12px 12px 12px 38px' }} />
            </div>
            <button onClick={() => handleScan(qrInput.trim())} disabled={scanning || !qrInput.trim()} className="btn-primary" style={{ padding: '12px 20px', fontSize: 13, border: 'none', cursor: 'pointer', opacity: scanning ? 0.6 : 1 }}>
              {scanning ? '...' : 'SCAN'}
            </button>
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>💡 Auto-detects QR codes in stream. Point the camera at a card or enter ID manually.</p>
        </div>

        {/* Scan Status & Details */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '360px' }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>📋 Scan Status</p>
            {lastScan ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, 
                  background: lastScan.success ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                  border: `1px solid ${lastScan.success ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`
                }}>
                  <span style={{ fontSize: 32 }}>{lastScan.success ? (lastScan.data?.action === 'entry' ? '✅' : '🚪') : '⚠️'}</span>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: lastScan.success ? '#4ade80' : '#f87171' }}>{lastScan.message}</p>
                    {lastScan.person && (
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                        Role: <span style={{ textTransform: 'capitalize' }}>{lastScan.person.type}</span>
                      </p>
                    )}
                  </div>
                </div>

                {lastScan.person && (
                  <div style={{ padding: 14, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: 'var(--text-tertiary)' }}>Name:</span><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lastScan.person.name}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: 'var(--text-tertiary)' }}>Type:</span><span style={{ fontWeight: 600, color: '#818cf8', textTransform: 'capitalize' }}>{lastScan.person.type}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: 'var(--text-tertiary)' }}>Location:</span><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lastScan.data?.location || 'Main Gate'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: 'var(--text-tertiary)' }}>Time:</span><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></div>
                  </div>
                )}

                {lastScan.requiresApproval && (
                  <div style={{ padding: 12, borderRadius: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>⚠️</span>
                    <p style={{ fontSize: 11, color: '#fbbf24', fontWeight: 600, margin: 0 }}>Requires principal early exit request approval before checking out.</p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', color: 'var(--text-tertiary)', fontSize: 13 }}>
                Awaiting first scan...
              </div>
            )}
          </div>

          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', fontSize: 11, color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
            <span>ℹ️</span>
            <span>All logs are recorded with server-authoritative timestamps in Pakistan (Asia/Karachi UTC+5) timezone.</span>
          </div>
        </div>
      </div>

      {/* Today's Logs */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>📋 Today's Gate Log ({logs.length})</span>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto' }} /></div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No gate logs today</div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: 400 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--card-bg)' }}>{['Time', 'Action', 'Name', 'Type', 'Method', 'Gate / Location', 'Early Exit'].map(h => <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 11 }}>{new Date(l.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ padding: '2px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: l.action === 'entry' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)', color: l.action === 'entry' ? '#4ade80' : '#f87171' }}>{l.action === 'entry' ? 'ENTRY' : 'EXIT'}</span></td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{l.personName}</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600, background: l.personType === 'student' ? 'rgba(99,102,241,0.1)' : l.personType === 'teacher' ? 'rgba(56,189,248,0.1)' : 'rgba(251,191,36,0.1)', color: l.personType === 'student' ? '#818cf8' : l.personType === 'teacher' ? '#38bdf8' : '#fbbf24' }}>{l.personType}</span></td>
                    <td style={{ padding: '10px 14px', textTransform: 'uppercase', fontSize: 10, color: 'var(--text-secondary)' }}>{l.verificationMethod || 'QR'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text-secondary)' }}>{l.location || 'Main Gate'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 10, color: 'var(--text-tertiary)' }}>{l.isEarlyExit ? (l.earlyExitApproved ? '✅ Approved' : '⚠️ Blocked') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuardDashboard;
