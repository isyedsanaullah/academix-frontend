import React from 'react';
import {
  HiOutlineAcademicCap,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineClipboardCheck,
  HiOutlineInformationCircle,
  HiOutlineExclamation,
  HiOutlineCode,
  HiOutlinePencil,
  HiOutlineCheckCircle
} from 'react-icons/hi';

export default function AssignmentDocumentViewer({
  assignmentData,
  onEditSection,
  isStudentView = false
}) {
  if (!assignmentData) return null;

  const {
    title = 'Untitled Assignment',
    assignmentNumber = 'ASSIGNMENT #01',
    collegeName = 'Academix College of Science & Technology',
    department = 'Department of Computer Science & Information Technology',
    subjectName = 'Subject',
    className = 'Class',
    sectionName = 'All Sections',
    teacherName = 'Faculty Member',
    issueDate = new Date().toLocaleDateString(),
    dueDate = 'TBA',
    totalMarks = 20,
    estimatedTime = '60 Mins',
    objectives = [],
    instructions = [],
    questions = [],
    activities = [],
    rubric = [],
    submissionMethods = [],
    academicIntegrityNotice = 'All work submitted must be original. Plagiarism, unauthorized collaboration, or copying from online sources without proper citation is strictly prohibited and subject to institutional disciplinary policy.',
    teacherNotes = ''
  } = assignmentData;

  return (
    <div className="bg-[#0b0f17] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-white font-sans">
      {/* Printable Institutional Header */}
      <div className="bg-gradient-to-r from-[#121824] via-[#1a2333] to-[#121824] border-b border-white/10 p-6 md:p-8 space-y-6">
        {/* Top Branding Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
              <HiOutlineAcademicCap size={28} />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black tracking-tight text-white uppercase">{collegeName}</h1>
              <p className="text-xs font-semibold text-indigo-400">{department}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-extrabold uppercase tracking-wider">
              {assignmentNumber}
            </span>
            <p className="text-[11px] text-white/40 mt-1">Official Institutional Document</p>
          </div>
        </div>

        {/* Assignment Metadata Matrix Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/[0.02] border border-white/5 p-4 rounded-xl text-xs">
          <div>
            <span className="text-white/40 font-semibold block text-[10px] uppercase">Subject</span>
            <span className="font-bold text-indigo-300">{subjectName}</span>
          </div>
          <div>
            <span className="text-white/40 font-semibold block text-[10px] uppercase">Course / Class</span>
            <span className="font-bold text-white/90">{className} ({sectionName})</span>
          </div>
          <div>
            <span className="text-white/40 font-semibold block text-[10px] uppercase">Instructor</span>
            <span className="font-bold text-white/90">{teacherName}</span>
          </div>
          <div>
            <span className="text-white/40 font-semibold block text-[10px] uppercase">Total Marks</span>
            <span className="font-black text-emerald-400 text-sm">{totalMarks} Marks</span>
          </div>
          <div>
            <span className="text-white/40 font-semibold block text-[10px] uppercase">Issue Date</span>
            <span className="font-medium text-white/70">{issueDate}</span>
          </div>
          <div>
            <span className="text-white/40 font-semibold block text-[10px] uppercase">Submission Deadline</span>
            <span className="font-bold text-amber-400">{dueDate}</span>
          </div>
          <div>
            <span className="text-white/40 font-semibold block text-[10px] uppercase">Estimated Effort</span>
            <span className="font-medium text-white/70">{estimatedTime}</span>
          </div>
          <div>
            <span className="text-white/40 font-semibold block text-[10px] uppercase">Document Status</span>
            <span className="font-bold text-emerald-400 uppercase">Verified</span>
          </div>
        </div>

        {/* Document Title Banner */}
        <div className="pt-2 flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">{title}</h2>
          {!isStudentView && onEditSection && (
            <button
              onClick={() => onEditSection('header')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition shrink-0"
            >
              <HiOutlinePencil size={14} /> Edit Header
            </button>
          )}
        </div>
      </div>

      {/* Main Document Body */}
      <div className="p-6 md:p-10 space-y-8 text-sm leading-relaxed">
        {/* Section 1: Objectives */}
        {objectives && objectives.length > 0 && (
          <div className="space-y-3 relative group">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <HiOutlineClipboardCheck size={16} /> 1. Learning Objectives & Outcomes
              </h3>
              {!isStudentView && onEditSection && (
                <button
                  onClick={() => onEditSection('objectives')}
                  className="opacity-0 group-hover:opacity-100 transition text-xs text-white/50 hover:text-white flex items-center gap-1"
                >
                  <HiOutlinePencil size={12} /> Edit
                </button>
              )}
            </div>
            <ul className="space-y-2 pl-4 list-disc marker:text-indigo-500 text-white/80">
              {objectives.map((obj, i) => (
                <li key={i} className="text-xs md:text-sm">{obj}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 2: Instructions */}
        {instructions && instructions.length > 0 && (
          <div className="space-y-3 relative group">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <HiOutlineInformationCircle size={16} /> 2. General Instructions
              </h3>
              {!isStudentView && onEditSection && (
                <button
                  onClick={() => onEditSection('instructions')}
                  className="opacity-0 group-hover:opacity-100 transition text-xs text-white/50 hover:text-white flex items-center gap-1"
                >
                  <HiOutlinePencil size={12} /> Edit
                </button>
              )}
            </div>
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl space-y-2 text-xs text-indigo-200">
              {instructions.map((inst, i) => (
                <p key={i} className="flex items-start gap-2">
                  <span className="font-bold text-indigo-400">•</span>
                  <span>{inst}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Questions & Tasks */}
        {questions && questions.length > 0 && (
          <div className="space-y-4 relative group">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <HiOutlineCode size={16} /> 3. Questions & Problem Tasks
              </h3>
              {!isStudentView && onEditSection && (
                <button
                  onClick={() => onEditSection('questions')}
                  className="opacity-0 group-hover:opacity-100 transition text-xs text-white/50 hover:text-white flex items-center gap-1"
                >
                  <HiOutlinePencil size={12} /> Edit Questions
                </button>
              )}
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={idx} className="bg-white/[0.02] border border-white/10 p-5 rounded-xl space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="font-bold text-white text-sm md:text-base flex items-center gap-2">
                      <span className="text-indigo-400 font-mono">Q{idx + 1}.</span> {q.title || q.questionText}
                    </h4>
                    {q.marks && (
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-extrabold shrink-0">
                        [{q.marks} Marks]
                      </span>
                    )}
                  </div>

                  {q.description && (
                    <p className="text-xs text-white/70 whitespace-pre-line leading-relaxed">{q.description}</p>
                  )}

                  {q.codeSnippet && (
                    <div className="bg-[#06080d] border border-white/10 p-4 rounded-lg font-mono text-xs text-emerald-300 overflow-x-auto">
                      <pre>{q.codeSnippet}</pre>
                    </div>
                  )}

                  {q.subQuestions && q.subQuestions.length > 0 && (
                    <div className="pl-4 space-y-1.5 border-l-2 border-indigo-500/30 text-xs text-white/80">
                      {q.subQuestions.map((sub, sIdx) => (
                        <p key={sIdx}>
                          <span className="font-bold text-indigo-300">({String.fromCharCode(97 + sIdx)})</span> {sub}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Practical / Lab Activities */}
        {activities && activities.length > 0 && (
          <div className="space-y-3 relative group">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
                4. Practical Activities & Exercises
              </h3>
              {!isStudentView && onEditSection && (
                <button
                  onClick={() => onEditSection('activities')}
                  className="opacity-0 group-hover:opacity-100 transition text-xs text-white/50 hover:text-white flex items-center gap-1"
                >
                  <HiOutlinePencil size={12} /> Edit
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activities.map((act, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/10 p-4 rounded-xl space-y-2 text-xs">
                  <h5 className="font-bold text-indigo-300">Activity {i + 1}: {act.name}</h5>
                  <p className="text-white/70">{act.instructions || act}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 5: Evaluation Rubric Table */}
        {rubric && rubric.length > 0 && (
          <div className="space-y-3 relative group">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
                5. Assessment & Grading Rubric
              </h3>
              {!isStudentView && onEditSection && (
                <button
                  onClick={() => onEditSection('rubric')}
                  className="opacity-0 group-hover:opacity-100 transition text-xs text-white/50 hover:text-white flex items-center gap-1"
                >
                  <HiOutlinePencil size={12} /> Edit Rubric
                </button>
              )}
            </div>
            <div className="border border-white/10 rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-white/[0.04] border-b border-white/10 font-bold text-white/60">
                    <th className="p-3">Evaluation Criterion</th>
                    <th className="p-3">Exemplary</th>
                    <th className="p-3">Proficient</th>
                    <th className="p-3">Developing</th>
                    <th className="p-3 text-right">Max Marks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  {rubric.map((r, i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-bold text-indigo-300">{r.criterion}</td>
                      <td className="p-3 text-emerald-300/90">{r.exemplary || 'Meets all requirements perfectly'}</td>
                      <td className="p-3 text-white/70">{r.proficient || 'Minor errors or omissions'}</td>
                      <td className="p-3 text-amber-300/80">{r.developing || 'Basic understanding shown'}</td>
                      <td className="p-3 text-right font-bold text-emerald-400">{r.maxMarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 6: Submission Guidelines */}
        {submissionMethods && submissionMethods.length > 0 && (
          <div className="space-y-3 relative group">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
                6. Submission Guidelines & Permitted Formats
              </h3>
              {!isStudentView && onEditSection && (
                <button
                  onClick={() => onEditSection('submission')}
                  className="opacity-0 group-hover:opacity-100 transition text-xs text-white/50 hover:text-white flex items-center gap-1"
                >
                  <HiOutlinePencil size={12} /> Edit Guidelines
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {submissionMethods.map((m, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/10 p-3.5 rounded-xl space-y-1.5 text-xs">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <HiOutlineCheckCircle size={14} /> {m.label || m.method}
                  </span>
                  <p className="text-white/60 text-[11px]">{m.instructions || m.rules || 'Follow standard department protocol.'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 7: Academic Integrity Notice */}
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl space-y-1.5 text-xs text-amber-200">
          <h4 className="font-bold flex items-center gap-1.5 text-amber-300">
            <HiOutlineExclamation size={16} /> Academic Integrity Notice
          </h4>
          <p className="text-white/80 text-[11px] leading-relaxed">{academicIntegrityNotice}</p>
        </div>

        {/* Section 8: Teacher Notes & Callouts */}
        {teacherNotes && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl space-y-1 text-xs text-indigo-200">
            <h4 className="font-bold text-indigo-300">Instructor Notes:</h4>
            <p className="text-white/70 italic text-[11px]">{teacherNotes}</p>
          </div>
        )}
      </div>

      {/* Printable Institutional Footer */}
      <div className="bg-[#080b10] border-t border-white/10 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/40 gap-2">
        <span>{collegeName} • Official LMS Authoring System</span>
        <span>Page 1 of 1</span>
        <span>Generated via CESMS Intelligence Platform</span>
      </div>
    </div>
  );
}
