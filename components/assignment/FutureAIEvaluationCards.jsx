import React from 'react';
import { HiOutlineSparkles, HiOutlineLockClosed } from 'react-icons/hi';

export function FutureAIEvaluationCard() {
  return (
    <div className="bg-[#0e131f] border border-indigo-500/20 rounded-2xl p-6 space-y-4 relative overflow-hidden opacity-90 select-none">
      {/* Background Glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HiOutlineSparkles className="text-indigo-400" size={20} />
          <h3 className="text-sm font-extrabold text-white">🤖 AI Assignment Evaluation Engine</h3>
        </div>
        <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
          <HiOutlineLockClosed size={12} /> Coming Soon
        </span>
      </div>

      <p className="text-xs text-white/50 leading-relaxed">
        Future CESMS releases will automatically evaluate uploaded student assignments using AI, suggest marks, analyze rubrics, detect plagiarism, and generate personalized feedback for teachers.
      </p>

      {/* Disabled Checklist */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
        {[
          'Suggested Marks',
          'Rubric Evaluation',
          'Topic Coverage',
          'Grammar Review',
          'Writing Quality',
          'Plagiarism Analysis',
          'AI Detection %',
          'Strengths & Weaknesses',
          'Bloom\'s Taxonomy Analysis',
          'Learning Outcome Analysis',
          'Personalized Feedback',
          'Improvement Recommendations'
        ].map((item, idx) => (
          <div
            key={idx}
            className="px-3 py-2 bg-white/[0.02] border border-white/5 rounded-xl text-[11px] text-white/40 flex items-center justify-between pointer-events-none"
          >
            <span>{item}</span>
            <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-white/30">Auto</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FutureSubmissionReviewSidePanel() {
  return (
    <div className="bg-[#0e131f] border border-white/10 rounded-2xl p-5 space-y-4 text-xs opacity-90 select-none">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-indigo-400 flex items-center gap-1.5">
          <HiOutlineSparkles /> 🤖 AI Evaluation Breakdown
        </h4>
        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[9px] font-extrabold uppercase tracking-wider">
          Coming Soon
        </span>
      </div>

      <div className="space-y-3 pt-1">
        <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl space-y-1 text-white/40">
          <span className="text-[10px] uppercase font-semibold">Suggested Score</span>
          <p className="text-base font-extrabold text-white/30">-- / 20</p>
        </div>

        <div className="space-y-2">
          {['Rubric Score', 'Grammar Score', 'Quality Score', 'Topic Coverage', 'Plagiarism %', 'AI Detection %'].map((metric, i) => (
            <div key={i} className="flex items-center justify-between text-white/40 border-b border-white/5 pb-1">
              <span>{metric}</span>
              <span className="font-mono font-bold text-white/20">Pending Integration</span>
            </div>
          ))}
        </div>

        <div className="bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-xl space-y-1 text-white/30 italic text-[11px]">
          "Automated feedback summary, strengths, and weaknesses will be displayed here."
        </div>
      </div>
    </div>
  );
}
