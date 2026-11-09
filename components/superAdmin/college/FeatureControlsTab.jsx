'use client';

import {
  HiOutlineOfficeBuilding,
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineCurrencyDollar,
  HiOutlineCalendar,
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineSave,
  HiOutlineEye,
  HiOutlineLockClosed,
  HiOutlineExclamation,
  HiOutlineInformationCircle,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
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
} from 'react-icons/hi';

const ICON_MAP = {
  HiOutlineAcademicCap,
  HiOutlineClipboardCheck,
  HiOutlineClock,
  HiOutlineChartBar,
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlineSpeakerphone,
  HiOutlineCurrencyDollar,
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding,
  HiOutlineShieldCheck,
  HiOutlineUser,
  HiOutlineSparkles,
  HiOutlineBookOpen,
  HiOutlineDocumentDuplicate,
};

export default function FeatureControlsTab({
  reactiveFeatureMatrix = [],
  filteredFeatures = [],
  categories = [],
  selectedCategory,
  setSelectedCategory,
  selectedStatusFilter,
  setSelectedStatusFilter,
  featureSearch,
  setFeatureSearch,
  dynamicStats = {},
  isDirty,
  savingFeatures,
  previewLoading,
  onDiscardOverrides,
  onResetAllToDefaults,
  onPreviewChanges,
  onSaveOverrides,
  onSetOverride,
  onUpdateOverrideDetail,
  expandedFeatureKeys = {},
  toggleFeatureExpand,
}) {
  return (
    <div className="space-y-6">
      {/* Dynamic KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">Total Modules</span>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{dynamicStats.totalFeatures || 0}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Plan Baseline</span>
          <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">{dynamicStats.planIncluded || 0}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Force Enabled</span>
          <p className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300 mt-0.5">{dynamicStats.customEnabled || 0}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Force Disabled</span>
          <p className="text-xl font-extrabold text-rose-700 dark:text-rose-300 mt-0.5">{dynamicStats.customDisabled || 0}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Dep. Blocked</span>
          <p className="text-xl font-extrabold text-amber-700 dark:text-amber-300 mt-0.5">{dynamicStats.dependencyBlocked || 0}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
          <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Effective Active</span>
          <p className="text-xl font-extrabold text-sky-700 dark:text-sky-300 mt-0.5">{dynamicStats.effectiveActive || 0}</p>
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
              onClick={onDiscardOverrides}
              disabled={savingFeatures}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#161b22] text-slate-700 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition cursor-pointer"
            >
              Discard
            </button>
            <button
              onClick={onResetAllToDefaults}
              disabled={savingFeatures}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#161b22] text-slate-700 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition cursor-pointer"
            >
              Reset to Plan
            </button>
            <button
              onClick={onPreviewChanges}
              disabled={previewLoading || savingFeatures}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition disabled:opacity-50 cursor-pointer"
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
              onClick={onSaveOverrides}
              disabled={savingFeatures}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition disabled:opacity-50 cursor-pointer"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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
              className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition cursor-pointer ${
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
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Tri-state Override Controller */}
                {!isCore && (
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <div className="inline-flex rounded-xl bg-slate-100 dark:bg-white/[0.04] p-1 border border-slate-200 dark:border-white/[0.06]">
                      <button
                        onClick={() => onSetOverride(feat.key, true)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                          override === true
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Force ON
                      </button>
                      <button
                        onClick={() => onSetOverride(feat.key, null)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                          override === null || override === undefined
                            ? 'bg-white dark:bg-[#161b22] text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Plan Default
                      </button>
                      <button
                        onClick={() => onSetOverride(feat.key, false)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                          override === false
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Force OFF
                      </button>
                    </div>

                    {/* Expand Details Trigger */}
                    {override !== null && override !== undefined && (
                      <button
                        onClick={() => toggleFeatureExpand(feat.key)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white/70 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition cursor-pointer"
                        title="Configure reason & expiration"
                      >
                        {expandedFeatureKeys[feat.key] ? (
                          <HiOutlineChevronUp size={16} />
                        ) : (
                          <HiOutlineChevronDown size={16} />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Collapsible Override Details (Reason & Expiry) */}
              {override !== null && override !== undefined && expandedFeatureKeys[feat.key] && (
                <div className="pt-3 border-t border-slate-100 dark:border-white/[0.04] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-white/40 block mb-1">
                      Reason for Override
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Free trial, VIP custom contract..."
                      value={feat.reason || ''}
                      onChange={e => onUpdateOverrideDetail(feat.key, 'reason', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-white/40 block mb-1">
                      Override Expiration Date (Optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={feat.expiresAt ? new Date(feat.expiresAt).toISOString().split('T')[0] : ''}
                        onChange={e => onUpdateOverrideDetail(feat.key, 'expiresAt', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                      {feat.expiresAt && (
                        <button
                          onClick={() => onUpdateOverrideDetail(feat.key, 'expiresAt', null)}
                          className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-500 hover:text-rose-600 transition cursor-pointer"
                          title="Remove expiration date (Make permanent)"
                        >
                          Clear
                        </button>
                      )}
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
  );
}

