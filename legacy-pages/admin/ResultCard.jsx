import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { HiOutlinePrinter, HiOutlineArrowLeft } from 'react-icons/hi';

const ResultCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/results', { params: {} });
        const found = (data.data || []).find(r => r._id === id);
        setResult(found);
      } catch { toast.error('Failed'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!result) return <div className="text-center py-20 text-surface-500">Result not found</div>;

  const collegeName = user?.college?.name || 'College';
  const gradeColor = result.grade === 'F' ? '#dc2626' : result.percentage >= 70 ? '#16a34a' : '#ca8a04';

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-surface-400 hover:text-white text-sm"><HiOutlineArrowLeft size={16} /> Back</button>
        <button onClick={() => window.print()} className="btn-primary"><HiOutlinePrinter size={18} /> Print</button>
      </div>

      <div id="result-card" className="bg-white text-gray-900 rounded-2xl p-8 max-w-2xl mx-auto print:shadow-none print:rounded-none print:max-w-none">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wider">{collegeName}</h1>
          <h2 className="text-lg font-semibold mt-1 text-gray-700">DETAILED MARKS CERTIFICATE</h2>
          <p className="text-sm text-gray-500 mt-1">{result.exam_id?.name || 'Examination'}</p>
        </div>

        {/* Student Info */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-6 p-4 bg-gray-50 rounded-lg">
          <p><span className="font-semibold">Name:</span> {result.student_id?.name}</p>
          <p><span className="font-semibold">Roll #:</span> {result.student_id?.rollNumber}</p>
          <p><span className="font-semibold">Class:</span> {result.student_id?.class} ({result.student_id?.section})</p>
          <p><span className="font-semibold">Exam:</span> {result.exam_id?.name}</p>
        </div>

        {/* Marks Table - Board Style */}
        <table className="w-full text-sm border-collapse mb-6">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="py-2.5 px-3 text-left font-semibold">#</th>
              <th className="py-2.5 px-3 text-left font-semibold">Subject</th>
              <th className="py-2.5 px-3 text-center font-semibold">Total Marks</th>
              <th className="py-2.5 px-3 text-center font-semibold">Obtained</th>
              <th className="py-2.5 px-3 text-center font-semibold">Grade</th>
            </tr>
          </thead>
          <tbody>
            {result.marks?.map((m, i) => {
              const pct = m.total > 0 ? (m.obtained / m.total) * 100 : 0;
              const g = pct >= 80 ? 'A+' : pct >= 70 ? 'A' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F';
              return (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td className="py-2 px-3">{i + 1}</td>
                  <td className="py-2 px-3 font-medium">{m.subject}</td>
                  <td className="py-2 px-3 text-center">{m.total}</td>
                  <td className="py-2 px-3 text-center font-semibold">{m.obtained}</td>
                  <td className="py-2 px-3 text-center" style={{ color: g === 'F' ? '#dc2626' : '#16a34a' }}>{g}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-800 text-white font-bold">
              <td colSpan={2} className="py-2.5 px-3">TOTAL</td>
              <td className="py-2.5 px-3 text-center">{result.totalMarks}</td>
              <td className="py-2.5 px-3 text-center">{result.totalObtained}</td>
              <td className="py-2.5 px-3 text-center">{result.grade}</td>
            </tr>
          </tfoot>
        </table>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 text-center mb-6">
          <div className="p-3 rounded-lg bg-gray-50">
            <p className="text-xs text-gray-500">Percentage</p>
            <p className="text-2xl font-bold" style={{ color: gradeColor }}>{result.percentage}%</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            <p className="text-xs text-gray-500">Grade</p>
            <p className="text-2xl font-bold" style={{ color: gradeColor }}>{result.grade}</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            <p className="text-xs text-gray-500">Result</p>
            <p className="text-2xl font-bold" style={{ color: gradeColor }}>{result.grade === 'F' ? 'FAIL' : 'PASS'}</p>
          </div>
        </div>

        <div className="flex justify-between text-xs text-gray-500 pt-4 border-t border-gray-200">
          <p>Printed on: {new Date().toLocaleDateString()}</p>
          <p>Controller of Examinations: _______________</p>
        </div>
      </div>

      <style>{`@media print { body * { visibility: hidden; } #result-card, #result-card * { visibility: visible; } #result-card { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
    </div>
  );
};

export default ResultCard;
