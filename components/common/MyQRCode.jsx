import { QRCodeSVG } from 'qrcode.react';

const MyQRCode = ({ value, name, subtitle, size = 180 }) => {
  if (!value) return (
    <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
      <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No QR code assigned yet. Contact administration.</p>
    </div>
  );

  return (
    <div className="glass-card" style={{ padding: 24, textAlign: 'center', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>📱 My ID Card QR</p>
      <div style={{ padding: 16, background: '#fff', borderRadius: 12, display: 'inline-block' }}>
        <QRCodeSVG value={value} size={size} level="H" includeMargin={false} />
      </div>
      {name && <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{name}</p>}
      {subtitle && <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{subtitle}</p>}
      <p style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'monospace', background: 'var(--hover-bg)', padding: '4px 12px', borderRadius: 6 }}>{value}</p>
      <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Show this QR at the gate for entry/exit</p>
    </div>
  );
};

export default MyQRCode;
