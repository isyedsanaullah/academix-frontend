import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineClock, HiOutlineShieldCheck, HiOutlineExclamation, HiOutlineCheckCircle } from 'react-icons/hi';

export default function QuizPlayer({ quizId, onClose, onCompleted }) {
  const [loading, setLoading] = useState(true);
  const [attemptData, setAttemptData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const containerRef = useRef(null);

  // 1. Start or Resume Attempt
  useEffect(() => {
    const initAttempt = async () => {
      try {
        const { data } = await api.post(`/quizzes/${quizId}/start-attempt`);
        setAttemptData(data.data);
        setAnswers(data.data.savedAnswers || {});
        setCurrentIndex(data.data.currentQuestionIndex || 0);
        setRemainingSeconds(data.data.remainingSeconds || 0);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to start quiz attempt');
        if (onClose) onClose();
      } finally {
        setLoading(false);
      }
    };
    if (quizId) initAttempt();
  }, [quizId]);

  // 2. Real-Time Countdown Timer
  useEffect(() => {
    if (!attemptData || submittedResult || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Time expired! Auto-submitting quiz...');
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [attemptData, submittedResult, remainingSeconds]);

  // 3. Proctoring Anti-Cheat Event Listeners
  const logProctorViolation = async (violationType) => {
    if (!attemptData?.attemptId || submittedResult) return;
    try {
      const { data } = await api.post(`/quizzes/attempt/${attemptData.attemptId}/violation`, {
        type: violationType,
        timestamp: new Date().toISOString()
      });
      toast.error(`⚠️ Security Warning: ${violationType} detected! (${data.violationsCount}/${data.maxAllowed})`, {
        duration: 4000
      });
      if (data.shouldAutoSubmit) {
        toast.error('Maximum violations exceeded! Auto-submitting quiz...');
        handleSubmit(true);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (!attemptData || submittedResult) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logProctorViolation('Tab Switch / Window Hide');
      }
    };

    const handleBlur = () => {
      logProctorViolation('Window Blur / Focus Lost');
    };

    const handleKeyDown = (e) => {
      // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        logProctorViolation('Developer Tools Shortcut Attempt');
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [attemptData, submittedResult]);

  // 4. Auto-save answers periodically and on option select
  const handleSelectOption = (qIdx, oIdx) => {
    const updated = { ...answers, [qIdx]: oIdx };
    setAnswers(updated);

    // Debounced API auto-save
    api.post(`/quizzes/attempt/${attemptData.attemptId}/save-answer`, {
      answers: updated,
      currentQuestionIndex: qIdx
    }).catch(() => {});
  };

  // 5. Submit Quiz
  const handleSubmit = async (isAuto = false) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/quizzes/attempt/${attemptData.attemptId}/submit`, {
        answers,
        isAutoSubmitted: isAuto
      });
      setSubmittedResult(data.data);
      toast.success('Quiz submitted successfully!');
      if (onCompleted) onCompleted();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const enterFullscreen = () => {
    if (containerRef.current?.requestFullscreen) {
      containerRef.current.requestFullscreen().catch(() => {});
    }
    setIsFullscreen(true);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-white/50">Preparing secure quiz environment...</p>
        </div>
      </div>
    );
  }

  // Fullscreen Entrance Modal
  if (!isFullscreen && !submittedResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md text-white">
        <div className="bg-[#0d1117] border border-white/10 p-8 rounded-2xl max-w-md w-full text-center space-y-5 shadow-2xl">
          <HiOutlineShieldCheck className="mx-auto text-indigo-400" size={48} />
          <div>
            <h3 className="text-lg font-bold">{attemptData?.quiz?.title}</h3>
            <p className="text-xs text-white/50 mt-1">Duration: {attemptData?.quiz?.duration} Mins | Total Questions: {attemptData?.quiz?.questions?.length}</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-xs text-amber-300 text-left space-y-1">
            <p className="font-bold flex items-center gap-1"><HiOutlineExclamation /> Security & Anti-Cheat Rules:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-white/70">
              <li>Fullscreen mode is required throughout the attempt</li>
              <li>Switching tabs or minimizing window is monitored</li>
              <li>Copy, paste, and right-click are disabled</li>
            </ul>
          </div>
          <button
            onClick={enterFullscreen}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm transition"
          >
            Start Quiz in Fullscreen Mode
          </button>
        </div>
      </div>
    );
  }

  // Submitted Result View
  if (submittedResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 text-white overflow-y-auto">
        <div className="bg-[#0d1117] border border-white/10 p-8 rounded-2xl max-w-md w-full text-center space-y-6 shadow-2xl">
          <HiOutlineCheckCircle className="mx-auto text-emerald-400" size={56} />
          <div>
            <h3 className="text-xl font-bold">Quiz Attempt Submitted</h3>
            <p className="text-xs text-white/50 mt-1">{attemptData?.quiz?.title}</p>
          </div>

          {submittedResult.isResultsReleased ? (
            <div className="bg-white/[0.03] border border-white/10 p-4 rounded-xl space-y-2">
              <p className="text-xs text-white/50 uppercase">Your Final Score</p>
              <h2 className="text-3xl font-extrabold text-emerald-400">{submittedResult.score} / {submittedResult.totalMarks}</h2>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                submittedResult.status === 'passed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {submittedResult.percentage}% — {submittedResult.status.toUpperCase()}
              </span>
            </div>
          ) : (
            <div className="bg-white/[0.03] border border-white/10 p-4 rounded-xl">
              <p className="text-xs text-white/70">Your answers have been securely recorded. Results will be released according to teacher configuration.</p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQ = attemptData?.quiz?.questions?.[currentIndex];
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div
      ref={containerRef}
      onCopy={(e) => { e.preventDefault(); logProctorViolation('Copy Event Blocked'); }}
      onPaste={(e) => { e.preventDefault(); logProctorViolation('Paste Event Blocked'); }}
      onContextMenu={(e) => { e.preventDefault(); logProctorViolation('Right-Click Context Menu'); }}
      className="fixed inset-0 z-50 bg-[#090d13] text-white flex flex-col select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0d1117] shrink-0">
        <div>
          <h2 className="text-sm font-bold text-white">{attemptData?.quiz?.title}</h2>
          <p className="text-[11px] text-white/40">Question {currentIndex + 1} of {attemptData?.quiz?.questions?.length}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-300 text-xs font-mono font-bold">
            <HiOutlineClock size={16} />
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold transition disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Question Panel */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto space-y-6">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>Marks: {currentQ?.marks || 1}</span>
            </div>
            <h3 className="text-base md:text-lg font-semibold text-white/90">{currentQ?.questionText}</h3>
          </div>

          {/* Options List */}
          <div className="space-y-3">
            {currentQ?.options?.map((opt, oIdx) => (
              <button
                key={oIdx}
                onClick={() => handleSelectOption(currentIndex, oIdx)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl text-left border transition ${
                  answers[currentIndex] === oIdx
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium shadow-lg'
                    : 'bg-white/[0.02] border-white/10 text-white/70 hover:bg-white/5'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                  answers[currentIndex] === oIdx ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-white/20 text-white/40'
                }`}>
                  {String.fromCharCode(65 + oIdx)}
                </div>
                <span className="text-sm">{opt}</span>
              </button>
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between pt-4">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold disabled:opacity-30"
            >
              ← Previous
            </button>
            <button
              onClick={() => setCurrentIndex(prev => Math.min(attemptData.quiz.questions.length - 1, prev + 1))}
              disabled={currentIndex === attemptData.quiz.questions.length - 1}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Question Grid Sidebar */}
        <div className="w-64 border-l border-white/10 p-4 bg-[#0d1117] hidden lg:block overflow-y-auto space-y-4">
          <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider">Question Navigator</h4>
          <div className="grid grid-cols-4 gap-2">
            {attemptData?.quiz?.questions?.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-9 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                  currentIndex === idx
                    ? 'ring-2 ring-indigo-400 bg-indigo-600 text-white'
                    : answers[idx] !== undefined
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
