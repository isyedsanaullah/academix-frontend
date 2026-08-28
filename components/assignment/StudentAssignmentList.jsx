import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineClipboardList, HiOutlineClock, HiOutlineCheckCircle, HiOutlineUpload } from 'react-icons/hi';
import StudentAssignmentPortal from './StudentAssignmentPortal';

export default function StudentAssignmentList() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

  const fetchAssignments = async () => {
    try {
      const { data } = await api.get('/assignments');
      setAssignments(data.data || []);
    } catch (e) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  if (selectedAssignmentId) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedAssignmentId(null)}
          className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition"
        >
          ← Back to All Assignments
        </button>
        <StudentAssignmentPortal assignmentId={selectedAssignmentId} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-white">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <HiOutlineClipboardList className="text-indigo-400" /> My Course Assignments ({assignments.length})
        </h1>
        <p className="text-xs text-white/50">View course assignments, institutional guidelines, rubrics, and turn in your responses</p>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/10 p-12 rounded-2xl text-center text-xs text-white/40">
          No active course assignments found for your class.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map(a => {
            const isPast = a.dueDate && new Date(a.dueDate) < new Date();
            const hasSubmitted = (a.submissions || []).length > 0;

            return (
              <div
                key={a._id || a.id}
                className="bg-white/[0.03] border border-white/10 hover:border-indigo-500/50 rounded-2xl p-6 space-y-4 flex flex-col justify-between transition shadow-xl"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 uppercase">
                      {a.subject_id?.name || 'Subject'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      hasSubmitted ? 'bg-emerald-500/20 text-emerald-300' :
                      isPast ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {hasSubmitted ? 'Submitted' : isPast ? 'Overdue' : 'Pending'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{a.title}</h3>
                  <p className="text-xs text-white/50 line-clamp-2">{a.description || 'Institutional coursework assignment.'}</p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-white/60 font-semibold">Marks: {a.totalMarks || 20}</span>
                  <button
                    onClick={() => setSelectedAssignmentId(a._id || a.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg"
                  >
                    <HiOutlineUpload size={14} /> {hasSubmitted ? 'View Submission' : 'View & Turn In'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
