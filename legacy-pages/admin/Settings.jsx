import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ApiKeyManager from '../../components/ai/ApiKeyManager';
import CollegesHubLoader from '../../components/common/CollegesHubLoader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import Field from '../../components/ui/Field';
import Select from '../../components/ui/Select';
import Icon from '../../components/Icon';

const TABS = [
  { id: 'general', name: 'General & Fees' },
  { id: 'gate', name: 'Gate & Timetable Fines' },
  { id: 'profile', name: 'Public Profile' },
  { id: 'ai', name: 'AI Configuration' },
];

const AUTO_FINE_OPTIONS = [
  { id: 'true', name: 'Enabled (Auto-issue fine on late scan)' },
  { id: 'false', name: 'Disabled (Log late without fine)' },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/colleges/settings');
        setSettings(data.data || {});
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/colleges/settings', settings);
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <CollegesHubLoader
          size="md"
          text="Loading college configuration…"
          minHeight="min-h-[220px]"
        />
      </div>
    );

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            <Icon name="cog" size={24} className="fill-[var(--brand-blue)]" />
            <span>Campus Settings</span>
          </h1>
          <p className="page-sub">
            Configure institutional fee defaults, gate timings, public directory metadata, and AI
            integrations
          </p>
        </div>
        {activeTab !== 'ai' && (
          <div className="page-actions">
            <Button isPrimary icon="check" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {/* Core 2.0 Segmented Pill Tabs */}
      <Tabs items={TABS} value={activeTab} setValue={setActiveTab} />

      {/* Tab 1: General Settings */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-8">
            <Card
              title="Default Fee Structure"
              subtitle="Standard billing amounts applied to new student enrollments (PKR)"
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field
                  label="Tuition Fee (PKR)"
                  type="number"
                  value={settings?.feeStructure?.tuitionFee ?? 0}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      feeStructure: {
                        ...settings?.feeStructure,
                        tuitionFee: Number(e.target.value),
                      },
                    })
                  }
                />
                <Field
                  label="Function Fee (PKR)"
                  type="number"
                  value={settings?.feeStructure?.functionFee ?? 0}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      feeStructure: {
                        ...settings?.feeStructure,
                        functionFee: Number(e.target.value),
                      },
                    })
                  }
                />
                <Field
                  label="Lab Fee (PKR)"
                  type="number"
                  value={settings?.feeStructure?.labFee ?? 0}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      feeStructure: {
                        ...settings?.feeStructure,
                        labFee: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>

              <div className="border-t border-s-subtle pt-5 flex items-center justify-end">
                <Button isPrimary icon="check" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Fee Structure'}
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card
              title="Academic Session"
              subtitle="Active academic year identifier across reports and transcripts"
              className="space-y-5"
            >
              <Field
                label="Academic Year"
                placeholder="e.g. 2026-2027"
                value={settings?.academicYear || ''}
                onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
              />
              <div className="p-4 rounded-3xl bg-b-surface1 border border-s-subtle text-caption text-t-secondary">
                All new student admissions, fee challans, and exam sessions default to this
                academic year label.
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Gate & Timetable Fines */}
      {activeTab === 'gate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-6">
            <Card
              title="College Timings & Gate Control"
              subtitle="Set campus operating hours and early exit cutoff rules"
              className="space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="College Opening Time"
                  type="time"
                  value={settings?.openingTime || '08:00'}
                  onChange={(e) => setSettings({ ...settings, openingTime: e.target.value })}
                />
                <Field
                  label="Closing Time (Early Exit Cutoff)"
                  type="time"
                  value={settings?.closingTime || '14:00'}
                  onChange={(e) => setSettings({ ...settings, closingTime: e.target.value })}
                />
              </div>
            </Card>
          </div>

          <div className="lg:col-span-6">
            <Card
              title="Late Entry & Auto Fine Policy"
              subtitle="Fines apply only to students. Faculty and staff are logged without fines."
              className="space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Late Grace Period (Minutes)"
                  type="number"
                  placeholder="15"
                  value={settings?.lateGraceMinutes ?? 15}
                  onChange={(e) =>
                    setSettings({ ...settings, lateGraceMinutes: Number(e.target.value) })
                  }
                />
                <Field
                  label="Student Late Fine Amount (PKR)"
                  type="number"
                  placeholder="100"
                  value={settings?.lateFineAmount ?? 100}
                  onChange={(e) =>
                    setSettings({ ...settings, lateFineAmount: Number(e.target.value) })
                  }
                />
              </div>

              <Select
                label="Automatic Fine Enforcement"
                value={settings?.autoLateFine !== false ? 'true' : 'false'}
                onChange={(opt) =>
                  setSettings({
                    ...settings,
                    autoLateFine: (typeof opt === 'object' ? opt.id : opt) === 'true',
                  })
                }
                options={AUTO_FINE_OPTIONS}
              />

              <div className="border-t border-s-subtle pt-4 flex justify-end">
                <Button isPrimary icon="check" onClick={handleSave} disabled={saving}>
                  Save Gate & Fine Policy
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 3: Public Profile */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-7 space-y-3">
            <Card
              title="Profile Metadata"
              subtitle="Displayed on your public institutional directory listing"
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Institutional Tagline"
                  placeholder="Excellence in Education"
                  value={settings?.tagline || ''}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                />
                <Field
                  label="Established Year"
                  type="number"
                  placeholder="1989"
                  value={settings?.establishedYear || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, establishedYear: Number(e.target.value) })
                  }
                />
              </div>
              <Field
                label="About Description"
                textarea
                rows={4}
                placeholder="Write a brief introduction about your college..."
                value={settings?.about || ''}
                onChange={(e) => setSettings({ ...settings, about: e.target.value })}
              />
            </Card>

            <Card
              title="Visual Branding URLs"
              subtitle="Set your college logo and cover banner URLs"
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Cover Photo URL"
                  placeholder="https://images.unsplash.com/..."
                  value={settings?.coverPhoto || ''}
                  onChange={(e) => setSettings({ ...settings, coverPhoto: e.target.value })}
                />
                <Field
                  label="Logo URL"
                  placeholder="https://images.unsplash.com/..."
                  value={settings?.logo || ''}
                  onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
                />
              </div>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <Card
              title="Contact & Campus Location"
              subtitle="Official communication channels and physical address"
              className="space-y-4"
            >
              <Field
                label="Official Email Address"
                type="email"
                value={settings?.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              />
              <Field
                label="Phone Number"
                value={settings?.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              />
              <Field
                label="Website URL"
                value={settings?.website || ''}
                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
              />
              <Field
                label="City"
                value={settings?.city || ''}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
              />
              <Field
                label="Campus Address"
                value={settings?.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              />

              <div className="border-t border-s-subtle pt-4 flex justify-end">
                <Button isPrimary icon="check" onClick={handleSave} disabled={saving}>
                  Save Profile Details
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 4: AI Configuration */}
      {activeTab === 'ai' && <ApiKeyManager />}
    </div>
  );
};

export default Settings;
