import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineCalendar, HiOutlineClock, HiOutlineAcademicCap } from 'react-icons/hi';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getPeriodColor = (p) => {
  return { bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.25)', text: '#818cf8' };
};

const TeacherTimetable = () => {
  const { user } = useAuth();
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/timetables/my-teacher');
        setTimetables(res.data.data || []);
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const todayEntries = timetables.filter(t => t.day === today);
  const todayPeriods = todayEntries.flatMap(t => (t.periods || []).map(p => ({ ...p, class: t.class, section: t.section })));

  const isCurrentPeriod = (p) => {
    if (!p.startTime || !p.endTime) return false;
    return currentTime >= p.startTime && currentTime <= p.endTime;
  };

  // Group by day for full week view
  const byDay = {};
  DAYS.forEach(d => { byDay[d] = []; });
  timetables.forEach(t => {
    (t.periods || []).forEach(p => {
      if (byDay[t.day]) {
        byDay[t.day].push({ ...p, class: t.class, section: t.section });
      }
    });
  });

  // Count total classes
  const totalClasses = Object.values(byDay).reduce((sum, arr) => sum + arr.length, 0);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px' }}>
      <div className="animate-spin" style={{ width: '32px', height: '32px', border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          📅 My Teaching Schedule
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          {totalClasses} classes across the week
        </p>
      </div>

      {/* Today's Classes */}
      {todayPeriods.length > 0 && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HiOutlineCalendar size={18} style={{ color: '#818cf8' }} />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Today — {today}</p>
              <p style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{todayPeriods.length} classes today</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {todayPeriods.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')).map((p, i) => {
              const current = isCurrentPeriod(p);
              const colors = getPeriodColor(p);
              return (
                <div key={i} style={{
                  flexShrink: 0, minWidth: '150px', padding: '12px', borderRadius: '12px',
                  background: current ? colors.bg : 'var(--hover-bg)',
                  border: `1.5px solid ${current ? colors.text : 'var(--border-color)'}`,
                  position: 'relative'
                }}>
                  {current && (
                    <div style={{ position: 'absolute', top: '4px', right: '6px', width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
                  )}
                  <div style={{ fontSize: '9px', fontWeight: 700, color: colors.text, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                    {p.startTime} – {p.endTime}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {p.subject_id?.name || 'TBD'}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '3px' }}>
                    📍 {p.class} — {p.section}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Week View */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>📋 Full Week Schedule</p>
        {totalClasses === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <HiOutlineAcademicCap size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>No classes assigned yet</p>
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Your teaching schedule will appear here once timetables are created</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DAYS.map(day => {
              const periods = byDay[day] || [];
              const isToday = day === today;
              return (
                <div key={day} style={{
                  borderRadius: '10px', padding: '12px 16px',
                  background: isToday ? 'rgba(99,102,241,0.06)' : 'var(--hover-bg)',
                  border: `1px solid ${isToday ? 'rgba(99,102,241,0.2)' : 'var(--border-color)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: periods.length > 0 ? '10px' : '0' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: isToday ? '#818cf8' : 'var(--text-primary)', minWidth: '80px' }}>
                      {isToday ? `🟢 ${day}` : day}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                      {periods.length} {periods.length === 1 ? 'class' : 'classes'}
                    </span>
                  </div>
                  {periods.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {periods.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')).map((p, i) => {
                        const colors = getPeriodColor(p);
                        return (
                          <div key={i} style={{
                            padding: '6px 10px', borderRadius: '8px',
                            background: colors.bg, border: `1px solid ${colors.border}`,
                            fontSize: '11px'
                          }}>
                            <span style={{ fontWeight: 600, color: colors.text }}>{p.subject_id?.name || 'TBD'}</span>
                            <span style={{ color: 'var(--text-tertiary)', marginLeft: '6px', fontSize: '9px' }}>📍 {p.class} - {p.section}</span>
                            <span style={{ color: 'var(--text-tertiary)', marginLeft: '6px', fontSize: '9px', fontFamily: 'monospace' }}>{p.startTime}–{p.endTime}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherTimetable;
