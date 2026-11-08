'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../Icon';
import { getAppPortalRoot } from '../../lib/portal';

const Dropdown = ({
  className = '',
  buttonClassName = '',
  items = [],
  value,
  setValue,
  onSelect,
  trigger,
  icon = 'dots',
  align = 'end',
  ariaLabel = 'Open actions menu',
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuWidth = 192;
    const left =
      align === 'end'
        ? Math.max(12, rect.right - menuWidth)
        : Math.min(window.innerWidth - menuWidth - 12, rect.left);
    setCoords({
      top: rect.bottom + 8,
      left,
    });
  }, [align]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const handleOutside = (e) => {
      if (
        btnRef.current &&
        !btnRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, updatePosition]);

  const activeId =
    typeof value === 'object' && value !== null ? value.id ?? value.value : value;

  const handleItemClick = (item) => {
    if (item.onClick) item.onClick(item);
    if (setValue) setValue(item);
    if (onSelect) onSelect(item);
    setOpen(false);
  };

  const portalRoot = getAppPortalRoot();

  const menuNode = open ? (
    <div
      ref={menuRef}
      role="menu"
      data-portal-dropdown="true"
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
      }}
      className="z-[115] min-w-48 p-2 rounded-[1.25rem] bg-b-surface2 border border-s-subtle outline-none shadow-dropdown animate-slide-up"
    >
      {items.map((item, idx) => {
        const id = item.id ?? item.value ?? idx;
        const label = item.name ?? item.label ?? String(item);
        const isSelected = activeId !== undefined && id === activeId;
        const isDanger = item.danger || item.variant === 'danger';

        return (
          <button
            key={id}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => handleItemClick(item)}
            className={`flex items-center gap-2.5 w-full min-h-9.5 px-3 py-2 rounded-xl text-left text-body-2 transition-colors cursor-pointer disabled:opacity-45 disabled:pointer-events-none ${
              isDanger
                ? 'text-primary-03 hover:bg-primary-03/10'
                : isSelected
                  ? 'bg-b-highlight text-t-primary font-semibold'
                  : 'text-t-secondary hover:bg-b-highlight hover:text-t-primary'
            }`}
          >
            {item.icon && (
              <Icon
                name={item.icon}
                className={`!size-4.5 shrink-0 ${
                  isDanger ? 'fill-primary-03' : 'fill-current'
                }`}
              />
            )}
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        ref={btnRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={
          buttonClassName ||
          'inline-flex items-center justify-center w-10 h-10 rounded-full bg-b-surface1 border border-s-subtle text-t-secondary hover:text-t-primary hover:border-s-highlight transition-colors cursor-pointer'
        }
      >
        {trigger || <Icon className="!size-5 fill-current" name={icon} />}
      </button>
      {open && (portalRoot ? createPortal(menuNode, portalRoot) : menuNode)}
    </div>
  );
};

export default Dropdown;

