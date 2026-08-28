import { useAuth } from '../../context/AuthContext';
import { HiOutlineCalendar } from 'react-icons/hi';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color:'var(--text-primary)' }}>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
          <HiOutlineCalendar style={{ color:'var(--text-tertiary)' }} size={13} />
          <span style={{ fontSize: '12px', color:'var(--text-tertiary)' }}>{today}</span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏢</div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color:'var(--text-primary)' }}>Employee Portal</h2>
        <p style={{ fontSize: '13px', color:'var(--text-tertiary)', marginTop: '8px', maxWidth: '400px', margin: '8px auto 0' }}>
          Your employee dashboard is ready. Task management and shift scheduling modules will be available in the next update.
        </p>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
