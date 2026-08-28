import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineCloudUpload, HiOutlineDocumentText, HiOutlineTrash,
  HiOutlineSearch, HiOutlineRefresh, HiOutlineCheckCircle,
  HiOutlineExclamation, HiOutlineClock
} from 'react-icons/hi';

const statusConfig = {
  ready:      { icon: HiOutlineCheckCircle, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Ready' },
  processing: { icon: HiOutlineClock,       color: 'text-amber-400 bg-amber-500/10 border-amber-500/20 animate-pulse',     label: 'Processing' },
  failed:     { icon: HiOutlineExclamation, color: 'text-red-400 bg-red-500/10 border-red-500/20',         label: 'Failed' },
  uploading:  { icon: HiOutlineCloudUpload, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',         label: 'Uploading' },
};

const PDFLibrary = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [retryingId, setRetryingId] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ subject: '', year: '', chapter: '', description: '' });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => { fetchDocuments(); fetchSubjects(); }, []);

  const fetchDocuments = async () => {
    try {
      const { data } = await api.get('/ai/pdf/documents');
      setDocuments(data.data || []);
    } catch (err) {
      if (err.response?.status !== 403) {
        toast.error('Failed to load documents');
      }
    } finally { setLoading(false); }
  };

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/ai/pdf/subjects');
      setSubjects(data.data || []);
    } catch { /* ignore */ }
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'pdf' || file.type !== 'application/pdf') {
      toast.error('Invalid file format. Only .pdf files are accepted.');
      return;
    }
    const MAX_SIZE = 25 * 1024 * 1024; // 25MB
    if (file.size > MAX_SIZE) {
      toast.error('File size exceeds the 25MB limit.');
      return;
    }
    setSelectedFile(file);
    setShowUpload(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return toast.error('Please select a valid PDF file');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      formData.append('subject', form.subject || 'General');
      formData.append('year', form.year);
      formData.append('chapter', form.chapter);
      formData.append('description', form.description);

      const res = await api.post('/ai/pdf/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.data?.isDuplicate) {
        toast.success('Duplicate PDF detected — existing processed document loaded!');
      } else {
        toast.success('PDF uploaded! Processing background job started...');
      }

      setShowUpload(false);
      setSelectedFile(null);
      setForm({ subject: '', year: '', chapter: '', description: '' });
      fetchDocuments();
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  const handleRetry = async (id) => {
    setRetryingId(id);
    try {
      await api.post(`/ai/pdf/retry/${id}`);
      toast.success('Retrying document processing in background...');
      fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Retry failed');
    } finally { setRetryingId(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document and all associated chunks and vectors?')) return;
    try {
      await api.delete(`/ai/pdf/${id}`);
      toast.success('Document deleted');
      fetchDocuments();
      fetchSubjects();
    } catch { toast.error('Delete failed'); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const filtered = documents.filter(d =>
    d.originalName?.toLowerCase().includes(search.toLowerCase()) ||
    d.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const formatSize = (bytes) => {
    if (!bytes || bytes < 1024) return (bytes || 0) + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">PDF Course Material Library</h1>
          <p className="text-white/30 text-sm mt-1">Upload study material for AI-powered student Q&A (Strict RAG with pgvector)</p>
        </div>
        <button onClick={() => { setShowUpload(true); setSelectedFile(null); }} className="btn-primary">
          <HiOutlineCloudUpload size={18} /> Upload PDF
        </button>
      </div>

      {/* Subject Stats */}
      {subjects.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {subjects.map(s => (
            <div key={s.subject} className="px-3 py-2 rounded-xl bg-[#0d1117] border border-white/[0.06] text-xs">
              <span className="text-white/70 font-semibold">{s.subject}</span>
              <span className="text-white/25 ml-2">{s.documentCount} docs · {s.totalChunks} chunks</span>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={17} />
        <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" placeholder="Search documents or subjects..." />
      </div>

      {/* Drop Zone (when no docs) */}
      {!loading && documents.length === 0 && !showUpload && (
        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            dragActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/10 hover:border-white/20'
          }`}
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <HiOutlineCloudUpload className="mx-auto text-white/20 mb-3" size={40} />
          <p className="text-white/40 text-sm font-medium">Drag & drop course PDFs here or click to browse</p>
          <p className="text-white/20 text-xs mt-1">PDF notes, handouts, books — up to 25MB per file</p>
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
        </div>
      )}

      {/* Documents Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document</th><th>Subject</th><th>Ver</th><th>Pages</th><th>Chunks</th><th>Status</th><th>Size</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => {
                  const st = statusConfig[doc.status] || statusConfig.uploading;
                  return (
                    <tr key={doc._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                            <HiOutlineDocumentText className="text-red-400" size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-white/80 font-medium text-sm truncate max-w-[240px]">{doc.originalName}</p>
                            {doc.errorMessage && <p className="text-red-400/80 text-[11px] truncate max-w-[240px]">{doc.errorMessage}</p>}
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-primary">{doc.subject}</span></td>
                      <td><span className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 text-[10px] font-mono">v{doc.versionNumber || 1}</span></td>
                      <td className="text-white/40 text-sm">{doc.pageCount || '—'}</td>
                      <td className="text-white/40 text-sm">{doc.chunkCount || '—'}</td>
                      <td>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.color}`}>
                          <st.icon size={12} /> {st.label}
                        </span>
                      </td>
                      <td className="text-white/30 text-xs">{formatSize(doc.fileSize)}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          {doc.status === 'failed' && (
                            <button
                              onClick={() => handleRetry(doc._id)}
                              disabled={retryingId === doc._id}
                              className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-xs hover:bg-amber-500/30 flex items-center gap-1 transition"
                              title="Retry processing"
                            >
                              <HiOutlineRefresh size={12} className={retryingId === doc._id ? 'animate-spin' : ''} /> Retry
                            </button>
                          )}
                          {doc.status === 'processing' && (
                            <button onClick={fetchDocuments} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-indigo-400 transition" title="Check status">
                              <HiOutlineRefresh size={14} />
                            </button>
                          )}
                          <button onClick={() => handleDelete(doc._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition" title="Delete document">
                            <HiOutlineTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-1">Upload Study Material</h2>
            <p className="text-white/30 text-xs mb-5">PDF will be processed, chunked, and indexed in PostgreSQL pgvector</p>

            {/* File Selection */}
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer mb-4 transition ${
                selectedFile ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/10 hover:border-white/20'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="flex items-center gap-3 justify-center">
                  <HiOutlineDocumentText className="text-indigo-400" size={24} />
                  <div className="text-left">
                    <p className="text-white/80 text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-white/30 text-xs">{formatSize(selectedFile.size)}</p>
                  </div>
                </div>
              ) : (
                <>
                  <HiOutlineCloudUpload className="mx-auto text-white/20 mb-2" size={28} />
                  <p className="text-white/40 text-xs">Click to select or drag & drop a PDF (Max 25MB)</p>
                </>
              )}
              <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-white/40 mb-1">Subject *</label>
                <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="input-field" placeholder="e.g. Physics" />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Year</label>
                <input value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="input-field" placeholder="e.g. 2026" />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Chapter</label>
                <input value={form.chapter} onChange={e => setForm({...form, chapter: e.target.value})} className="input-field" placeholder="e.g. Chapter 5" />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Description</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" placeholder="Brief notes description" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleUpload} disabled={!selectedFile || uploading} className="btn-primary flex-1 justify-center">
                {uploading ? 'Uploading...' : 'Upload & Process'}
              </button>
              <button onClick={() => { setShowUpload(false); setSelectedFile(null); }} className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFLibrary;
