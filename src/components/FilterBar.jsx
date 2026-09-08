import React from 'react';
import { Filter, X } from 'lucide-react';
import { GENRES, COUNTRIES, YEARS } from '../api/movieApi';

export default function FilterBar({
  selectedGenre,
  onSelectGenre,
  selectedCountry,
  onSelectCountry,
  selectedYear,
  onSelectYear,
  onReset
}) {
  const hasActiveFilter = Boolean(selectedGenre || selectedCountry || selectedYear);

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-4 mb-8 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-dark-border">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Filter className="w-4 h-4 text-brand-red" />
          <span>Bộ Lọc Phim</span>
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Xóa bộ lọc</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Genre Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Thể loại
          </label>
          <select
            value={selectedGenre || ''}
            onChange={(e) => onSelectGenre(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-dark-surface border border-dark-border rounded-lg text-gray-200 focus:outline-none focus:border-brand-red"
          >
            <option value="">Tất cả thể loại</option>
            {GENRES.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Country Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Quốc gia
          </label>
          <select
            value={selectedCountry || ''}
            onChange={(e) => onSelectCountry(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-dark-surface border border-dark-border rounded-lg text-gray-200 focus:outline-none focus:border-brand-red"
          >
            <option value="">Tất cả quốc gia</option>
            {COUNTRIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Year Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Năm phát hành
          </label>
          <select
            value={selectedYear || ''}
            onChange={(e) => onSelectYear(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-dark-surface border border-dark-border rounded-lg text-gray-200 focus:outline-none focus:border-brand-red"
          >
            <option value="">Tất cả các năm</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
