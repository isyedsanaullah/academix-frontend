import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineTag, HiOutlineDocumentText } from 'react-icons/hi';

export default function QuestionBankView() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  const fetchQuestions = async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: 15 });
      if (search) params.append('search', search);
      if (difficulty) params.append('difficulty', difficulty);

      const { data } = await api.get(`/quizzes/question-bank?${params.toString()}`);
      setQuestions(data.data || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (e) {
      toast.error('Failed to load question bank');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions(1);
  }, [search, difficulty]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <HiOutlineSearch className="absolute left-3 top-2.5 text-white/40" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions by keyword..."
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500 text-white"
          />
        </div>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="px-3 py-2 bg-[#161b22] border border-white/10 rounded-lg text-sm text-white focus:outline-none"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Question Cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-xs">No questions found in Question Bank.</div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={q.id || idx} className="bg-white/[0.02] border border-white/10 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    q.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400' :
                    q.difficulty === 'hard' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {q.difficulty || 'medium'}
                  </span>
                  {q.subjectName && (
                    <span className="text-[11px] font-medium text-indigo-400 flex items-center gap-1">
                      <HiOutlineTag size={12} /> {q.subjectName}
                    </span>
                  )}
                  {q.version > 1 && (
                    <span className="text-[10px] bg-white/10 text-white/60 px-1.5 py-0.5 rounded">v{q.version}</span>
                  )}
                </div>
                <span className="text-[10px] text-white/40">
                  {q.isAIGenerated ? '🤖 AI Generated' : '✍️ Manual'}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-white/90">{q.questionText}</h4>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {(q.options || []).map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    className={`px-2.5 py-1 rounded text-xs border ${
                      oIdx === q.correctAnswer
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold'
                        : 'bg-white/5 border-white/5 text-white/50'
                    }`}
                  >
                    {opt} {oIdx === q.correctAnswer && '✓'}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
