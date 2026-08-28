import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  HiOutlineOfficeBuilding, HiOutlineMail, HiOutlinePhone,
  HiOutlineLocationMarker, HiOutlineGlobe, HiOutlineUser
} from 'react-icons/hi';

const roleBadge = {
  admin:      { label: 'Administration', color: '#818cf8' },
  principal:  { label: 'Principal',      color: '#38bdf8' },
  registrar:  { label: 'Registrar',      color: '#34d399' },
  accountant: { label: 'Accounts',       color: '#fbbf24' },
};

const CollegeInfoCard = () => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/colleges/info')
      .then(({ data }) => setInfo(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
      <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
    </div>
  );

  if (!info) return null;

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
          border: '1px solid rgba(99,102,241,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <HiOutlineOfficeBuilding size={22} style={{ color: '#818cf8' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color:'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {info.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '1px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {info.code}
            </span>
            <span style={{ fontSize: '10px', color:'var(--text-tertiary)', textTransform: 'capitalize' }}>
              {info.subscription?.plan} Plan
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {info.email && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiOutlineMail size={13} style={{ color:'var(--text-tertiary)', flexShrink: 0 }} />
            <a href={`mailto:${info.email}`} style={{ fontSize: '12px', color:'var(--text-secondary)', textDecoration: 'none' }}>{info.email}</a>
          </div>
        )}
        {info.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiOutlinePhone size={13} style={{ color:'var(--text-tertiary)', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color:'var(--text-secondary)' }}>{info.phone}</span>
          </div>
        )}
        {info.address && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiOutlineLocationMarker size={13} style={{ color:'var(--text-tertiary)', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color:'var(--text-secondary)' }}>{info.address}{info.city ? `, ${info.city}` : ''}</span>
          </div>
        )}
        {info.website && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiOutlineGlobe size={13} style={{ color:'var(--text-tertiary)', flexShrink: 0 }} />
            <a href={info.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#818cf8', textDecoration: 'none' }}>{info.website}</a>
          </div>
        )}
      </div>

      {/* Staff Contacts */}
      {info.contacts?.length > 0 && (
        <>
          <div style={{ borderTop:'1px solid var(--border-color)', paddingTop: '12px', marginBottom: '10px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color:'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Key Contacts</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {info.contacts.map((c, i) => {
              const badge = roleBadge[c.role] || { label: c.role, color: '#94a3b8' };
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px', borderRadius: '8px',
                  background:'var(--hover-bg)', border: '1px solid rgba(255,255,255,0.04)'
                }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: `${badge.color}15`, border: `1px solid ${badge.color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <HiOutlineUser size={13} style={{ color: badge.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color:'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                    <p style={{ fontSize: '10px', color:'var(--text-tertiary)' }}>{c.email}</p>
                  </div>
                  <span style={{
                    fontSize: '9px', fontWeight: 700, color: badge.color,
                    background: `${badge.color}12`, padding: '2px 6px', borderRadius: '4px',
                    textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0
                  }}>{badge.label}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default CollegeInfoCard;
