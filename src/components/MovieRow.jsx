import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import MovieCard from './MovieCard';

export default function MovieRow({
  title,
  subtitle,
  movies = [],
  viewAllLink,
  isTopRank = false,
  icon: Icon = null,
  loading = false,
  className = ''
}) {
  const rowRef = useRef(null);

  const scroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      rowRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className={`my-8 relative ${className}`}>
      {/* Row Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="p-1.5 rounded-lg bg-brand-gold/15 text-brand-gold">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-wide flex items-center gap-2">
              {title}
              {isTopRank && (
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-red text-white">
                  HOT TOP 10
                </span>
              )}
            </h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View all link */}
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="text-xs md:text-sm font-semibold text-gray-400 hover:text-brand-gold transition-colors flex items-center gap-1 mr-2"
            >
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          )}

          {/* Nav scroll buttons */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              aria-label="Cuộn sang trái"
              className="p-1.5 rounded-full bg-dark-card border border-dark-border text-gray-300 hover:text-white hover:border-brand-red transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Cuộn sang phải"
              className="p-1.5 rounded-full bg-dark-card border border-dark-border text-gray-300 hover:text-white hover:border-brand-red transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Movies Row Container */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col">
              <div className="aspect-[2/3] w-full rounded-xl bg-dark-card border border-dark-border"></div>
              <div className="mt-2.5 h-4 w-3/4 bg-dark-card rounded"></div>
              <div className="mt-1 h-3 w-1/2 bg-dark-card rounded"></div>
            </div>
          ))}
        </div>
      ) : movies && movies.length > 0 ? (
        <div
          ref={rowRef}
          className="flex gap-3.5 md:gap-4 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth"
        >
          {movies.map((movie, idx) => (
            <div
              key={movie.slug || idx}
              className="flex-shrink-0 w-[145px] sm:w-[170px] md:w-[195px] lg:w-[210px]"
            >
              <MovieCard movie={movie} rank={isTopRank ? idx + 1 : null} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 text-sm">
          Chưa có dữ liệu phim cho danh mục này
        </div>
      )}
    </section>
  );
}
