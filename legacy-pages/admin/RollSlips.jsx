import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { HiOutlinePrinter, HiOutlineArrowLeft } from 'react-icons/hi';

const RollSlips = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [examData, setExamData] = useState(null);

  useEffect(() => { api.get('/exams').then(r => setExams(r.data.data || [])).catch(() => {}); }, []);

  useEffect(() => {
    if (!selectedExam) return;
    const exam = exams.find(e => e._id === selectedExam);
    setExamData(exam);
    if (exam) {
      api.get('/students', { params: { class: exam.class, limit: 200 } })
        .then(r => setStudents(r.data.data || [])).catch(() => {});
    }
  }, [selectedExam]);

  const collegeName = user?.college?.name || 'College';

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-surface-400 hover:text-white text-sm mb-2"><HiOutlineArrowLeft size={16} /> Back</button>
          <h1 className="text-2xl font-bold text-white">Roll Number Slips</h1>
        </div>
        {examData && <button onClick={() => window.print()} className="btn-primary"><HiOutlinePrinter size={18} /> Print All</button>}
      </div>

      <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} className="input-field w-auto">
        <option value="">Select Exam</option>
        {exams.map(e => <option key={e._id} value={e._id}>{e.name} ({e.class})</option>)}
      </select>

      {/* Roll Slips */}
      <div id="roll-slips" className="space-y-6">
        {examData && students.map(s => (
          <div key={s._id} className="bg-white text-gray-900 rounded-2xl p-6 max-w-xl mx-auto print:break-after-page print:rounded-none print:shadow-none print:max-w-none print:mx-0">
            <div className="text-center border-b-2 border-gray-800 pb-3 mb-4">
              <h2 className="text-xl font-bold uppercase">{collegeName}</h2>
              <p className="text-sm font-semibold text-gray-600 mt-1">ROLL NUMBER SLIP — {examData.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <p><span className="font-semibold">Name:</span> {s.name}</p>
              <p><span className="font-semibold">Roll #:</span> {s.rollNumber}</p>
              <p><span className="font-semibold">Father:</span> {s.fatherName}</p>
              <p><span className="font-semibold">Class:</span> {s.class} ({s.section})</p>
            </div>
            <table className="w-full text-sm border-collapse mb-4">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-1.5 font-semibold">#</th>
                  <th className="text-left py-1.5 font-semibold">Subject</th>
                  <th className="text-center py-1.5 font-semibold">Date</th>
                  <th className="text-center py-1.5 font-semibold">Time</th>
                  <th className="text-center py-1.5 font-semibold">Marks</th>
                </tr>
              </thead>
              <tbody>
                {examData.subjects.map((sub, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="py-1.5">{i + 1}</td>
                    <td className="py-1.5">{sub.name}</td>
                    <td className="py-1.5 text-center">{sub.date ? new Date(sub.date).toLocaleDateString() : '-'}</td>
                    <td className="py-1.5 text-center">{sub.startTime || '-'} - {sub.endTime || '-'}</td>
                    <td className="py-1.5 text-center">{sub.totalMarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
              <p>Note: Bring this slip to the exam hall</p>
              <p>Controller of Examinations</p>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #roll-slips, #roll-slips * { visibility: visible; }
          #roll-slips { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default RollSlips;
