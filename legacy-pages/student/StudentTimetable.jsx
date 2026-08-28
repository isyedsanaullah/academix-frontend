'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/* ──────────────────── Constants ──────────────────── */
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat' };

/* ──────────────────── Slot type config ──────────────────── */
const SLOT_CONFIG = {
  class:        { icon: '📚', label: 'Class',    gradient: 'linear-gradient(135deg, #6366f1, #818cf8)', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.18)', accent: '#818cf8', glow: 'rgba(99,102,241,0.25)' },
  break:        { icon: '☕', label: 'Break',    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.18)',  accent: '#fbbf24', glow: 'rgba(251,191,36,0.25)' },
  sports_gap:   { icon: '⚽', label: 'Sports',   gradient: 'linear-gradient(135deg, #10b981, #34d399)', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.18)',  accent: '#34d399', glow: 'rgba(52,211,153,0.25)' },
  nazira_gap:   { icon: '📖', label: 'Nazira',   gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)', bg: 'rgba(34,211,238,0.08)',  border: 'rgba(34,211,238,0.18)',  accent: '#22d3ee', glow: 'rgba(34,211,238,0.25)' },
  assembly_gap: { icon: '🎤', label: 'Assembly', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.18)', accent: '#a855f7', glow: 'rgba(168,85,247,0.25)' },
  function_gap: { icon: '🎉', label: 'Function', gradient: 'linear-gradient(135deg, #f43f5e, #fb7185)', bg: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.18)', accent: '#fb7185', glow: 'rgba(251,113,133,0.25)' },
};

const getSlotType = (p) => {
  if (p.type && SLOT_CONFIG[p.type]) return p.type;
  if (p.isBreak) return 'break';
  return 'class';
};

const isGapSlot = (p) => {
  const t = getSlotType(p);
  return t !== 'class';
};

const getSlotLabel = (p) => {
  const t = getSlotType(p);
  if (t !== 'class') return p.label || SLOT_CONFIG[t].label;
  return p.subject_id?.name || p.label || 'TBD';
};

/* ──────────────────── Component ──────────────────── */
const StudentTimetable = () => {
  const { user } = useAuth();
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/timetables/my');
        setTimetables(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch timetable:', err);
        setError('Could not load your timetable. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Time helpers
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const todayTimetable = timetables.find(t => t.day === today);
  const todayPeriods = todayTimetable?.periods || [];

  const isCurrentPeriod = (p) => {
    if (!p.startTime || !p.endTime) return false;
    return currentTime >= p.startTime && currentTime <= p.endTime;
  };

  // Compute all unique time slots across all days for the grid
  const allTimeSlots = useMemo(() => {
    const slotsMap = new Map();
    timetables.forEach(t => {
      (t.periods || []).forEach(p => {
        const key = `${p.startTime}-${p.endTime}`;
        if (!slotsMap.has(key)) {
          slotsMap.set(key, { startTime: p.startTime, endTime: p.endTime, order: p.periodNumber || 0 });
        }
      });
    });
    return Array.from(slotsMap.values()).sort((a, b) => {
      if (a.startTime < b.startTime) return -1;
      if (a.startTime > b.startTime) return 1;
      return 0;
    });
  }, [timetables]);

  // Get period for a specific day and time slot
  const getPeriodForSlot = (day, startTime, endTime) => {
    const tt = timetables.find(t => t.day === day);
    if (!tt) return null;
    return (tt.periods || []).find(p => p.startTime === startTime && p.endTime === endTime);
  };

  // Active day for detail view
  const activeDay = selectedDay || today;

  /* ──────────────────── Loading ──────────────────── */
  if (loading) return (
    <div style={styles.loadingContainer}>
      <div style={styles.loadingSpinner}>
        <div style={styles.spinnerRing} className="animate-spin" />
      </div>
      <p style={styles.loadingText}>Loading your timetable...</p>
    </div>
  );

  /* ──────────────────── Error ──────────────────── */
  if (error) return (
    <div style={styles.errorContainer}>
      <div style={styles.errorIcon}>⚠️</div>
      <p style={styles.errorText}>{error}</p>
      <button onClick={() => window.location.reload()} style={styles.retryBtn}>Retry</button>
    </div>
  );

  /* ──────────────────── Empty ──────────────────── */
  if (timetables.length === 0) return (
    <div style={styles.emptyContainer}>
      <div style={styles.emptyIconWrap}>
        <span style={{ fontSize: '48px' }}>📅</span>
      </div>
      <h2 style={styles.emptyTitle}>No Timetable Yet</h2>
      <p style={styles.emptySubtitle}>Your timetable will appear here once your admin creates it.</p>
    </div>
  );

  /* ──────────────────── Render ──────────────────── */
  return (
    <div style={styles.pageWrap}>
      {/* ── Inline keyframes ── */}
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.5); } 50% { box-shadow: 0 0 0 6px rgba(74, 222, 128, 0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .tt-card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.12) !important; }
        .tt-day-btn:hover { transform: scale(1.05); }
        .tt-grid-cell:hover { transform: scale(1.03); z-index: 2; }
      `}</style>

      {/* ── Page Header ── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>
            <span style={styles.titleIcon}>📅</span>
            My Timetable
          </h1>
          <p style={styles.pageSubtitle}>
            {user?.name ? `${user.name}'s` : 'Your'} weekly class schedule
          </p>
        </div>
        <div style={styles.headerBadge}>
          <span style={styles.headerBadgeIcon}>🟢</span>
          <span style={styles.headerBadgeText}>{today}</span>
        </div>
      </div>

      {/* ── Today's Schedule Hero ── */}
      {todayPeriods.length > 0 && (
        <div style={styles.todayCard} className="tt-card-hover">
          <div style={styles.todayHeader}>
            <div style={styles.todayHeaderLeft}>
              <div style={styles.todayIconWrap}>
                <span style={{ fontSize: '20px' }}>⏰</span>
              </div>
              <div>
                <h2 style={styles.todayTitle}>Today&apos;s Schedule</h2>
                <p style={styles.todayMeta}>
                  {todayPeriods.filter(p => !isGapSlot(p)).length} classes · {today}, {now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div style={styles.liveIndicator}>
              <div style={styles.liveDot} />
              <span style={styles.liveText}>LIVE</span>
            </div>
          </div>

          <div style={styles.todayTimeline}>
            {todayPeriods.map((p, i) => {
              const current = isCurrentPeriod(p);
              const slotType = getSlotType(p);
              const config = SLOT_CONFIG[slotType];
              return (
                <div
                  key={i}
                  style={{
                    ...styles.timelineItem,
                    background: current ? config.bg : 'var(--hover-bg, rgba(255,255,255,0.03))',
                    border: `1.5px solid ${current ? config.accent : 'var(--border-color, rgba(255,255,255,0.06))'}`,
                    boxShadow: current ? `0 0 20px ${config.glow}` : 'none',
                    animation: `fadeInUp 0.4s ease ${i * 0.05}s both`,
                  }}
                  className="tt-card-hover"
                >
                  {current && <div style={{ ...styles.currentDot, background: '#4ade80' }} />}

                  {/* Time */}
                  <div style={{ ...styles.timelineTime, color: config.accent }}>
                    {p.startTime} – {p.endTime}
                  </div>

                  {/* Content */}
                  <div style={styles.timelineContent}>
                    <span style={{ fontSize: '16px', marginRight: '6px' }}>{config.icon}</span>
                    <span style={styles.timelineLabel}>
                      {getSlotLabel(p)}
                    </span>
                  </div>

                  {/* Teacher */}
                  {!isGapSlot(p) && (
                    <div style={{
                      ...styles.timelineTeacher,
                      color: p.teacher_id?.name ? 'var(--text-tertiary, #888)' : '#fbbf24',
                      fontStyle: p.teacher_id?.name ? 'normal' : 'italic',
                    }}>
                      👤 {p.teacher_id?.name || 'Not assigned'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Day Selector Tabs ── */}
      <div style={styles.dayTabsWrap}>
        {DAYS.map(day => {
          const isActive = day === activeDay;
          const isToday = day === today;
          const tt = timetables.find(t => t.day === day);
          const count = (tt?.periods || []).filter(p => !isGapSlot(p)).length;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className="tt-day-btn"
              style={{
                ...styles.dayTab,
                background: isActive ? 'linear-gradient(135deg, #6366f1, #818cf8)' : 'var(--hover-bg, rgba(255,255,255,0.04))',
                color: isActive ? '#fff' : 'var(--text-secondary, #aaa)',
                border: `1.5px solid ${isActive ? 'transparent' : isToday ? 'rgba(99,102,241,0.3)' : 'var(--border-color, rgba(255,255,255,0.06))'}`,
                fontWeight: isActive ? 700 : 500,
                boxShadow: isActive ? '0 4px 15px rgba(99,102,241,0.3)' : 'none',
              }}
            >
              <span style={styles.dayTabName}>{SHORT_DAYS[day]}</span>
              <span style={{ ...styles.dayTabCount, opacity: isActive ? 1 : 0.6 }}>
                {count} {count === 1 ? 'class' : 'classes'}
              </span>
              {isToday && !isActive && <div style={styles.todayDotIndicator} />}
            </button>
          );
        })}
      </div>

      {/* ── Full Week Grid Table ── */}
      <div style={styles.gridCard} className="tt-card-hover">
        <div style={styles.gridHeader}>
          <h2 style={styles.gridTitle}>📋 Weekly Schedule</h2>
          <div style={styles.legendRow}>
            {Object.entries(SLOT_CONFIG).map(([key, cfg]) => (
              <div key={key} style={styles.legendItem}>
                <span style={{ fontSize: '12px' }}>{cfg.icon}</span>
                <span style={styles.legendLabel}>{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table Grid */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.thTime}>Time</th>
                {DAYS.map(day => (
                  <th key={day} style={{
                    ...styles.thDay,
                    background: day === today ? 'rgba(99,102,241,0.1)' : 'transparent',
                    color: day === today ? '#818cf8' : 'var(--text-secondary, #aaa)',
                  }}>
                    {SHORT_DAYS[day]}
                    {day === today && <div style={styles.todayUnderline} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allTimeSlots.map((slot, rowIdx) => (
                <tr key={rowIdx}>
                  <td style={styles.tdTime}>
                    <div style={styles.timeLabel}>{slot.startTime}</div>
                    <div style={styles.timeLabelEnd}>{slot.endTime}</div>
                  </td>
                  {DAYS.map(day => {
                    const period = getPeriodForSlot(day, slot.startTime, slot.endTime);
                    if (!period) return <td key={day} style={styles.tdEmpty}>—</td>;

                    const slotType = getSlotType(period);
                    const config = SLOT_CONFIG[slotType];
                    const isCurrent = day === today && isCurrentPeriod(period);

                    return (
                      <td key={day} style={styles.tdCell}>
                        <div
                          className="tt-grid-cell"
                          style={{
                            ...styles.cellInner,
                            background: config.bg,
                            border: `1px solid ${config.border}`,
                            boxShadow: isCurrent ? `0 0 12px ${config.glow}` : 'none',
                            position: 'relative',
                          }}
                        >
                          {isCurrent && (
                            <div style={{
                              position: 'absolute', top: '3px', right: '3px',
                              width: '6px', height: '6px', borderRadius: '50%',
                              background: '#4ade80',
                              animation: 'pulseGlow 2s infinite',
                            }} />
                          )}
                          <div style={{ fontSize: '13px', marginBottom: '2px' }}>{config.icon}</div>
                          <div style={{ ...styles.cellLabel, color: config.accent }}>
                            {isGapSlot(period) ? config.label : (period.subject_id?.name || 'TBD')}
                          </div>
                          {!isGapSlot(period) && period.teacher_id?.name && (
                            <div style={styles.cellTeacher}>{period.teacher_id.name}</div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Selected Day Detail View ── */}
      <div style={styles.detailCard} className="tt-card-hover">
        <h2 style={styles.detailTitle}>
          {activeDay === today ? '🟢' : '📌'} {activeDay} — Detail View
        </h2>
        {(() => {
          const tt = timetables.find(t => t.day === activeDay);
          const periods = tt?.periods || [];
          if (periods.length === 0) return (
            <div style={styles.detailEmpty}>
              <span style={{ fontSize: '32px' }}>📭</span>
              <p style={{ color: 'var(--text-tertiary, #888)', marginTop: '8px', fontSize: '13px' }}>No classes scheduled for {activeDay}</p>
            </div>
          );
          return (
            <div style={styles.detailList}>
              {periods.map((p, i) => {
                const slotType = getSlotType(p);
                const config = SLOT_CONFIG[slotType];
                const isCurrent = activeDay === today && isCurrentPeriod(p);
                return (
                  <div
                    key={i}
                    style={{
                      ...styles.detailItem,
                      borderLeft: `3px solid ${config.accent}`,
                      background: isCurrent ? config.bg : 'var(--hover-bg, rgba(255,255,255,0.02))',
                      animation: `fadeInUp 0.4s ease ${i * 0.06}s both`,
                    }}
                    className="tt-card-hover"
                  >
                    {isCurrent && (
                      <div style={{
                        position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)',
                        padding: '2px 8px', borderRadius: '8px',
                        background: 'rgba(74,222,128,0.15)', color: '#4ade80',
                        fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em',
                      }}>NOW</div>
                    )}
                    <div style={styles.detailItemLeft}>
                      <div style={{
                        ...styles.detailIconWrap,
                        background: config.gradient,
                      }}>
                        <span style={{ fontSize: '16px' }}>{config.icon}</span>
                      </div>
                      <div>
                        <div style={styles.detailItemName}>
                          {getSlotLabel(p)}
                        </div>
                        {!isGapSlot(p) && (
                          <div style={{
                            ...styles.detailItemTeacher,
                            color: p.teacher_id?.name ? 'var(--text-tertiary, #888)' : '#fbbf24',
                          }}>
                            👤 {p.teacher_id?.name || 'Teacher not assigned'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={styles.detailItemRight}>
                      <div style={{ ...styles.detailItemTime, color: config.accent }}>{p.startTime}</div>
                      <div style={styles.detailItemTimeSep}>to</div>
                      <div style={{ ...styles.detailItemTime, color: config.accent }}>{p.endTime}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

/* ──────────────────── Styles ──────────────────── */
const styles = {
  pageWrap: {
    display: 'flex', flexDirection: 'column', gap: '20px',
    padding: '20px', maxWidth: '1200px', margin: '0 auto',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },

  // Header
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    flexWrap: 'wrap', gap: '12px',
  },
  pageTitle: {
    fontSize: '26px', fontWeight: 800, color: 'var(--text-primary, #fff)',
    letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '10px', margin: 0,
  },
  titleIcon: { fontSize: '28px' },
  pageSubtitle: {
    fontSize: '13px', color: 'var(--text-tertiary, #888)', marginTop: '4px',
  },
  headerBadge: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '6px 14px', borderRadius: '20px',
    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
  },
  headerBadgeIcon: { fontSize: '10px' },
  headerBadgeText: { fontSize: '12px', fontWeight: 600, color: '#818cf8' },

  // Loading
  loadingContainer: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '400px', gap: '16px',
  },
  loadingSpinner: { position: 'relative', width: '44px', height: '44px' },
  spinnerRing: {
    width: '44px', height: '44px', borderRadius: '50%',
    border: '3px solid rgba(99,102,241,0.15)', borderTopColor: '#6366f1',
  },
  loadingText: { fontSize: '13px', color: 'var(--text-tertiary, #888)' },

  // Error
  errorContainer: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '400px', gap: '12px',
  },
  errorIcon: { fontSize: '40px' },
  errorText: { fontSize: '14px', color: 'var(--text-secondary, #aaa)', textAlign: 'center' },
  retryBtn: {
    padding: '8px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: '#fff',
    fontSize: '13px', fontWeight: 600,
  },

  // Empty
  emptyContainer: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '400px', gap: '12px',
  },
  emptyIconWrap: {
    width: '80px', height: '80px', borderRadius: '20px',
    background: 'rgba(99,102,241,0.08)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    border: '1px solid rgba(99,102,241,0.15)',
  },
  emptyTitle: {
    fontSize: '20px', fontWeight: 700, color: 'var(--text-primary, #fff)', margin: 0,
  },
  emptySubtitle: {
    fontSize: '13px', color: 'var(--text-tertiary, #888)', textAlign: 'center', maxWidth: '280px',
  },

  // Today Card
  todayCard: {
    borderRadius: '16px', padding: '20px',
    background: 'var(--card-bg, rgba(255,255,255,0.03))',
    border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
    backdropFilter: 'blur(12px)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  todayHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '16px', flexWrap: 'wrap', gap: '8px',
  },
  todayHeaderLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  todayIconWrap: {
    width: '42px', height: '42px', borderRadius: '12px',
    background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid rgba(99,102,241,0.2)',
  },
  todayTitle: {
    fontSize: '16px', fontWeight: 700, color: 'var(--text-primary, #fff)', margin: 0,
  },
  todayMeta: {
    fontSize: '11px', color: 'var(--text-tertiary, #888)', marginTop: '2px',
  },
  liveIndicator: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '4px 10px', borderRadius: '12px',
    background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)',
  },
  liveDot: {
    width: '6px', height: '6px', borderRadius: '50%',
    background: '#4ade80', animation: 'pulseGlow 2s infinite',
  },
  liveText: {
    fontSize: '9px', fontWeight: 700, color: '#4ade80', letterSpacing: '0.08em',
  },
  todayTimeline: {
    display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px',
  },
  timelineItem: {
    flexShrink: 0, minWidth: '140px', padding: '14px',
    borderRadius: '12px', position: 'relative', overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
  },
  currentDot: {
    position: 'absolute', top: '6px', right: '8px',
    width: '7px', height: '7px', borderRadius: '50%',
    animation: 'pulseGlow 2s infinite',
  },
  timelineTime: {
    fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em',
    textTransform: 'uppercase', marginBottom: '6px',
  },
  timelineContent: {
    display: 'flex', alignItems: 'center',
  },
  timelineLabel: {
    fontSize: '13px', fontWeight: 700, color: 'var(--text-primary, #fff)',
  },
  timelineTeacher: {
    fontSize: '10px', marginTop: '4px',
  },

  // Day Tabs
  dayTabsWrap: {
    display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px',
  },
  dayTab: {
    flex: '1 1 0', minWidth: '80px', padding: '10px 8px',
    borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
    transition: 'all 0.2s', position: 'relative',
    outline: 'none',
  },
  dayTabName: {
    display: 'block', fontSize: '13px', fontWeight: 'inherit',
  },
  dayTabCount: {
    display: 'block', fontSize: '10px', marginTop: '2px',
  },
  todayDotIndicator: {
    position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)',
    width: '4px', height: '4px', borderRadius: '50%', background: '#818cf8',
  },

  // Grid Card
  gridCard: {
    borderRadius: '16px', padding: '20px',
    background: 'var(--card-bg, rgba(255,255,255,0.03))',
    border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
    backdropFilter: 'blur(12px)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    overflow: 'hidden',
  },
  gridHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: '16px', flexWrap: 'wrap', gap: '10px',
  },
  gridTitle: {
    fontSize: '16px', fontWeight: 700, color: 'var(--text-primary, #fff)', margin: 0,
  },
  legendRow: {
    display: 'flex', gap: '10px', flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex', alignItems: 'center', gap: '4px',
  },
  legendLabel: {
    fontSize: '10px', color: 'var(--text-tertiary, #888)',
  },

  // Table
  tableContainer: {
    overflowX: 'auto', borderRadius: '10px',
  },
  table: {
    width: '100%', borderCollapse: 'separate', borderSpacing: '3px',
    minWidth: '600px',
  },
  thTime: {
    width: '70px', padding: '8px 6px', fontSize: '10px', fontWeight: 700,
    color: 'var(--text-tertiary, #888)', textTransform: 'uppercase',
    letterSpacing: '0.06em', textAlign: 'center', verticalAlign: 'middle',
  },
  thDay: {
    padding: '8px 6px', fontSize: '12px', fontWeight: 700,
    textAlign: 'center', position: 'relative', borderRadius: '8px 8px 0 0',
  },
  todayUnderline: {
    position: 'absolute', bottom: '0', left: '20%', right: '20%',
    height: '2px', borderRadius: '1px', background: '#818cf8',
  },
  tdTime: {
    padding: '4px 6px', textAlign: 'center', verticalAlign: 'middle',
  },
  timeLabel: {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-primary, #fff)',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  timeLabelEnd: {
    fontSize: '9px', color: 'var(--text-tertiary, #888)',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  tdEmpty: {
    padding: '8px', textAlign: 'center', color: 'var(--text-tertiary, rgba(255,255,255,0.1))',
    fontSize: '12px', verticalAlign: 'middle',
  },
  tdCell: {
    padding: '2px', verticalAlign: 'middle',
  },
  cellInner: {
    padding: '8px 6px', borderRadius: '8px', textAlign: 'center',
    transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'default',
  },
  cellLabel: {
    fontSize: '10px', fontWeight: 700, lineHeight: 1.2,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  cellTeacher: {
    fontSize: '8px', color: 'var(--text-tertiary, #888)',
    marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },

  // Detail Card
  detailCard: {
    borderRadius: '16px', padding: '20px',
    background: 'var(--card-bg, rgba(255,255,255,0.03))',
    border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
    backdropFilter: 'blur(12px)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  detailTitle: {
    fontSize: '16px', fontWeight: 700, color: 'var(--text-primary, #fff)',
    margin: '0 0 16px 0',
  },
  detailEmpty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '30px 0',
  },
  detailList: {
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  detailItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', borderRadius: '12px', position: 'relative',
    border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
    transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
  },
  detailItemLeft: {
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  detailIconWrap: {
    width: '36px', height: '36px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  detailItemName: {
    fontSize: '14px', fontWeight: 700, color: 'var(--text-primary, #fff)',
  },
  detailItemTeacher: {
    fontSize: '11px', marginTop: '2px',
  },
  detailItemRight: {
    display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
  },
  detailItemTime: {
    fontSize: '12px', fontWeight: 700,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  detailItemTimeSep: {
    fontSize: '9px', color: 'var(--text-tertiary, #888)',
  },
};

export default StudentTimetable;
