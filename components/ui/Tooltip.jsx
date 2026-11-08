'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../Icon';
import { getAppPortalRoot } from '../../lib/portal';

const Tooltip = ({
  className = '',
  content,
  children,
  large = false,
}) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const ref = useRef(null);

  const handleEnter = () => {
    if (!ref.current || !content) return;
    const rect = ref.current.getBoundingClientRect();
    setCoords({
      top: Math.max(8, rect.top - 38),
      left: rect.left + rect.width / 2,
    });
    setVisible(true);
  };

  const portalRoot = getAppPortalRoot();
  const bubble =
    visible && content ? (
      <div
        role="tooltip"
        data-portal-tooltip="true"
        style={{
          position: 'fixed',
          top: `${coords.top}px`,
          left: `${coords.left}px`,
          transform: 'translateX(-50%)',
        }}
        className="pointer-events-none z-[120] max-w-xs px-3 py-1.5 rounded-xl bg-b-surface2 border border-s-subtle text-caption text-t-primary shadow-dropdown whitespace-nowrap"
      >
        {content}
      </div>
    ) : null;

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setVisible(false)}
        onFocus={handleEnter}
        onBlur={() => setVisible(false)}
        className={`inline-flex items-center text-t-secondary opacity-70 hover:opacity-100 hover:text-primary-01 transition-all cursor-help ${className}`}
      >
        {children || (
          <Icon
            className={`fill-current ${large ? '!size-5' : '!size-4'}`}
            name={large ? 'help-think' : 'help'}
          />
        )}
      </span>
      {visible && (portalRoot ? createPortal(bubble, portalRoot) : bubble)}
    </>
  );
};

export default Tooltip;

