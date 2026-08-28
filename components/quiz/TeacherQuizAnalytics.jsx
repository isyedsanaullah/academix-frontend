import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineChartBar, HiOutlineCheckCircle, HiOutlineExclamation, HiOutlineEye } from 'react-icons/hi';

export default function TeacherQuizAnalytics({ quizId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [releasing, setReleasing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const { data } = await api.get(`/quizzes/${quizId}/analytics`);
      setAnalytics(data.data);
    } catch (e) {
      toast.error('Failed to load quiz analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizId) fetchAnalytics();
  }, [quizId]);

  const handleReleaseResults = async () => {
    setReleasing(true);
    try {
      await api.post(`/quizzes/${quizId}/release-results`);
      toast.success('Results released to students!');
      fetchAnalytics();
    } catch (e) {
      toast.error('Failed to release results');
    } finally {
      setReleasing(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-12 text-center text-white">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-white/50">Calculating quiz analytics from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <HiOutlineChartBar className="text-indigo-400" />
              Quiz Analytics & Student Rankings
            </h2>
            <p className="text-xs text-white/50">{analytics?.quizTitle}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/[0.03] border border-white/10 p-4 rounded-xl">
              <p className="text-[11px] font-semibold text-white/40 uppercase">Average Score</p>
              <h3 className="text-xl font-extrabold text-indigo-400 mt-1">{analytics?.averageScore || 0}</h3>
            </div>
            <div className="bg-white/[0.03] border border-white/10 p-4 rounded-xl">
              <p className="text-[11px] font-semibold text-white/40 uppercase">Pass Rate</p>
              <h3 className="text-xl font-extrabold text-emerald-400 mt-1">{analytics?.passPercentage || 0}%</h3>
            </div>
            <div className="bg-white/[0.03] border border-white/10 p-4 rounded-xl">
              <p className="text-[11px] font-semibold text-white/40 uppercase">Total Attempts</p>
              <h3 className="text-xl font-extrabold text-white mt-1">{analytics?.totalAttempts || 0}</h3>
            </div>
            <div className="bg-white/[0.03] border border-white/10 p-4 rounded-xl">
              <p className="text-[11px] font-semibold text-white/40 uppercase">Total Violations</p>
              <h3 className="text-xl font-extrabold text-amber-400 mt-1">{analytics?.violationsSummary?.totalViolations || 0}</h3>
            </div>
          </div>

          {/* Result Release Control */}
          <div className="bg-white/[0.02] border border-white/10 p-4 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white/80">Result Visibility Mode</h4>
              <p className="text-xs text-white/40">Current mode: <span className="text-indigo-300 font-semibold">{analytics?.resultVisibility}</span></p>
            </div>
            {!analytics?.isResultsReleased && analytics?.resultVisibility === 'manual_release' && (
              <button
                onClick={handleReleaseResults}
                disabled={releasing}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-semibold transition"
              >
                <HiOutlineEye size={14} /> {releasing ? 'Releasing...' : 'Release Results Now'}
              </button>
            )}
          </div>

          {/* Question Accuracy & Distractor Analysis */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Question Accuracy & Distractor Analysis</h3>
            <div className="space-y-2">
              {(analytics?.questionAccuracy || []).map((q, idx) => (
                <div key={idx} className="bg-white/[0.02] border border-white/5 p-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="flex-1">
                    <span className="font-bold text-indigo-400">Q{q.questionIndex}. </span>
                    <span className="text-white/80">{q.questionText}</span>
                    <p className="text-[11px] text-white/40 mt-0.5">Most common incorrect choice: <span className="text-amber-400">{q.mostSelectedDistractor}</span></p>
                  </div>
                  <div className="w-full md:w-48 flex items-center gap-2">
                    <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${q.accuracyPercentage}%` }} />
                    </div>
                    <span className="font-bold text-white/70 w-10 text-right">{q.accuracyPercentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Rankings Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Student Attempts & Rankings</h3>
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="px-3 py-2 text-left text-white/40 uppercase">Rank</th>
                    <th className="px-3 py-2 text-left text-white/40 uppercase">Student</th>
                    <th className="px-3 py-2 text-left text-white/40 uppercase">Roll No</th>
                    <th className="px-3 py-2 text-left text-white/40 uppercase">Score</th>
                    <th className="px-3 py-2 text-left text-white/40 uppercase">Percentage</th>
                    <th className="px-3 py-2 text-left text-white/40 uppercase">Time Spent</th>
                    <th className="px-3 py-2 text-left text-white/40 uppercase">Violations</th>
                    <th className="px-3 py-2 text-left text-white/40 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(analytics?.studentRankings || []).map(r => (
                    <tr key={r.attemptId} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-3 py-2 font-bold text-indigo-400">#{r.rank}</td>
                      <td className="px-3 py-2 font-medium text-white/90">{r.studentName}</td>
                      <td className="px-3 py-2 text-white/50">{r.rollNumber}</td>
                      <td className="px-3 py-2 font-bold text-white">{r.score}/{r.totalMarks}</td>
                      <td className="px-3 py-2 font-bold text-emerald-400">{r.percentage}%</td>
                      <td className="px-3 py-2 text-white/50">{Math.round((r.timeSpentSeconds || 0) / 60)}m</td>
                      <td className="px-3 py-2">
                        {r.violationsCount > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold text-[10px]">
                            {r.violationsCount} warnings
                          </span>
                        ) : (
                          <span className="text-white/30">0</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          r.status === 'passed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
