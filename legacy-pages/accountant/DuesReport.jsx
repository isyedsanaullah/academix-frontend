import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineExclamation, HiOutlinePrinter, HiOutlineFilter } from 'react-icons/hi';

const DuesReport = () => {
  const [dues, setDues] = useState([]);
  const [summary, setSummary] = useState({ count: 0, totalDues: 0 });
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const fetch_ = async () => {
    setLoading(true);
    try {
      const params = {};
      if (className) params.className = className;
      if (section) params.section = section;
      if (month) params.month = month;
      const { data } = await api.get('/accountant/dues', { params });
      setDues(data.data || []);
      setSummary(data.summary || { count: 0, totalDues: 0 });
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);

  const handlePrint = () => window.print();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color:'var(--text-primary)' }}>⚠ Dues Report</h1>
        <button onClick={handlePrint} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background:'var(--hover-bg)', color:'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <HiOutlinePrinter size={14} /> Print
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 10, color:'var(--text-tertiary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Month</label>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="input-field" style={{ width: 160 }} />
        </div>
        <div>
          <label style={{ fontSize: 10, color:'var(--text-tertiary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Class</label>
          <select value={className} onChange={e => setClassName(e.target.value)} className="input-field" style={{ width: 140 }}>
            <option value="">All Classes</option>
            <option value="FSC Part 1">FSC Part 1</option>
            <option value="FSC Part 2">FSC Part 2</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 10, color:'var(--text-tertiary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Section</label>
          <select value={section} onChange={e => setSection(e.target.value)} className="input-field" style={{ width: 100 }}>
            <option value="">All</option>
            {['A','B','C','D'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={fetch_} className="btn-primary" style={{ fontSize: 12, height: 38 }}><HiOutlineFilter size={14} style={{ display: 'inline', marginRight: 4 }} /> Filter</button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div className="stat-card">
          <p style={{ fontSize: 10, fontWeight: 700, color:'var(--text-tertiary)', textTransform: 'uppercase' }}>Students with Dues</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#f87171', marginTop: 4 }}>{summary.count}</p>
        </div>
        <div className="stat-card">
          <p style={{ fontSize: 10, fontWeight: 700, color:'var(--text-tertiary)', textTransform: 'uppercase' }}>Total Outstanding</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>Rs.{summary.totalDues?.toLocaleString()}</p>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border-color)' }}>
              {['#', 'Student', 'Roll #', 'Class', 'Section', 'Total Fee', 'Paid', 'Due', 'Month', 'Phone'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color:'var(--text-tertiary)', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color:'var(--text-tertiary)' }}>Loading...</td></tr>
            ) : dues.length === 0 ? (
              <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color:'var(--text-tertiary)' }}>🎉 No dues found!</td></tr>
            ) : dues.map((d, i) => (
              <tr key={d._id} style={{ borderBottom:'1px solid var(--border-color)' }}>
                <td style={{ padding: '10px 14px', color:'var(--text-tertiary)' }}>{i + 1}</td>
                <td style={{ padding: '10px 14px', fontWeight: 600, color:'var(--text-primary)' }}>{d.student_id?.name || '-'}</td>
                <td style={{ padding: '10px 14px', color:'var(--text-secondary)' }}>{d.student_id?.rollNumber || '-'}</td>
                <td style={{ padding: '10px 14px', color:'var(--text-secondary)' }}>{d.student_id?.class || '-'}</td>
                <td style={{ padding: '10px 14px', color:'var(--text-secondary)' }}>{d.student_id?.section || '-'}</td>
                <td style={{ padding: '10px 14px', color:'var(--text-secondary)' }}>Rs.{d.totalAmount?.toLocaleString()}</td>
                <td style={{ padding: '10px 14px', color: '#4ade80' }}>Rs.{d.paidAmount?.toLocaleString()}</td>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f87171' }}>Rs.{(d.totalAmount - d.paidAmount)?.toLocaleString()}</td>
                <td style={{ padding: '10px 14px', color:'var(--text-tertiary)' }}>{d.month}</td>
                <td style={{ padding: '10px 14px', color:'var(--text-tertiary)' }}>{d.student_id?.phone || d.student_id?.guardianPhone || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DuesReport;
