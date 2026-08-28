import { useState } from 'react';
import { HiOutlineCog, HiOutlineKey, HiOutlineOfficeBuilding } from 'react-icons/hi';
import ApiKeyManager from '../../components/ai/ApiKeyManager';
import CollegeInfoCard from '../../components/CollegeInfoCard';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { id: 'college', label: 'My College', icon: HiOutlineOfficeBuilding },
  { id: 'ai', label: 'AI Settings', icon: HiOutlineKey },
];

const RoleSettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('college');

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <HiOutlineCog className="text-primary-400" /> Settings
      </h1>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-500/15 text-indigo-400 shadow-sm'
                : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04]'
            }`}>
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* My College Tab */}
      {activeTab === 'college' && (
        <div className="space-y-4 max-w-lg">
          {/* User Info */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color:'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Your Account</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color:'var(--text-primary)', fontWeight: 700, fontSize: '16px'
              }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color:'var(--text-primary)' }}>{user?.name}</p>
                <p style={{ fontSize: '12px', color:'var(--text-tertiary)' }}>{user?.email}</p>
                <span style={{
                  fontSize: '9px', fontWeight: 700, color: '#818cf8',
                  background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: '4px',
                  textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px', display: 'inline-block'
                }}>{user?.role}</span>
              </div>
            </div>
          </div>

          <CollegeInfoCard />
        </div>
      )}

      {/* AI Settings Tab */}
      {activeTab === 'ai' && (
        <div className="space-y-4 max-w-lg">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">AI API Configuration</h3>
            <p className="text-white/30 text-xs">Configure your Gemini AI API key to enable AI-powered features like Chat, Notes Generator, etc.</p>
          </div>
          <ApiKeyManager />
        </div>
      )}
    </div>
  );
};

export default RoleSettings;
