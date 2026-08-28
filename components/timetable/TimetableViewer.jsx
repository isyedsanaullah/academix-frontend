import { useState } from 'react';
import { HiOutlineCalendar, HiOutlineClock, HiOutlineAcademicCap, HiOutlinePencil, HiOutlineCheck, HiOutlineX, HiOutlineChevronDown, HiOutlineSwitchHorizontal } from 'react-icons/hi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getPeriodStyles = (period) => {
  if (period.isBreak || period.type === 'break') return 'bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-400 border-l-2 border-amber-500';
  if (period.type === 'sports_gap') return 'bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-400 border-l-2 border-emerald-500';
  if (period.type === 'nazira_gap') return 'bg-cyan-50 dark:bg-cyan-500/8 text-cyan-700 dark:text-cyan-400 border-l-2 border-cyan-500';
  if (period.type === 'assembly_gap') return 'bg-purple-50 dark:bg-purple-500/8 text-purple-700 dark:text-purple-400 border-l-2 border-purple-500';
  if (period.type === 'function_gap') return 'bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-400 border-l-2 border-rose-500';
  const name = (period.subject_id?.name || '').toLowerCase();
  if (name.includes('lab')) return 'bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-400 border-l-2 border-emerald-500';
  if (name.includes('activity')) return 'bg-purple-50 dark:bg-purple-500/8 text-purple-700 dark:text-purple-400 border-l-2 border-purple-500';
  return 'bg-indigo-50 dark:bg-indigo-500/8 text-indigo-700 dark:text-indigo-400 border-l-2 border-indigo-500';
};

const getGapIcon = (type) => {
  const map = { break: '☕', sports_gap: '⚽', nazira_gap: '📖', assembly_gap: '🎤', function_gap: '🎉' };
  return map[type] || '☕';
};

const getGapLabel = (period) => {
  if (period.label) return period.label;
  const map = { break: 'Break', sports_gap: 'Sports', nazira_gap: 'Nazira', assembly_gap: 'Assembly', function_gap: 'Function' };
  return map[period.type] || 'Break';
};

const isGapType = (period) => {
  return period.isBreak || ['break', 'sports_gap', 'nazira_gap', 'assembly_gap', 'function_gap'].includes(period.type);
};

/**
 * Get the subject ID string from a period's subject_id (which can be an object or string)
 */
const getSubjectIdStr = (period) => {
  if (!period.subject_id) return '';
  if (typeof period.subject_id === 'object') return period.subject_id._id || period.subject_id.id || '';
  return period.subject_id;
};

/**
 * Filter teachers to only those who have a given subject assigned.
 * Falls back to all teachers if none match (safety net).
 */
const getTeachersForSubject = (allTeachers, subjectId) => {
  if (!subjectId || !allTeachers?.length) return allTeachers || [];
  const filtered = allTeachers.filter(t => {
    const subs = t.subjects || [];
    return subs.some(s => {
      const sId = typeof s === 'object' ? (s._id || s.id) : s;
      return sId === subjectId;
    });
  });
  // If no teachers found for this subject, return all (better UX than empty dropdown)
  return filtered.length > 0 ? filtered : allTeachers;
};

const TimetableViewer = ({ timetables, viewMode, role = 'admin', teachers = [], onRefresh }) => {
  const [editingKey, setEditingKey] = useState(null);
  const [editPeriods, setEditPeriods] = useState({});
  const [saving, setSaving] = useState(false);
  const [sameAllDays, setSameAllDays] = useState(false);

  const grouped = {};
  const timetableIdMap = {};

  timetables.forEach(tt => {
    const className = tt.class || tt.class_id?.name || 'Unknown';
    const sectionCode = tt.section || tt.section_id?.code || '';
    const key = `${className}${sectionCode ? ` - ${sectionCode}` : ''}`;
    if (!grouped[key]) {
      grouped[key] = {};
      timetableIdMap[key] = {};
    }
    grouped[key][tt.day] = tt.periods || [];
    timetableIdMap[key][tt.day] = tt._id || tt.id;
  });

  const entries = Object.entries(grouped);

  const startEditing = (key) => {
    const cloned = {};
    DAYS.forEach(day => {
      cloned[day] = (grouped[key][day] || []).map(p => ({
        ...p,
        _teacherId: typeof p.teacher_id === 'object' ? (p.teacher_id?._id || '') : (p.teacher_id || ''),
      }));
    });
    setEditPeriods(cloned);
    setEditingKey(key);
    setSameAllDays(false);
  };

  const cancelEditing = () => {
    setEditingKey(null);
    setEditPeriods({});
    setSameAllDays(false);
  };

  // Update teacher for a specific day + period index
  // If sameAllDays is true, apply to the same periodIndex across all days
  const updateTeacherForPeriod = (day, periodIndex, teacherId) => {
    setEditPeriods(prev => {
      const updated = {};
      // Deep clone all days
      DAYS.forEach(d => {
        updated[d] = [...(prev[d] || [])].map(p => ({ ...p }));
      });

      if (sameAllDays) {
        // Apply to same period index across ALL days
        DAYS.forEach(d => {
          if (updated[d] && updated[d][periodIndex]) {
            updated[d][periodIndex] = {
              ...updated[d][periodIndex],
              _teacherId: teacherId,
            };
          }
        });
      } else {
        // Apply to single day only
        if (updated[day] && updated[day][periodIndex]) {
          updated[day][periodIndex] = {
            ...updated[day][periodIndex],
            _teacherId: teacherId,
          };
        }
      }
      return updated;
    });
  };

  const saveEditing = async (key) => {
    setSaving(true);
    try {
      const promises = [];
      for (const day of DAYS) {
        const ttId = timetableIdMap[key]?.[day];
        if (!ttId) continue;
        const updatedPeriods = (editPeriods[day] || []).map(p => {
          const period = { ...p };
          period.teacher_id = p._teacherId || null;
          delete period._teacherId;
          if (typeof period.subject_id === 'object' && period.subject_id) {
            period.subject_id = period.subject_id._id || period.subject_id.id || period.subject_id;
          }
          if (typeof period.teacher_id === 'object' && period.teacher_id) {
            period.teacher_id = period.teacher_id._id || period.teacher_id.id || period.teacher_id;
          }
          return period;
        });
        promises.push(api.put(`/timetables/${ttId}`, { periods: updatedPeriods }));
      }
      await Promise.all(promises);
      toast.success('Teachers assigned successfully!');
      setEditingKey(null);
      setEditPeriods({});
      setSameAllDays(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (entries.length === 0) {
    return (
      <div className="rounded-xl bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/[0.06] p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-white/[0.03] flex items-center justify-center">
          <HiOutlineCalendar className="w-8 h-8 text-gray-300 dark:text-white/15" />
        </div>
        <h3 className="text-base font-semibold text-gray-600 dark:text-white/50">No timetable data</h3>
        <p className="text-xs text-gray-400 dark:text-white/25 mt-1">
          {role === 'student' ? 'Your timetable has not been created yet' : role === 'teacher' ? 'No classes assigned to you yet' : 'Use the builder above to create a timetable'}
        </p>
      </div>
    );
  }

  /** Render teacher dropdown for a period in edit mode */
  const renderTeacherSelect = (period, day, periodIndex, sizeClass = 'text-[10px]') => {
    const subjectId = getSubjectIdStr(period);
    const eligibleTeachers = getTeachersForSubject(teachers, subjectId);
    const isFiltered = eligibleTeachers.length < teachers.length;

    return (
      <div className="relative mt-1">
        <select
          value={period._teacherId || ''}
          onChange={e => updateTeacherForPeriod(day, periodIndex, e.target.value)}
          className={`appearance-none w-full ${sizeClass} pl-1.5 pr-5 py-1 rounded bg-white/80 dark:bg-white/5 border border-gray-300/50 dark:border-white/10 text-gray-700 dark:text-white/60 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer`}
        >
          <option value="">No teacher</option>
          {isFiltered && (
            <optgroup label="— Subject Teachers —">
              {eligibleTeachers.map(t => (
                <option key={t._id || t.id} value={t._id || t.id}>
                  {t.user?.name || t.name || 'Teacher'}
                </option>
              ))}
            </optgroup>
          )}
          {isFiltered && (
            <optgroup label="— All Teachers —">
              {teachers.filter(t => !eligibleTeachers.find(e => (e._id || e.id) === (t._id || t.id))).map(t => (
                <option key={t._id || t.id} value={t._id || t.id}>
                  {t.user?.name || t.name || 'Teacher'}
                </option>
              ))}
            </optgroup>
          )}
          {!isFiltered && teachers.map(t => (
            <option key={t._id || t.id} value={t._id || t.id}>
              {t.user?.name || t.name || 'Teacher'}
            </option>
          ))}
        </select>
        <HiOutlineChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={10} />
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {entries.map(([key, data]) => {
        const isEditing = editingKey === key;

        return (
          <div key={key} className="rounded-xl bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/[0.06] overflow-hidden shadow-sm">
            {/* Class Header */}
            <div className="px-5 py-3 border-b border-gray-100 dark:border-white/[0.06] bg-gradient-to-r from-gray-50 to-white dark:from-white/[0.02] dark:to-transparent flex items-center gap-3 flex-wrap">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center">
                <HiOutlineAcademicCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">{key}</h2>
                <p className="text-[10px] text-gray-500 dark:text-white/25">{DAYS.length} days • Weekly</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">Active</span>

              {/* Edit / Save / Cancel buttons — admin only */}
              {role === 'admin' && (
                <div className="flex items-center gap-1.5 ml-auto">
                  {isEditing ? (
                    <>
                      {/* Same for all days toggle */}
                      <label className="flex items-center gap-1.5 mr-2 cursor-pointer select-none px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/15">
                        <HiOutlineSwitchHorizontal size={12} className="text-indigo-500" />
                        <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">Same for all days</span>
                        <input type="checkbox" checked={sameAllDays} onChange={e => setSameAllDays(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                      </label>
                      <button onClick={() => saveEditing(key)} disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition shadow-sm disabled:opacity-50">
                        <HiOutlineCheck size={13} />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={cancelEditing} disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-white/[0.06] hover:bg-gray-300 dark:hover:bg-white/[0.1] text-gray-700 dark:text-white/60 text-[11px] font-semibold transition disabled:opacity-50">
                        <HiOutlineX size={13} />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button onClick={() => startEditing(key)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 hover:bg-indigo-200 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-[11px] font-semibold transition border border-indigo-200 dark:border-indigo-500/20">
                      <HiOutlinePencil size={12} />
                      Edit Teachers
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Grid View */}
            {viewMode === 'grid' ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-white/[0.02]">
                      <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 dark:text-white/30 uppercase w-24">Day</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 dark:text-white/30 uppercase">Schedule</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map(day => {
                      const periods = isEditing ? (editPeriods[day] || []) : (data[day] || []);
                      return (
                        <tr key={day} className="border-t border-gray-100 dark:border-white/[0.04] hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                          <td className="px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-white/60 align-top">{day.slice(0, 3)}</td>
                          <td className="px-3 py-2">
                            {periods.length === 0 ? (
                              <span className="text-[11px] text-gray-300 dark:text-white/15">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {periods.map((p, i) => (
                                  <div key={i} className={`rounded-lg px-2.5 py-1.5 text-[11px] ${getPeriodStyles(p)} ${isEditing && !isGapType(p) ? 'min-w-[170px]' : ''}`}>
                                    <span className="font-semibold">
                                      {isGapType(p)
                                        ? `${getGapIcon(p.type || 'break')} ${getGapLabel(p)}`
                                        : (p.subject_id?.name || 'TBD')}
                                    </span>

                                    {isEditing && !isGapType(p) ? (
                                      renderTeacherSelect(p, day, i)
                                    ) : (
                                      !isGapType(p) && (
                                        p.teacher_id?.name
                                          ? <span className="opacity-60 ml-1">({p.teacher_id.name})</span>
                                          : <span className="opacity-40 ml-1 italic text-[9px]">(No teacher)</span>
                                      )
                                    )}

                                    <span className="opacity-40 ml-1.5 font-mono text-[9px]">{p.startTime}–{p.endTime}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Compact View */
              <div className="overflow-x-auto">
                <div className="min-w-[640px] grid" style={{ gridTemplateColumns: `80px repeat(${DAYS.length}, 1fr)` }}>
                  <div className="px-2 py-2 text-[9px] font-bold text-gray-400 dark:text-white/20 uppercase bg-gray-50 dark:bg-white/[0.02]">Time</div>
                  {DAYS.map(d => (
                    <div key={d} className="px-2 py-2 text-[9px] font-bold text-gray-400 dark:text-white/20 uppercase text-center bg-gray-50 dark:bg-white/[0.02] border-l border-gray-100 dark:border-white/[0.04]">{d.slice(0, 3)}</div>
                  ))}
                  {(() => {
                    const allTimes = new Set();
                    DAYS.forEach(d => ((isEditing ? editPeriods[d] : data[d]) || []).forEach(p => allTimes.add(p.startTime)));
                    return [...allTimes].sort().map(time => (
                      <div key={time} className="contents">
                        <div className="px-2 py-1.5 text-[10px] text-gray-500 dark:text-white/30 flex items-center gap-1 border-t border-gray-100 dark:border-white/[0.04]">
                          <HiOutlineClock size={10} />{time}
                        </div>
                        {DAYS.map(d => {
                          const periods = isEditing ? (editPeriods[d] || []) : (data[d] || []);
                          const p = periods.find(x => x.startTime === time);
                          const pIdx = periods.findIndex(x => x.startTime === time);
                          return (
                            <div key={d} className="px-1 py-1 border-l border-t border-gray-100 dark:border-white/[0.04]">
                              {p ? (
                                <div className={`rounded px-1.5 py-1 text-[10px] ${getPeriodStyles(p)}`}>
                                  <div className="font-medium truncate">
                                    {isGapType(p) ? `${getGapIcon(p.type || 'break')} ${getGapLabel(p)}` : (p.subject_id?.name || 'TBD')}
                                  </div>
                                  {isEditing && !isGapType(p) ? (
                                    renderTeacherSelect(p, d, pIdx, 'text-[8px]')
                                  ) : (
                                    !isGapType(p) && p.teacher_id?.name && (
                                      <div className="text-[8px] opacity-50 truncate">{p.teacher_id.name}</div>
                                    )
                                  )}
                                </div>
                              ) : <span className="text-[10px] text-gray-200 dark:text-white/8">—</span>}
                            </div>
                          );
                        })}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.01] flex flex-wrap gap-4 text-[9px]">
              <span className="text-gray-400 dark:text-white/20">Legend:</span>
              {[
                ['indigo', 'Class', '📚'], ['amber', 'Break', '☕'], ['emerald', 'Sports', '⚽'],
                ['cyan', 'Nazira', '📖'], ['purple', 'Assembly', '🎤'], ['rose', 'Function', '🎉']
              ].map(([c, l, icon]) => (
                <span key={l} className="flex items-center gap-1">
                  <span className="text-[10px]">{icon}</span>
                  <span className="text-gray-500 dark:text-white/30">{l}</span>
                </span>
              ))}
            </div>

            {/* Edit mode hint */}
            {isEditing && (
              <div className="px-4 py-2 border-t border-indigo-100 dark:border-indigo-500/10 bg-indigo-50/50 dark:bg-indigo-500/5">
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                  ✏️ Edit Mode — Teachers are filtered by subject assignment. {sameAllDays ? '🔗 Changes apply to all days.' : 'Assigning per day.'}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TimetableViewer;
