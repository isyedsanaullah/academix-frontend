'use client';

import { useState, useEffect } from 'react';
import Icon from '../Icon';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const [jumpInput, setJumpInput] = useState('');

  useEffect(() => {
    setJumpInput(currentPage?.toString() || '1');
  }, [currentPage]);

  if (!totalPages || totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(jumpInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    } else {
      setJumpInput(currentPage.toString());
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-b-surface2 border border-s-subtle px-5 py-3.5 rounded-3xl shadow-widget mt-5">
      <div className="text-caption text-t-secondary font-medium">
        Page <span className="text-t-blue font-bold tabular-nums">{currentPage}</span> of{' '}
        <span className="text-t-primary font-bold tabular-nums">{totalPages}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentPage === 1}
          aria-label="Previous page"
          title="Previous Page"
          className="flex items-center justify-center w-9 h-9 rounded-full border border-s-stroke2 bg-b-surface1 text-t-secondary transition hover:text-t-primary hover:border-s-highlight disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <Icon name="chevron-left" className="!size-4.5 fill-current" />
        </button>

        <div className="hidden md:flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 text-t-tertiary font-mono text-caption select-none"
                >
                  ...
                </span>
              );
            }
            const isCurrent = currentPage === p;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`w-9 h-9 rounded-full text-caption font-bold tabular-nums transition-all cursor-pointer border ${
                  isCurrent
                    ? 'bg-primary-01 text-t-light border-primary-01 shadow-widget'
                    : 'bg-b-surface1 border-s-subtle text-t-secondary hover:text-t-primary hover:border-s-highlight'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          title="Next Page"
          className="flex items-center justify-center w-9 h-9 rounded-full border border-s-stroke2 bg-b-surface1 text-t-secondary transition hover:text-t-primary hover:border-s-highlight disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <Icon name="chevron-right" className="!size-4.5 fill-current" />
        </button>

        <form
          onSubmit={handleJumpSubmit}
          className="flex items-center gap-1.5 ml-2 border-l border-s-subtle pl-3"
        >
          <span className="text-[11px] uppercase font-bold tracking-wider text-t-tertiary">
            Go to
          </span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            aria-label="Jump to page number"
            className="w-13 h-9 text-center text-caption font-bold tabular-nums bg-b-surface1 border border-s-stroke2 rounded-full text-t-primary focus:outline-none focus:border-s-focus [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="submit"
            className="px-3 h-9 text-[11px] font-bold uppercase tracking-wider bg-b-surface1 border border-s-stroke2 text-t-blue hover:bg-b-highlight transition rounded-full cursor-pointer"
          >
            Jump
          </button>
        </form>
      </div>
    </div>
  );
};

export default Pagination;
