'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import CollegesHubLoader from '@/components/common/CollegesHubLoader';

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
      setRemainingSeconds((prev) => {
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
        timestamp: new Date().toISOString(),
      });
      toast.error(
        `Security Warning: ${violationType} detected! (${data.violationsCount}/${data.maxAllowed})`,
        { duration: 4000 }
      );
      if (data.shouldAutoSubmit) {
        toast.error('Maximum violations exceeded! Auto-submitting quiz...');
        handleSubmit(true);
      }
    } catch {}
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

    api
      .post(`/quizzes/attempt/${attemptData.attemptId}/save-answer`, {
        answers: updated,
        currentQuestionIndex: qIdx,
      })
      .catch(() => {});
  };

  // 5. Submit Quiz
  const handleSubmit = async (isAuto = false) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/quizzes/attempt/${attemptData.attemptId}/submit`, {
        answers,
        isAutoSubmitted: isAuto,
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
      <div
        data-fullscreen-player="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-b-surface1/90 backdrop-blur-sm text-t-primary"
      >
        <div className="card p-10 max-w-sm w-full text-center">
          <CollegesHubLoader
            size="md"
            text="Preparing secure quiz environment..."
            minHeight="min-h-[140px]"
          />
        </div>
      </div>
    );
  }

  // Fullscreen Entrance Modal
  if (!isFullscreen && !submittedResult) {
    return (
      <div
        data-fullscreen-player="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-b-surface1/95 backdrop-blur-md text-t-primary"
      >
        <div className="card p-8 max-w-md w-full text-center space-y-5 shadow-dropdown border border-s-subtle">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-primary-01/12 text-primary-01">
            <Icon name="shield-check" className="!size-8 fill-primary-01" />
          </div>
          <div>
            <h3 className="text-h5 text-t-primary">{attemptData?.quiz?.title}</h3>
            <p className="text-caption text-t-secondary mt-1">
              Duration: {attemptData?.quiz?.duration} Mins | Total Questions:{' '}
              {attemptData?.quiz?.questions?.length}
            </p>
          </div>
          <div className="bg-primary-05/10 border border-primary-05/25 p-4 rounded-2xl text-caption text-t-primary text-left space-y-1.5">
            <p className="font-bold flex items-center gap-1.5 text-primary-05">
              <Icon name="alert" className="!size-4 fill-primary-05" />
              Security & Anti-Cheat Rules:
            </p>
            <ul className="list-disc list-inside space-y-1 text-caption text-t-secondary">
              <li>Fullscreen mode is required throughout the attempt</li>
              <li>Switching tabs or minimizing window is monitored</li>
              <li>Copy, paste, and right-click are disabled</li>
            </ul>
          </div>
          <Button isPrimary onClick={enterFullscreen} className="w-full">
            Start Quiz in Fullscreen Mode
          </Button>
        </div>
      </div>
    );
  }

  // Submitted Result View
  if (submittedResult) {
    return (
      <div
        data-fullscreen-player="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-b-surface1/95 text-t-primary overflow-y-auto"
      >
        <div className="card p-8 max-w-md w-full text-center space-y-6 shadow-dropdown border border-s-subtle">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-primary-02/12 text-primary-02">
            <Icon name="check-circle" className="!size-9 fill-primary-02" />
          </div>
          <div>
            <h3 className="text-h5 text-t-primary">Quiz Attempt Submitted</h3>
            <p className="text-caption text-t-secondary mt-1">
              {attemptData?.quiz?.title}
            </p>
          </div>

          {submittedResult.isResultsReleased ? (
            <div className="bg-b-surface1 border border-s-subtle p-5 rounded-3xl space-y-2">
              <p className="text-caption text-t-secondary uppercase tracking-wider">
                Your Final Score
              </p>
              <h2 className="text-h2 text-primary-02 tabular-nums">
                {submittedResult.score} / {submittedResult.totalMarks}
              </h2>
              <span
                className={`label ${
                  submittedResult.status === 'passed' ? 'label-green' : 'label-red'
                }`}
              >
                {submittedResult.percentage}% — {submittedResult.status.toUpperCase()}
              </span>
            </div>
          ) : (
            <div className="bg-b-surface1 border border-s-subtle p-4 rounded-3xl">
              <p className="text-body-2 text-t-secondary">
                Your answers have been securely recorded. Results will be released according to teacher configuration.
              </p>
            </div>
          )}

          <Button isWhite onClick={onClose} className="w-full">
            Back to Dashboard
          </Button>
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
      data-fullscreen-player="true"
      onCopy={(e) => {
        e.preventDefault();
        logProctorViolation('Copy Event Blocked');
      }}
      onPaste={(e) => {
        e.preventDefault();
        logProctorViolation('Paste Event Blocked');
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        logProctorViolation('Right-Click Context Menu');
      }}
      className="fixed inset-0 z-50 bg-b-surface1 text-t-primary flex flex-col select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-s-subtle bg-b-surface2 shrink-0">
        <div>
          <h2 className="text-sub-title-1 text-t-primary">{attemptData?.quiz?.title}</h2>
          <p className="text-caption text-t-secondary">
            Question {currentIndex + 1} of {attemptData?.quiz?.questions?.length}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3.5 py-2 bg-primary-01/12 border border-primary-01/25 rounded-full text-t-blue text-caption font-mono font-bold tabular-nums">
            <Icon name="clock" className="!size-4 fill-primary-01" />
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <Button
            isGreen
            size="sm"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 md:p-10 overflow-y-auto space-y-6 max-w-4xl mx-auto">
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between text-caption text-t-secondary">
              <span className="label label-blue">Marks: {currentQ?.marks || 1}</span>
            </div>
            <h3 className="text-h6 text-t-primary">{currentQ?.questionText}</h3>
          </div>

          <div className="space-y-3">
            {currentQ?.options?.map((opt, oIdx) => {
              const selected = answers[currentIndex] === oIdx;
              return (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => handleSelectOption(currentIndex, oIdx)}
                  className={`w-full flex items-center gap-3.5 p-4 rounded-3xl text-left border transition cursor-pointer ${
                    selected
                      ? 'bg-primary-01/12 border-primary-01 text-t-primary font-semibold shadow-widget'
                      : 'bg-b-surface2 border-s-subtle text-t-secondary hover:bg-b-highlight hover:text-t-primary'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full border flex items-center justify-center text-caption font-bold shrink-0 ${
                      selected
                        ? 'border-primary-01 bg-primary-01 text-t-light'
                        : 'border-s-stroke2 text-t-secondary'
                    }`}
                  >
                    {String.fromCharCode(65 + oIdx)}
                  </div>
                  <span className="text-body-2">{opt}</span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between pt-4">
            <Button
              isStroke
              size="sm"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              icon="arrow-left"
            >
              Previous
            </Button>
            <Button
              isPrimary
              size="sm"
              onClick={() =>
                setCurrentIndex((prev) =>
                  Math.min(attemptData.quiz.questions.length - 1, prev + 1)
                )
              }
              disabled={currentIndex === attemptData.quiz.questions.length - 1}
              iconRight="arrow"
            >
              Next
            </Button>
          </div>
        </div>

        <div className="w-68 border-l border-s-subtle p-5 bg-b-surface2 hidden lg:block overflow-y-auto space-y-4">
          <h4 className="text-caption font-bold text-t-tertiary uppercase tracking-wider">
            Question Navigator
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {attemptData?.quiz?.questions?.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-10 rounded-2xl text-caption font-bold tabular-nums transition flex items-center justify-center cursor-pointer ${
                  currentIndex === idx
                    ? 'ring-2 ring-primary-01 bg-primary-01 text-t-light'
                    : answers[idx] !== undefined
                      ? 'bg-primary-02/15 text-primary-02 border border-primary-02/30'
                      : 'bg-b-surface1 text-t-secondary hover:bg-b-highlight'
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
