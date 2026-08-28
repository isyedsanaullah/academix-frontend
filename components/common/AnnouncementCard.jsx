import { useState, useEffect } from 'react';
import {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_AUDIENCES,
  CATEGORY_COLORS,
  PRIORITY_COLORS,
  REFINEMENT_ACTIONS
} from '../../config/announcementConstants';
import {
  HiOutlineSparkles, HiOutlineCheckCircle, HiOutlineExclamationCircle,
  HiOutlineCalendar, HiOutlineClock, HiOutlinePencilAlt,
  HiOutlineCloudUpload, HiOutlineSave, HiOutlineXCircle,
  HiOutlineChevronDown, HiOutlineChevronUp, HiOutlinePaperClip,
  HiOutlineDuplicate, HiOutlineEye
} from 'react-icons/hi';

const AnnouncementCard = ({
  announcement,
  mode = 'preview', // 'preview' | 'published'
  onPublish,
  onSchedule,
  onSaveDraft,
  onRefine,
  onEditChange,
  onCancel,
  authorName = 'Administrator'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAiReasoning, setShowAiReasoning] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showScheduleInput, setShowScheduleInput] = useState(false);

  const [draft, setDraft] = useState({
    title: '',
    content: '',
    category: 'General',
    priority: 'Medium',
    audience: 'All Users',
    isPublic: false,
    status: 'Draft',
    scheduledFor: '',
    expiresAt: '',
    confidenceScore: 90,
    missingFields: [],
    warnings: [],
    reasoning: '',
    attachments: [],
    ...announcement
  });

  const [versions, setVersions] = useState([
    { v: 1, title: announcement?.title || '', content: announcement?.content || '', timestamp: new Date() }
  ]);

  useEffect(() => {
    if (announcement) {
      setDraft(prev => ({ ...prev, ...announcement }));
    }
  }, [announcement]);

  // Handle local form edits
  const handleChange = (field, value) => {
    const updated = { ...draft, [field]: value };
    setDraft(updated);
    if (onEditChange) onEditChange(updated);
  };

  // Version tracking on major changes
  const saveVersion = () => {
    const newVer = {
      v: versions.length + 1,
      title: draft.title,
      content: draft.content,
      category: draft.category,
      priority: draft.priority,
      audience: draft.audience,
      timestamp: new Date()
    };
    setVersions(prev => [...prev, newVer]);
  };

  const restoreVersion = (verObj) => {
    const restored = {
      ...draft,
      title: verObj.title,
      content: verObj.content,
      category: verObj.category || draft.category,
      priority: verObj.priority || draft.priority,
      audience: verObj.audience || draft.audience
    };
    setDraft(restored);
    if (onEditChange) onEditChange(restored);
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    if (mode !== 'preview') return;
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (isValid && onPublish) onPublish(draft);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (onSaveDraft) onSaveDraft(draft);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (onRefine) onRefine('enhance', 'Enhance wording and clarity');
      } else if (e.key === 'Escape' && isEditing) {
        setIsEditing(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [draft, mode, isEditing]);

  // Pre-Publish Validation Check
  const isValidTitle = Boolean(draft.title && draft.title.trim().length >= 3);
  const isValidContent = Boolean(draft.content && draft.content.trim().length >= 5);
  const isValidCategory = ANNOUNCEMENT_CATEGORIES.includes(draft.category);
  const isValidPriority = ANNOUNCEMENT_PRIORITIES.includes(draft.priority);
  const isValidAudience = ANNOUNCEMENT_AUDIENCES.includes(draft.audience);
  const isValid = isValidTitle && isValidContent && isValidCategory && isValidPriority && isValidAudience;

  const catStyle = CATEGORY_COLORS[draft.category] || CATEGORY_COLORS.General;
  const prioStyle = PRIORITY_COLORS[draft.priority] || PRIORITY_COLORS.Medium;

  return (
    <div className={`w-full rounded-2xl border transition-all shadow-lg overflow-hidden ${
      mode === 'preview'
        ? 'bg-[#0f172a]/95 border-indigo-500/30 text-white'
        : 'bg-[#111827] border-white/10 text-white'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 bg-slate-900/80 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            {mode === 'preview' ? '📢 Announcement Preview' : 'Announcement Notice'}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
            draft.status === 'Published'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : draft.status === 'Scheduled'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
          }`}>
            {draft.status || 'Draft'}
          </span>
        </div>

        {/* Badges Bar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Category Badge */}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
            {draft.category}
          </span>

          {/* Priority Badge */}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${prioStyle.badge}`}>
            {draft.priority} Priority
          </span>

          {/* Audience Badge */}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/80">
            🎯 {draft.audience}
          </span>

          {/* Confidence Score Badge */}
          {mode === 'preview' && draft.confidenceScore !== undefined && (
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              draft.confidenceScore >= 80
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {draft.confidenceScore}% Confidence
            </span>
          )}
        </div>
      </div>

      {/* Warning Banners */}
      {mode === 'preview' && (
        <div className="space-y-1 p-3 px-5 bg-slate-950/40 border-b border-white/5">
          {/* Low Confidence Warning */}
          {draft.confidenceScore < 80 && (
            <div className="flex items-center gap-2 text-xs font-medium text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
              <HiOutlineExclamationCircle size={18} className="shrink-0 text-amber-400" />
              <span>⚠️ Low confidence output: Please review all announcement fields carefully before publishing.</span>
            </div>
          )}

          {/* Missing Information Alert */}
          {draft.missingFields && draft.missingFields.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-medium text-red-300 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
              <HiOutlineExclamationCircle size={18} className="shrink-0 text-red-400" />
              <span>⚠️ Missing details detected ({draft.missingFields.join(', ')}). Please complete missing details or edit fields below.</span>
            </div>
          )}

          {/* Warnings List */}
          {draft.warnings && draft.warnings.map((warn, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-medium text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
              <HiOutlineExclamationCircle size={18} className="shrink-0 text-amber-400" />
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}

      {/* Card Content Area */}
      <div className="p-5 md:p-6 space-y-4">
        {!isEditing ? (
          /* WYSIWYG View Mode */
          <div className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-snug">
              {draft.title || <span className="italic text-white/30">Untitled Announcement</span>}
            </h2>

            <div className="text-sm md:text-base text-slate-200 leading-relaxed max-w-none break-words whitespace-pre-wrap font-sans">
              {draft.content ? draft.content.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').trim() : 'No content provided.'}
            </div>

            {/* Attachments List */}
            {draft.attachments && draft.attachments.length > 0 && (
              <div className="pt-3 border-t border-white/10">
                <p className="text-xs font-semibold text-white/50 mb-1 flex items-center gap-1">
                  <HiOutlinePaperClip size={14} /> Attached Documents ({draft.attachments.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {draft.attachments.map((file, idx) => (
                    <a key={idx} href={file} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-indigo-300 hover:bg-white/10 transition flex items-center gap-1.5">
                      <HiOutlinePaperClip size={12} /> {typeof file === 'string' ? file.split('/').pop() : `Attachment ${idx+1}`}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Interactive Inline Edit Mode */
          <div className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-indigo-500/30">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <HiOutlinePencilAlt size={14} /> Edit Announcement Fields
              </span>
              <button onClick={() => { setIsEditing(false); saveVersion(); }}
                className="text-xs font-semibold px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition">
                Done Editing
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Announcement Title</label>
              <input
                type="text"
                value={draft.title}
                onChange={e => handleChange('title', e.target.value)}
                placeholder="Enter title..."
                className="w-full px-3 py-2 bg-slate-950 border border-white/15 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Announcement Body Text</label>
              <textarea
                value={draft.content ? draft.content.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').trim() : ''}
                onChange={e => handleChange('content', e.target.value)}
                placeholder="Enter notice details..."
                rows={5}
                className="w-full px-3 py-2 bg-slate-950 border border-white/15 rounded-lg text-sm text-white focus:border-indigo-500 outline-none font-sans text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Category</label>
                <select
                  value={draft.category}
                  onChange={e => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/15 rounded-lg text-xs text-white outline-none">
                  {ANNOUNCEMENT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Priority</label>
                <select
                  value={draft.priority}
                  onChange={e => handleChange('priority', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/15 rounded-lg text-xs text-white outline-none">
                  {ANNOUNCEMENT_PRIORITIES.map(prio => (
                    <option key={prio} value={prio}>{prio}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Audience</label>
                <select
                  value={draft.audience}
                  onChange={e => handleChange('audience', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/15 rounded-lg text-xs text-white outline-none">
                  {ANNOUNCEMENT_AUDIENCES.map(aud => (
                    <option key={aud} value={aud}>{aud}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-white/80">
                <input
                  type="checkbox"
                  checked={draft.isPublic}
                  onChange={e => handleChange('isPublic', e.target.checked)}
                  className="rounded bg-slate-950 border-white/20 text-indigo-600 focus:ring-0"
                />
                Public Notice (Visible on Website)
              </label>
            </div>
          </div>
        )}

        {/* Live Character & Metrics Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/40 pt-2 border-t border-white/10">
          <div className="flex items-center gap-4">
            <span>Title: <strong className="text-white/70">{draft.title?.length || 0}</strong> chars</span>
            <span>Content: <strong className="text-white/70">{draft.content?.replace(/<[^>]*>/g, '')?.length || 0}</strong> chars</span>
            {draft.viewCount !== undefined && (
              <span className="flex items-center gap-1 text-indigo-300">
                <HiOutlineEye size={14} /> {draft.viewCount} Views
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span>By: <strong className="text-white/70">{authorName}</strong></span>
            {mode === 'preview' && (
              <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/30">
                Ctrl+Enter: Publish | Ctrl+S: Draft | Ctrl+E: Enhance
              </span>
            )}
          </div>
        </div>

        {/* Collapsible AI Decision Reasoning Panel */}
        {mode === 'preview' && draft.reasoning && (
          <div className="border border-white/10 rounded-xl bg-slate-950/60 overflow-hidden">
            <button
              onClick={() => setShowAiReasoning(!showAiReasoning)}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-indigo-300 hover:bg-white/5 transition">
              <span className="flex items-center gap-1.5">
                <HiOutlineSparkles size={14} /> AI Decision & Rule Engine Explanation
              </span>
              {showAiReasoning ? <HiOutlineChevronUp size={14} /> : <HiOutlineChevronDown size={14} />}
            </button>
            {showAiReasoning && (
              <div className="p-4 pt-2 text-xs text-slate-300 space-y-1.5 border-t border-white/5">
                <p><strong>Category Decision:</strong> {draft.category}</p>
                <p><strong>Priority Decision:</strong> {draft.priority}</p>
                <p><strong>Audience Mapping:</strong> {draft.audience}</p>
                <p><strong>Rule Logic:</strong> {draft.reasoning}</p>
              </div>
            )}
          </div>
        )}

        {/* Collapsible Version History */}
        {mode === 'preview' && versions.length > 1 && (
          <div className="border border-white/10 rounded-xl bg-slate-950/60 overflow-hidden">
            <button
              onClick={() => setShowVersionHistory(!showVersionHistory)}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 transition">
              <span className="flex items-center gap-1.5">
                <HiOutlineClock size={14} /> Draft Version Trajectory ({versions.length} versions)
              </span>
              {showVersionHistory ? <HiOutlineChevronUp size={14} /> : <HiOutlineChevronDown size={14} />}
            </button>
            {showVersionHistory && (
              <div className="p-3 border-t border-white/5 space-y-2">
                {versions.map(ver => (
                  <div key={ver.v} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg text-xs">
                    <div>
                      <span className="font-bold text-indigo-300">Version {ver.v}</span>
                      <span className="text-white/40 ml-2">{new Date(ver.timestamp).toLocaleTimeString()}</span>
                      <p className="text-white/70 truncate max-w-md">{ver.title}</p>
                    </div>
                    <button
                      onClick={() => restoreVersion(ver)}
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-semibold transition">
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Schedule Date Input Drawer */}
        {showScheduleInput && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3">
            <HiOutlineCalendar size={20} className="text-amber-400 shrink-0" />
            <div className="flex-1">
              <label className="block text-xs font-bold text-amber-300 mb-1">Select Schedule Publish Date & Time</label>
              <input
                type="datetime-local"
                value={draft.scheduledFor || ''}
                onChange={e => handleChange('scheduledFor', e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-white/20 rounded text-xs text-white outline-none w-full"
              />
            </div>
            <button
              onClick={() => {
                if (onSchedule) onSchedule(draft);
                setShowScheduleInput(false);
              }}
              disabled={!draft.scheduledFor}
              className="px-3 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-amber-400 disabled:opacity-40 transition shrink-0">
              Confirm Schedule
            </button>
          </div>
        )}

        {/* Refinement Actions & Publishing Toolbar (Preview Mode & Draft Only) */}
        {mode === 'preview' && (
          <div className="pt-3 border-t border-white/10 space-y-3">
            {draft.status === 'Published' ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <HiOutlineCheckCircle size={20} />
                  <span>Announcement Published & Active</span>
                </div>
                <span className="text-[11px] text-emerald-300/60 font-medium">Visible to {draft.audience}</span>
              </div>
            ) : draft.status === 'Scheduled' ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <HiOutlineCalendar size={20} />
                  <span>Scheduled for {draft.scheduledFor ? new Date(draft.scheduledFor).toLocaleString() : 'Selected Time'}</span>
                </div>
                <span className="text-[11px] text-amber-300/60 font-medium">Auto-publishing</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-1">
                    <HiOutlineSparkles size={14} className="text-indigo-400" /> AI Refinements
                  </span>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                      <HiOutlinePencilAlt size={14} /> Manual Edit
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {REFINEMENT_ACTIONS.map(act => (
                    <button
                      key={act.id}
                      onClick={() => onRefine && onRefine(act.id, act.label)}
                      className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 rounded-lg text-xs font-medium transition">
                      {act.label}
                    </button>
                  ))}
                </div>

                {/* Main Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                  {onCancel && (
                    <button
                      onClick={onCancel}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs font-semibold transition flex items-center gap-1.5">
                      <HiOutlineXCircle size={16} /> Cancel
                    </button>
                  )}

                  {onSaveDraft && (
                    <button
                      onClick={() => onSaveDraft(draft)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-white/10">
                      <HiOutlineSave size={16} /> Save Draft
                    </button>
                  )}

                  {onSchedule && (
                    <button
                      onClick={() => setShowScheduleInput(!showScheduleInput)}
                      className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-amber-500/30">
                      <HiOutlineCalendar size={16} /> Schedule
                    </button>
                  )}

                  {onPublish && (
                    <button
                      onClick={() => onPublish(draft)}
                      disabled={!isValid}
                      className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg ${
                        isValid
                          ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90 cursor-pointer'
                          : 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5'
                      }`}>
                      <HiOutlineCloudUpload size={18} /> Publish Now
                    </button>
                  )}
                </div>

                {!isValid && (
                  <p className="text-[11px] text-red-400 text-right">
                    ⚠️ Complete required fields (Title, Content, Category, Priority, Audience) to enable Publish.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementCard;
