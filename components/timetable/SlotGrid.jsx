import { useState } from 'react';
import { HiOutlineX, HiOutlineSwitchHorizontal, HiOutlineChevronDown } from 'react-icons/hi';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat' };

/**
 * Filter teachers to only those who have the given subject assigned.
 * Falls back to all teachers if none match.
 */
const getTeachersForSubject = (allTeachers, subjectId) => {
  if (!subjectId || !allTeachers?.length) return { eligible: allTeachers || [], others: [] };
  const eligible = allTeachers.filter(t => {
    const subs = t.subjects || [];
    return subs.some(s => {
      const sId = typeof s === 'object' ? (s._id || s.id) : s;
      return sId === subjectId;
    });
  });
  const others = allTeachers.filter(t => !eligible.find(e => (e._id || e.id) === (t._id || t.id)));
  // If no teachers found for this subject, return all as eligible
  if (eligible.length === 0) return { eligible: allTeachers, others: [] };
  return { eligible, others };
};

const SlotGrid = ({ slots, subjects, teachers = [], grid, setGrid, sameDays, setSameDays }) => {
  const [dragItem, setDragItem] = useState(null);
  const periodSlots = slots.filter(s => s.type === 'class' || s.type === 'period');
  const activeDays = sameDays ? ['Monday'] : DAYS;

  const handleDrop = (day, slotId) => {
    if (!dragItem) return;
    if (sameDays) {
      // Apply subject to all days for this slot
      setGrid(prev => {
        const next = { ...prev };
        DAYS.forEach(d => {
          next[`${d}_${slotId}`] = { ...dragItem };
        });
        return next;
      });
    } else {
      const key = `${day}_${slotId}`;
      setGrid(prev => ({ ...prev, [key]: { ...dragItem } }));
    }
    setDragItem(null);
  };

  const clearSlot = (day, slotId) => {
    if (sameDays) {
      setGrid(prev => {
        const n = { ...prev };
        DAYS.forEach(d => { delete n[`${d}_${slotId}`]; });
        return n;
      });
    } else {
      const key = `${day}_${slotId}`;
      setGrid(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  const updateTeacher = (day, slotId, teacherId) => {
    const teacher = teachers.find(t => (t._id || t.id) === teacherId);
    const teacherName = teacher ? (teacher.user?.name || teacher.user_id?.name || teacher.name || '') : '';

    if (sameDays) {
      // Apply same teacher to all days for this slot
      setGrid(prev => {
        const next = { ...prev };
        DAYS.forEach(d => {
          const key = `${d}_${slotId}`;
          if (next[key]) {
            next[key] = { ...next[key], teacherId: teacherId || null, teacherName };
          }
        });
        return next;
      });
    } else {
      const key = `${day}_${slotId}`;
      setGrid(prev => ({
        ...prev,
        [key]: { ...prev[key], teacherId: teacherId || null, teacherName }
      }));
    }
  };

  const getAssignment = (day, slotId) => grid[`${day}_${slotId}`];

  return (
    <div className="rounded-xl bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">📋 Assign Subjects to Slots</h3>
          <p className="text-[11px] text-gray-500 dark:text-white/30 mt-0.5">Drag subjects from the palette into the grid, then assign teachers</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/15">
          <HiOutlineSwitchHorizontal size={14} className="text-indigo-500" />
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Same for all days</span>
          <input type="checkbox" checked={sameDays} onChange={e => setSameDays(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
        </label>
      </div>

      {/* Subject Palette */}
      <div className="px-5 py-3 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/[0.06]">
        <p className="text-[10px] font-bold text-gray-400 dark:text-white/20 uppercase tracking-wider mb-2">📦 Subject Palette — drag into grid</p>
        <div className="flex flex-wrap gap-2">
          {subjects.map(sub => (
            <div key={sub._id || sub.id} draggable
              onDragStart={() => setDragItem({ subjectId: sub._id || sub.id, subjectName: sub.name })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-medium cursor-grab active:cursor-grabbing border border-indigo-200 dark:border-indigo-500/20 hover:shadow-md hover:scale-105 transition-all select-none">
              📚 {sub.name}
            </div>
          ))}
          {subjects.length === 0 && (
            <span className="text-xs text-gray-400 dark:text-white/20">No subjects loaded for this section's class/group.</span>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-auto max-h-[500px]">
        <div className="min-w-[600px]">
          {/* Column Headers */}
          <div className="grid sticky top-0 z-10 bg-gray-50 dark:bg-[#0a0e14] border-b border-gray-200 dark:border-white/[0.06]"
            style={{ gridTemplateColumns: `90px repeat(${periodSlots.length}, minmax(140px, 1fr))` }}>
            <div className="px-3 py-2.5 text-[10px] font-bold text-gray-500 dark:text-white/25 uppercase">
              {sameDays ? 'All Days' : 'Day'}
            </div>
            {periodSlots.map((slot, i) => (
              <div key={slot.id} className="px-2 py-2.5 text-center border-l border-gray-200 dark:border-white/[0.06]">
                <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">{slot.label || `P${i + 1}`}</div>
                <div className="text-[9px] text-gray-400 dark:text-white/20 mt-0.5">{slot.startTime}–{slot.endTime}</div>
              </div>
            ))}
          </div>

          {/* Day Rows */}
          {activeDays.map(day => (
            <div key={day} className="grid border-b border-gray-100 dark:border-white/[0.04] hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition"
              style={{ gridTemplateColumns: `90px repeat(${periodSlots.length}, minmax(140px, 1fr))` }}>
              <div className="px-3 py-3 flex items-center text-xs font-semibold text-gray-700 dark:text-white/50 bg-gray-50/50 dark:bg-white/[0.02]">
                {sameDays ? '📅 All' : DAY_SHORT[day]}
              </div>
              {periodSlots.map(slot => {
                const assignment = getAssignment(day, slot.id);
                const subjectId = assignment?.subjectId || '';
                const { eligible, others } = getTeachersForSubject(teachers, subjectId);
                const hasFiltered = others.length > 0;

                return (
                  <div key={slot.id}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => handleDrop(day, slot.id)}
                    className={`px-1.5 py-1.5 border-l border-gray-100 dark:border-white/[0.04] min-h-[80px] flex items-center justify-center transition-colors ${
                      !assignment ? 'hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5' : ''
                    }`}>
                    {assignment ? (
                      <div className="w-full rounded-lg bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-2 relative group">
                        <button onClick={() => clearSlot(day, slot.id)}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                          <HiOutlineX size={10} />
                        </button>
                        <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 truncate">{assignment.subjectName}</div>
                        {/* Teacher Dropdown — filtered by subject */}
                        <div className="relative mt-1.5">
                          <select
                            value={assignment.teacherId || ''}
                            onChange={e => updateTeacher(day, slot.id, e.target.value)}
                            className="appearance-none w-full text-[9px] pl-1.5 pr-5 py-1 rounded bg-white/80 dark:bg-white/5 border border-indigo-200/50 dark:border-indigo-500/10 text-gray-600 dark:text-white/50 focus:outline-none focus:border-indigo-400 cursor-pointer">
                            <option value="">No teacher</option>
                            {hasFiltered ? (
                              <>
                                <optgroup label="— Subject Teachers —">
                                  {eligible.map(t => (
                                    <option key={t._id || t.id} value={t._id || t.id}>
                                      {t.user?.name || t.name || 'Teacher'}
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="— All Teachers —">
                                  {others.map(t => (
                                    <option key={t._id || t.id} value={t._id || t.id}>
                                      {t.user?.name || t.name || 'Teacher'}
                                    </option>
                                  ))}
                                </optgroup>
                              </>
                            ) : (
                              eligible.map(t => (
                                <option key={t._id || t.id} value={t._id || t.id}>
                                  {t.user?.name || t.name || 'Teacher'}
                                </option>
                              ))
                            )}
                          </select>
                          <HiOutlineChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={9} />
                        </div>
                        {!assignment.teacherId && (
                          <div className="text-[8px] text-amber-500/70 dark:text-amber-400/50 mt-0.5 italic">Teacher not assigned</div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-lg border-2 border-dashed border-gray-200 dark:border-white/[0.06] flex items-center justify-center min-h-[60px]">
                        <span className="text-[10px] text-gray-300 dark:text-white/10">Drop here</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Hint */}
      <div className="px-4 py-2 border-t border-gray-100 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.01]">
        <p className="text-[10px] text-gray-400 dark:text-white/20">
          💡 Teachers are filtered by subject assignment. {sameDays ? '🔗 Changes apply to all 6 days.' : 'Assign per day individually.'}
        </p>
      </div>
    </div>
  );
};

export default SlotGrid;
