'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  HiOutlineSparkles,
  HiOutlineCurrencyDollar,
  HiOutlineChartBar,
  HiOutlineServer,
  HiOutlineClock,
  HiOutlineFilter,
  HiOutlineDownload,
  HiOutlineBell,
  HiOutlineAdjustments,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationCircle,
  HiOutlineExternalLink,
  HiOutlineClipboardCopy,
  HiOutlineSearch,
  HiOutlineOfficeBuilding,
  HiOutlineCube
} from 'react-icons/hi';

// Helper formatters
const formatTokens = (val) => {
  const num = Number(val) || 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toLocaleString();
};

const formatCostUsd = (val) => {
  const num = Number(val) || 0;
  if (num === 0) return '$0.00';
  if (num < 0.01) return `$${num.toFixed(4)}`;
  return `$${num.toFixed(3)}`;
};

export default function SuperAdminAiUsageClient() {
  // Filter States
  const [datePreset, setDatePreset] = useState('30d'); // 'today' | '7d' | '30d' | 'month' | 'all' | 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedFeature, setSelectedFeature] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('models'); // 'models' | 'colleges' | 'features' | 'pricing'
  const [chartMetric, setChartMetric] = useState('cost'); // 'cost' | 'tokens' | 'requests'

  // Pagination for Requests Log
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Data States
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [summary, setSummary] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [byModel, setByModel] = useState([]);
  const [byCollege, setByCollege] = useState([]);
  const [byFeature, setByFeature] = useState([]);
  const [requestsData, setRequestsData] = useState({ records: [], total: 0, totalPages: 1 });
  const [collegesList, setCollegesList] = useState([]);
  const [pricingTiers, setPricingTiers] = useState([]);

  // Modals
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    dailyCostLimitUsd: 20,
    monthlyCostLimitUsd: 300,
    dailyTokenLimit: '10000000',
    alertEmail: 'admin@collegeshub.com',
    isEnabled: true
  });
  const [savingAlert, setSavingAlert] = useState(false);

  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingForm, setPricingForm] = useState({
    modelName: '',
    provider: 'gemini',
    inputPricePerMillionUsd: '',
    outputPricePerMillionUsd: '',
    cachedInputPricePerMillionUsd: '',
    notes: ''
  });
  const [savingPricing, setSavingPricing] = useState(false);

  // Compute actual date strings based on preset
  const getDateRange = useCallback(() => {
    const now = new Date();
    let startDate = '';
    let endDate = now.toISOString().slice(0, 10);

    if (datePreset === 'today') {
      startDate = endDate;
    } else if (datePreset === '7d') {
      const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate = d.toISOString().slice(0, 10);
    } else if (datePreset === '30d') {
      const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate = d.toISOString().slice(0, 10);
    } else if (datePreset === 'month') {
      startDate = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
    } else if (datePreset === 'custom') {
      startDate = customStart;
      endDate = customEnd || endDate;
    }

    return { startDate, endDate };
  }, [datePreset, customStart, customEnd]);

  // Main data loader function
  const loadData = useCallback(async () => {
    try {
      const { startDate, endDate } = getDateRange();
      const params = {
        startDate,
        endDate,
        collegeId: selectedCollege || undefined,
        modelName: selectedModel || undefined,
        featureKey: selectedFeature || undefined,
        status: selectedStatus || undefined,
        search: searchQuery || undefined
      };

      const [summaryRes, tsRes, modelRes, collegeRes, featRes, reqRes, pricingRes] = await Promise.all([
        api.get('/super-admin/usage/ai/summary', { params }),
        api.get('/super-admin/usage/ai/timeseries', { params }),
        api.get('/super-admin/usage/ai/by-model', { params }),
        api.get('/super-admin/usage/ai/by-college', { params }),
        api.get('/super-admin/usage/ai/by-feature', { params }),
        api.get('/super-admin/usage/ai/requests', {
          params: { ...params, page: currentPage, limit: pageSize }
        }),
        api.get('/super-admin/usage/ai/pricing')
      ]);

      if (summaryRes.data?.success) setSummary(summaryRes.data.data);
      if (tsRes.data?.success) setTimeseries(tsRes.data.data);
      if (modelRes.data?.success) setByModel(modelRes.data.data);
      if (collegeRes.data?.success) {
        setByCollege(collegeRes.data.data);
        const cols = collegeRes.data.data
          .filter(c => c.collegeId)
          .map(c => ({ id: c.collegeId, name: c.collegeName, code: c.collegeCode }));
        setCollegesList(cols);
      }
      if (featRes.data?.success) setByFeature(featRes.data.data);
      if (reqRes.data?.success) setRequestsData(reqRes.data.data);
      if (pricingRes.data?.success) setPricingTiers(pricingRes.data.data);
    } catch (err) {
      console.error('Failed to load AI usage analytics:', err);
      toast.error('Failed to load AI usage analytics');
    } finally {
      setLoading(false);
    }
  }, [getDateRange, selectedCollege, selectedModel, selectedFeature, selectedStatus, searchQuery, currentPage, pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setLoading(true);
    loadData();
  };

  // Load alert settings on mount
  useEffect(() => {
    api.get('/super-admin/usage/ai/alerts')
      .then(res => {
        if (res.data?.success && res.data.data) {
          setAlertConfig({
            dailyCostLimitUsd: Number(res.data.data.dailyCostLimitUsd || 20),
            monthlyCostLimitUsd: Number(res.data.data.monthlyCostLimitUsd || 300),
            dailyTokenLimit: res.data.data.dailyTokenLimit ? String(res.data.data.dailyTokenLimit) : '10000000',
            alertEmail: res.data.data.alertEmail || 'admin@collegeshub.com',
            isEnabled: res.data.data.isEnabled ?? true
          });
        }
      })
      .catch(() => {});
  }, []);

  // Save Alert Settings
  const handleSaveAlerts = async (e) => {
    e.preventDefault();
    try {
      setSavingAlert(true);
      const res = await api.put('/super-admin/usage/ai/alerts', alertConfig);
      if (res.data?.success) {
        toast.success('Alert settings updated successfully');
        setShowAlertModal(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update alert settings');
    } finally {
      setSavingAlert(false);
    }
  };

  // Add Pricing Tier
  const handleCreatePricing = async (e) => {
    e.preventDefault();
    try {
      setSavingPricing(true);
      const res = await api.post('/super-admin/usage/ai/pricing', {
        ...pricingForm,
        inputPricePerMillionUsd: Number(pricingForm.inputPricePerMillionUsd),
        outputPricePerMillionUsd: Number(pricingForm.outputPricePerMillionUsd),
        cachedInputPricePerMillionUsd: Number(pricingForm.cachedInputPricePerMillionUsd || 0)
      });
      if (res.data?.success) {
        toast.success('New pricing tier registered');
        setShowPricingModal(false);
        setPricingForm({
          modelName: '',
          provider: 'gemini',
          inputPricePerMillionUsd: '',
          outputPricePerMillionUsd: '',
          cachedInputPricePerMillionUsd: '',
          notes: ''
        });
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save pricing tier');
    } finally {
      setSavingPricing(false);
    }
  };

  // Handle CSV Export
  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const { startDate, endDate } = getDateRange();
      const params = new URLSearchParams({
        startDate: startDate || '',
        endDate: endDate || '',
        collegeId: selectedCollege || '',
        modelName: selectedModel || '',
        featureKey: selectedFeature || '',
        status: selectedStatus || ''
      });

      const response = await api.get(`/super-admin/usage/ai/export?${params.toString()}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `collegeshub-ai-usage-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV export downloaded');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Top Header & Billing Distinction Banner ──────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <HiOutlineSparkles className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI API Usage & Telemetry
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time Google Gemini token metrics, infrastructure cost estimation, and institutional tenant breakdown.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAlertModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 transition"
          >
            <HiOutlineBell className="w-4 h-4 text-amber-500" />
            Alerts
          </button>

          <button
            onClick={() => setShowPricingModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 transition"
          >
            <HiOutlineAdjustments className="w-4 h-4 text-indigo-500" />
            Pricing Tiers
          </button>

          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
          >
            <HiOutlineDownload className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>

          <button
            onClick={handleRefresh}
            title="Refresh Data"
            className="p-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 transition"
          >
            <HiOutlineRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Google AI Studio Provider Reference Banner ───────────────────────── */}
      <div className="relative overflow-hidden rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/80 p-4 dark:border-indigo-900/50 dark:from-indigo-950/30 dark:via-gray-900 dark:to-blue-950/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 mt-0.5 p-1.5 rounded-md bg-indigo-600 text-white">
              <HiOutlineServer className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Google Gemini Infrastructure Telemetry
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                Estimated costs shown here are computed strictly from real prompt, completion, and cached token metadata at published Google Gemini rates.
                This reflects raw upstream Google infrastructure usage, segregated from internal institutional AI credit consumption.
              </p>
            </div>
          </div>

          <a
            href="https://aistudio.google.com/app/plan_information"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-md hover:bg-indigo-50 shadow-xs dark:bg-gray-800 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-gray-700 transition flex-shrink-0"
          >
            Google AI Studio Billing
            <HiOutlineExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ─── Filters & Range Controls ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setDatePreset(p.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  datePreset === p.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <HiOutlineSearch className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Request ID or Error..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Custom Date Pickers */}
        {datePreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
            <span className="text-gray-500">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-white"
            />
            <span className="text-gray-500">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-white"
            />
          </div>
        )}

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">College Tenant</label>
            <select
              value={selectedCollege}
              onChange={(e) => { setSelectedCollege(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none"
            >
              <option value="">All Colleges & Platform</option>
              <option value="platform">System Only (Global / Super Admin)</option>
              {collegesList.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Gemini Model</label>
            <select
              value={selectedModel}
              onChange={(e) => { setSelectedModel(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none"
            >
              <option value="">All Models</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              <option value="text-embedding-004">text-embedding-004</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Feature / Engine</label>
            <select
              value={selectedFeature}
              onChange={(e) => { setSelectedFeature(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none"
            >
              <option value="">All Features</option>
              <option value="ai-chat">AI Chat</option>
              <option value="student-tutor">Student AI Tutor</option>
              <option value="quiz-generator">Quiz Generator</option>
              <option value="assignment-grade">Assignment Grader</option>
              <option value="announcement-generator">Announcement Generator</option>
              <option value="pdf-toc-extraction">PDF TOC / Knowledge</option>
              <option value="vector-embedding">Vector Embeddings</option>
              <option value="super-admin-report-spec">Super Admin Reports</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Execution Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
              <option value="RATE_LIMITED">RATE_LIMITED</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── 4 Top KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cost Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estimated Cost</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg">
              <HiOutlineCurrencyDollar className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCostUsd(summary?.estimatedCostUsd)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              USD estimated at model tier rates
            </p>
          </div>
        </div>

        {/* Tokens Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tokens Processed</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-lg">
              <HiOutlineCube className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatTokens(summary?.totalTokens)}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1">
              <span>In: {formatTokens(summary?.promptTokens)}</span>
              <span>•</span>
              <span>Out: {formatTokens(summary?.outputTokens)}</span>
              <span>•</span>
              <span>Cached: {formatTokens(summary?.cachedTokens)}</span>
            </div>
          </div>
        </div>

        {/* Requests & Success Rate */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">API Requests</span>
            <span className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-lg">
              <HiOutlineChartBar className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {(summary?.totalRequests || 0).toLocaleString()}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                {summary?.successRate || 100}% OK
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1">
              <span className="text-red-500">Failed: {summary?.failedCount || 0}</span>
              <span>•</span>
              <span className="text-amber-500">Rate-limited: {summary?.rateLimitedCount || 0}</span>
            </div>
          </div>
        </div>

        {/* Active Tenants & Latency */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenants & Speed</span>
            <span className="p-2 bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 rounded-lg">
              <HiOutlineOfficeBuilding className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {summary?.activeCollegesCount || 0} Colleges
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
              <HiOutlineClock className="w-3.5 h-3.5 text-gray-400" />
              <span>Avg Latency: {summary?.avgDurationMs || 0} ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Interactive Recharts Timeline ────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Usage & Cost Trajectory</h3>
            <p className="text-xs text-gray-500">Daily historical distribution over selected period</p>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setChartMetric('cost')}
              className={`px-3 py-1 rounded-md transition ${
                chartMetric === 'cost' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Estimated Cost ($)
            </button>
            <button
              onClick={() => setChartMetric('tokens')}
              className={`px-3 py-1 rounded-md transition ${
                chartMetric === 'tokens' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Tokens Volume
            </button>
            <button
              onClick={() => setChartMetric('requests')}
              className={`px-3 py-1 rounded-md transition ${
                chartMetric === 'requests' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Requests
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          {timeseries.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs">
              <HiOutlineChartBar className="w-10 h-10 mb-2 stroke-1 text-gray-300 dark:text-gray-600" />
              <span>No AI API requests recorded during this date window</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartMetric === 'cost' ? (
                <AreaChart data={timeseries}>
                  <defs>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(value) => [`$${Number(value).toFixed(4)}`, 'Estimated Cost']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area type="monotone" dataKey="estimatedCostUsd" stroke="#10b981" strokeWidth={2} fill="url(#costGrad)" />
                </AreaChart>
              ) : chartMetric === 'tokens' ? (
                <AreaChart data={timeseries}>
                  <defs>
                    <linearGradient id="promptGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} tickFormatter={(v) => formatTokens(v)} />
                  <Tooltip formatter={(v) => [Number(v).toLocaleString(), '']} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Area type="monotone" dataKey="promptTokens" name="Prompt Tokens" stackId="1" stroke="#6366f1" fill="url(#promptGrad)" />
                  <Area type="monotone" dataKey="outputTokens" name="Output Tokens" stackId="1" stroke="#ec4899" fill="url(#outGrad)" />
                </AreaChart>
              ) : (
                <BarChart data={timeseries}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="successful" name="Success" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rateLimited" name="Rate Limited" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ─── Granular Breakdown Tabs (Model / College / Feature / Pricing) ──────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
        {/* Tabs header */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 px-4 gap-2 bg-gray-50/50 dark:bg-gray-800/40">
          {[
            { id: 'models', label: 'Model Breakdown', count: byModel.length },
            { id: 'colleges', label: 'College-Wise Consumption', count: byCollege.length },
            { id: 'features', label: 'Feature Breakdown', count: byFeature.length },
            { id: 'pricing', label: 'Active Pricing Tiers', count: pricingTiers.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab 1: By Model */}
        {activeTab === 'models' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="py-3 px-4">Model Name</th>
                  <th className="py-3 px-4">Requests</th>
                  <th className="py-3 px-4">Prompt Tokens</th>
                  <th className="py-3 px-4">Output Tokens</th>
                  <th className="py-3 px-4">Cached Tokens</th>
                  <th className="py-3 px-4">Total Tokens</th>
                  <th className="py-3 px-4">Estimated Cost</th>
                  <th className="py-3 px-4">% Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {byModel.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-gray-400">No model usage recorded in this range</td>
                  </tr>
                ) : (
                  byModel.map((m, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="py-3 px-4 font-mono font-medium text-gray-900 dark:text-white">{m.modelName}</td>
                      <td className="py-3 px-4">{(m.requestCount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4">{formatTokens(m.promptTokens)}</td>
                      <td className="py-3 px-4">{formatTokens(m.outputTokens)}</td>
                      <td className="py-3 px-4">{formatTokens(m.cachedTokens)}</td>
                      <td className="py-3 px-4 font-semibold">{formatTokens(m.totalTokens)}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">{formatCostUsd(m.estimatedCostUsd)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, m.percentageOfCost || 0)}%` }} />
                          </div>
                          <span>{m.percentageOfCost || 0}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: By College */}
        {activeTab === 'colleges' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="py-3 px-4">College Tenant</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Requests</th>
                  <th className="py-3 px-4">Prompt Tokens</th>
                  <th className="py-3 px-4">Output Tokens</th>
                  <th className="py-3 px-4">Total Tokens</th>
                  <th className="py-3 px-4">Estimated Cost</th>
                  <th className="py-3 px-4">% Cost</th>
                  <th className="py-3 px-4">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {byCollege.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-gray-400">No tenant activity recorded in this range</td>
                  </tr>
                ) : (
                  byCollege.map((c, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{c.collegeName}</td>
                      <td className="py-3 px-4 font-mono text-gray-500">{c.collegeCode}</td>
                      <td className="py-3 px-4">{(c.requestCount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4">{formatTokens(c.promptTokens)}</td>
                      <td className="py-3 px-4">{formatTokens(c.outputTokens)}</td>
                      <td className="py-3 px-4 font-semibold">{formatTokens(c.totalTokens)}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">{formatCostUsd(c.estimatedCostUsd)}</td>
                      <td className="py-3 px-4">{c.percentageOfCost || 0}%</td>
                      <td className="py-3 px-4 text-gray-500">{c.lastRequestAt ? new Date(c.lastRequestAt).toLocaleString() : '---'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: By Feature */}
        {activeTab === 'features' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="py-3 px-4">Feature Key</th>
                  <th className="py-3 px-4">Total Requests</th>
                  <th className="py-3 px-4">Total Tokens</th>
                  <th className="py-3 px-4">Estimated Cost (USD)</th>
                  <th className="py-3 px-4">Avg Duration</th>
                  <th className="py-3 px-4">% Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {byFeature.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400">No feature activity recorded in this range</td>
                  </tr>
                ) : (
                  byFeature.map((f, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="py-3 px-4 font-mono font-medium text-gray-900 dark:text-white">{f.featureKey}</td>
                      <td className="py-3 px-4">{(f.requestCount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 font-semibold">{formatTokens(f.totalTokens)}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">{formatCostUsd(f.estimatedCostUsd)}</td>
                      <td className="py-3 px-4 text-gray-500">{f.avgDurationMs} ms</td>
                      <td className="py-3 px-4">{f.percentageOfCost || 0}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Pricing Reference */}
        {activeTab === 'pricing' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="py-3 px-4">Model Name</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Prompt Price / 1M</th>
                  <th className="py-3 px-4">Completion Price / 1M</th>
                  <th className="py-3 px-4">Cached Input / 1M</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {pricingTiers.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="py-3 px-4 font-mono font-semibold text-gray-900 dark:text-white">{p.modelName}</td>
                    <td className="py-3 px-4 uppercase text-gray-500">{p.provider}</td>
                    <td className="py-3 px-4 font-mono">v{p.version}</td>
                    <td className="py-3 px-4 font-mono font-medium">${Number(p.inputPricePerMillionUsd).toFixed(4)}</td>
                    <td className="py-3 px-4 font-mono font-medium">${Number(p.outputPricePerMillionUsd).toFixed(4)}</td>
                    <td className="py-3 px-4 font-mono">${Number(p.cachedInputPricePerMillionUsd || 0).toFixed(4)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        ACTIVE
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{p.notes || '---'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Granular Request History Table ────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Granular Request Logs</h3>
            <p className="text-xs text-gray-500">Immutable execution telemetry records without student PII or prompts</p>
          </div>
          <span className="text-xs text-gray-500">
            Total {requestsData.total.toLocaleString()} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">College</th>
                <th className="py-3 px-4">Feature</th>
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4">Tokens (In / Out / Tot)</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Est. Cost</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {requestsData.records.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-gray-400">
                    <HiOutlineServer className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No individual AI request records match your filters
                  </td>
                </tr>
              ) : (
                requestsData.records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="py-3 px-4 whitespace-nowrap text-gray-500">
                      {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}{' '}
                      <span className="text-[10px] text-gray-400">{new Date(r.createdAt).toISOString().slice(5, 10)}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[11px] text-gray-800 dark:text-gray-200">
                          {r.requestId?.slice(0, 10)}...
                        </span>
                        <button
                          onClick={() => copyToClipboard(r.requestId)}
                          title="Copy Full Request ID"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <HiOutlineClipboardCopy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900 dark:text-white">{r.collegeName}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-800 font-mono text-gray-700 dark:text-gray-300">
                        {r.featureKey}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-gray-600 dark:text-gray-400">
                      {r.modelName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-[11px] font-mono">
                      {r.promptTokens} / {r.outputTokens} / <strong className="text-gray-900 dark:text-white">{r.totalTokens}</strong>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-500">
                      {r.durationMs} ms
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCostUsd(r.estimatedCostUsd)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {r.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          <HiOutlineCheckCircle className="w-3 h-3" /> SUCCESS
                        </span>
                      ) : r.status === 'RATE_LIMITED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                          <HiOutlineExclamationCircle className="w-3 h-3" /> RATE_LIMITED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400" title={r.errorMessage || ''}>
                          <HiOutlineXCircle className="w-3 h-3" /> FAILED
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {requestsData.totalPages > 1 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
            <div>
              Page {requestsData.page} of {requestsData.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= requestsData.totalPages}
                onClick={() => setCurrentPage(p => Math.min(requestsData.totalPages, p + 1))}
                className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Modal: Configurable Alerts ────────────────────────────────────────── */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full border border-gray-200 dark:border-gray-800 p-6 shadow-xl">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HiOutlineBell className="w-5 h-5 text-amber-500" />
              Configure AI Usage Alerts
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Set automated notifications when infrastructure thresholds are reached.
            </p>

            <form onSubmit={handleSaveAlerts} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Daily Cost Threshold (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={alertConfig.dailyCostLimitUsd}
                  onChange={(e) => setAlertConfig({ ...alertConfig, dailyCostLimitUsd: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Monthly Cost Threshold (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={alertConfig.monthlyCostLimitUsd}
                  onChange={(e) => setAlertConfig({ ...alertConfig, monthlyCostLimitUsd: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Daily Token Limit
                </label>
                <input
                  type="text"
                  value={alertConfig.dailyTokenLimit}
                  onChange={(e) => setAlertConfig({ ...alertConfig, dailyTokenLimit: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Alert Recipient Email
                </label>
                <input
                  type="email"
                  value={alertConfig.alertEmail}
                  onChange={(e) => setAlertConfig({ ...alertConfig, alertEmail: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="enableAlerts"
                  checked={alertConfig.isEnabled}
                  onChange={(e) => setAlertConfig({ ...alertConfig, isEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <label htmlFor="enableAlerts" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Enable active automated threshold alerts
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAlertModal(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAlert}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingAlert ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: Register Pricing Tier ──────────────────────────────────────── */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full border border-gray-200 dark:border-gray-800 p-6 shadow-xl">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HiOutlineAdjustments className="w-5 h-5 text-indigo-500" />
              Register AI Model Pricing Tier
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Add or update historical pricing tiers without hardcoding rates.
            </p>

            <form onSubmit={handleCreatePricing} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Model Identifier (e.g. gemini-2.0-flash)
                </label>
                <input
                  type="text"
                  required
                  value={pricingForm.modelName}
                  onChange={(e) => setPricingForm({ ...pricingForm, modelName: e.target.value })}
                  placeholder="gemini-2.0-flash"
                  className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Input / 1M ($)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={pricingForm.inputPricePerMillionUsd}
                    onChange={(e) => setPricingForm({ ...pricingForm, inputPricePerMillionUsd: e.target.value })}
                    placeholder="0.1000"
                    className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Output / 1M ($)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={pricingForm.outputPricePerMillionUsd}
                    onChange={(e) => setPricingForm({ ...pricingForm, outputPricePerMillionUsd: e.target.value })}
                    placeholder="0.4000"
                    className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Cached Input / 1M ($) (optional)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={pricingForm.cachedInputPricePerMillionUsd}
                  onChange={(e) => setPricingForm({ ...pricingForm, cachedInputPricePerMillionUsd: e.target.value })}
                  placeholder="0.0250"
                  className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Tier Notes
                </label>
                <input
                  type="text"
                  value={pricingForm.notes}
                  onChange={(e) => setPricingForm({ ...pricingForm, notes: e.target.value })}
                  placeholder="Google AI Studio updated rate"
                  className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowPricingModal(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPricing}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingPricing ? 'Registering...' : 'Register Tier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

