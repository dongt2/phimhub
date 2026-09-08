import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, Compass, Film, Heart } from 'lucide-react';
import { useWatch } from '../context/WatchContext';
import { movieApi } from '../api/movieApi';
import MovieCard from './MovieCard';

export default function RecommendedMoviesRow({ title = 'Gợi Ý Dành Riêng Cho Bạn' }) {
  const { watchHistory, getFavoriteGenres } = useWatch();
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenreSlug, setSelectedGenreSlug] = useState('all');
  const scrollRef = useRef(null);

  // User's top favorite genres based on watch history
  const topGenres = getFavoriteGenres(4);
  const hasHistory = watchHistory && watchHistory.length > 0;

  useEffect(() => {
    let isMounted = true;

    async function loadRecommendations() {
      setLoading(true);
      try {
        let movies = [];

        if (hasHistory && topGenres.length > 0) {
          if (selectedGenreSlug === 'all') {
            // Fetch from top 1st and 2nd genres
            const [res1, res2] = await Promise.allSettled([
              movieApi.getMoviesByGenre(topGenres[0].slug, 1),
              topGenres[1] ? movieApi.getMoviesByGenre(topGenres[1].slug, 1) : Promise.resolve({ items: [] })
            ]);

            const list1 = res1.status === 'fulfilled' ? res1.value?.items || [] : [];
            const list2 = res2.status === 'fulfilled' ? res2.value?.items || [] : [];

            // Combine and deduplicate
            const map = new Map();
            [...list1, ...list2].forEach((m) => {
              if (m && m.slug && !map.has(m.slug)) map.set(m.slug, m);
            });
            movies = Array.from(map.values());
          } else {
            // Fetch specific selected genre
            const res = await movieApi.getMoviesByGenre(selectedGenreSlug, 1);
            movies = res?.items || [];
          }

          // Filter out movies the user has already watched so recommendations are fresh
          const watchedSlugs = new Set(watchHistory.map((h) => h.slug));
          const unwatched = movies.filter((m) => !watchedSlugs.has(m.slug));
          
          // If all are watched, keep original movies
          movies = unwatched.length > 0 ? unwatched : movies;
        } else {
          // If user has no history yet, recommend high-rated / new movies
          const res = await movieApi.getMoviesByCategory('phim-bo', 1);
          movies = res?.items || [];
        }

        if (isMounted) {
          setRecommendedMovies(movies.slice(0, 14));
        }
      } catch (err) {
        console.error('Failed to load recommended movies:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRecommendations();

    return () => {
      isMounted = false;
    };
  }, [hasHistory, topGenres.length, selectedGenreSlug, watchHistory.length]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -700 : 700;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (!loading && recommendedMovies.length === 0) {
    return null;
  }

  return (
    <section className="my-8 relative">
      {/* Header with Taste Badges & Genre Switcher Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-gradient-to-br from-amber-500/20 to-brand-gold/10 text-brand-gold border border-brand-gold/30">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
              {title}
            </h2>

            {hasHistory && topGenres.length > 0 ? (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                🎯 Gu của bạn: {topGenres.map((g) => g.name).slice(0, 2).join(', ')}
              </span>
            ) : (
              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-dark-card text-gray-400 border border-dark-border">
                <Compass className="w-3 h-3 text-brand-gold" /> Khám phá phim hay
              </span>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-1">
            {hasHistory && topGenres.length > 0
              ? `Tự động phân tích từ ${watchHistory.length} bộ phim bạn đã xem để đề xuất các tác phẩm tương tự.`
              : 'Xem vài bộ phim để hệ thống học thể loại yêu thích và đề xuất đúng gu của bạn!'}
          </p>
        </div>

        {/* Interactive Genre Filter Chips (if user has watched multiple genres) */}
        {hasHistory && topGenres.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => setSelectedGenreSlug('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                selectedGenreSlug === 'all'
                  ? 'bg-brand-red text-white shadow'
                  : 'bg-dark-card hover:bg-dark-hover text-gray-300 border border-dark-border'
              }`}
            >
              Tất cả gợi ý
            </button>
            {topGenres.map((genre) => (
              <button
                key={genre.slug}
                type="button"
                onClick={() => setSelectedGenreSlug(genre.slug)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex-shrink-0 flex items-center gap-1.5 ${
                  selectedGenreSlug === genre.slug
                    ? 'bg-brand-red text-white shadow font-bold'
                    : 'bg-dark-card hover:bg-dark-hover text-gray-300 border border-dark-border'
                }`}
              >
                <span>{genre.name}</span>
                <span className="text-[10px] px-1 rounded bg-black/40 text-amber-300 font-bold">
                  {genre.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Movies Row Carousel */}
      <div className="relative group/carousel">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-dark-card/90 border border-dark-border/80 text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 hover:bg-brand-red hover:border-brand-red transition-all shadow-xl backdrop-blur-sm"
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-dark-card/90 border border-dark-border/80 text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 hover:bg-brand-red hover:border-brand-red transition-all shadow-xl backdrop-blur-sm"
          aria-label="Next"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Cards Container */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scroll-smooth no-scrollbar py-2"
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-36 sm:w-44 aspect-[2/3] rounded-xl bg-dark-card border border-dark-border animate-pulse"
              />
            ))
          ) : (
            recommendedMovies.map((movie) => (
              <div key={movie.slug} className="flex-shrink-0 w-36 sm:w-44">
                <MovieCard movie={movie} />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
