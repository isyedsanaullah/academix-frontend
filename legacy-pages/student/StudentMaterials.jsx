import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  HiOutlineDocumentText, HiOutlineDownload, HiOutlineSearch,
  HiOutlineBookOpen, HiOutlineSparkles, HiOutlineCheckCircle,
  HiOutlineAcademicCap, HiOutlineCalendar
} from 'react-icons/hi';

const StudentMaterials = () => {
  const [documents, setDocuments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');

  useEffect(() => {
    fetchDocuments();
    fetchSubjects();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data } = await api.get('/ai/pdf/documents');
      setDocuments(data.data || []);
    } catch (err) {
      toast.error('Failed to load study materials');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/ai/pdf/subjects');
      setSubjects(data.data || []);
    } catch { /* ignore */ }
  };

  const handleDownload = async (docId, fileName) => {
    try {
      toast.loading('Preparing document download...', { id: 'dl' });
      const response = await api.get(`/ai/pdf/download/${docId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'study-material.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download started!', { id: 'dl' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download document', { id: 'dl' });
    }
  };

  const filtered = documents.filter(d => {
    const matchesSearch = d.originalName?.toLowerCase().includes(search.toLowerCase()) ||
                          d.subject?.toLowerCase().includes(search.toLowerCase()) ||
                          d.chapter?.toLowerCase().includes(search.toLowerCase()) ||
                          d.description?.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = selectedSubject === 'ALL' || d.subject === selectedSubject;
    return matchesSearch && matchesSubject && d.status === 'ready';
  });

  const formatSize = (bytes) => {
    if (!bytes || bytes < 1024) return (bytes || 0) + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-violet-900/30 to-slate-900/50 border border-indigo-500/20 backdrop-blur-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-1">
              <HiOutlineBookOpen size={16} /> Course Material Library
            </div>
            <h1 className="text-2xl font-bold text-white">Study Materials & Notes</h1>
            <p className="text-white/40 text-sm mt-1 max-w-xl">
              Access official course content uploaded by your instructors. Read, download PDFs, or ask questions to the AI Course Assistant.
            </p>
          </div>
          <Link href="/student/ai/chat" className="btn-primary shrink-0 self-start md:self-auto">
            <HiOutlineSparkles size={18} /> Ask AI Assistant
          </Link>
        </div>
      </div>

      {/* Subject Filter Tags */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedSubject('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 border ${
            selectedSubject === 'ALL'
              ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
              : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/70'
          }`}
        >
          All Subjects ({documents.filter(d => d.status === 'ready').length})
        </button>
        {subjects.map(s => (
          <button
            key={s.subject}
            onClick={() => setSelectedSubject(s.subject)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 border ${
              selectedSubject === s.subject
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/70'
            }`}
          >
            {s.subject} ({s.documentCount})
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-10"
          placeholder="Search by topic, chapter, or subject..."
        />
      </div>

      {/* Materials List / Cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <HiOutlineBookOpen className="mx-auto text-white/20 mb-3" size={44} />
          <h3 className="text-white/70 font-semibold text-base mb-1">No Study Materials Found</h3>
          <p className="text-white/30 text-xs max-w-sm mx-auto">
            {search || selectedSubject !== 'ALL'
              ? 'No documents match your filter criteria. Try searching for a different subject or title.'
              : 'Your instructors have not uploaded any study material PDFs yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <div key={doc._id} className="glass-card p-5 hover:border-indigo-500/30 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                    <HiOutlineDocumentText className="text-red-400" size={22} />
                  </div>
                  <span className="badge badge-primary font-medium text-[11px]">
                    {doc.subject}
                  </span>
                </div>

                <h3 className="text-white/90 font-semibold text-sm line-clamp-2 mb-1 group-hover:text-indigo-300 transition-colors">
                  {doc.originalName}
                </h3>
                
                {doc.description && (
                  <p className="text-white/40 text-xs line-clamp-2 mb-3">
                    {doc.description}
                  </p>
                )}

                <div className="space-y-1 py-2 border-t border-b border-white/[0.06] mb-4 text-xs text-white/30">
                  {doc.chapter && (
                    <div className="flex justify-between">
                      <span>Chapter</span>
                      <span className="text-white/60 font-medium">{doc.chapter}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Page Count</span>
                    <span className="text-white/60 font-medium">{doc.pageCount || '—'} pages</span>
                  </div>
                  <div className="flex justify-between">
                    <span>File Size</span>
                    <span className="text-white/60 font-medium">{formatSize(doc.fileSize)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleDownload(doc._id, doc.originalName)}
                  className="btn-primary flex-1 justify-center py-2 text-xs"
                >
                  <HiOutlineDownload size={15} /> Download PDF
                </button>
                <Link
                  href="/student/ai/chat"
                  className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-indigo-500/40 text-white/50 hover:text-indigo-300 transition"
                  title="Ask AI about this document"
                >
                  <HiOutlineSparkles size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentMaterials;
