import { useState } from 'react';

const QuickAccessDashboard = ({ handleQuickLogin, quickBtnStyle, activeTab, setActiveTab }) => {
  return (
    <div className="glass-card animate-slide-up" style={{
      width: '100%',
      maxWidth: '460px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      position: 'relative',
      zIndex: 1,
    }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>⚡ Quick Testing Dashboard</h2>
        <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px' }}>Click any role to log in instantly (auto-submits)</p>
      </div>

      {/* College Selector Tabs */}
      <div style={{
        display: 'flex',
        background: 'var(--color-surface-3)',
        padding: '4px',
        borderRadius: '10px',
        border: '1px solid var(--color-border)',
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('pcs')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'pcs' ? 'var(--color-surface-1)' : 'transparent',
            color: activeTab === 'pcs' ? 'var(--text-primary)' : 'var(--color-muted)',
            fontWeight: activeTab === 'pcs' ? 700 : 500,
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Punjab College (PCS)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('vgc')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'vgc' ? 'var(--color-surface-1)' : 'transparent',
            color: activeTab === 'vgc' ? 'var(--text-primary)' : 'var(--color-muted)',
            fontWeight: activeTab === 'vgc' ? 700 : 500,
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Vital Group (VGC)
        </button>
      </div>

      {/* Buttons Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
        {activeTab === 'pcs' ? (
          <>
            {/* Central / Platform Roles */}
            <div>
              <h3 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Platform Core
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('superadmin@academix.io', 'super@123')}
                  style={quickBtnStyle}
                  onMouseOver={e => e.currentTarget.style.borderColor = '#6366f1'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#f43f5e', fontSize: '12px' }}>🔴 Super Admin</span>
                    <span style={{ fontSize: '10px', color: 'var(--color-muted)' }}>superadmin@academix.io</span>
                  </div>
                </button>
              </div>
            </div>

            {/* College Admin Roles */}
            <div>
              <h3 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                PCS Administration
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  ['College Admin', 'admin@pcs.edu.pk', 'admin@123'],
                  ['Principal', 'principal@pcs.edu.pk', 'principal@123'],
                  ['Registrar', 'registrar@pcs.edu.pk', 'registrar@123'],
                  ['Accountant', 'accounts@pcs.edu.pk', 'accounts@123'],
                ].map(([role, em, pw]) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleQuickLogin(em, pw)}
                    style={quickBtnStyle}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '11px' }}>{role}</span>
                    <span style={{ fontSize: '9px', color: 'var(--color-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>{em}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Teachers & Staff */}
            <div>
              <h3 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                PCS Staff
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  ['Teacher (Nadia)', 'nadia@pcs.edu.pk', 'teacher@123'],
                  ['Teacher (Asad)', 'asad@pcs.edu.pk', 'teacher@123'],
                  ['Teacher (Hira)', 'hira@pcs.edu.pk', 'teacher@123'],
                  ['Teacher 4', 'teacher4@pcs.edu.pk', 'teacher@123'],
                  ['Teacher 5', 'teacher5@pcs.edu.pk', 'teacher@123'],
                  ['Employee (Guard)', 'security@pcs.edu.pk', 'employee@123'],
                ].map(([role, em, pw]) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleQuickLogin(em, pw)}
                    style={quickBtnStyle}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '11px' }}>{role}</span>
                    <span style={{ fontSize: '9px', color: 'var(--color-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>{em}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Students (1-5) */}
            <div>
              <h3 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                PCS Students (1-5)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  ['Student 1 (Ali)', 'ali@student.pcs.edu.pk', 'student@123'],
                  ['Student 2 (Sara)', 'sara@student.pcs.edu.pk', 'student@123'],
                  ['Student 3 (Usman)', 'usman@student.pcs.edu.pk', 'student@123'],
                  ['Student 4 (Fatima)', 'fatima@student.pcs.edu.pk', 'student@123'],
                  ['Student 5 (Hamza)', 'hamza@student.pcs.edu.pk', 'student@123'],
                ].map(([role, em, pw]) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleQuickLogin(em, pw)}
                    style={quickBtnStyle}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '11px' }}>{role}</span>
                    <span style={{ fontSize: '9px', color: 'var(--color-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>{em}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Students (6-10) */}
            <div>
              <h3 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                PCS Students (6-10)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  ['Student 6 (Ayesha)', 'ayesha@student.pcs.edu.pk', 'student@123'],
                  ['Student 7 (Zain)', 'zain@student.pcs.edu.pk', 'student@123'],
                  ['Student 8 (Khadija)', 'khadija@student.pcs.edu.pk', 'student@123'],
                  ['Student 9 (Bilal)', 'bilal@student.pcs.edu.pk', 'student@123'],
                  ['Student 10 (Sana)', 'sana@student.pcs.edu.pk', 'student@123'],
                ].map(([role, em, pw]) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleQuickLogin(em, pw)}
                    style={quickBtnStyle}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '11px' }}>{role}</span>
                    <span style={{ fontSize: '9px', color: 'var(--color-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>{em}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* VGC Admin Roles */}
            <div>
              <h3 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                VGC Administration
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  ['College Admin', 'admin@vgc.edu.pk', 'admin@123'],
                  ['Principal', 'principal@vgc.edu.pk', 'principal@123'],
                  ['Registrar', 'registrar@vgc.edu.pk', 'registrar@123'],
                  ['Accountant', 'accounts@vgc.edu.pk', 'accounts@123'],
                ].map(([role, em, pw]) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleQuickLogin(em, pw)}
                    style={quickBtnStyle}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '11px' }}>{role}</span>
                    <span style={{ fontSize: '9px', color: 'var(--color-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>{em}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* VGC Teachers & Staff */}
            <div>
              <h3 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                VGC Staff
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  ['Teacher 1', 'teacher1@vgc.edu.pk', 'teacher@123'],
                  ['Teacher 2', 'teacher2@vgc.edu.pk', 'teacher@123'],
                  ['Employee (Guard)', 'security@vgc.edu.pk', 'employee@123'],
                ].map(([role, em, pw]) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleQuickLogin(em, pw)}
                    style={quickBtnStyle}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '11px' }}>{role}</span>
                    <span style={{ fontSize: '9px', color: 'var(--color-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>{em}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* VGC Students */}
            <div>
              <h3 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                VGC Students
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  ['Student 1', 'student1@vgc.edu.pk', 'student@123'],
                  ['Student 2', 'student2@vgc.edu.pk', 'student@123'],
                  ['Student 3', 'student3@vgc.edu.pk', 'student@123'],
                ].map(([role, em, pw]) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleQuickLogin(em, pw)}
                    style={quickBtnStyle}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '11px' }}>{role}</span>
                    <span style={{ fontSize: '9px', color: 'var(--color-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>{em}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuickAccessDashboard;
