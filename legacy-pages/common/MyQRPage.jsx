import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MyQRCode from '../../components/common/MyQRCode';

const MyQRPage = () => {
  const { user } = useAuth();
  const [qrCode, setQrCode] = useState('');
  const [info, setInfo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        if (user?.role === 'student') {
          const { data } = await api.get('/students/my-profile');
          const s = data.data;
          setQrCode(s?.qrCode || s?.rollNumber || '');
          setInfo({ name: s?.name, subtitle: `${s?.class} ${s?.section} • ${s?.rollNumber}` });
        } else {
          // Teacher/Employee - use user's qrCode or email
          setQrCode(user?.qrCode || user?.email || '');
          setInfo({ name: user?.name, subtitle: `${user?.role} • ${user?.email}` });
        }
      } catch {
        setQrCode(user?.email || user?._id || '');
        setInfo({ name: user?.name, subtitle: user?.role });
      } finally { setLoading(false); }
    };
    fetch();
  }, [user]);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}><div className="animate-spin" style={{ width: 32, height: 32, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} /></div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>📱 My ID Card</h1>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Show this QR code at the gate for entry/exit</p>
      </div>
      <MyQRCode value={qrCode} name={info.name} subtitle={info.subtitle} size={200} />
      <div className="glass-card" style={{ padding: 16, maxWidth: 400, width: '100%' }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <b>Instructions:</b><br/>
          • Show this QR to the security guard when entering/exiting the campus<br/>
          • Your attendance is automatically marked when you scan at entry<br/>
          • For early exit, request approval from the principal first<br/>
          • Keep your physical ID card with this QR code at all times
        </p>
      </div>
    </div>
  );
};

export default MyQRPage;
