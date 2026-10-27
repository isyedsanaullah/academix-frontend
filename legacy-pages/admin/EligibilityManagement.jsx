'use client';

import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import {
  HiOutlineClipboardCheck,
  HiOutlineExclamation,
  HiOutlineDownload,
  HiOutlineAdjustments,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineShieldCheck
} from 'react-icons/hi';

export default function EligibilityManagement() {
  const [forKind, setForKind] = useState('send_up');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, eligible, defaulter, overridden
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');

  // Override Modal
  const [overrideModal, setOverrideModal] = useState({ open: false, record: null, reason: '' });
  const [overrideLoading, setOverrideLoading] = useState(false);

  // Compute / Rule Modal
  const [ruleModal, setRuleModal] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    minAttendancePercent: 75,
    minOverallPercent: 33,
    maxFailedSubjects: 0
  });

  const [computing, setComputing] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get('/eligibility', {
        params: { forKind }
      });
      if (res.data?.success) {
        setRecords(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch eligibility records:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRule = async () => {
    try {
      const res = await api.get('/eligibility/rules');
      if (res.data?.success && Array.isArray(res.data.data)) {
        const found = res.data.data.find(r => r.forKind === forKind);
        if (found) {
          setRuleForm({
            minAttendancePercent: found.minAttendancePercent ?? 75,
            minOverallPercent: found.minOverallPercent ?? 33,
            maxFailedSubjects: found.maxFailedSubjects ?? 0
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch rule:', err);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchRule();
  }, [forKind]);

  const handleCompute = async () => {
    setComputing(true);
    setMessage(null);
    try {
      const res = await api.post('/eligibility/compute', { forKind });
      if (res.data?.success) {
        setMessage({ type: 'success', text: res.data.message || 'Eligibility computed successfully!' });
        fetchRecords();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Computation failed' });
    } finally {
      setComputing(false);
    }
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/eligibility/rules', {
        forKind,
        ...ruleForm
      });
      if (res.data?.success) {
        setMessage({ type: 'success', text: 'Eligibility criteria saved!' });
        setRuleModal(false);
        handleCompute();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save criteria');
    }
  };

  const handleOverride = async () => {
    if (!overrideModal.reason.trim()) {
      alert('Please enter an official override reason');
      return;
    }
    setOverrideLoading(true);
    try {
      const res = await api.put(`/eligibility/${overrideModal.record.id}/override`, {
        overrideReason: overrideModal.reason
      });
      if (res.data?.success) {
        setMessage({ type: 'success', text: 'Principal override saved and logged to audit trail!' });
        setOverrideModal({ open: false, record: null, reason: '' });
        fetchRecords();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Override failed');
    } finally {
      setOverrideLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await api.get('/eligibility/defaulters/pdf', {
        params: { forKind },
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Defaulter_List_${forKind}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate defaulters PDF');
    }
  };

  // Filtered records
  const filtered = records.filter(r => {
    if (filterStatus === 'eligible' && (!r.eligible || r.overridden)) return false;
    if (filterStatus === 'defaulter' && (r.eligible || r.overridden)) return false;
    if (filterStatus === 'overridden' && !r.overridden) return false;
    if (selectedClass !== 'all' && r.student?.class !== selectedClass) return false;
    if (selectedGroup !== 'all' && r.student?.group !== selectedGroup) return false;
    return true;
  });

  const totalEvaluated = records.length;
  const eligibleCount = records.filter(r => r.eligible && !r.overridden).length;
  const defaulterCount = records.filter(r => !r.eligible).length;
  const overriddenCount = records.filter(r => r.overridden).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <HiOutlineClipboardCheck className="w-7 h-7 text-indigo-600" />
            Send-Up & Board Eligibility Portal
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Automated attendance & academic examination gating with principal override auditing
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setRuleModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition"
          >
            <HiOutlineAdjustments className="w-4 h-4 text-gray-500" />
            Rules & Thresholds
          </button>
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition"
          >
            <HiOutlineDownload className="w-4 h-4 text-rose-600" />
            Defaulter PDF
          </button>
          <button
            onClick={handleCompute}
            disabled={computing}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm disabled:opacity-50 transition"
          >
            <HiOutlineRefresh className={`w-4 h-4 ${computing ? 'animate-spin' : ''}`} />
            {computing ? 'Computing...' : 'Re-Compute Eligibility'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Target Selector Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setForKind('send_up')}
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition ${
            forKind === 'send_up'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Send-Up (Pre-Board) Exams
        </button>
        <button
          onClick={() => setForKind('board_form')}
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition ${
            forKind === 'board_form'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Board Exam Registration
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Evaluated</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totalEvaluated}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Cleared & Eligible</p>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{eligibleCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
          <p className="text-xs font-medium text-rose-600 uppercase tracking-wider">Defaulters / Ineligible</p>
          <p className="text-2xl font-bold text-rose-700 mt-2">{defaulterCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm">
          <p className="text-xs font-medium text-purple-600 uppercase tracking-wider">Principal Overridden</p>
          <p className="text-2xl font-bold text-purple-700 mt-2">{overriddenCount}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'eligible', 'defaulter', 'overridden'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-xs font-medium border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none"
          >
            <option value="all">All Classes</option>
            <option value="FSC Part 1">FSC Part 1</option>
            <option value="FSC Part 2">FSC Part 2</option>
          </select>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="text-xs font-medium border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none"
          >
            <option value="all">All Groups</option>
            <option value="Pre-Medical">Pre-Medical</option>
            <option value="Pre-Engineering">Pre-Engineering</option>
            <option value="Computer Science">Computer Science</option>
            <option value="I.Com">I.Com</option>
            <option value="FA">FA</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-4">Roll #</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Class & Group</th>
                <th className="py-3.5 px-4 text-center">Attendance %</th>
                <th className="py-3.5 px-4 text-center">Exam Result %</th>
                <th className="py-3.5 px-4 text-center">Failed Subs</th>
                <th className="py-3.5 px-4">Status & Reasons</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Loading eligibility records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    No records found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(r => {
                  const isOverridden = r.overridden;
                  const isEligible = r.eligible;
                  const attOk = (r.attendancePercent ?? 100) >= (ruleForm.minAttendancePercent || 75);

                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        {r.student?.rollNumber || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{r.student?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-400">{r.student?.fatherName || ''}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-gray-700 font-semibold">{r.student?.class}</span>
                        <span className="block text-xs text-indigo-600 font-medium">{r.student?.group}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                          attOk ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {r.attendancePercent != null ? `${r.attendancePercent}%` : '-'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-gray-800">
                        {r.resultPercent != null ? `${r.resultPercent}%` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-semibold ${r.failedSubjects > 0 ? 'text-rose-600' : 'text-gray-600'}`}>
                          {r.failedSubjects ?? 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isOverridden ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                              <HiOutlineShieldCheck className="w-3.5 h-3.5" />
                              Principal Overridden
                            </span>
                            <p className="text-xs text-purple-700 italic mt-0.5 max-w-xs truncate" title={r.overrideReason}>
                              {r.overrideReason}
                            </p>
                          </div>
                        ) : isEligible ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                            Eligible
                          </span>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                              <HiOutlineXCircle className="w-3.5 h-3.5" />
                              Ineligible Defaulter
                            </span>
                            {Array.isArray(r.reasons) && r.reasons.length > 0 && (
                              <p className="text-xs text-rose-600 mt-0.5">
                                {r.reasons.join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isEligible && !isOverridden && (
                          <button
                            onClick={() => setOverrideModal({ open: true, record: r, reason: '' })}
                            className="px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                          >
                            Override
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Modal */}
      {overrideModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <HiOutlineShieldCheck className="w-6 h-6 text-indigo-600" />
              Principal Eligibility Override
            </h2>
            <p className="text-xs text-gray-500">
              Candidate: <strong>{overrideModal.record?.student?.name}</strong> ({overrideModal.record?.student?.rollNumber})
            </p>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Official Justification / Medical Remarks</label>
              <textarea
                value={overrideModal.reason}
                onChange={(e) => setOverrideModal({ ...overrideModal, reason: e.target.value })}
                rows={3}
                placeholder="e.g. Medical absence condoned; special academic coaching assigned."
                className="w-full text-sm border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setOverrideModal({ open: false, record: null, reason: '' })}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                disabled={overrideLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm disabled:opacity-50 transition"
              >
                {overrideLoading ? 'Saving...' : 'Authorize Override'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {ruleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <HiOutlineAdjustments className="w-6 h-6 text-indigo-600" />
              Eligibility Thresholds ({forKind === 'send_up' ? 'Send-Up' : 'Board'})
            </h2>
            <form onSubmit={handleSaveRule} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">Minimum Attendance (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={ruleForm.minAttendancePercent}
                  onChange={(e) => setRuleForm({ ...ruleForm, minAttendancePercent: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-xl p-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Minimum Overall Exam Score (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={ruleForm.minOverallPercent}
                  onChange={(e) => setRuleForm({ ...ruleForm, minOverallPercent: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-xl p-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Maximum Allowed Failed Subjects</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={ruleForm.maxFailedSubjects}
                  onChange={(e) => setRuleForm({ ...ruleForm, maxFailedSubjects: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-xl p-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setRuleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition"
                >
                  Save & Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
