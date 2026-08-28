import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineKey, HiOutlineTrash, HiOutlineCheck,
  HiOutlineExclamation, HiOutlineRefresh, HiOutlineEye, HiOutlineEyeOff,
  HiOutlineExternalLink, HiOutlineChevronDown, HiOutlineChevronUp
} from 'react-icons/hi';

/**
 * ApiKeyManager — Reusable component for managing Gemini API key
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

  useEffect(() => { fetchKey(); }, []);

  const fetchKey = async () => {
    try {
      const { data } = await api.get('/ai/api-key');
      setKeyData(data.data);
    } catch { /* no key yet */ }
    finally { setLoading(false); }
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
    } finally { setSaving(false); }
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
      const { data } = await api.post('/ai/api-key/test');
      const isRateLimited = data.data?.rateLimited;
      setTestResult({
        success: true,
        rateLimited: isRateLimited,
        message: data.message
      });
      toast.success(isRateLimited ? 'Key valid (rate limited)' : 'Key is valid!');
    } catch (err) {
      setTestResult({ success: false, message: err.response?.data?.message || 'Test failed' });
      toast.error('Key test failed');
    } finally { setTesting(false); }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-[#0d1117] border border-white/[0.06] p-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-white/40 text-sm">Loading API configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#0d1117] border border-white/[0.06] p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/20">
            <HiOutlineKey className="text-violet-400" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Gemini AI API Key</h3>
            <p className="text-[11px] text-white/30 mt-0.5">
              Your personal API key for AI features. You pay for your own usage.
            </p>
          </div>
        </div>
        {/* Direct Link Button */}
        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-lg hover:bg-blue-500/15 transition shrink-0">
          <HiOutlineExternalLink size={14} /> Get API Key
        </a>
      </div>

      {/* Current Key Display */}
      {keyData ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Active Key</p>
              <p className="text-sm font-mono text-indigo-400 truncate">{keyData.maskedKey}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={handleTest} disabled={testing} title="Test Key"
                className="p-2 rounded-lg text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition disabled:opacity-50">
                {testing ? <HiOutlineRefresh size={16} className="animate-spin" /> : <HiOutlineCheck size={16} />}
              </button>
              <button onClick={() => { setShowInput(true); setNewKey(''); }} title="Update Key"
                className="p-2 rounded-lg text-white/30 hover:text-amber-400 hover:bg-amber-500/10 transition">
                <HiOutlineRefresh size={16} />
              </button>
              <button onClick={handleDelete} title="Delete Key"
                className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition">
                <HiOutlineTrash size={16} />
              </button>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="flex gap-4 text-[11px] text-white/25">
            {keyData.usageCount > 0 && <span>Used {keyData.usageCount} times</span>}
            {keyData.lastUsed && <span>Last used: {new Date(keyData.lastUsed).toLocaleDateString()}</span>}
            {keyData.updatedAt && <span>Updated: {new Date(keyData.updatedAt).toLocaleDateString()}</span>}
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium ${
              testResult.rateLimited
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                : testResult.success
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {testResult.success ? <HiOutlineCheck size={14} /> : <HiOutlineExclamation size={14} />}
              {testResult.message}
            </div>
          )}
        </div>
      ) : !showInput ? (
        <div className="text-center py-4">
          <p className="text-white/25 text-sm mb-3">No API key configured</p>
          <button onClick={() => setShowInput(true)} className="btn-primary">
            <HiOutlineKey size={16} /> Add API Key
          </button>
        </div>
      ) : null}

      {/* Key Input */}
      {showInput && (
        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">
              {keyData ? 'Update' : 'Add'} Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                placeholder="AIzaSy..."
                className="input-field pr-10"
                autoFocus
              />
              <button type="button" onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showKey ? <HiOutlineEyeOff size={15} /> : <HiOutlineEye size={15} />}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Key'}
            </button>
            <button onClick={() => { setShowInput(false); setNewKey(''); }} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Step-by-Step Guide (Collapsible) */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <button onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition text-left">
          <span className="text-xs font-semibold text-white/50">📖 How to get your Gemini API Key</span>
          {showGuide
            ? <HiOutlineChevronUp size={14} className="text-white/30" />
            : <HiOutlineChevronDown size={14} className="text-white/30" />
          }
        </button>

        {showGuide && (
          <div className="px-4 py-4 space-y-4 border-t border-white/[0.06]">

            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-indigo-400">1</span>
              </div>
              <div>
                <p className="text-xs text-white/60 font-semibold">Open Google AI Studio</p>
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:underline mt-0.5">
                  aistudio.google.com/apikey <HiOutlineExternalLink size={10} />
                </a>
                <p className="text-[11px] text-white/30 mt-0.5">Sign in with your Google account</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-indigo-400">2</span>
              </div>
              <div>
                <p className="text-xs text-white/60 font-semibold">Click "Create API Key"</p>
                <p className="text-[11px] text-white/30 mt-0.5">
                  → Select <span className="text-white/50 font-semibold">"Create API key in new project"</span>
                </p>
                <p className="text-[11px] text-white/20 mt-0.5">This auto-creates a project with the API enabled for you</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-indigo-400">3</span>
              </div>
              <div>
                <p className="text-xs text-white/60 font-semibold">Copy the API Key</p>
                <div className="mt-1 text-[11px] text-white/30 space-y-1">
                  <p>→ Key looks like <code className="text-white/50 font-mono text-[10px]">AIzaSy...</code></p>
                  <p>→ Click <span className="text-white/50 font-semibold">"Copy Key"</span> (not "Copy cURL")</p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-emerald-400">4</span>
              </div>
              <div>
                <p className="text-xs text-white/60 font-semibold">Paste here & save</p>
                <div className="mt-1 text-[11px] text-white/30 space-y-0.5">
                  <p>→ Click <span className="text-white/50 font-semibold">"Add API Key"</span> above</p>
                  <p>→ Paste → <span className="text-white/50 font-semibold">"Save Key"</span></p>
                  <p>→ Hit <span className="text-white/50 font-semibold">✓</span> to test</p>
                </div>
              </div>
            </div>

            {/* Warning: Don't use these */}
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/10">
              <HiOutlineExclamation className="text-red-400/60 shrink-0 mt-0.5" size={12} />
              <div className="text-[10px] text-red-400/60 leading-relaxed">
                <p className="font-semibold mb-1">⚠ Do NOT use these (they require billing):</p>
                <p>→ console.cloud.google.com (Google Cloud Console)</p>
                <p>→ Vertex AI / Agent Platform / Enterprise setup</p>
                <p className="mt-1">Only use <span className="font-semibold">aistudio.google.com</span> — it's free!</p>
              </div>
            </div>

            {/* Rate limit info */}
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <HiOutlineExclamation className="text-amber-400/60 shrink-0 mt-0.5" size={12} />
              <p className="text-[10px] text-amber-400/60 leading-relaxed">
                Free tier: ~15 req/min, ~1500/day. "Quota exceeded"? Wait 1 min and retry.{' '}
                <a href="https://ai.google.dev/gemini-api/docs/rate-limits" target="_blank" rel="noopener noreferrer" className="underline">See limits</a>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Security Note */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
        <HiOutlineExclamation className="text-amber-400/60 shrink-0 mt-0.5" size={14} />
        <p className="text-[10px] text-white/25 leading-relaxed">
          Your API key is encrypted with AES-256 before storage. The platform never stores or accesses your key in plaintext. 
          All AI costs are billed directly to your Google account.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyManager;
