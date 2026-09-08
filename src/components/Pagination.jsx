import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages = 10, onPageChange }) {
  if (totalPages <= 1) return null;

  // Build page numbers around current page
  const getPages = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1.5 my-10">
      {/* Previous Button */}
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="p-2 rounded-lg bg-dark-card border border-dark-border text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand-red transition-colors"
        aria-label="Trang trước"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Pages */}
      {getPages().map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`w-9 h-9 rounded-lg text-xs sm:text-sm font-bold transition-all ${
            page === currentPage
              ? 'bg-brand-red text-white shadow-md shadow-brand-red/30'
              : 'bg-dark-card border border-dark-border text-gray-300 hover:text-white hover:border-brand-red/50'
          }`}
        >
          {page}
        </button>
      ))}

      {/* Next Button */}
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="p-2 rounded-lg bg-dark-card border border-dark-border text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand-red transition-colors"
        aria-label="Trang kế"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
