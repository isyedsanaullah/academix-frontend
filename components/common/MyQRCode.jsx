'use client';

import { QRCodeSVG } from 'qrcode.react';
import Icon from '../Icon';

const MyQRCode = ({ value, name, subtitle, size = 180 }) => {
  if (!value) {
    return (
      <div className="card p-6 text-center">
        <p className="text-body-2 text-t-secondary">
          No QR code assigned yet. Contact administration.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6 text-center inline-flex flex-col items-center gap-3">
      <div className="inline-flex items-center gap-2 text-sub-title-1 text-t-primary">
        <Icon name="qr-code" className="!size-5 fill-primary-01" />
        <span>My ID Card QR</span>
      </div>
      {/* Print/scanner-safe white background for QR code */}
      <div className="print-surface p-4 bg-white rounded-2xl border border-s-subtle shadow-widget inline-block">
        <QRCodeSVG value={value} size={size} level="H" includeMargin={false} />
      </div>
      {name && <p className="text-sub-title-1 text-t-primary">{name}</p>}
      {subtitle && <p className="text-caption text-t-secondary">{subtitle}</p>}
      <p className="text-caption text-t-secondary font-mono bg-b-surface1 px-3 py-1 rounded-full border border-s-subtle">
        {value}
      </p>
      <p className="text-caption text-t-tertiary">
        Show this QR at the campus gate for entry/exit
      </p>
    </div>
  );
};

export default MyQRCode;
