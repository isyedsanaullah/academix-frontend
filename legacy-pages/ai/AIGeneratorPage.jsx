import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  HiOutlineSparkles, HiOutlineClipboardCopy, HiOutlineDownload,
  HiOutlineRefresh, HiOutlinePrinter
} from 'react-icons/hi';

/**
 * AIGeneratorPage — Reusable page for all AI generation modules.
 * Props:
 *  - title: Page title
 *  - description: Subtitle
 *  - endpoint: API endpoint (e.g. '/ai/generate/quiz')
 *  - fields: Array of field configs [{name, label, type, placeholder, required, options}]
 *  - icon: Icon component
 */
const AIGeneratorPage = ({ title, description, endpoint, fields, icon: Icon = HiOutlineSparkles }) => {
  const [form, setForm] = useState({});
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (name, value) => setForm(prev => ({ ...prev, [name]: value }));

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult('');
    try {
      const { data } = await api.post(endpoint, form);
      setResult(data.data?.content || 'No content generated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally { setLoading(false); }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    toast.success('Copied to clipboard!');
  };

  const printResult = () => {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>${title}</title><style>
      body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1a1a1a; line-height: 1.6; }
      h1,h2,h3 { color: #333; } pre { background: #f5f5f5; padding: 12px; border-radius: 8px; }
      table { border-collapse: collapse; width: 100%; } th,td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    </style></head><body>${document.querySelector('.prose-output')?.innerHTML || result}</body></html>`);
    win.document.close();
    win.print();
  };

  const downloadResult = () => {
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Icon className="text-indigo-400" size={24} /> {title}
        </h1>
        <p className="text-white/30 text-sm mt-1">{description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="glass-card p-6">
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Configuration</p>
          <form onSubmit={handleGenerate} className="space-y-4">
            {fields.map(field => (
              <div key={field.name}>
                <label className="block text-xs text-white/40 mb-1.5">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={form[field.name] || ''}
                    onChange={e => updateField(field.name, e.target.value)}
                    className="input-field"
                    required={field.required}
                  >
                    <option value="">Select...</option>
                    {field.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={form[field.name] || ''}
                    onChange={e => updateField(field.name, e.target.value)}
                    className="input-field"
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={3}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={form[field.name] || ''}
                    onChange={e => updateField(field.name, e.target.value)}
                    className="input-field"
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}
              </div>
            ))}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? (
                <span className="flex items-center gap-2">
                  <HiOutlineRefresh size={16} className="animate-spin" /> Generating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <HiOutlineSparkles size={16} /> Generate
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Output */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Output</p>
            {result && (
              <div className="flex gap-1">
                <button onClick={copyResult} title="Copy" className="p-1.5 rounded-lg text-white/25 hover:text-indigo-400 hover:bg-indigo-500/10 transition">
                  <HiOutlineClipboardCopy size={15} />
                </button>
                <button onClick={downloadResult} title="Download" className="p-1.5 rounded-lg text-white/25 hover:text-emerald-400 hover:bg-emerald-500/10 transition">
                  <HiOutlineDownload size={15} />
                </button>
                <button onClick={printResult} title="Print" className="p-1.5 rounded-lg text-white/25 hover:text-amber-400 hover:bg-amber-500/10 transition">
                  <HiOutlinePrinter size={15} />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-white/30 text-sm">Generating with AI...</p>
              </div>
            ) : result ? (
              <div className="prose-output prose-chat text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Icon className="text-white/10 mb-3" size={32} />
                <p className="text-white/20 text-sm">Configure and generate to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGeneratorPage;
