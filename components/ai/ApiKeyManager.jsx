import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Icon from '../Icon';
import CollegesHubLoader from '../common/CollegesHubLoader';

/**
 * ApiKeyManager — Reusable component for managing Gemini API key (Core 2.0 styled)
 */
const ApiKeyManager = () => {
  const [keyData, setKeyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    fetchKey();
  }, []);

  const fetchKey = async () => {
    try {
      const { data } = await api.get('/ai/api-key');
      setKeyData(data.data);
    } catch {
      /* no key yet */
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newKey.trim()) return toast.error('Please enter an API key');
    setSaving(true);
    try {
      const { data } = await api.post('/ai/api-key', { apiKey: newKey.trim() });
      setKeyData(data.data);
      setNewKey('');
      setShowInput(false);
      setTestResult(null);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save key');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your API key?')) return;
    try {
      await api.delete('/ai/api-key');
      setKeyData(null);
      setTestResult(null);
      toast.success('API key deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const payload = newKey.trim() ? { apiKey: newKey.trim() } : {};
      const { data } = await api.post('/ai/api-key/test', payload);
      const isRateLimited = data.data?.rateLimited;
      setTestResult({
        success: true,
        rateLimited: isRateLimited,
        message: data.message,
      });
      toast.success(isRateLimited ? 'Key valid (rate limited)' : 'Key is valid!');
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'Test failed',
      });
      toast.error(err.response?.data?.message || 'Key test failed');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card className="flex justify-center">
        <CollegesHubLoader size="xs" text="Loading API configuration…" minHeight="min-h-[120px]" />
      </Card>
    );
  }

  return (
    <Card
      title="Gemini AI API Key"
      subtitle="Your personal API key for AI features. Encrypted with AES-256."
      headContent={
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-1.5 rounded-3xl border border-s-stroke2 bg-b-surface2 px-4 text-button text-[var(--brand-blue)] transition-colors hover:border-s-highlight"
        >
          <span>Get API Key</span>
          <Icon name="external-link" size={15} className="fill-current" />
        </a>
      }
      className="space-y-5"
    >
      {keyData ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-b-surface1 border border-s-subtle">
            <div className="flex-1 min-w-0">
              <p className="text-caption text-t-tertiary uppercase tracking-wider mb-0.5">
                Active Key
              </p>
              <p className="text-sub-title-2 font-mono text-[var(--brand-blue)] truncate">
                {keyData.maskedKey}
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button
                isStroke
                isCircle
                size="sm"
                icon={testing ? 'refresh' : 'check'}
                onClick={handleTest}
                disabled={testing}
                aria-label="Test API Key"
              />
              <Button
                isStroke
                isCircle
                size="sm"
                icon="refresh"
                onClick={() => {
                  setShowInput(true);
                  setNewKey('');
                }}
                aria-label="Update API Key"
              />
              <Button
                isDanger
                isCircle
                size="sm"
                icon="trash"
                onClick={handleDelete}
                aria-label="Delete API Key"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-caption text-t-tertiary">
            {keyData.usageCount > 0 && <span>Used {keyData.usageCount} times</span>}
            {keyData.lastUsed && (
              <span>Last used: {new Date(keyData.lastUsed).toLocaleDateString()}</span>
            )}
            {keyData.updatedAt && (
              <span>Updated: {new Date(keyData.updatedAt).toLocaleDateString()}</span>
            )}
          </div>

          {testResult && (
            <div
              className={`flex items-center gap-2 p-3.5 rounded-2xl text-caption font-medium border ${
                testResult.rateLimited
                  ? 'bg-[var(--warning-soft)] border-[var(--warning)]/25 text-[var(--warning)]'
                  : testResult.success
                  ? 'bg-[var(--brand-green-soft)] border-[var(--brand-green)]/25 text-[var(--brand-green-text)]'
                  : 'bg-[var(--danger-soft)] border-[var(--danger)]/25 text-[var(--danger)]'
              }`}
            >
              <Icon
                name={testResult.success ? 'check-circle' : 'alert'}
                size={15}
                className="fill-current shrink-0"
              />
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      ) : !showInput ? (
        <div className="text-center py-6">
          <p className="text-body-2 text-t-secondary mb-3">No API key configured</p>
          <Button isPrimary icon="key" onClick={() => setShowInput(true)}>
            Add API Key
          </Button>
        </div>
      ) : null}

      {showInput && (
        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-sub-title-2 text-t-primary mb-2">
              {keyData ? 'Update' : 'Add'} Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="AIzaSy..."
                className="input-field pr-11"
                autoFocus
              />
              <button
                type="button"
                aria-label={showKey ? 'Hide key' : 'Show key'}
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-t-tertiary hover:text-t-primary"
              >
                <Icon name={showKey ? 'eye-hide' : 'eye'} size={18} className="fill-current" />
              </button>
            </div>
          </div>
          <div className="flex gap-2.5">
            <Button isPrimary onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Key'}
            </Button>
            <Button
              isStroke
              onClick={() => {
                setShowInput(false);
                setNewKey('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-s-subtle overflow-hidden">
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between px-4 py-3 bg-b-surface1 hover:bg-b-highlight transition text-left"
        >
          <span className="text-sub-title-2 text-t-primary flex items-center gap-2">
            <Icon name="book-open" size={16} className="fill-t-secondary" />
            How to get your Gemini API Key
          </span>
          <Icon
            name="chevron"
            size={16}
            className={`fill-t-tertiary transition-transform ${showGuide ? 'rotate-180' : ''}`}
          />
        </button>

        {showGuide && (
          <div className="p-4 space-y-3 border-t border-s-subtle bg-b-surface2 text-caption text-t-secondary">
            <p>
              <strong>1.</strong> Open{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--brand-blue)] hover:underline"
              >
                aistudio.google.com/apikey
              </a>{' '}
              and sign in with your Google account.
            </p>
            <p>
              <strong>2.</strong> Click <strong>Create API Key</strong> and choose{' '}
              <strong>Create API key in new project</strong>.
            </p>
            <p>
              <strong>3.</strong> Copy the key (<code className="font-mono">AIzaSy...</code>),
              paste it above, and click <strong>Save Key</strong>.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-b-surface1 border border-s-subtle text-caption text-t-secondary">
        <Icon name="shield" size={16} className="fill-t-tertiary shrink-0 mt-0.5" />
        <p>
          Your API key is encrypted with AES-256 before storage. The platform never stores or
          accesses your key in plaintext.
        </p>
      </div>
    </Card>
  );
};

export default ApiKeyManager;
