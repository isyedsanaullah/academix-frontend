import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#818cf8', '#4ade80', '#fbbf24', '#f87171', '#38bdf8', '#a78bfa', '#fb923c', '#34d399'];
const PLAN_COLORS = { basic: '#94a3b8', standard: '#60a5fa', premium: '#a78bfa', enterprise: '#fbbf24' };

const Card = ({ children, style }) => (
  <div className="glass-card" style={{ padding: 20, ...style }}>{children}</div>
);

const ChartTitle = ({ emoji, text, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{emoji} {text}</p>
    {sub && <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{sub}</p>}
  </div>
);

const customTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
      <p style={{ color:'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name || p.dataKey}: <b>{p.value}</b></p>
      ))}
    </div>
  );
};

const SAAnalytics = () => {
  const [overview, setOverview] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [logins, setLogins] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    const fetch = async () => {
      try {
        const [ov, cl, lg] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/analytics/colleges'),
          api.get('/analytics/logins')
        ]);
        setOverview(ov.data.data);
        setColleges(cl.data.data);
        setLogins(lg.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><div className="animate-spin" style={{ width: 32, height: 32, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} /></div>;

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'colleges', label: '🏫 College-wise' },
    { id: 'logins', label: '🔑 Login Trends' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total Colleges', value: overview?.totals?.colleges, color: '#818cf8', emoji: '🏫' },
          { label: 'Active Colleges', value: overview?.totals?.activeColleges, color: '#4ade80', emoji: '✅' },
          { label: 'Total Users', value: overview?.totals?.users, color: '#38bdf8', emoji: '👥' },
          { label: 'Students', value: overview?.totals?.students, color: '#a78bfa', emoji: '🎓' },
          { label: 'Teachers', value: overview?.totals?.teachers, color: '#fbbf24', emoji: '📚' },
        ].map(s => (
          <Card key={s.label} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 28, marginBottom: 4 }}>{s.emoji}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value ?? '—'}</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            border: '1px solid var(--border-color)',
            background: tab === t.id ? 'rgba(99,102,241,0.1)' : 'transparent',
            color: tab === t.id ? '#818cf8' : 'var(--text-secondary)',
            borderColor: tab === t.id ? 'rgba(99,102,241,0.2)' : 'var(--border-color)'
          }}>{t.label}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
            {/* User Registrations Trend */}
            <Card>
              <ChartTitle emoji="📈" text="User Registrations" sub="Monthly trend (last 12 months)" />
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={overview?.monthlyRegistrations || []}>
                  <defs>
                    <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={customTooltip} />
                  <Area type="monotone" dataKey="count" stroke="#818cf8" strokeWidth={2} fill="url(#gradUsers)" name="Users" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* College Registrations Trend */}
            <Card>
              <ChartTitle emoji="🏫" text="College Registrations" sub="Monthly growth" />
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={overview?.monthlyColleges || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={customTooltip} />
                  <Bar dataKey="count" fill="#4ade80" radius={[6, 6, 0, 0]} name="Colleges" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {/* Role Distribution Pie */}
            <Card>
              <ChartTitle emoji="👥" text="Users by Role" sub="Platform-wide distribution" />
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={overview?.roleBreakdown || []} dataKey="count" nameKey="role" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2} label={({ role, count }) => `${role}: ${count}`} labelLine={false} >
                    {(overview?.roleBreakdown || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={customTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Subscription Plans Pie */}
            <Card>
              <ChartTitle emoji="⭐" text="Subscription Plans" sub="College plan distribution" />
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={overview?.planBreakdown || []} dataKey="count" nameKey="plan" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3} label={({ plan, count }) => `${plan}: ${count}`} labelLine={false}>
                    {(overview?.planBreakdown || []).map((entry, i) => <Cell key={i} fill={PLAN_COLORS[entry.plan] || COLORS[i]} />)}
                  </Pie>
                  <Tooltip content={customTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Daily Logins */}
            <Card>
              <ChartTitle emoji="🔑" text="Daily Active Users" sub="Last 30 days login activity" />
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={overview?.dailyLogins || []}>
                  <defs>
                    <linearGradient id="gradLogins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={customTooltip} />
                  <Area type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={2} fill="url(#gradLogins)" name="Logins" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}

      {/* College-wise Tab */}
      {tab === 'colleges' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* College comparison bar chart */}
          <Card>
            <ChartTitle emoji="📊" text="College Comparison" sub="Users, students & teachers per college" />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={colleges} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={140} axisLine={false} tickLine={false} />
                <Tooltip content={customTooltip} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="students" fill="#818cf8" name="Students" radius={[0, 4, 4, 0]} />
                <Bar dataKey="teachers" fill="#4ade80" name="Teachers" radius={[0, 4, 4, 0]} />
                <Bar dataKey="activeUsers" fill="#fbbf24" name="Active (30d)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* College Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
            {colleges.map(c => (
              <Card key={c._id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{c.code}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700, background: c.isActive ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)', color: c.isActive ? '#4ade80' : '#f87171' }}>{c.isActive ? 'Active' : 'Inactive'}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700, background: `${PLAN_COLORS[c.plan] || '#94a3b8'}15`, color: PLAN_COLORS[c.plan] || '#94a3b8', textTransform: 'uppercase' }}>{c.plan}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
                  {[
                    { l: 'Users', v: c.users, cl: '#818cf8' },
                    { l: 'Students', v: c.students, cl: '#a78bfa' },
                    { l: 'Teachers', v: c.teachers, cl: '#4ade80' },
                    { l: 'Active', v: c.activeUsers, cl: '#fbbf24' },
                  ].map(s => (
                    <div key={s.l} style={{ padding: 8, borderRadius: 8, background: 'var(--hover-bg)' }}>
                      <p style={{ fontSize: 18, fontWeight: 800, color: s.cl }}>{s.v}</p>
                      <p style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{s.l}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Login Trends Tab */}
      {tab === 'logins' && logins && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Top Active Colleges */}
          <Card>
            <ChartTitle emoji="🏆" text="Most Active Colleges" sub="By login count (last 30 days)" />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={logins.topColleges || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={customTooltip} />
                <Bar dataKey="logins" radius={[6, 6, 0, 0]} name="Logins">
                  {(logins.topColleges || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Login by Role breakdown */}
          <Card>
            <ChartTitle emoji="👤" text="Logins by Role" sub="Daily breakdown by user type" />
            {(() => {
              // Transform loginsByRole into daily grouped data
              const dayMap = {};
              (logins.loginsByRole || []).forEach(e => {
                if (!dayMap[e._id.day]) dayMap[e._id.day] = { day: e._id.day };
                dayMap[e._id.day][e._id.role] = e.count;
              });
              const chartData = Object.values(dayMap).sort((a, b) => a.day.localeCompare(b.day));
              const roles = [...new Set((logins.loginsByRole || []).map(e => e._id.role))];
              return (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip content={customTooltip} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    {roles.map((r, i) => <Bar key={r} dataKey={r} stackId="a" fill={COLORS[i % COLORS.length]} name={r} />)}
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </Card>
        </div>
      )}
    </div>
  );
};

export default SAAnalytics;
