'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../Icon';
import Tooltip from './Tooltip';
import { getAppPortalRoot } from '../../lib/portal';

const normalizeOption = (opt, idx) => {
  if (typeof opt === 'object' && opt !== null) {
    const id = opt.id ?? opt.value ?? opt._id ?? idx;
    const name = opt.name ?? opt.label ?? String(id);
    return { ...opt, id, name };
  }
  return { id: opt, name: String(opt), raw: opt };
};

const Select = ({
  className = '',
  classButton = '',
  label,
  tooltip,
  value = null,
  onChange,
  options = [],
  isBlack = false,
  placeholder = 'Select...',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 180 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const normalizedOptions = options.map(normalizeOption);
  const selectedId =
    typeof value === 'object' && value !== null
      ? value.id ?? value.value ?? value._id
      : value;
  const selectedOption =
    normalizedOptions.find((o) => o.id === selectedId) ||
    (typeof value === 'object' && value?.name ? value : null);

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 6,
      left: rect.left,
      width: Math.max(rect.width, 160),
    });
  }, []);

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

  const handleSelect = (opt, rawIndex) => {
    if (onChange) {
      const original = options[rawIndex] ?? opt;
      onChange(original);
    }
    setOpen(false);
  };

  const portalRoot = getAppPortalRoot();

  const menuNode = open ? (
    <div
      ref={menuRef}
      role="listbox"
      data-portal-select-menu="true"
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        minWidth: `${coords.width}px`,
      }}
      className="z-[115] max-h-68 overflow-y-auto p-2 rounded-[1.25rem] bg-b-surface2 border border-s-subtle shadow-dropdown outline-none animate-slide-up"
    >
      {normalizedOptions.map((option, idx) => {
        const isSelected = option.id === selectedId;
        return (
          <button
            key={option.id ?? idx}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => handleSelect(option, idx)}
            className={`relative flex items-center justify-between w-full px-3 py-2 rounded-xl text-left text-body-2 transition-colors cursor-pointer ${
              isSelected
                ? 'bg-b-highlight text-t-primary font-semibold'
                : 'text-t-secondary hover:bg-b-highlight/60 hover:text-t-primary'
            }`}
          >
            <span className="truncate pr-4">{option.name}</span>
            {isSelected && (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: 'var(--primary-01)' }}
              />
            )}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="flex items-center mb-2.5 text-button text-t-primary">
          <span>{label}</span>
          {tooltip && <Tooltip className="ml-1.5" content={tooltip} />}
        </label>
      )}
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        className={`group flex justify-between items-center w-full h-12 pl-4.5 pr-3.5 border rounded-3xl text-body-2 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${
          isBlack
            ? 'btn-primary border-transparent'
            : open
              ? 'bg-b-surface2 border-s-focus text-t-primary shadow-widget'
              : 'bg-b-surface2 border-s-stroke2 text-t-primary hover:border-s-highlight'
        } ${classButton}`}
      >
        {selectedOption?.name ? (
          <span className="truncate">{selectedOption.name}</span>
        ) : (
          <span className="truncate text-t-tertiary">{placeholder}</span>
        )}
        <Icon
          className={`!size-4.5 shrink-0 ml-2 fill-current transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          name="chevron"
        />
      </button>
      {open && (portalRoot ? createPortal(menuNode, portalRoot) : menuNode)}
    </div>
  );
};

export default Select;

