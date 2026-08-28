import { useState, useEffect } from 'react';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const [jumpInput, setJumpInput] = useState('');

  useEffect(() => {
    setJumpInput(currentPage.toString());
  }, [currentPage]);

  if (totalPages <= 1) return null;

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

  // Generate page numbers array with ellipses (e.g., [1, '...', 4, 5, 6, '...', 10])
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // how many number buttons to show around current page

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
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

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/40 border border-white/5 p-4 rounded-2xl shadow-xl backdrop-blur-md mt-6">
      {/* Desktop and Mobile text summary */}
      <div className="text-xs text-slate-400 font-medium">
        Page <span className="text-indigo-400 font-bold">{currentPage}</span> of{' '}
        <span className="text-white font-bold">{totalPages}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className="flex items-center justify-center p-2 rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 transition hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900/60"
          title="Previous Page"
        >
          <HiOutlineChevronLeft size={16} />
        </button>

        {/* Page numbers: visible on larger screens, compact view on mobile */}
        <div className="hidden md:flex items-center gap-1.5">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 text-slate-500 font-mono text-xs select-none">
                  ...
                </span>
              );
            }
            return (
              <button
                key={`page-${p}`}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-xl text-xs font-bold font-mono transition-all duration-200 border ${
                  currentPage === p
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                    : 'bg-slate-900/40 border-white/5 text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="flex items-center justify-center p-2 rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 transition hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900/60"
          title="Next Page"
        >
          <HiOutlineChevronRight size={16} />
        </button>

        {/* Custom page input selector (Quick Jump) */}
        <form onSubmit={handleJumpSubmit} className="flex items-center gap-1.5 ml-2 border-l border-white/10 pl-3">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Go to</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            className="w-12 h-8 text-center text-xs font-bold font-mono bg-slate-950/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="submit"
            className="px-2.5 h-8 text-[10px] font-extrabold uppercase tracking-wider bg-slate-900 border border-white/10 text-indigo-400 hover:bg-slate-800 transition rounded-lg"
          >
            Jump
          </button>
        </form>
      </div>
    </div>
  );
};

export default Pagination;
