import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineArrowLeft, HiOutlineSave } from 'react-icons/hi';

const ResultEntry = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [examData, setExamData] = useState(null);
  const [marksMap, setMarksMap] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'teacher') {
      toast.error('Only teachers can enter results.');
      navigate('/admin/results');
    }
  }, [user, navigate]);

  useEffect(() => {
    api.get('/exams').then(r => setExams(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedExam) return;
    const exam = exams.find(e => e._id === selectedExam);
    setExamData(exam);
    if (exam) {
      api.get('/students', { params: { class: exam.class, limit: 200 } })
        .then(r => {
          setStudents(r.data.data || []);
          const map = {};
          (r.data.data || []).forEach(s => {
            map[s._id] = {};
            exam.subjects.forEach(sub => { map[s._id][sub.name] = { obtained: '', total: sub.totalMarks, subject_id: sub.subject_id }; });
          });
          setMarksMap(map);
        }).catch(() => {});
    }
  }, [selectedExam]);

  const updateMark = (studentId, subject, value) => {
    setMarksMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [subject]: { ...prev[studentId][subject], obtained: value } }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const results = Object.entries(marksMap)
        .filter(([_, subjects]) => Object.values(subjects).some(s => s.obtained !== ''))
        .map(([student_id, subjects]) => ({
          student_id,
          marks: Object.entries(subjects)
            .filter(([_, v]) => v.obtained !== '')
            .map(([subject, v]) => ({ 
              subject, 
              subject_id: v.subject_id, 
              obtained: Number(v.obtained), 
              total: v.total 
            }))
        }));

      if (results.length === 0) return toast.error('No marks entered');

      await api.post('/results/bulk', { exam_id: selectedExam, results });
      toast.success(`${results.length} results saved!`);
      navigate('/admin/results');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-surface-400 hover:text-white transition-colors text-sm mb-2">
            <HiOutlineArrowLeft size={16} /> Back
          </button>
          <h1 className="text-2xl font-bold text-white">Bulk Result Entry</h1>
          <p className="text-surface-400 text-sm mt-1">Enter marks for all students at once</p>
        </div>
        {selectedExam && (
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <HiOutlineSave size={18} /> {saving ? 'Saving...' : 'Save All Results'}
          </button>
        )}
      </div>

      <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} className="input-field w-auto">
        <option value="">Select Exam</option>
        {exams.map(e => <option key={e._id} value={e._id}>{e.name} ({e.class})</option>)}
      </select>

      {examData && students.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-surface-900 z-10">Student</th>
                  <th className="sticky left-0 bg-surface-900 z-10">Roll #</th>
                  {examData.subjects.map(s => (
                    <th key={s.name} className="text-center">{s.name}<br /><span className="text-xs font-normal text-surface-500">/{s.totalMarks}</span></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s._id}>
                    <td className="sticky left-0 bg-surface-900/95 z-10 font-medium text-surface-200">{s.name}</td>
                    <td className="sticky left-0 bg-surface-900/95 z-10 font-mono text-primary-400 text-xs">{s.rollNumber}</td>
                    {examData.subjects.map(sub => (
                      <td key={sub.name} className="text-center">
                        <input
                          type="number"
                          min="0"
                          max={sub.totalMarks}
                          value={marksMap[s._id]?.[sub.name]?.obtained || ''}
                          onChange={e => updateMark(s._id, sub.name, e.target.value)}
                          className="input-field w-20 text-center py-1 text-sm mx-auto"
                          placeholder="--"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultEntry;
