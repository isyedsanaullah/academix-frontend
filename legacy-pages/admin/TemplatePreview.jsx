import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { 
  HiOutlineDocumentText, 
  HiOutlineCreditCard, 
  HiOutlineReceiptTax, 
  HiOutlineIdentification,
  HiOutlineDownload,
  HiOutlineEye,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

const TEMPLATES = [
  {
    id: 'certificate',
    title: 'Academic Certificates',
    subtitle: 'Character, Bonafide, Hope, Leaving & Migration Certificates',
    icon: HiOutlineDocumentText,
    badge: 'Standard Plan',
    color: 'from-blue-600 to-indigo-700',
    description: 'A4 portrait orientation with collegiate ornate borders, official seal, student photograph, and QR-verifiable authenticity token.',
    previewEndpoint: '/documents/preview/certificate.pdf'
  },
  {
    id: 'voucher',
    title: '3-Copy Bank Challan',
    subtitle: 'Bank, College & Student Copies',
    icon: HiOutlineCreditCard,
    badge: 'Fees Basic / Starter',
    color: 'from-amber-500 to-orange-600',
    description: 'Triplicate bank challan on a single A4 page with cutting guides, automated fee breakdown, designated bank accounts, and verification token.',
    previewEndpoint: '/documents/preview/voucher.pdf'
  },
  {
    id: 'receipt',
    title: 'Verified Paid Receipt',
    subtitle: 'Settled Fee Voucher with Official PAID Stamp',
    icon: HiOutlineReceiptTax,
    badge: 'Standard Plan',
    color: 'from-emerald-600 to-teal-700',
    description: 'High-security payment receipt printed with prominent PAID watermark, accountant signature, settlement method, and bank clearance reference.',
    previewEndpoint: '/documents/preview/receipt.pdf'
  },
  {
    id: 'card',
    title: 'ISO CR80 Student ID Card',
    subtitle: 'Standard 85.6 x 54 mm Single & 8-Up Sheet',
    icon: HiOutlineIdentification,
    badge: 'Standard Plan',
    color: 'from-purple-600 to-pink-700',
    description: 'Two-sided laminated identity card with student photo, gate scanner QR code, emergency contacts, session validity, and principal signature block.',
    previewEndpoint: '/documents/preview/card.pdf'
  }
];

/**
 * Fetch a PDF from a protected endpoint (with JWT token) and return a blob URL.
 * Returns null and sets error message if the fetch fails.
 */
async function fetchAuthPdfBlob(endpoint, setError) {
  try {
    const response = await api.get(endpoint, { responseType: 'blob' });
    return URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  } catch (err) {
    const status = err.response?.status;
    if (status === 403) {
      setError('Your plan does not include this template. Upgrade to Standard or higher.');
    } else if (status === 401) {
      setError('Session expired. Please log in again.');
    } else {
      setError('Failed to load PDF preview. The server may still be generating the template.');
    }
    return null;
  }
}

export default function TemplatePreview() {
  const [activeTemplate, setActiveTemplate] = useState(TEMPLATES[0]);
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const prevBlobUrl = useRef(null);

  // Revoke old blob URL on cleanup to avoid memory leaks
  useEffect(() => {
    return () => {
      if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
    };
  }, []);

  const loadPreview = async (template) => {
    setLoading(true);
    setError(null);
    if (prevBlobUrl.current) {
      URL.revokeObjectURL(prevBlobUrl.current);
      prevBlobUrl.current = null;
    }
    setBlobUrl(null);

    const url = await fetchAuthPdfBlob(template.previewEndpoint, setError);
    if (url) {
      prevBlobUrl.current = url;
      setBlobUrl(url);
    }
    setLoading(false);
  };

  // Load on mount and when template changes
  useEffect(() => {
    loadPreview(activeTemplate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTemplate.id]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', `${activeTemplate.id}_sample.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFullscreen = () => {
    if (blobUrl) window.open(blobUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <HiOutlineDocumentText className="text-indigo-400" size={28} />
            Document Templates & Official Forms
          </h1>
          <p className="text-sm text-surface-400 mt-1">
            Enterprise stream-only PDF generation engine with cryptographic QR verification, custom college branding, and digital signatures.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadPreview(activeTemplate)}
            className="px-4 py-2 bg-surface-800 hover:bg-surface-700 text-white text-xs font-semibold rounded-lg border border-white/10 transition-colors flex items-center gap-1.5"
          >
            Refresh Preview
          </button>
          <button
            onClick={handleDownload}
            disabled={!blobUrl || loading}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <HiOutlineDownload size={16} />
            Download Sample PDF
          </button>
        </div>
      </div>

      {/* Template Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TEMPLATES.map((tmpl) => {
          const Icon = tmpl.icon;
          const isSelected = activeTemplate.id === tmpl.id;

          return (
            <div
              key={tmpl.id}
              onClick={() => setActiveTemplate(tmpl)}
              className={`cursor-pointer rounded-xl p-5 border transition-all duration-200 relative overflow-hidden ${
                isSelected
                  ? 'bg-surface-800/90 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                  : 'bg-surface-900/60 border-white/[0.08] hover:border-white/20 hover:bg-surface-800/50'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 text-indigo-400">
                  <HiOutlineCheckCircle size={20} />
                </div>
              )}

              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tmpl.color} flex items-center justify-center text-white mb-3 shadow-md`}>
                <Icon size={20} />
              </div>

              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-white/[0.08] text-surface-300">
                {tmpl.badge}
              </span>

              <h3 className="text-base font-bold text-white mt-2">{tmpl.title}</h3>
              <p className="text-xs text-surface-400 mt-1 line-clamp-2">{tmpl.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Main Preview Pane */}
      <div className="rounded-2xl bg-surface-900/90 border border-white/[0.08] overflow-hidden p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{activeTemplate.title}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                Live Server Render
              </span>
            </div>
            <p className="text-xs text-surface-400 mt-1">{activeTemplate.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFullscreen}
              disabled={!blobUrl}
              className="px-3.5 py-1.5 bg-surface-800 hover:bg-surface-700 text-surface-200 text-xs font-medium rounded-lg border border-white/10 flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <HiOutlineEye size={14} /> Fullscreen
            </button>
            <button
              onClick={handleDownload}
              disabled={!blobUrl || loading}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <HiOutlineDownload size={14} /> Download
            </button>
          </div>
        </div>

        {/* Live PDF Viewer */}
        <div className="w-full h-[680px] bg-surface-950 rounded-xl border border-white/[0.06] overflow-hidden flex items-center justify-center">
          {loading && (
            <div className="text-center text-surface-400">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium">Generating PDF preview…</p>
            </div>
          )}
          {!loading && error && (
            <div className="text-center text-surface-400 px-8 max-w-sm">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-sm font-semibold text-rose-400">{error}</p>
              <button
                onClick={() => loadPreview(activeTemplate)}
                className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 underline"
              >
                Try again
              </button>
            </div>
          )}
          {!loading && !error && blobUrl && (
            <iframe
              key={blobUrl}
              src={`${blobUrl}#toolbar=0&navpanes=0`}
              title={`Preview of ${activeTemplate.title}`}
              className="w-full h-full border-0 rounded-xl"
            />
          )}
        </div>
      </div>
    </div>
  );
}
