'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineOfficeBuilding,
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineCurrencyDollar,
  HiOutlineCalendar,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineGlobe,
  HiOutlineArrowLeft,
  HiOutlineRefresh,
  HiOutlineSave,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlinePencil,
  HiOutlineBan,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
  HiOutlineClipboardCheck,
  HiOutlineClock,
  HiOutlineChartBar,
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlineSpeakerphone,
  HiOutlineShieldCheck,
  HiOutlineUser,
  HiOutlineBookOpen,
  HiOutlineDocumentDuplicate,
  HiOutlineSearch,
  HiOutlineAdjustments,
  HiOutlineInformationCircle,
  HiOutlineLockClosed,
  HiOutlineExclamation,
  HiOutlineEye,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineCreditCard
} from 'react-icons/hi';
import SubscriptionTab from '@/components/superAdmin/college/SubscriptionTab';
import MessagesTab from '@/components/superAdmin/college/MessagesTab';

// Dynamic Icon Map for Feature Registry
const ICON_MAP = {
  HiOutlineAcademicCap: HiOutlineAcademicCap,
  HiOutlineClipboardCheck: HiOutlineClipboardCheck,
  HiOutlineClock: HiOutlineClock,
  HiOutlineChartBar: HiOutlineChartBar,
  HiOutlineClipboardList: HiOutlineClipboardList,
  HiOutlineDocumentText: HiOutlineDocumentText,
  HiOutlineSpeakerphone: HiOutlineSpeakerphone,
  HiOutlineCurrencyDollar: HiOutlineCurrencyDollar,
  HiOutlineUserGroup: HiOutlineUserGroup,
  HiOutlineOfficeBuilding: HiOutlineOfficeBuilding,
  HiOutlineShieldCheck: HiOutlineShieldCheck,
  HiOutlineUser: HiOutlineUser,
  HiOutlineSparkles: HiOutlineSparkles,
  HiOutlineBookOpen: HiOutlineBookOpen,
  HiOutlineDocumentDuplicate: HiOutlineDocumentDuplicate
};

// Plan baseline definition for real-time frontend recalculation
const PLAN_FEATURES = {
  basic: [
    'core-academic',
    'students',
    'teachers',
    'subjects',
    'classes',
    'sections',
    'sessions',
    'attendance',
    'timetable',
    'exams-results',
    'exams',
    'results',
    'assignments-quizzes',
    'assignments',
    'quizzes',
    'certificates',
    'announcements',
    'notices'
  ],
  standard: [
    'core-academic',
    'students',
    'teachers',
    'subjects',
    'classes',
    'sections',
    'sessions',
    'attendance',
    'timetable',
    'exams-results',
    'exams',
    'results',
    'assignments-quizzes',
    'assignments',
    'quizzes',
    'certificates',
    'announcements',
    'notices',
    'fees',
    'entry-system',
    'visitors',
    'employees',
    'canteen',
    'analytics-reports',
    'analytics',
    'reports',
    'advanced'
  ],
  premium: [
    'core-academic',
    'students',
    'teachers',
    'subjects',
    'classes',
    'sections',
    'sessions',
    'attendance',
    'timetable',
    'exams-results',
    'exams',
    'results',
    'assignments-quizzes',
    'assignments',
    'quizzes',
    'certificates',
    'announcements',
    'notices',
    'fees',
    'entry-system',
    'visitors',
    'employees',
    'canteen',
    'analytics-reports',
    'analytics',
    'reports',
    'advanced',
    'ai-chat',
    'ai-pdf-chat',
    'ai-generators',
    'ai-study-assistant',
    'ai-paper-generator',
    'ai-quiz-generator',
    'ai-assignment-generator',
    'ai-notes-generator',
    'ai-syllabus-generator',
    'ai-mcq-generator'
  ]
};

const planBadges = {
  basic: {
    label: 'Basic Plan',
    classes: 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60'
  },
  standard: {
    label: 'Standard Plan',
    classes: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/20'
  },
  premium: {
    label: 'Premium Plan',
    classes: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/20'
  }
};

/**
 * Deterministic fixed-point resolution matching backend algorithm
 */
function computeReactiveFeatureMatrix(planId, baseRegistry, overrides) {
  const cleanPlan = (planId || 'basic').toLowerCase().trim();
  const planKey = cleanPlan.startsWith('prem') ? 'premium' : cleanPlan.startsWith('stand') ? 'standard' : 'basic';
  const planAllowed = PLAN_FEATURES[planKey] || PLAN_FEATURES.basic;
  const stateMap = new Map();

  for (const feat of baseRegistry) {
    const inPlan = planAllowed.includes(feat.key);
    const rawOverride = overrides[feat.key];
    let override = null;

    if (rawOverride === true || rawOverride === 'true' || (typeof rawOverride === 'object' && rawOverride?.state === 'on')) {
      if (typeof rawOverride === 'object' && rawOverride?.expiresAt && new Date(rawOverride.expiresAt).getTime() <= Date.now()) {
        override = null; // Expired override reverts to plan default
      } else {
        override = true;
      }
    } else if (rawOverride === false || rawOverride === 'false' || (typeof rawOverride === 'object' && rawOverride?.state === 'off')) {
      if (typeof rawOverride === 'object' && rawOverride?.expiresAt && new Date(rawOverride.expiresAt).getTime() <= Date.now()) {
        override = null; // Expired override reverts to plan default
      } else {
        override = false;
      }
    }

    if (feat.isCore) {
      stateMap.set(feat.key, {
        ...feat,
        inPlan: true,
        override: null,
        rawOverride,
        effective: true,
        dependencyBlocked: false,
        blockedBy: [],
        source: 'core_foundation'
      });
      continue;
    }

    let effective = inPlan;
    let source = inPlan ? 'plan_default' : 'plan_default';

    if (override === true) {
      effective = true;
      source = inPlan ? 'plan_default' : 'custom_enabled';
    } else if (override === false) {
      effective = false;
      source = 'custom_disabled';
    } else {
      effective = inPlan;
      source = 'plan_default';
    }

    stateMap.set(feat.key, {
      ...feat,
      inPlan,
      override,
      rawOverride,
      effective,
      dependencyBlocked: false,
      blockedBy: [],
      source
    });
  }

  // Deterministic fixed-point propagation
  let changed = true;
  let iterations = 0;
  const maxIterations = baseRegistry.length * 2;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (const feat of baseRegistry) {
      const current = stateMap.get(feat.key);
      if (!current || current.isCore) continue;

      if (current.effective && feat.dependsOn && feat.dependsOn.length > 0) {
        const missingDeps = [];
        for (const depKey of feat.dependsOn) {
          const depState = stateMap.get(depKey);
          if (!depState || !depState.effective) {
            missingDeps.push(depKey);
          }
        }

        if (missingDeps.length > 0) {
          current.effective = false;
          current.dependencyBlocked = true;
          current.blockedBy = missingDeps;
          current.source = 'dependency_blocked';
          changed = true;
        }
      }
    }
  }

  return Array.from(stateMap.values());
}

const CollegeDetail = () => {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'features'

  // Inline editing state for Overview tab
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [savingField, setSavingField] = useState(false);

  // Feature overrides state for Feature tab
  const [localOverrides, setLocalOverrides] = useState({});
  const [serverOverrides, setServerOverrides] = useState({});
  const [savingFeatures, setSavingFeatures] = useState(false);
  const [featureSearch, setFeatureSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  // Audit log state
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditTotal, setAuditTotal] = useState(0);

  // Preview impact modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [expandedFeatureKeys, setExpandedFeatureKeys] = useState({});

  useEffect(() => {
    if (id) fetchCollege();
  }, [id]);

  const fetchCollege = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const { data } = await api.get(`/super-admin/colleges/${id}`);
      const c = data.data;
      setCollege(c);

      const existingOverrides = c.subscription?.featureOverrides || {};
      setServerOverrides(existingOverrides);
      setLocalOverrides(existingOverrides);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load college details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Base feature catalog from server response or fallback
  const baseRegistry = useMemo(() => {
    return college?.features?.featureMatrix || [];
  }, [college]);

  // Compute reactive matrix based on local dirty state
  const currentPlan = (college?.subscription?.plan || 'basic').toLowerCase();
  const reactiveFeatureMatrix = useMemo(() => {
    if (baseRegistry.length === 0) return [];
    return computeReactiveFeatureMatrix(currentPlan, baseRegistry, localOverrides);
  }, [currentPlan, baseRegistry, localOverrides]);

  // Compute dynamic stats from reactive matrix
  const dynamicStats = useMemo(() => {
    const total = reactiveFeatureMatrix.length;
    const planIncluded = reactiveFeatureMatrix.filter(f => f.inPlan).length;
    const customEnabled = reactiveFeatureMatrix.filter(f => f.override === true).length;
    const customDisabled = reactiveFeatureMatrix.filter(f => f.override === false).length;
    const dependencyBlocked = reactiveFeatureMatrix.filter(f => f.dependencyBlocked).length;
    const effectiveActive = reactiveFeatureMatrix.filter(f => f.effective).length;

    return {
      totalFeatures: total,
      planIncluded,
      customEnabled,
      customDisabled,
      dependencyBlocked,
      effectiveActive
    };
  }, [reactiveFeatureMatrix]);

  // Check dirty state
  const isDirty = useMemo(() => {
    const localKeys = Object.keys(localOverrides);
    const serverKeys = Object.keys(serverOverrides);
    if (localKeys.length !== serverKeys.length) return true;
    for (const key of localKeys) {
      if (JSON.stringify(localOverrides[key]) !== JSON.stringify(serverOverrides[key])) return true;
    }
    return false;
  }, [localOverrides, serverOverrides]);

  // Dynamic categories list
  const categories = useMemo(() => {
    const set = new Set(reactiveFeatureMatrix.map(f => f.category));
    return ['All', ...Array.from(set)];
  }, [reactiveFeatureMatrix]);

  // Filtered feature list
  const filteredFeatures = useMemo(() => {
    return reactiveFeatureMatrix.filter(feat => {
      // Category filter
      if (selectedCategory !== 'All' && feat.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter === 'Active' && !feat.effective) return false;
      if (selectedStatusFilter === 'Disabled' && feat.effective) return false;
      if (selectedStatusFilter === 'Overridden' && feat.override === null) return false;
      if (selectedStatusFilter === 'Blocked' && !feat.dependencyBlocked) return false;

      // Search query
      if (featureSearch.trim()) {
        const query = featureSearch.toLowerCase().trim();
        const matchName = feat.name.toLowerCase().includes(query);
        const matchKey = feat.key.toLowerCase().includes(query);
        const matchDesc = feat.description?.toLowerCase().includes(query);
        const matchCat = feat.category?.toLowerCase().includes(query);
        if (!matchName && !matchKey && !matchDesc && !matchCat) return false;
      }

      return true;
    });
  }, [reactiveFeatureMatrix, selectedCategory, selectedStatusFilter, featureSearch]);

  // Inline edit handlers
  const handleStartInlineEdit = (key, val) => {
    setEditingField(key);
    if (key === 'sub_expiresAt') {
      setEditValue(val ? new Date(val).toISOString().split('T')[0] : '');
    } else {
      setEditValue(val || '');
    }
  };

  const handleCancelInlineEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleSaveInlineEdit = async (key) => {
    setSavingField(true);
    try {
      if (key.startsWith('sub_')) {
        const subKey = key.replace('sub_', '');
        if (subKey === 'plan') {
          await api.put(`/super-admin/colleges/${id}/plan`, { plan: editValue });
        } else if (subKey === 'status') {
          await api.put(`/super-admin/colleges/${id}/status`, { status: editValue });
        } else if (subKey === 'expiresAt') {
          const currentSub = typeof college.subscription === 'object' ? college.subscription : {};
          const updatedSub = {
            ...currentSub,
            expiresAt: editValue || null
          };
          await api.put(`/super-admin/colleges/${id}`, { subscription: updatedSub });
        }
      } else {
        await api.put(`/super-admin/colleges/${id}`, { [key]: editValue });
      }
      toast.success('Updated successfully');
      setEditingField(null);
      fetchCollege();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update field');
    } finally {
      setSavingField(false);
    }
  };

  const handleToggleCollegeStatus = async () => {
    const currentStatus = college.subscription?.status === 'active' ? 'suspended' : 'active';
    try {
      await api.put(`/super-admin/colleges/${id}/status`, { status: currentStatus });
      toast.success(`College status set to ${currentStatus}`);
      fetchCollege();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleChangePlan = async (newPlan) => {
    if (newPlan === college.subscription?.plan) return;
    try {
      await api.put(`/super-admin/colleges/${id}/plan`, { plan: newPlan });
      toast.success(`Plan changed to ${newPlan.toUpperCase()}`);
      fetchCollege();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update plan');
    }
  };

  // Feature override control handlers
  const handleSetOverride = (featureKey, overrideValue) => {
    setLocalOverrides(prev => {
      const next = { ...prev };
      if (overrideValue === null) {
        delete next[featureKey];
      } else {
        const existing = prev[featureKey];
        const state = overrideValue ? 'on' : 'off';
        const expiresAt = (typeof existing === 'object' && existing?.expiresAt) ? existing.expiresAt : null;
        const reason = (typeof existing === 'object' && existing?.reason) ? existing.reason : '';
        next[featureKey] = { state, expiresAt, reason };
      }
      return next;
    });
  };

  const handleUpdateOverrideDetail = (featureKey, field, val) => {
    setLocalOverrides(prev => {
      const current = prev[featureKey];
      if (!current) return prev;
      const state = typeof current === 'object' ? current.state : (current === true ? 'on' : 'off');
      return {
        ...prev,
        [featureKey]: {
          ...(typeof current === 'object' ? current : { state }),
          [field]: val || null
        }
      };
    });
  };

  const toggleFeatureExpand = (key) => {
    setExpandedFeatureKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const { data } = await api.get(`/super-admin/colleges/${id}/audit`);
      setAuditLogs(data.data || []);
      setAuditTotal(data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit' && id) {
      fetchAuditLogs();
    }
  }, [activeTab, id]);

  const handlePreviewChanges = async () => {
    setPreviewLoading(true);
    try {
      const { data } = await api.post(`/super-admin/colleges/${id}/features/preview`, {
        overrides: localOverrides
      });
      setPreviewData(data.data);
      setPreviewModalOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDiscardOverrides = () => {
    setLocalOverrides(serverOverrides);
    toast.success('Changes discarded');
  };

  const handleResetAllToDefaults = () => {
    setLocalOverrides({});
    toast.success('All features reset to Plan Defaults (click Save to apply)');
  };

  const handleSaveOverrides = async () => {
    setSavingFeatures(true);
    try {
      const { data } = await api.put(`/super-admin/colleges/${id}/features`, {
        overrides: localOverrides,
        reason: overrideReason || undefined
      });
      toast.success('Feature overrides saved successfully');
      const updatedCollege = data.data;
      setCollege(updatedCollege);
      const savedOverrides = updatedCollege.subscription?.featureOverrides || {};
      setServerOverrides(savedOverrides);
      setLocalOverrides(savedOverrides);
      setOverrideReason('');
      setPreviewModalOpen(false);
      if (activeTab === 'audit') fetchAuditLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save feature overrides');
    } finally {
      setSavingFeatures(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-32 space-y-4">
        <div className="w-10 h-10 border-3 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500 dark:text-white/40">Loading college control center...</p>
      </div>
    );
  }

  if (!college) {
    return (
      <div className="text-center py-28 max-w-md mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center mx-auto text-slate-400">
          <HiOutlineOfficeBuilding size={28} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">College Not Found</h3>
        <p className="text-sm text-slate-500 dark:text-white/50">The requested college identifier does not exist or has been removed.</p>
        <button
          onClick={() => router.push('/super-admin/colleges')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
        >
          <HiOutlineArrowLeft size={16} /> Back to Colleges
        </button>
      </div>
    );
  }

  const c = college;
  const stats = c.stats || {};
  const isCollegeActive = c.subscription?.status === 'active';
  const planInfo = planBadges[currentPlan] || planBadges.basic;

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/[0.06]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-white/40">
            <button
              onClick={() => router.push('/super-admin/colleges')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              Colleges
            </button>
            <span>/</span>
            <span className="text-slate-700 dark:text-white/80">{c.name}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {c.name}
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-white/80 border border-slate-200 dark:border-white/[0.08] font-mono">
              {c.code}
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${planInfo.classes}`}>
              {planInfo.label}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                isCollegeActive
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isCollegeActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {isCollegeActive ? 'Active' : 'Suspended'}
            </span>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchCollege(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#161b22] text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition"
            title="Refresh College Data"
          >
            <HiOutlineRefresh size={18} className={refreshing ? 'animate-spin text-indigo-600' : ''} />
          </button>

          <button
            onClick={handleToggleCollegeStatus}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border transition shadow-sm ${
              isCollegeActive
                ? 'border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                : 'border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
            }`}
          >
            {isCollegeActive ? (
              <>
                <HiOutlineBan size={16} /> Suspend College
              </>
            ) : (
              <>
                <HiOutlineCheckCircle size={16} /> Activate College
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <HiOutlineAcademicCap size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-white/40">Total Students</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
              {stats.totalStudents || 0}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
            <HiOutlineUserGroup size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-white/40">Faculty & Staff</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
              {stats.totalStaff || 0}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <HiOutlineSparkles size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-white/40">Active Features</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
              {dynamicStats.effectiveActive} <span className="text-xs font-medium text-slate-400">/ {dynamicStats.totalFeatures}</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <HiOutlineCalendar size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-white/40">Registered Since</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight mt-0.5 truncate">
              {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-white/[0.06]">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition -mb-px ${
            activeTab === 'overview'
              ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white/70'
          }`}
        >
          <HiOutlineOfficeBuilding size={18} />
          Overview & College Details
        </button>

        <button
          onClick={() => setActiveTab('subscription')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition -mb-px ${
            activeTab === 'subscription'
              ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white/70'
          }`}
        >
          <HiOutlineCreditCard size={18} />
          Subscription & Billing
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition -mb-px ${
            activeTab === 'messages'
              ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white/70'
          }`}
        >
          <HiOutlineSpeakerphone size={18} />
          Administrative Messages
        </button>

        <button
          onClick={() => setActiveTab('features')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition -mb-px relative ${
            activeTab === 'features'
              ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white/70'
          }`}
        >
          <HiOutlineAdjustments size={18} />
          Feature Access & Overrides
          {isDirty && (
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition -mb-px ${
            activeTab === 'audit'
              ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white/70'
          }`}
        >
          <HiOutlineDocumentText size={18} />
          Entitlement Audit Log
          {auditTotal > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/[0.1] text-slate-700 dark:text-white/70 font-semibold">
              {auditTotal}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: OVERVIEW & COLLEGE DETAILS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: College Identity & Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Institution Profile</h3>
                  <p className="text-xs text-slate-500 dark:text-white/40">Official details and communication coordinates</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {/* College Name */}
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500 dark:text-white/40 w-44">
                    <HiOutlineOfficeBuilding size={16} className="text-slate-400" />
                    College Name
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingField === 'name' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveInlineEdit('name')}
                          disabled={savingField}
                          className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                        >
                          <HiOutlineCheck size={16} />
                        </button>
                        <button
                          onClick={handleCancelInlineEdit}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                        >
                          <HiOutlineX size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between group">
                        <span className="text-sm font-semibold text-slate-800 dark:text-white/90 truncate">{c.name}</span>
                        <button
                          onClick={() => handleStartInlineEdit('name', c.name)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
                        >
                          <HiOutlinePencil size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* College Code */}
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500 dark:text-white/40 w-44">
                    <HiOutlineLockClosed size={16} className="text-slate-400" />
                    Institution Code
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingField === 'code' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm font-mono uppercase rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveInlineEdit('code')}
                          disabled={savingField}
                          className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                        >
                          <HiOutlineCheck size={16} />
                        </button>
                        <button
                          onClick={handleCancelInlineEdit}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                        >
                          <HiOutlineX size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between group">
                        <span className="text-sm font-mono font-bold text-slate-800 dark:text-white/90">{c.code}</span>
                        <button
                          onClick={() => handleStartInlineEdit('code', c.code)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
                        >
                          <HiOutlinePencil size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500 dark:text-white/40 w-44">
                    <HiOutlineMail size={16} className="text-slate-400" />
                    Official Email
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingField === 'email' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="email"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveInlineEdit('email')}
                          disabled={savingField}
                          className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                        >
                          <HiOutlineCheck size={16} />
                        </button>
                        <button
                          onClick={handleCancelInlineEdit}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                        >
                          <HiOutlineX size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between group">
                        <span className="text-sm text-slate-800 dark:text-white/90">{c.email || 'Not specified'}</span>
                        <button
                          onClick={() => handleStartInlineEdit('email', c.email)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
                        >
                          <HiOutlinePencil size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500 dark:text-white/40 w-44">
                    <HiOutlinePhone size={16} className="text-slate-400" />
                    Phone Number
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingField === 'phone' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveInlineEdit('phone')}
                          disabled={savingField}
                          className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                        >
                          <HiOutlineCheck size={16} />
                        </button>
                        <button
                          onClick={handleCancelInlineEdit}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                        >
                          <HiOutlineX size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between group">
                        <span className="text-sm text-slate-800 dark:text-white/90">{c.phone || 'Not specified'}</span>
                        <button
                          onClick={() => handleStartInlineEdit('phone', c.phone)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
                        >
                          <HiOutlinePencil size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* City */}
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500 dark:text-white/40 w-44">
                    <HiOutlineLocationMarker size={16} className="text-slate-400" />
                    City / Region
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingField === 'city' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveInlineEdit('city')}
                          disabled={savingField}
                          className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                        >
                          <HiOutlineCheck size={16} />
                        </button>
                        <button
                          onClick={handleCancelInlineEdit}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                        >
                          <HiOutlineX size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between group">
                        <span className="text-sm text-slate-800 dark:text-white/90">{c.city || 'Not specified'}</span>
                        <button
                          onClick={() => handleStartInlineEdit('city', c.city)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
                        >
                          <HiOutlinePencil size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Website */}
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500 dark:text-white/40 w-44">
                    <HiOutlineGlobe size={16} className="text-slate-400" />
                    Website Portal
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingField === 'website' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveInlineEdit('website')}
                          disabled={savingField}
                          className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                        >
                          <HiOutlineCheck size={16} />
                        </button>
                        <button
                          onClick={handleCancelInlineEdit}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                        >
                          <HiOutlineX size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between group">
                        <span className="text-sm text-slate-800 dark:text-white/90 truncate">{c.website || 'Not specified'}</span>
                        <button
                          onClick={() => handleStartInlineEdit('website', c.website)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
                        >
                          <HiOutlinePencil size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Subscription & License Controls */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Subscription & Tier</h3>
                <p className="text-xs text-slate-500 dark:text-white/40">Baseline entitlement level and term</p>
              </div>

              {/* Plan Switcher */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-white/60 uppercase tracking-wider">
                  Active Plan Baseline
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['basic', 'standard', 'premium'].map(p => (
                    <button
                      key={p}
                      onClick={() => handleChangePlan(p)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition capitalize ${
                        currentPlan === p
                          ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-white/50 hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiry Date */}
              <div className="pt-4 border-t border-slate-100 dark:divide-white/[0.04] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-white/60 uppercase tracking-wider">
                    Term Expiry
                  </span>
                  {editingField !== 'sub_expiresAt' && (
                    <button
                      onClick={() => handleStartInlineEdit('sub_expiresAt', c.subscription?.expiresAt)}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 transition"
                    >
                      <HiOutlinePencil size={14} />
                    </button>
                  )}
                </div>

                {editingField === 'sub_expiresAt' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                    />
                    <button
                      onClick={() => handleSaveInlineEdit('sub_expiresAt')}
                      disabled={savingField}
                      className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                    >
                      <HiOutlineCheck size={16} />
                    </button>
                    <button
                      onClick={handleCancelInlineEdit}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                    >
                      <HiOutlineX size={16} />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-slate-800 dark:text-white/90">
                    {c.subscription?.expiresAt
                      ? new Date(c.subscription.expiresAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : 'Perpetual / No Expiry'}
                  </p>
                )}
              </div>

              {/* Shortcut to Features tab */}
              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.04]">
                <button
                  onClick={() => setActiveTab('features')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-white/[0.04] hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-700 dark:text-white/80 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-white/[0.06] transition"
                >
                  <HiOutlineAdjustments size={16} /> Configure Individual Feature Overrides
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FEATURE ACCESS & OVERRIDES */}
      {activeTab === 'features' && (
        <div className="space-y-6">
          {/* Dynamic KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">Total Modules</span>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{dynamicStats.totalFeatures}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Plan Baseline</span>
              <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">{dynamicStats.planIncluded}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Force Enabled</span>
              <p className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300 mt-0.5">{dynamicStats.customEnabled}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Force Disabled</span>
              <p className="text-xl font-extrabold text-rose-700 dark:text-rose-300 mt-0.5">{dynamicStats.customDisabled}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Dep. Blocked</span>
              <p className="text-xl font-extrabold text-amber-700 dark:text-amber-300 mt-0.5">{dynamicStats.dependencyBlocked}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Effective Active</span>
              <p className="text-xl font-extrabold text-sky-700 dark:text-sky-300 mt-0.5">{dynamicStats.effectiveActive}</p>
            </div>
          </div>

          {/* Sticky Dirty State Save Bar */}
          {isDirty && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-4 z-20 backdrop-blur-md shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <HiOutlineExclamation size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Unsaved Override Modifications</h4>
                  <p className="text-xs text-slate-600 dark:text-white/60">
                    You have adjusted feature access overrides. Save to apply changes immediately to this institution.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  onClick={handleDiscardOverrides}
                  disabled={savingFeatures}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#161b22] text-slate-700 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition"
                >
                  Discard
                </button>
                <button
                  onClick={handleResetAllToDefaults}
                  disabled={savingFeatures}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#161b22] text-slate-700 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition"
                >
                  Reset to Plan
                </button>
                <button
                  onClick={handlePreviewChanges}
                  disabled={previewLoading || savingFeatures}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition disabled:opacity-50"
                  title="Preview which capabilities switch to Plan B and which features turn on/off"
                >
                  {previewLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <HiOutlineEye size={15} />
                  )}
                  Preview Impact
                </button>
                <button
                  onClick={handleSaveOverrides}
                  disabled={savingFeatures}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition disabled:opacity-50"
                >
                  {savingFeatures ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <HiOutlineSave size={16} />
                  )}
                  Save Overrides
                </button>
              </div>
            </div>
          )}

          {/* Search and Filters Toolbar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-0">
                <HiOutlineSearch size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search features by name, key, or category..."
                  value={featureSearch}
                  onChange={e => setFeatureSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 text-sm rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
                />
                {featureSearch && (
                  <button
                    onClick={() => setFeatureSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <HiOutlineX size={16} />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-slate-500 dark:text-white/40">Status:</span>
                <select
                  value={selectedStatusFilter}
                  onChange={e => setSelectedStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-white/80 focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Disabled">Disabled Only</option>
                  <option value="Overridden">Overridden Only</option>
                  <option value="Blocked">Blocked by Dependency</option>
                </select>
              </div>
            </div>

            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/[0.08]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 gap-3.5">
            {filteredFeatures.map(feat => {
              const IconComp = ICON_MAP[feat.iconName] || HiOutlineOfficeBuilding;
              const isCore = feat.isCore === true;
              const inPlan = feat.inPlan === true;
              const override = feat.override;
              const isBlocked = feat.dependencyBlocked === true;
              const isEffective = feat.effective === true;

              // Derive badge metadata
              let statusBadge = {
                label: 'Active (Plan Default)',
                classes: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
              };

              if (isCore) {
                statusBadge = {
                  label: 'Core Foundation (Always Active)',
                  classes: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'
                };
              } else if (isBlocked) {
                statusBadge = {
                  label: `Disabled (Blocked by ${feat.blockedBy?.join(', ') || 'Dependency'})`,
                  classes: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                };
              } else if (override === true) {
                statusBadge = {
                  label: 'Active (Special Override)',
                  classes: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'
                };
              } else if (override === false) {
                statusBadge = {
                  label: 'Disabled (Custom Override)',
                  classes: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                };
              } else if (!inPlan) {
                statusBadge = {
                  label: 'Disabled (Plan Default)',
                  classes: 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-white/40 border-slate-200 dark:border-white/[0.06]'
                };
              }

              return (
                <div
                  key={feat.key}
                  className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#161b22] border transition-all shadow-sm flex flex-col gap-3 ${
                    isBlocked
                      ? 'border-amber-400/40 dark:border-amber-500/30'
                      : override !== null && override !== undefined
                      ? 'border-indigo-400/40 dark:border-indigo-500/30 ring-1 ring-indigo-500/20'
                      : 'border-slate-200/80 dark:border-white/[0.06]'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Feature Info */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                          isCore
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'
                            : isEffective
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-white/30 border-slate-200 dark:border-white/[0.06]'
                        }`}
                      >
                        <IconComp size={22} />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                            {feat.name}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-white/50 border border-slate-200 dark:border-white/[0.06]">
                            {feat.category}
                          </span>
                          {isCore && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                              <HiOutlineLockClosed size={12} /> Core
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.classes}`}>
                            {statusBadge.label}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-white/50 line-clamp-2">
                          {feat.description}
                        </p>

                        {/* Dependencies note */}
                        {feat.dependsOn && feat.dependsOn.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400/90 pt-0.5">
                            <HiOutlineInformationCircle size={14} className="shrink-0" />
                            <span>Requires: {feat.dependsOn.join(', ')}</span>
                            {isBlocked && (
                              <span className="font-bold underline decoration-amber-500/50">
                                (Blocked: {feat.blockedBy?.join(', ')} is disabled)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Plan Status & 3-State Override Control */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-white/[0.04]">
                      {/* Baseline indicator */}
                      <div className="text-right sm:text-center px-2">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-wider block">
                          Base Plan
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            inPlan
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400 dark:text-white/30'
                          }`}
                        >
                          {inPlan ? 'Included' : 'Not in Plan'}
                        </span>
                      </div>

                      {/* 3-State Override Switcher */}
                      {isCore ? (
                        <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] text-xs font-semibold text-slate-400 dark:text-white/40 border border-slate-200 dark:border-white/[0.06] text-center">
                          Permanently Active
                        </div>
                      ) : (
                        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]">
                          {/* Option 1: Force Disable */}
                          <button
                            onClick={() => handleSetOverride(feat.key, false)}
                            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                              override === false
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-white/50 hover:text-rose-600 dark:hover:text-rose-400'
                            }`}
                            title="Force Disable this feature regardless of plan"
                          >
                            <HiOutlineBan size={13} />
                            <span>Disable</span>
                          </button>

                          {/* Option 2: Plan Default */}
                          <button
                            onClick={() => handleSetOverride(feat.key, null)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                              override === null || override === undefined
                                ? 'bg-white dark:bg-[#1f242c] text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-white/[0.08]'
                                : 'text-slate-600 dark:text-white/50 hover:text-slate-800 dark:hover:text-white/80'
                            }`}
                            title="Follow the subscription plan baseline default"
                          >
                            Plan Default
                          </button>

                          {/* Option 3: Force Enable */}
                          <button
                            onClick={() => handleSetOverride(feat.key, true)}
                            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                              override === true
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-white/50 hover:text-indigo-600 dark:hover:text-indigo-400'
                            }`}
                            title="Force Enable this feature even if not in plan"
                          >
                            <HiOutlineSparkles size={13} />
                            <span>Enable</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline Override Settings Panel (ExpiresAt & Reason) */}
                  {!isCore && override !== null && override !== undefined && (
                    <div className="pt-2.5 border-t border-slate-100 dark:border-white/[0.04] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 rounded-xl">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-white/70 shrink-0">
                        <HiOutlineClock size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>Override Settings:</span>
                        {feat.rawOverride?.expiresAt && (
                          <span className="text-[11px] font-normal text-amber-600 dark:text-amber-400">
                            (Expires {new Date(feat.rawOverride.expiresAt).toLocaleDateString()})
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] font-medium text-slate-400 dark:text-white/40">Expires:</label>
                          <input
                            type="date"
                            value={feat.rawOverride?.expiresAt ? new Date(feat.rawOverride.expiresAt).toISOString().split('T')[0] : ''}
                            onChange={e => handleUpdateOverrideDetail(feat.key, 'expiresAt', e.target.value)}
                            className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-[#1f242c] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                            title="Set expiration date (override automatically reverts to Plan Default after this date)"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 flex-1 sm:w-56">
                          <label className="text-[11px] font-medium text-slate-400 dark:text-white/40">Reason:</label>
                          <input
                            type="text"
                            placeholder="Optional reason for audit..."
                            value={feat.rawOverride?.reason || ''}
                            onChange={e => handleUpdateOverrideDetail(feat.key, 'reason', e.target.value)}
                            className="w-full px-2 py-1 text-xs rounded-lg bg-white dark:bg-[#1f242c] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 placeholder-slate-400"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredFeatures.length === 0 && (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] space-y-2">
                <p className="text-sm font-bold text-slate-700 dark:text-white/70">No matching features found</p>
                <p className="text-xs text-slate-400 dark:text-white/40">Try adjusting your search query or category filter.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ENTITLEMENT AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Entitlement & Subscription Audit Trail</h3>
              <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">
                Immutable, append-only history of plan changes, status updates, and feature overrides for this college.
              </p>
            </div>
            <button
              onClick={fetchAuditLogs}
              disabled={loadingAudit}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition"
            >
              <HiOutlineRefresh size={14} className={loadingAudit ? 'animate-spin' : ''} />
              Refresh Logs
            </button>
          </div>

          {loadingAudit ? (
            <div className="p-16 text-center rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06]">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 dark:text-white/40">Loading audit history...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-16 text-center rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] space-y-2">
              <HiOutlineDocumentText size={32} className="mx-auto text-slate-300 dark:text-white/20" />
              <p className="text-sm font-bold text-slate-700 dark:text-white/70">No Audit Events Recorded</p>
              <p className="text-xs text-slate-400 dark:text-white/40">
                Any plan modifications, status changes, or feature overrides will be permanently logged here.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-white/40 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Reason / Notes</th>
                      <th className="py-3 px-4">State Transition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {auditLogs.map(log => {
                      let badge = { label: log.action, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
                      if (log.action === 'plan_change') {
                        badge = { label: 'Plan Change', bg: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20' };
                      } else if (log.action === 'feature_override') {
                        badge = { label: 'Feature Override', bg: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20' };
                      } else if (log.action === 'status_change') {
                        badge = { label: 'Status Change', bg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' };
                      }

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition">
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-white/60">
                            {new Date(log.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-white/80 font-medium">
                            {log.actorId ? `User (${log.actorId.slice(0, 8)}...)` : 'Super Admin / System'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-white/60 max-w-xs truncate">
                            {log.reason || <span className="text-slate-400 italic">None provided</span>}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-white/60 font-mono text-[11px]">
                            {log.action === 'plan_change' ? (
                              <span>
                                <span className="line-through text-slate-400">{log.before?.plan || 'none'}</span>
                                {' → '}
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">{log.after?.plan}</span>
                              </span>
                            ) : log.action === 'status_change' ? (
                              <span>
                                <span className="line-through text-slate-400">{log.before?.status || 'none'}</span>
                                {' → '}
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{log.after?.status}</span>
                              </span>
                            ) : (
                              <details className="cursor-pointer">
                                <summary className="text-indigo-600 dark:text-indigo-400 hover:underline">View details</summary>
                                <pre className="mt-1 p-2 rounded bg-slate-100 dark:bg-black/30 text-[10px] max-w-md overflow-x-auto">
                                  {JSON.stringify({ before: log.before, after: log.after }, null, 2)}
                                </pre>
                              </details>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: SUBSCRIPTION & BILLING (Phase 9) */}
      {activeTab === 'subscription' && (
        <SubscriptionTab
          collegeId={id}
          collegeName={college?.name}
          onSubscriptionChanged={fetchCollege}
        />
      )}

      {/* TAB: MESSAGES & NOTICES (Phase 9) */}
      {activeTab === 'messages' && (
        <MessagesTab
          collegeId={id}
          collegeName={college?.name}
        />
      )}

      {/* PREVIEW IMPACT MODAL */}
      {previewModalOpen && previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <HiOutlineEye size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    What Will Change: Entitlement Impact Preview
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-white/40">
                    Calculated reactive impact before saving modifications to the database
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
              >
                <HiOutlineX size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-center">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Turning ON</p>
                  <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                    +{previewData.turnedOn?.length || 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-center">
                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">Turning OFF</p>
                  <p className="text-xl font-black text-rose-700 dark:text-rose-400 mt-0.5">
                    -{previewData.turnedOff?.length || 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-center">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Plan B Switched</p>
                  <p className="text-xl font-black text-amber-700 dark:text-amber-400 mt-0.5">
                    {previewData.switched?.length || 0}
                  </p>
                </div>
              </div>

              {/* Switched / Degraded Capabilities Warning */}
              {previewData.switched && previewData.switched.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <HiOutlineExclamation size={16} />
                    <span>Capabilities Switching to Plan B Fallback:</span>
                  </div>
                  <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-400 pl-5 list-disc">
                    {previewData.switched.map((sw, i) => (
                      <li key={i}>
                        <code className="font-bold">{sw.capability}</code> switches method from{' '}
                        <span className="font-semibold">{sw.from}</span> to{' '}
                        <span className="font-semibold underline">{sw.to}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Turning Off List */}
              {previewData.turnedOff && previewData.turnedOff.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700 dark:text-white/70">
                    Features turning OFF ({previewData.turnedOff.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {previewData.turnedOff.map(fKey => (
                      <span
                        key={fKey}
                        className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
                      >
                        {fKey}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Turning On List */}
              {previewData.turnedOn && previewData.turnedOn.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700 dark:text-white/70">
                    Features turning ON ({previewData.turnedOn.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {previewData.turnedOn.map(fKey => (
                      <span
                        key={fKey}
                        className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                      >
                        {fKey}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(!previewData.turnedOn?.length && !previewData.turnedOff?.length && !previewData.switched?.length) && (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-white/40">
                  No net functional changes detected in capabilities or feature flags.
                </div>
              )}

              {/* Reason for Audit Log */}
              <div className="pt-2 border-t border-slate-200 dark:border-white/[0.06] space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-white/80">
                  Audit Reason (Recommended)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Approved trial for semester 2, or requested fee waiver"
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-white/[0.02]">
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
              >
                Close Preview
              </button>
              <button
                onClick={handleSaveOverrides}
                disabled={savingFeatures}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition disabled:opacity-50"
              >
                {savingFeatures ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <HiOutlineSave size={15} />
                )}
                Confirm & Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeDetail;
