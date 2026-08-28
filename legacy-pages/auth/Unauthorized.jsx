import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineShieldExclamation, HiOutlineHome, HiOutlineLogin, HiOutlineLogout } from 'react-icons/hi';

const Unauthorized = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080c12', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ textAlign: 'center', padding: '40px 24px', maxWidth: 420 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <HiOutlineShieldExclamation size={36} style={{ color: '#f87171' }} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f87171', marginBottom: 8 }}>Access Denied</h1>
        <p style={{ fontSize: 14, color:'var(--text-tertiary)', marginBottom: 8 }}>You don't have permission to access this page.</p>
        {user && (
          <div style={{ padding: '12px 18px', borderRadius: 10, background:'var(--hover-bg)', border:'1px solid var(--border-color)', marginBottom: 20 }}>
            <p style={{ fontSize: 12, color:'var(--text-secondary)' }}>Logged in as: <strong style={{ color: '#818cf8' }}>{user.name}</strong></p>
            <p style={{ fontSize: 11, color:'var(--text-tertiary)', marginTop: 4 }}>Role: <strong style={{ color: '#fbbf24', textTransform: 'capitalize' }}>{user.role}</strong></p>
            <p style={{ fontSize: 10, color:'var(--text-tertiary)', marginTop: 4 }}>{user.email}</p>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.3)', background: 'transparent', color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <HiOutlineHome size={14} /> Home
          </button>
          {user ? (
            <button onClick={() => { logout(); navigate('/login'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, border: 'none', background: '#f87171', color:'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <HiOutlineLogout size={14} /> Sign Out
            </button>
          ) : (
            <button onClick={() => navigate('/login')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, border: 'none', background: '#6366f1', color:'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <HiOutlineLogin size={14} /> Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
