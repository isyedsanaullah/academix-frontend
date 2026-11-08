import { useState, useEffect } from 'react';
import {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_AUDIENCES,
  REFINEMENT_ACTIONS,
} from '../../config/announcementConstants';
import Button from '../ui/Button';
import Icon from '../Icon';

const AnnouncementCard = ({
  announcement,
  mode = 'preview', // 'preview' | 'published'
  onPublish,
  onSchedule,
  onSaveDraft,
  onRefine,
  onEditChange,
  onCancel,
  authorName = 'Administrator',
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
    ...announcement,
  });

  const [versions, setVersions] = useState([
    {
      v: 1,
      title: announcement?.title || '',
      content: announcement?.content || '',
      timestamp: new Date(),
    },
  ]);

  useEffect(() => {
    if (announcement) {
      setDraft((prev) => ({ ...prev, ...announcement }));
    }
  }, [announcement]);

  const handleChange = (field, value) => {
    const updated = { ...draft, [field]: value };
    setDraft(updated);
    if (onEditChange) onEditChange(updated);
  };

  const saveVersion = () => {
    const newVer = {
      v: versions.length + 1,
      title: draft.title,
      content: draft.content,
      category: draft.category,
      priority: draft.priority,
      audience: draft.audience,
      timestamp: new Date(),
    };
    setVersions((prev) => [...prev, newVer]);
  };

  const restoreVersion = (verObj) => {
    const restored = {
      ...draft,
      title: verObj.title,
      content: verObj.content,
      category: verObj.category || draft.category,
      priority: verObj.priority || draft.priority,
      audience: verObj.audience || draft.audience,
    };
    setDraft(restored);
    if (onEditChange) onEditChange(restored);
  };

  const isValidTitle = Boolean(draft.title && draft.title.trim().length >= 3);
  const isValidContent = Boolean(draft.content && draft.content.trim().length >= 5);
  const isValidCategory = ANNOUNCEMENT_CATEGORIES.includes(draft.category);
  const isValidPriority = ANNOUNCEMENT_PRIORITIES.includes(draft.priority);
  const isValidAudience = ANNOUNCEMENT_AUDIENCES.includes(draft.audience);
  const isValid =
    isValidTitle && isValidContent && isValidCategory && isValidPriority && isValidAudience;

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
  }, [draft, mode, isEditing, isValid, onPublish, onSaveDraft, onRefine]);

  const prioClass =
    draft.priority === 'Urgent' || draft.priority === 'High'
      ? 'label-red'
      : draft.priority === 'Medium'
      ? 'label-yellow'
      : 'label-gray';

  return (
    <div className="w-full rounded-4xl border border-s-stroke2 bg-b-surface2 shadow-depth overflow-hidden">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 bg-b-surface1 border-b border-s-subtle">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--brand-blue)] animate-pulse" />
          <span className="text-caption font-bold uppercase tracking-wider text-[var(--brand-blue)]">
            {mode === 'preview' ? 'Announcement Preview' : 'Announcement Notice'}
          </span>
          <span
            className={`label uppercase ${
              draft.status === 'Published'
                ? 'label-green'
                : draft.status === 'Scheduled'
                ? 'label-yellow'
                : 'label-blue'
            }`}
          >
            {draft.status || 'Draft'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="label label-blue">{draft.category}</span>
          <span className={`label ${prioClass}`}>{draft.priority} Priority</span>
          <span className="label label-gray">{draft.audience}</span>
          {mode === 'preview' && draft.confidenceScore !== undefined && (
            <span className={`label ${draft.confidenceScore >= 80 ? 'label-green' : 'label-yellow'}`}>
              {draft.confidenceScore}% Confidence
            </span>
          )}
        </div>
      </div>

      {/* Warning Banners */}
      {mode === 'preview' &&
        (draft.confidenceScore < 80 ||
          draft.missingFields?.length > 0 ||
          draft.warnings?.length > 0) && (
          <div className="space-y-2 p-4 px-6 bg-b-surface1 border-b border-s-subtle">
            {draft.confidenceScore < 80 && (
              <div className="flex items-center gap-2 text-caption font-medium text-[var(--warning)] bg-[var(--warning-soft)] p-3 rounded-2xl border border-[var(--warning)]/25">
                <Icon name="alert" size={18} className="shrink-0 fill-current" />
                <span>
                  Low confidence output: Please review all announcement fields carefully before
                  publishing.
                </span>
              </div>
            )}

            {draft.missingFields && draft.missingFields.length > 0 && (
              <div className="flex items-center gap-2 text-caption font-medium text-[var(--danger)] bg-[var(--danger-soft)] p-3 rounded-2xl border border-[var(--danger)]/25">
                <Icon name="alert" size={18} className="shrink-0 fill-current" />
                <span>
                  Missing details detected ({draft.missingFields.join(', ')}). Please complete
                  missing details below.
                </span>
              </div>
            )}

            {draft.warnings &&
              draft.warnings.map((warn, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-caption font-medium text-[var(--warning)] bg-[var(--warning-soft)] p-3 rounded-2xl border border-[var(--warning)]/25"
                >
                  <Icon name="alert" size={18} className="shrink-0 fill-current" />
                  <span>{warn}</span>
                </div>
              ))}
          </div>
        )}

      {/* Card Content Area */}
      <div className="p-6 space-y-4">
        {!isEditing ? (
          <div className="space-y-3">
            <h2 className="text-h5 text-t-primary">
              {draft.title || <span className="italic text-t-tertiary">Untitled Announcement</span>}
            </h2>

            <div className="text-body-2 text-t-secondary leading-relaxed max-w-none break-words whitespace-pre-wrap">
              {draft.content
                ? draft.content
                    .replace(/<p[^>]*>/gi, '')
                    .replace(/<\/p>/gi, '\n')
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<[^>]*>/g, '')
                    .trim()
                : 'No content provided.'}
            </div>

            {draft.attachments && draft.attachments.length > 0 && (
              <div className="pt-3 border-t border-s-subtle">
                <p className="text-caption font-semibold text-t-secondary mb-2 flex items-center gap-1.5">
                  <Icon name="paperclip" size={14} className="fill-current" /> Attached Documents (
                  {draft.attachments.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {draft.attachments.map((file, idx) => (
                    <a
                      key={idx}
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-2xl bg-b-surface1 border border-s-stroke2 text-caption font-medium text-[var(--brand-blue)] hover:border-s-highlight transition flex items-center gap-1.5"
                    >
                      <Icon name="paperclip" size={12} className="fill-current" />{' '}
                      {typeof file === 'string' ? file.split('/').pop() : `Attachment ${idx + 1}`}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 bg-b-surface1 p-5 rounded-3xl border border-s-stroke2">
            <div className="flex items-center justify-between border-b border-s-subtle pb-3">
              <span className="text-caption font-bold text-[var(--brand-blue)] uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="edit" size={14} className="fill-current" /> Edit Announcement Fields
              </span>
              <Button
                isPrimary
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  saveVersion();
                }}
              >
                Done Editing
              </Button>
            </div>

            <div>
              <label className="block text-sub-title-2 text-t-primary mb-1.5">
                Announcement Title
              </label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter title..."
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sub-title-2 text-t-primary mb-1.5">
                Announcement Body Text
              </label>
              <textarea
                value={
                  draft.content
                    ? draft.content
                        .replace(/<p[^>]*>/gi, '')
                        .replace(/<\/p>/gi, '\n')
                        .replace(/<br\s*\/?>/gi, '\n')
                        .replace(/<[^>]*>/g, '')
                        .trim()
                    : ''
                }
                onChange={(e) => handleChange('content', e.target.value)}
                placeholder="Enter notice details..."
                rows={5}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sub-title-2 text-t-primary mb-1.5">Category</label>
                <select
                  value={draft.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="input-field"
                >
                  {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sub-title-2 text-t-primary mb-1.5">Priority</label>
                <select
                  value={draft.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="input-field"
                >
                  {ANNOUNCEMENT_PRIORITIES.map((prio) => (
                    <option key={prio} value={prio}>
                      {prio}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sub-title-2 text-t-primary mb-1.5">Audience</label>
                <select
                  value={draft.audience}
                  onChange={(e) => handleChange('audience', e.target.value)}
                  className="input-field"
                >
                  {ANNOUNCEMENT_AUDIENCES.map((aud) => (
                    <option key={aud} value={aud}>
                      {aud}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-caption text-t-secondary">
                <input
                  type="checkbox"
                  checked={draft.isPublic}
                  onChange={(e) => handleChange('isPublic', e.target.checked)}
                  className="rounded border-s-stroke2 text-[var(--brand-blue)]"
                />
                Public Notice (Visible on Website)
              </label>
            </div>
          </div>
        )}

        {/* Metrics Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-caption text-t-tertiary pt-3 border-t border-s-subtle">
          <div className="flex items-center gap-4">
            <span>
              Title: <strong className="text-t-primary">{draft.title?.length || 0}</strong> chars
            </span>
            <span>
              Content:{' '}
              <strong className="text-t-primary">
                {draft.content?.replace(/<[^>]*>/g, '')?.length || 0}
              </strong>{' '}
              chars
            </span>
            {draft.viewCount !== undefined && (
              <span className="flex items-center gap-1 text-[var(--brand-blue)]">
                <Icon name="eye" size={14} className="fill-current" /> {draft.viewCount} Views
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span>
              By: <strong className="text-t-primary">{authorName}</strong>
            </span>
          </div>
        </div>

        {/* AI Reasoning */}
        {mode === 'preview' && draft.reasoning && (
          <div className="border border-s-subtle rounded-2xl bg-b-surface1 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAiReasoning(!showAiReasoning)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-caption font-semibold text-[var(--brand-blue)] hover:bg-b-highlight transition"
            >
              <span className="flex items-center gap-1.5">
                <Icon name="sparkles" size={14} className="fill-current" /> AI Decision & Rule
                Engine Explanation
              </span>
              <Icon
                name="chevron"
                size={14}
                className={`fill-current transition-transform ${
                  showAiReasoning ? 'rotate-180' : ''
                }`}
              />
            </button>
            {showAiReasoning && (
              <div className="p-4 pt-2 text-caption text-t-secondary space-y-1.5 border-t border-s-subtle">
                <p>
                  <strong>Category Decision:</strong> {draft.category}
                </p>
                <p>
                  <strong>Priority Decision:</strong> {draft.priority}
                </p>
                <p>
                  <strong>Audience Mapping:</strong> {draft.audience}
                </p>
                <p>
                  <strong>Rule Logic:</strong> {draft.reasoning}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Version History */}
        {mode === 'preview' && versions.length > 1 && (
          <div className="border border-s-subtle rounded-2xl bg-b-surface1 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowVersionHistory(!showVersionHistory)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-caption font-semibold text-t-secondary hover:bg-b-highlight transition"
            >
              <span className="flex items-center gap-1.5">
                <Icon name="clock" size={14} className="fill-current" /> Draft Version Trajectory (
                {versions.length} versions)
              </span>
              <Icon
                name="chevron"
                size={14}
                className={`fill-current transition-transform ${
                  showVersionHistory ? 'rotate-180' : ''
                }`}
              />
            </button>
            {showVersionHistory && (
              <div className="p-3 border-t border-s-subtle space-y-2">
                {versions.map((ver) => (
                  <div
                    key={ver.v}
                    className="flex items-center justify-between px-3 py-2 bg-b-surface2 rounded-xl text-caption"
                  >
                    <div>
                      <span className="font-bold text-[var(--brand-blue)]">Version {ver.v}</span>
                      <span className="text-t-tertiary ml-2">
                        {new Date(ver.timestamp).toLocaleTimeString()}
                      </span>
                      <p className="text-t-primary truncate max-w-md">{ver.title}</p>
                    </div>
                    <Button isStroke size="sm" onClick={() => restoreVersion(ver)}>
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Schedule Input */}
        {showScheduleInput && (
          <div className="p-4 bg-[var(--warning-soft)] border border-[var(--warning)]/30 rounded-2xl flex items-center gap-3 flex-wrap">
            <Icon name="calendar" size={20} className="fill-[var(--warning)] shrink-0" />
            <div className="flex-1 min-w-[200px]">
              <label className="block text-caption font-bold text-t-primary mb-1">
                Select Schedule Publish Date & Time
              </label>
              <input
                type="datetime-local"
                value={draft.scheduledFor || ''}
                onChange={(e) => handleChange('scheduledFor', e.target.value)}
                className="input-field"
              />
            </div>
            <Button
              isPrimary
              size="sm"
              disabled={!draft.scheduledFor}
              onClick={() => {
                if (onSchedule) onSchedule(draft);
                setShowScheduleInput(false);
              }}
            >
              Confirm Schedule
            </Button>
          </div>
        )}

        {/* Publishing Toolbar */}
        {mode === 'preview' && (
          <div className="pt-3 border-t border-s-subtle space-y-3">
            {draft.status === 'Published' ? (
              <div className="p-3.5 bg-[var(--brand-green-soft)] border border-[var(--brand-green)]/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-caption font-bold text-[var(--brand-green-text)]">
                  <Icon name="check-circle" size={18} className="fill-current" />
                  <span>Announcement Published & Active</span>
                </div>
                <span className="text-caption text-t-secondary">Visible to {draft.audience}</span>
              </div>
            ) : draft.status === 'Scheduled' ? (
              <div className="p-3.5 bg-[var(--warning-soft)] border border-[var(--warning)]/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-caption font-bold text-[var(--warning)]">
                  <Icon name="calendar" size={18} className="fill-current" />
                  <span>
                    Scheduled for{' '}
                    {draft.scheduledFor
                      ? new Date(draft.scheduledFor).toLocaleString()
                      : 'Selected Time'}
                  </span>
                </div>
                <span className="text-caption text-t-secondary">Auto-publishing</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-caption font-bold text-t-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Icon name="sparkles" size={14} className="fill-[var(--brand-blue)]" /> AI
                    Refinements
                  </span>
                  {!isEditing && (
                    <Button
                      isGhost
                      size="sm"
                      icon="edit"
                      onClick={() => setIsEditing(true)}
                    >
                      Manual Edit
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {REFINEMENT_ACTIONS.map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => onRefine && onRefine(act.id, act.label)}
                      className="px-3 py-1.5 bg-[var(--brand-blue-soft)] hover:bg-[var(--brand-blue)]/15 text-[var(--brand-blue)] rounded-full text-caption font-semibold transition"
                    >
                      {act.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                  {onCancel && (
                    <Button isStroke size="sm" icon="close" onClick={onCancel}>
                      Cancel
                    </Button>
                  )}
                  {onSaveDraft && (
                    <Button isStroke size="sm" icon="save" onClick={() => onSaveDraft(draft)}>
                      Save Draft
                    </Button>
                  )}
                  {onSchedule && (
                    <Button
                      isStroke
                      size="sm"
                      icon="calendar"
                      onClick={() => setShowScheduleInput(!showScheduleInput)}
                    >
                      Schedule
                    </Button>
                  )}
                  {onPublish && (
                    <Button
                      isPrimary
                      size="sm"
                      icon="upload"
                      disabled={!isValid}
                      onClick={() => onPublish(draft)}
                    >
                      Publish Now
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementCard;
