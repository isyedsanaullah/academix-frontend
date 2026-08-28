import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineCurrencyDollar, HiOutlineTrendingUp, HiOutlineTrendingDown,
  HiOutlineCalculator, HiOutlinePlus, HiOutlineX
} from 'react-icons/hi';

const Treasury = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [includeOld, setIncludeOld] = useState(false);
  const [form, setForm] = useState({ type: 'income', category: 'misc_income', amount: '', description: '', paymentMethod: 'cash' });

  const fetch_ = async (sessId) => {
    setLoading(true);
    try {
      const url = sessId ? `/accountant/treasury?sessionId=${sessId}` : '/accountant/treasury';
      const { data: d } = await api.get(url);
      setData(d.data);
      if (d.data?.currentSession && !sessId) {
        setSelectedSessionId(d.data.currentSession._id);
      }
    } catch { toast.error('Failed to load treasury'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetch_(selectedSessionId);
  }, [selectedSessionId]);

  const addTxn = async () => {
    if (!form.amount) return toast.error('Amount required');
    try {
      await api.post('/accountant/transactions', { ...form, amount: Number(form.amount) });
      toast.success('Transaction added');
      setShowAdd(false);
      setForm({ type: 'income', category: 'misc_income', amount: '', description: '', paymentMethod: 'cash' });
      fetch_(selectedSessionId);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const catLabels = {
    fee_collection: '💰 Fee Collection', salary_payment: '👤 Salary', fine: '⚠ Fine',
    misc_income: '📥 Misc Income', misc_expense: '📤 Misc Expense', refund: '↩ Refund',
    maintenance: '🔧 Maintenance', utilities: '💡 Utilities'
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="animate-spin" style={{ width: 28, height: 28, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} /></div>;

  const displayBalance = includeOld
    ? (data?.balance || 0) + (data?.oldRemaining || 0)
    : (data?.balance || 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>🏦 Treasury</h1>
            {data?.currentSession && !data?.currentSession?.isCurrent && (
              <span className="inline-block text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                Historical Records
              </span>
            )}
          </div>
          {data?.currentSession && (
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
              Viewing records for session: <strong>{data.currentSession.name}</strong>
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Session Selector Dropdown */}
          {data?.sessions?.length > 0 && (
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              style={{
                background: '#131a25',
                color: 'var(--text-primary)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {data.sessions.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name} {s.isCurrent ? '(Active)' : '(Old)'}
                </option>
              ))}
            </select>
          )}

          {/* Include Old remainings toggle */}
          {data?.oldRemaining !== undefined && (
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              background: 'rgba(255,255,255,0.03)',
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.06)',
              userSelect: 'none',
            }} className="hover:bg-white/[0.06] hover:border-white/10 transition-all duration-150">
              <input 
                type="checkbox" 
                checked={includeOld} 
                onChange={(e) => setIncludeOld(e.target.checked)}
                style={{ 
                  accentColor: '#6366f1', 
                  width: 14, 
                  height: 14, 
                  cursor: 'pointer' 
                }} 
              />
              <span>Include Old Remainings (Rs. {data.oldRemaining.toLocaleString()})</span>
            </label>
          )}

          <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ fontSize: 12 }}><HiOutlinePlus size={14} style={{ display: 'inline', marginRight: 4 }} /> Add Transaction</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <Card icon={HiOutlineCalculator} label="Balance" value={`Rs.${displayBalance?.toLocaleString()}`} color={displayBalance >= 0 ? '#4ade80' : '#f87171'} />
        <Card icon={HiOutlineTrendingUp} label="Total Income" value={`Rs.${data?.totalIncome?.toLocaleString()}`} color="#4ade80" />
        <Card icon={HiOutlineTrendingDown} label="Total Expense" value={`Rs.${data?.totalExpense?.toLocaleString()}`} color="#f87171" />
        <Card icon={HiOutlineCurrencyDollar} label="This Month In" value={`Rs.${data?.monthIncome?.toLocaleString()}`} color="#38bdf8" />
      </div>

      {/* Recent Transactions */}
      <div className="glass-card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color:'var(--text-primary)', marginBottom: 14 }}>Recent Transactions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data?.recent?.length === 0 ? (
            <p style={{ textAlign: 'center', color:'var(--text-tertiary)', padding: 20, fontSize: 13 }}>No transactions yet</p>
          ) : data?.recent?.map(t => (
            <div key={t._id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', borderRadius: 8, background:'var(--hover-bg)', border: '1px solid rgba(255,255,255,0.04)'
            }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color:'var(--text-primary)' }}>{catLabels[t.category] || t.category}</p>
                <p style={{ fontSize: 10, color:'var(--text-tertiary)' }}>{t.description} • {t.paymentMethod} • by {t.enteredBy?.name || '-'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: t.type === 'income' ? '#4ade80' : '#f87171' }}>
                  {t.type === 'income' ? '+' : '-'}Rs.{t.amount?.toLocaleString()}
                </p>
                <p style={{ fontSize: 10, color:'var(--text-tertiary)' }}>{new Date(t.date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowAdd(false)} />
          <div style={{ position: 'relative', zIndex: 1, background: '#131a25', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 24, maxWidth: 420, width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color:'var(--text-primary)' }}>Add Transaction</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', color:'var(--text-tertiary)', cursor: 'pointer' }}><HiOutlineX size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['income', 'expense'].map(t => (
                  <button key={t} onClick={() => setForm({...form, type: t, category: t === 'income' ? 'misc_income' : 'misc_expense'})} style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: form.type === t ? (t === 'income' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)') : 'transparent',
                    borderColor: form.type === t ? (t === 'income' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)') : 'rgba(255,255,255,0.1)',
                    color: form.type === t ? (t === 'income' ? '#4ade80' : '#f87171') : 'rgba(255,255,255,0.3)'
                  }}>{t === 'income' ? '↗ Income' : '↘ Expense'}</button>
                ))}
              </div>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-field">
                {form.type === 'income'
                  ? ['fee_collection', 'fine', 'misc_income'].map(c => <option key={c} value={c}>{catLabels[c]}</option>)
                  : ['salary_payment', 'misc_expense', 'refund', 'maintenance', 'utilities'].map(c => <option key={c} value={c}>{catLabels[c]}</option>)
                }
              </select>
              <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="Amount (Rs.)" className="input-field" />
              <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" className="input-field" />
              <select value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})} className="input-field">
                {['cash', 'bank', 'online', 'cheque'].map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
              <button onClick={addTxn} className="btn-primary">Add Transaction</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Card = ({ icon: Icon, label, value, color }) => (
  <div className="stat-card">
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color:'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 800, color, marginTop: 4 }}>{value}</p>
      </div>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} style={{ color }} />
      </div>
    </div>
  </div>
);

export default Treasury;
