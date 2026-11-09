'use client';

import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/Icon';

const ACTUAL_PLANS = [
  { id: 'starter', name: 'Starter' },
  { id: 'standard', name: 'Standard' },
  { id: 'premium', name: 'Premium' },
  { id: 'enterprise', name: 'Enterprise' },
];

export default function PlanFilterDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const current = ACTUAL_PLANS.find((p) => p.id === value);
  const label = current ? current.name : 'All Plans';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Filter by subscription plan"
        className={`h-12 px-4 rounded-3xl bg-b-surface2 border text-caption font-semibold flex items-center justify-between gap-2.5 shadow-widget transition-all cursor-pointer ${
          open
            ? 'border-s-focus ring-2 ring-s-focus/20 text-t-primary'
            : value
              ? 'border-s-highlight text-t-primary'
              : 'border-s-subtle text-t-secondary hover:text-t-primary hover:border-s-highlight'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span className="text-t-tertiary font-normal">Plan:</span>
          <span className="font-semibold text-t-primary">{label}</span>
        </span>
        <Icon
          name="chevron"
          className={`!size-3.5 fill-t-secondary transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-2 w-48 p-1.5 rounded-2xl bg-b-surface2 border border-s-stroke2 shadow-depth z-50 animate-slide-up"
        >
          <button
            type="button"
            role="option"
            aria-selected={!value}
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-caption font-medium transition-colors cursor-pointer ${
              !value
                ? 'bg-b-surface1 text-t-primary font-bold'
                : 'text-t-secondary hover:bg-b-highlight hover:text-t-primary'
            }`}
          >
            <span>All Plans</span>
            {!value && (
              <Icon name="check" className="!size-4 fill-primary-01" />
            )}
          </button>
          <div className="h-px bg-s-subtle my-1" />
          {ACTUAL_PLANS.map((p) => {
            const isSelected = value === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(p.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-caption font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-b-surface1 text-t-primary font-bold'
                    : 'text-t-secondary hover:bg-b-highlight hover:text-t-primary'
                }`}
              >
                <span>{p.name}</span>
                {isSelected && (
                  <Icon name="check" className="!size-4 fill-primary-01" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

