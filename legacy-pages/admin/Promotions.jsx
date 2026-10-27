'use client';

import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineAcademicCap,
  HiOutlineArrowRight,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineExclamation
} from 'react-icons/hi';

const Promotions = () => {
  const [sessions, setSessions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [fromSessionId, setFromSessionId] = useState('');
  const [toSessionId, setToSessionId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [fromClass, setFromClass] = useState('FSC Part 1');
  const [toClass, setToClass] = useState('FSC Part 2');
  const [rollNumberRule, setRollNumberRule] = useState('keep');

  // Simulation / execution states
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [sesRes, batRes] = await Promise.all([
          api.get('/sessions'),
          api.get('/batches').catch(() => ({ data: { data: [] } }))
        ]);
        const sesList = sesRes.data.data || [];
        setSessions(sesList);
        setBatches(batRes.data.data || []);

        const current = sesList.find(s => s.isCurrent);
        if (current) setFromSessionId(current._id || current.id);
        const nextSession = sesList.find(s => s._id !== current?._id && s.id !== current?.id);
        if (nextSession) setToSessionId(nextSession._id || nextSession.id);
      } catch (err) {
        toast.error('Failed to load academic sessions');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleRunSimulation = async () => {
    if (!fromSessionId || !toSessionId) {
      return toast.error('Please select both source and destination academic sessions');
    }
    if (fromSessionId === toSessionId) {
      return toast.error('Source and destination sessions must be different');
    }

    setSimulating(true);
    setSimulationResult(null);
    setExecutionResult(null);
    try {
      const { data } = await api.post('/promotions/run', {
        fromSessionId,
        toSessionId,
        batchId: batchId || undefined,
        fromClass,
        toClass,
        rollNumberRule,
        dryRun: true
      });
      setSimulationResult(data);
      toast.success(`Simulation complete: ${data.totalEligible} eligible students found.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to run promotion dry run');
    } finally {
      setSimulating(false);
    }
  };

  const handleExecutePromotion = async () => {
    if (!confirm(`Are you sure you want to promote ${simulationResult?.totalEligible || 0} students from ${fromClass} to ${toClass}? Old records will be set to 'promoted' and new records created.`)) {
      return;
    }

    setExecuting(true);
    try {
      const { data } = await api.post('/promotions/run', {
        fromSessionId,
        toSessionId,
        batchId: batchId || undefined,
        fromClass,
        toClass,
        rollNumberRule,
        dryRun: false
      });
      setExecutionResult(data);
      setSimulationResult(null);
      toast.success(`Promotion complete: ${data.promotedCount} students successfully promoted!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to execute promotion');
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading promotion engine...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <HiOutlineAcademicCap size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Annual Student Promotion Engine</h2>
            <p className="text-xs text-slate-500 dark:text-white/40">
              Promote active first-year students to second year, preserving historical records, Card IDs, and roll numbers.
            </p>
          </div>
        </div>
      </div>

      {/* Promotion Parameters Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Promotion Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-white/60 mb-1.5">
              Source Session (From)
            </label>
            <select
              value={fromSessionId}
              onChange={e => setFromSessionId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select source session...</option>
              {sessions.map(s => (
                <option key={s._id || s.id} value={s._id || s.id}>
                  {s.name} {s.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-white/60 mb-1.5">
              Destination Session (To)
            </label>
            <select
              value={toSessionId}
              onChange={e => setToSessionId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select destination session...</option>
              {sessions.map(s => (
                <option key={s._id || s.id} value={s._id || s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-white/60 mb-1.5">
              Two-Year Batch (Optional)
            </label>
            <select
              value={batchId}
              onChange={e => setBatchId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">No Batch Assigned</option>
              {batches.map(b => (
                <option key={b._id || b.id} value={b._id || b.id}>
                  {b.name} ({b.startYear}-{b.endYear})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-white/60 mb-1.5">
              Source Class Level
            </label>
            <input
              type="text"
              value={fromClass}
              onChange={e => setFromClass(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-white/60 mb-1.5">
              Target Class Level
            </label>
            <input
              type="text"
              value={toClass}
              onChange={e => setToClass(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-white/60 mb-1.5">
              Roll Number Policy
            </label>
            <select
              value={rollNumberRule}
              onChange={e => setRollNumberRule(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="keep">Keep Same Roll Number (Standard)</option>
              <option value="suffix">Append Part 2 Suffix (-P2)</option>
            </select>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-end gap-3">
          <button
            onClick={handleRunSimulation}
            disabled={simulating || executing}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition disabled:opacity-50"
          >
            {simulating ? (
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <HiOutlineRefresh size={16} />
            )}
            Run Dry Run (Simulation)
          </button>
        </div>
      </div>

      {/* Simulation Results Card */}
      {simulationResult && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                  Simulation Ready (Dry Run)
                </span>
                <span className="text-xs text-slate-400">Zero database rows modified</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {simulationResult.totalEligible} Students Eligible for Promotion
              </h3>
            </div>

            <button
              onClick={handleExecutePromotion}
              disabled={executing || simulationResult.totalEligible === 0}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition disabled:opacity-50"
            >
              {executing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <HiOutlineCheckCircle size={16} />
              )}
              Confirm & Execute Promotion ({simulationResult.totalEligible})
            </button>
          </div>

          {/* Sample Table */}
          {simulationResult.sample && simulationResult.sample.length > 0 && (
            <div className="rounded-xl border border-slate-100 dark:border-white/[0.04] overflow-hidden mt-3">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-white/40 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Current Roll No</th>
                    <th className="py-2.5 px-3">Projected Roll No</th>
                    <th className="py-2.5 px-3">Group</th>
                    <th className="py-2.5 px-3">Transition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {simulationResult.sample.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                      <td className="py-2 px-3 font-semibold text-slate-800 dark:text-white">{s.name}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{s.currentRollNumber}</td>
                      <td className="py-2 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{s.projectedRollNumber}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-white/60">{s.group}</td>
                      <td className="py-2 px-3 text-[11px] text-slate-500">
                        {s.fromClass} ({s.fromSession}) <HiOutlineArrowRight className="inline mx-1" /> {s.toClass} ({s.toSession})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Execution Complete Card */}
      {executionResult && (
        <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <HiOutlineCheckCircle size={20} />
            <span>Promotion Completed Successfully!</span>
          </div>
          <p className="text-xs">
            {executionResult.message} Previous records were marked as &apos;promoted&apos; and new Part 2 active profiles created.
          </p>
        </div>
      )}
    </div>
  );
};

export default Promotions;
