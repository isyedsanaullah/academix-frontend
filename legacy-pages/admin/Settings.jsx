import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineCog, HiOutlineKey, HiOutlineGlobe, HiOutlineClock } from 'react-icons/hi';
import ApiKeyManager from '../../components/ai/ApiKeyManager';

const TABS = [
  { id: 'general', label: 'General', icon: HiOutlineCog },
  { id: 'gate', label: 'Gate & Timetable Fines', icon: HiOutlineClock },
  { id: 'profile', label: 'Public Profile', icon: HiOutlineGlobe },
  { id: 'ai', label: 'AI Configuration', icon: HiOutlineKey },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/colleges/settings');
        setSettings(data.data);
      }
      catch {
        toast.error('Failed to load settings');
      }
      finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    try {
      await api.put('/colleges/settings', settings);
      toast.success('Settings saved');
    }
    catch {
      toast.error('Failed to save settings');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <HiOutlineCog className="text-indigo-400" /> Settings
      </h1>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-500/15 text-indigo-400 shadow-sm'
                : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04]'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <div className="glass-card p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Fee Structure</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-surface-300 mb-1">Tuition Fee</label>
                <input
                  type="number"
                  value={settings?.feeStructure?.tuitionFee || 0}
                  onChange={e => setSettings({
                    ...settings,
                    feeStructure: { ...settings?.feeStructure, tuitionFee: Number(e.target.value) }
                  })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-surface-300 mb-1">Function Fee</label>
                <input
                  type="number"
                  value={settings?.feeStructure?.functionFee || 0}
                  onChange={e => setSettings({
                    ...settings,
                    feeStructure: { ...settings?.feeStructure, functionFee: Number(e.target.value) }
                  })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-surface-300 mb-1">Lab Fee</label>
                <input
                  type="number"
                  value={settings?.feeStructure?.labFee || 0}
                  onChange={e => setSettings({
                    ...settings,
                    feeStructure: { ...settings?.feeStructure, labFee: Number(e.target.value) }
                  })}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-surface-300 mb-1">Academic Year</label>
            <input
              value={settings?.academicYear || ''}
              onChange={e => setSettings({ ...settings, academicYear: e.target.value })}
              className="input-field w-40"
            />
          </div>

          <button onClick={handleSave} className="btn-primary">Save Settings</button>
        </div>
      )}

      {/* Public Profile Tab */}
      {activeTab === 'profile' && (
        <div className="glass-card p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Visual Branding</h3>
            <p className="text-white/30 text-xs mb-4">Set your college logo and main cover photo urls</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-surface-300 mb-1">Cover Photo URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={settings?.coverPhoto || ''}
                  onChange={e => setSettings({ ...settings, coverPhoto: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-surface-300 mb-1">Logo URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={settings?.logo || ''}
                  onChange={e => setSettings({ ...settings, logo: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.05] pt-6">
            <h3 className="text-lg font-semibold text-white mb-1">Profile Metadata</h3>
            <p className="text-white/30 text-xs mb-4">Provide details to display on your public profile page</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-surface-300 mb-1">Tagline</label>
                  <input
                    type="text"
                    placeholder="Excellence in Education"
                    value={settings?.tagline || ''}
                    onChange={e => setSettings({ ...settings, tagline: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm text-surface-300 mb-1">Established Year</label>
                  <input
                    type="number"
                    placeholder="1989"
                    value={settings?.establishedYear || ''}
                    onChange={e => setSettings({ ...settings, establishedYear: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-surface-300 mb-1">About description</label>
                <textarea
                  rows={4}
                  placeholder="Write a brief introduction about your college..."
                  value={settings?.about || ''}
                  onChange={e => setSettings({ ...settings, about: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.05] pt-6">
            <h3 className="text-lg font-semibold text-white mb-1">Contact & Address</h3>
            <p className="text-white/30 text-xs mb-4">Official communication channels and campus location</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-surface-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={settings?.email || ''}
                  onChange={e => setSettings({ ...settings, email: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-surface-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={settings?.phone || ''}
                  onChange={e => setSettings({ ...settings, phone: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-surface-300 mb-1">Website URL</label>
                <input
                  type="text"
                  value={settings?.website || ''}
                  onChange={e => setSettings({ ...settings, website: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-surface-300 mb-1">City</label>
                <input
                  type="text"
                  value={settings?.city || ''}
                  onChange={e => setSettings({ ...settings, city: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-surface-300 mb-1">Campus Address</label>
                <input
                  type="text"
                  value={settings?.address || ''}
                  onChange={e => setSettings({ ...settings, address: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <button onClick={handleSave} className="btn-primary">Save Settings</button>
        </div>
      )}

      {/* Gate & Timetable Fines Tab */}
      {activeTab === 'gate' && (
        <div className="glass-card p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">College Timings & Gate Control</h3>
            <p className="text-xs text-surface-400 mb-4">Set college operating hours and early exit restrictions for students and staff.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-surface-300 mb-1">College Opening Time</label>
                <input
                  type="time"
                  value={settings?.openingTime || '08:00'}
                  onChange={e => setSettings({ ...settings, openingTime: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-surface-300 mb-1">College Closing Time (Early Exit Cutoff)</label>
                <input
                  type="time"
                  value={settings?.closingTime || '14:00'}
                  onChange={e => setSettings({ ...settings, closingTime: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-semibold text-white mb-1">Late Entry & Auto Fine Configuration</h3>
            <p className="text-xs text-surface-400 mb-4">Fines apply <strong>only to students</strong>. Teachers and staff are marked late without fines.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-surface-300 mb-1">Late Grace Period (Minutes)</label>
                <input
                  type="number"
                  value={settings?.lateGraceMinutes ?? 15}
                  onChange={e => setSettings({ ...settings, lateGraceMinutes: Number(e.target.value) })}
                  className="input-field"
                  placeholder="15"
                />
              </div>
              <div>
                <label className="block text-sm text-surface-300 mb-1">Student Late Fine Amount (PKR)</label>
                <input
                  type="number"
                  value={settings?.lateFineAmount ?? 100}
                  onChange={e => setSettings({ ...settings, lateFineAmount: Number(e.target.value) })}
                  className="input-field"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm text-surface-300 mb-1">Auto Fine Students</label>
                <select
                  value={settings?.autoLateFine !== false ? 'true' : 'false'}
                  onChange={e => setSettings({ ...settings, autoLateFine: e.target.value === 'true' })}
                  className="input-field"
                >
                  <option value="true">Enabled (Auto-issue fine on late scan)</option>
                  <option value="false">Disabled (Log late without fine)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button onClick={handleSave} className="btn-primary">Save Timetable & Gate Settings</button>
          </div>
        </div>
      )}

      {/* AI Configuration Tab */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">AI API Configuration</h3>
            <p className="text-white/30 text-xs">Configure your Gemini AI API key to enable AI-powered features</p>
          </div>
          <ApiKeyManager />
        </div>
      )}
    </div>
  );
};

export default Settings;
