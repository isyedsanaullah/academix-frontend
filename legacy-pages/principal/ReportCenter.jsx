'use client';

import { useState, useEffect } from 'react';
import { 
  HiOutlineDocumentReport, HiOutlineDownload, HiOutlineFilter, 
  HiOutlineEye, HiOutlineCheckCircle, HiOutlineExclamationCircle,
  HiOutlineRefresh, HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineOfficeBuilding
} from 'react-icons/hi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const REPORT_CATEGORIES = [
  {
    category: 'Student Reports (17)',
    icon: HiOutlineAcademicCap,
    reports: [
      { id: 'student-attendance', name: 'Student Attendance Report' },
      { id: 'attendance-percentage', name: 'Attendance Percentage Report' },
      { id: 'low-attendance', name: 'Low Attendance Report (<75%)' },
      { id: 'student-result', name: 'Student Result Report' },
      { id: 'subject-wise-result', name: 'Subject-wise Result Report' },
      { id: 'year-result', name: 'Year Result Report' },
      { id: 'merit-list', name: 'Merit List Report' },
      { id: 'student-performance', name: 'Student Performance Report' },
      { id: 'academic-progress', name: 'Academic Progress Report' },
      { id: 'student-fine', name: 'Student Fine Report' },
      { id: 'student-fee-status', name: 'Student Fee Status Report' },
      { id: 'outstanding-fee', name: 'Outstanding Fee Defaulters Report' },
      { id: 'student-profile', name: 'Student Profile Report' },
      { id: 'student-enrollment', name: 'Student Enrollment Report' },
      { id: 'student-admission', name: 'Student Admission Report' },
      { id: 'student-transfer', name: 'Student Transfer Report' },
      { id: 'student-withdrawal', name: 'Student Withdrawal Report' }
    ]
  },
  {
    category: 'Teacher Reports (4)',
    icon: HiOutlineUserGroup,
    reports: [
      { id: 'teacher-attendance', name: 'Teacher Attendance Report' },
      { id: 'teacher-workload', name: 'Teacher Workload Report' },
      { id: 'teacher-assigned-courses', name: 'Teacher Assigned Courses Report' },
      { id: 'teacher-performance-summary', name: 'Teacher Performance Summary' }
    ]
  },
  {
    category: 'College & Analytics Reports (8)',
    icon: HiOutlineOfficeBuilding,
    reports: [
      { id: 'class-summary', name: 'Class Summary Report' },
      { id: 'section-summary', name: 'Section Summary Report' },
      { id: 'course-summary', name: 'Course Summary Report' },
      { id: 'overall-college-statistics', name: 'Overall College Statistics' },
      { id: 'admission-statistics', name: 'Admission Statistics Report' },
      { id: 'fee-collection-summary', name: 'Fee Collection Summary' },
      { id: 'fine-collection-summary', name: 'Fine Collection Summary' },
      { id: 'student-growth', name: 'Student Growth Report' }
    ]
  }
];

export default function ReportCenter() {
  const [selectedReports, setSelectedReports] = useState(['overall-college-statistics']);
  const [activePreviewReport, setActivePreviewReport] = useState('overall-college-statistics');
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    session_id: '',
    class: '',
    section: '',
    student_id: '',
    teacher_id: ''
  });

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    fetchOptions();
    loadPreview('overall-college-statistics');
  }, []);

  const fetchOptions = async () => {
    try {
      const [clsRes, secRes] = await Promise.all([
        api.get('/classes').catch(() => ({ data: { data: [] } })),
        api.get('/sections').catch(() => ({ data: { data: [] } }))
      ]);
      setClasses(clsRes.data.data || []);
      setSections(secRes.data.data || []);
    } catch (e) {}
  };

  const toggleReportSelection = (id) => {
    setSelectedReports(prev => 
      prev.includes(id) ? (prev.length > 1 ? prev.filter(r => r !== id) : prev) : [...prev, id]
    );
  };

  const loadPreview = async (reportId) => {
    try {
      setLoadingPreview(true);
      setActivePreviewReport(reportId);
      const queryParams = new URLSearchParams({ reportType: reportId });
      Object.entries(filters).forEach(([k, v]) => { if (v) queryParams.append(k, v); });

      const res = await api.get(`/reports/preview?${queryParams.toString()}`);
      if (res.data.success) {
        setPreviewData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load report preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPdf(true);
      toast.loading('Generating professional PDF report...', { id: 'pdf-toast' });

      const response = await api.post('/reports/generate-pdf', {
        reportTypes: selectedReports,
        filters
      }, { responseType: 'blob' });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `College_Reports_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('PDF report downloaded successfully!', { id: 'pdf-toast' });
    } catch (err) {
      toast.error('Failed to generate PDF report', { id: 'pdf-toast' });
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 backdrop-blur-md rounded-xl text-blue-400 border border-blue-500/30">
              <HiOutlineDocumentReport className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Report Generation Center</h1>
              <p className="text-slate-300 text-sm mt-0.5">
                Generate 100% custom backend reports. Preview live tabular data and merge multiple reports into a single PDF.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={downloadingPdf || selectedReports.length === 0}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-5 py-3 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50"
        >
          <HiOutlineDownload className="w-5 h-5" />
          {downloadingPdf ? 'Generating PDF...' : `Export Selected PDF (${selectedReports.length})`}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <HiOutlineFilter className="w-4 h-4 text-blue-500" /> Filter Criteria
          </h2>
          <button
            onClick={() => {
              setFilters({ startDate: '', endDate: '', session_id: '', class: '', section: '', student_id: '', teacher_id: '' });
              loadPreview(activePreviewReport);
            }}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <HiOutlineRefresh className="w-3.5 h-3.5" /> Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Class</label>
            <select
              value={filters.class}
              onChange={(e) => setFilters({ ...filters, class: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Section</label>
            <select
              value={filters.section}
              onChange={(e) => setFilters({ ...filters, section: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Sections</option>
              {sections.map((s) => (
                <option key={s.id || s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => loadPreview(activePreviewReport)}
            className="bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition"
          >
            Apply Filters to Preview
          </button>
        </div>
      </div>

      {/* Main Grid: Left Category Picker, Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Report Selectors (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {REPORT_CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-3 flex items-center gap-2">
                  <Icon className="w-4 h-4 text-blue-500" /> {cat.category}
                </h3>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {cat.reports.map((rep) => {
                    const isSelected = selectedReports.includes(rep.id);
                    const isPreviewing = activePreviewReport === rep.id;
                    return (
                      <div
                        key={rep.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isPreviewing
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 font-medium text-blue-900 dark:text-blue-200'
                            : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5" onClick={() => loadPreview(rep.id)}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleReportSelection(rep.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                          <span>{rep.name}</span>
                        </div>

                        <button
                          onClick={() => loadPreview(rep.id)}
                          title="Preview Data"
                          className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <HiOutlineEye className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Live Data Preview (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                {previewData?.title || 'Report Live Data Preview'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verifying backend SQL data before exporting to PDF
              </p>
            </div>

            <button
              onClick={() => loadPreview(activePreviewReport)}
              className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition"
              title="Refresh Preview"
            >
              <HiOutlineRefresh className={`w-4 h-4 ${loadingPreview ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingPreview ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-medium">Fetching real-time report data...</p>
            </div>
          ) : previewData && previewData.rows ? (
            <div className="flex-1 flex flex-col">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 flex-1">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold">
                    <tr>
                      {previewData.headers.map((h, i) => (
                        <th key={i} className="p-3 border-b border-slate-200 dark:border-slate-700">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                    {previewData.rows.length === 0 ? (
                      <tr>
                        <td colSpan={previewData.headers.length} className="text-center py-8 text-slate-400">
                          No matching records found for applied filters.
                        </td>
                      </tr>
                    ) : (
                      previewData.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-3 whitespace-nowrap">{cell}</td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pt-4 text-xs text-slate-500 flex justify-between items-center">
                <span>Showing {previewData.rows.length} preview records</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {selectedReports.length} report(s) selected for PDF export
                </span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              Select a report from the left column to preview dataset.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
