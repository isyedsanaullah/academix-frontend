import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineClock, HiOutlineSave, HiOutlineChevronDown, HiOutlineCollection } from 'react-icons/hi';

const SLOT_TYPES = [
  { type: 'class', label: 'Period', icon: '📚', color: 'indigo' },
  { type: 'break', label: 'Break', icon: '☕', color: 'amber' },
  { type: 'sports_gap', label: 'Sports', icon: '⚽', color: 'emerald' },
  { type: 'nazira_gap', label: 'Nazira', icon: '📖', color: 'cyan' },
  { type: 'assembly_gap', label: 'Assembly', icon: '🎤', color: 'purple' },
  { type: 'function_gap', label: 'Function', icon: '🎉', color: 'rose' },
];

const COLOR_MAP = {
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-500/5', border: 'border-indigo-200 dark:border-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400', btn: 'bg-indigo-600 hover:bg-indigo-700' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-500/5', border: 'border-amber-200 dark:border-amber-500/20', text: 'text-amber-600 dark:text-amber-400', btn: 'bg-amber-500 hover:bg-amber-600' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/5', border: 'border-emerald-200 dark:border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-700' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-500/5', border: 'border-cyan-200 dark:border-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400', btn: 'bg-cyan-600 hover:bg-cyan-700' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-500/5', border: 'border-purple-200 dark:border-purple-500/20', text: 'text-purple-600 dark:text-purple-400', btn: 'bg-purple-600 hover:bg-purple-700' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-500/5', border: 'border-rose-200 dark:border-rose-500/20', text: 'text-rose-600 dark:text-rose-400', btn: 'bg-rose-600 hover:bg-rose-700' },
};

const getSlotMeta = (type) => SLOT_TYPES.find(s => s.type === type) || SLOT_TYPES[0];

const TimingSetup = ({ slots, setSlots, presets = [], selectedPreset, setSelectedPreset, onSavePreset, onDeletePreset, presetName, setPresetName, fromDate, setFromDate, toDate, setToDate }) => {
  const addSlot = (type = 'class') => {
    const last = slots[slots.length - 1];
    const start = last ? last.endTime : '08:00';
    const [h, m] = start.split(':').map(Number);

    let durationMinutes = type === 'class' ? 40 : type === 'break' ? 20 : 15;
    const totalMinutes = h * 60 + m + durationMinutes;
    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const meta = getSlotMeta(type);
    const countOfType = slots.filter(s => s.type === type).length;
    const label = type === 'class' ? `Period ${countOfType + 1}` : `${meta.label}${countOfType > 0 ? ` ${countOfType + 1}` : ''}`;

    setSlots([...slots, { id: Date.now(), type, startTime: start, endTime, label }]);
  };

  const updateSlot = (id, field, value) => {
    setSlots(slots.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSlot = (id) => {
    setSlots(slots.filter(s => s.id !== id));
  };

  const handlePresetChange = (presetId) => {
    setSelectedPreset(presetId);
    if (presetId) {
      const preset = presets.find(p => (p._id || p.id) === presetId);
      if (preset) {
        setSlots(preset.slots || []);
        setPresetName(preset.name || '');
        setFromDate(preset.fromDate ? preset.fromDate.split('T')[0] : '');
        setToDate(preset.toDate ? preset.toDate.split('T')[0] : '');
      }
    }
  };

  return (
    <div className="rounded-xl bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/[0.06] p-5 space-y-4">
      {/* Preset Management Bar */}
      <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] p-4">
        <div className="flex items-center gap-2 mb-3">
          <HiOutlineCollection size={15} className="text-indigo-500" />
          <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Universal Timetable Presets</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Preset Selector */}
          <div className="relative">
            <select value={selectedPreset || ''} onChange={e => handlePresetChange(e.target.value)}
              className="appearance-none w-full pl-3 pr-8 py-2 rounded-lg bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white/80 text-xs cursor-pointer focus:outline-none focus:border-indigo-500 transition">
              <option value="">New Preset</option>
              {presets.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>)}
            </select>
            <HiOutlineChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
          </div>
          {/* Name */}
          <input type="text" placeholder="Preset name..." value={presetName} onChange={e => setPresetName(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white/80 text-xs focus:outline-none focus:border-indigo-500 transition" />
          {/* From Date */}
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white/80 text-xs focus:outline-none focus:border-indigo-500 transition" />
          {/* To Date */}
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white/80 text-xs focus:outline-none focus:border-indigo-500 transition" />
          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={onSavePreset}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition">
              <HiOutlineSave size={13} /> Save
            </button>
            {selectedPreset && (
              <button onClick={onDeletePreset}
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition">
                <HiOutlineTrash size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Slot Type Buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">⏰ Timing Setup</h3>
          <p className="text-[11px] text-gray-500 dark:text-white/30 mt-0.5">Define periods, breaks & gaps — applies to all sections</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SLOT_TYPES.map(st => (
            <button key={st.type} onClick={() => addSlot(st.type)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg ${COLOR_MAP[st.color].btn} text-white text-[10px] font-medium transition`}>
              <HiOutlinePlus size={12} /> {st.icon} {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slot Cards */}
      {slots.length === 0 ? (
        <div className="py-8 text-center text-gray-400 dark:text-white/20 text-sm">
          Add periods, breaks, and gaps to define the daily schedule
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {slots.map((slot, i) => {
            const meta = getSlotMeta(slot.type);
            const colors = COLOR_MAP[meta.color];
            return (
              <div key={slot.id}
                className={`shrink-0 rounded-xl p-3 border-2 min-w-[130px] transition-all ${colors.bg} ${colors.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
                    {meta.icon} {meta.label}
                  </span>
                  <button onClick={() => removeSlot(slot.id)} className="text-gray-400 hover:text-rose-500 transition">
                    <HiOutlineTrash size={13} />
                  </button>
                </div>
                <input value={slot.label} onChange={e => updateSlot(slot.id, 'label', e.target.value)}
                  className="w-full text-xs font-medium bg-transparent border-0 border-b border-gray-300 dark:border-white/10 text-gray-900 dark:text-white/80 pb-1 mb-2 focus:outline-none focus:border-indigo-500"
                  placeholder="Label" />
                <div className="flex items-center gap-1.5">
                  <HiOutlineClock size={11} className="text-gray-400 dark:text-white/25" />
                  <input type="time" value={slot.startTime} onChange={e => updateSlot(slot.id, 'startTime', e.target.value)}
                    className="text-[11px] bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded px-1.5 py-0.5 text-gray-700 dark:text-white/70 w-[72px]" />
                  <span className="text-gray-400 text-[10px]">→</span>
                  <input type="time" value={slot.endTime} onChange={e => updateSlot(slot.id, 'endTime', e.target.value)}
                    className="text-[11px] bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded px-1.5 py-0.5 text-gray-700 dark:text-white/70 w-[72px]" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimingSetup;
