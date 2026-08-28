import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineClock, HiOutlineRefresh, HiOutlineCheck } from 'react-icons/hi';

export default function AssignmentVersionHistoryModal({
  history = [],
  onRestoreVersion,
  onClose
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const mockHistory = history.length > 0 ? history : [
    { version: 2, timestamp: new Date().toLocaleTimeString(), label: 'Current Version (Edited inline)' },
    { version: 1, timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(), label: 'Initial AI Generated Snapshot' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl text-white font-sans">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <HiOutlineClock className="text-indigo-400" /> Version History & Snapshots
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-white/50">Select a previous snapshot to view or restore to the assignment editor:</p>

          <div className="space-y-2">
            {mockHistory.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  selectedIdx === idx
                    ? 'bg-indigo-600/10 border-indigo-500 text-white'
                    : 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono font-bold flex items-center justify-center text-xs">
                    v{item.version}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">{item.label}</h4>
                    <span className="text-[10px] text-white/40">{item.timestamp}</span>
                  </div>
                </div>

                {selectedIdx === idx && (
                  <span className="text-indigo-400 font-bold flex items-center gap-1">
                    <HiOutlineCheck /> Selected
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (onRestoreVersion) onRestoreVersion(mockHistory[selectedIdx]);
                toast.success(`Restored to version ${mockHistory[selectedIdx].version}`);
                onClose();
              }}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-lg"
            >
              <HiOutlineRefresh /> Restore Selected Version
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
