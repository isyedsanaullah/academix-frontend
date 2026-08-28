import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineClock, HiOutlineCheckCircle, HiOutlinePlay, HiOutlineCalendar } from 'react-icons/hi';
import QuizPlayer from './QuizPlayer';

export default function StudentQuizPortal() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeQuizId, setActiveQuizId] = useState(null);

  const fetchQuizzes = async () => {
    try {
      const { data } = await api.get('/quizzes');
      setQuizzes(data.data || []);
    } catch (e) {
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  if (activeQuizId) {
    return (
      <QuizPlayer
        quizId={activeQuizId}
        onClose={() => setActiveQuizId(null)}
        onCompleted={() => {
          fetchQuizzes();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const now = new Date();

  // Active & Pending (Not yet completed by student)
  const activeQuizzes = quizzes.filter(q => {
    if (q.status !== 'published' && q.status !== 'active') return false;
    if (q.hasSubmitted || q.isCompleted) return false;
    const start = q.startTime ? new Date(q.startTime) : null;
    const end = q.endTime ? new Date(q.endTime) : null;
    if (start && start > now) return false;
    if (end && end < now) return false;
    return true;
  });

  // Submitted / Completed Quizzes by student
  const completedQuizzes = quizzes.filter(q => q.hasSubmitted || q.isCompleted);

  // Scheduled Upcoming Quizzes
  const upcomingQuizzes = quizzes.filter(q => {
    if (q.status !== 'published' && q.status !== 'active') return false;
    if (q.hasSubmitted || q.isCompleted) return false;
    const start = q.startTime ? new Date(q.startTime) : null;
    return start && start > now;
  });

  return (
    <div className="space-y-8">
      {/* Active & Pending Quizzes */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <HiOutlinePlay className="text-emerald-400" /> Active Quizzes ({activeQuizzes.length})
        </h2>

        {activeQuizzes.length === 0 ? (
          <div className="bg-white/[0.02] border border-white/10 p-8 rounded-xl text-center text-xs text-white/40">
            No active unsubmitted quizzes available at this time.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeQuizzes.map(q => (
              <div key={q._id || q.id} className="bg-white/[0.03] border border-white/10 rounded-xl p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 uppercase">
                      Active Now
                    </span>
                    <span className="text-xs text-white/50 flex items-center gap-1">
                      <HiOutlineClock size={14} /> {q.duration} Mins
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{q.title}</h3>
                  <p className="text-xs text-white/50 mt-1">{q.description || 'No description provided.'}</p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/70">Total Marks: {q.totalMarks || 'N/A'}</span>
                  <button
                    onClick={() => setActiveQuizId(q._id || q.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-lg"
                  >
                    Start / Resume Quiz
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed & Submitted Quizzes */}
      {completedQuizzes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <HiOutlineCheckCircle className="text-indigo-400" /> Completed & Submitted Quizzes ({completedQuizzes.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedQuizzes.map(q => {
              const attempt = q.myAttempt;
              const isScoreVisible = q.isResultsReleased || q.resultVisibility === 'immediate';

              return (
                <div key={q._id || q.id} className="bg-white/[0.02] border border-white/10 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 uppercase flex items-center gap-1">
                      <HiOutlineCheckCircle /> Submitted
                    </span>
                    <span className="text-xs text-white/40">
                      {attempt?.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : 'Completed'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white">{q.title}</h3>

                  {isScoreVisible && attempt ? (
                    <div className="bg-white/5 border border-white/5 p-3 rounded-lg flex items-center justify-between text-xs">
                      <span className="text-white/60">Score Obtained:</span>
                      <span className="font-bold text-emerald-400 text-sm">
                        {attempt.score} / {attempt.totalMarks || q.totalMarks} ({attempt.percentage}%)
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-white/40 italic">Results will be released according to teacher settings.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Quizzes */}
      {upcomingQuizzes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <HiOutlineCalendar className="text-amber-400" /> Upcoming Scheduled Quizzes ({upcomingQuizzes.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingQuizzes.map(q => (
              <div key={q._id || q.id} className="bg-white/[0.02] border border-white/10 rounded-xl p-5 space-y-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 uppercase">
                  Upcoming
                </span>
                <h3 className="text-sm font-bold text-white">{q.title}</h3>
                <p className="text-xs text-white/40">Starts: {q.startTime ? new Date(q.startTime).toLocaleString() : 'TBA'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
