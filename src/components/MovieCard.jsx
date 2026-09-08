import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Heart, Bookmark } from 'lucide-react';
import LiveViewersBadge from './LiveViewersBadge';
import { useWatch } from '../context/WatchContext';

export default function MovieCard({ movie, rank = null, className = '' }) {
  const { isFavorite, toggleFavorite } = useWatch();
  if (!movie) return null;

  const favorited = isFavorite(movie.slug);
  const posterUrl = movie.poster_url || movie.thumb_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80';

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(movie);
  };

  return (
    <div className={`group/card relative flex flex-col ${className}`}>
      {/* Poster Container */}
      <Link
        to={`/phim/${movie.slug}`}
        className="relative block aspect-[2/3] w-full overflow-hidden rounded-xl bg-dark-card border border-dark-border group-hover/card:border-brand-red/50 shadow-lg group-hover/card:shadow-brand-red/20 transition-all duration-300"
      >
        {/* Poster Image */}
        <img
          src={posterUrl}
          alt={movie.name}
          loading="lazy"
          className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover/card:scale-105"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80';
          }}
        />

        {/* Gradient Overlay for badges & hover effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/50 opacity-90 transition-opacity group-hover/card:opacity-100 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 z-10 pointer-events-none">
          <div className="flex flex-wrap items-center gap-1">
            {movie.quality && (
              <span className="rounded bg-brand-red px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm uppercase tracking-wider">
                {movie.quality}
              </span>
            )}
            {movie.language && (
              <span className="rounded bg-black/65 backdrop-blur-md px-1.5 py-0.5 text-[10px] font-semibold text-gray-200 border border-white/10">
                {movie.language.includes('Thuyết') ? 'Thuyết minh' : 'Vietsub'}
              </span>
            )}
          </div>
        </div>

        {/* Episode Status Badge at bottom of poster */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
          {movie.current_episode && (
            <span className="rounded-md bg-black/75 backdrop-blur-md px-2 py-0.5 text-[11px] font-medium text-amber-300 border border-amber-500/20 shadow">
              {movie.current_episode}
            </span>
          )}
          {movie.year && (
            <span className="text-[11px] font-medium text-gray-400 bg-black/60 px-1.5 py-0.5 rounded">
              {movie.year}
            </span>
          )}
        </div>

        {/* Hover Center Play Button & Favorite */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-300 bg-black/30 backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-full bg-brand-red/90 text-white flex items-center justify-center shadow-lg transform group-hover/card:scale-110 transition-transform duration-300">
            <Play className="w-6 h-6 fill-current translate-x-0.5" />
          </div>

          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-label="Yêu thích"
            className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all z-20 ${
              favorited
                ? 'bg-brand-red text-white'
                : 'bg-black/60 text-gray-300 hover:text-white hover:bg-black/80'
            }`}
          >
            <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Rank Badge for Top 10 rows */}
        {rank !== null && (
          <div className="absolute -bottom-2 -left-2 text-5xl font-black italic tracking-tighter text-white/20 group-hover/card:text-brand-red/40 select-none transition-colors drop-shadow pointer-events-none font-mono">
            {rank < 10 ? `0${rank}` : rank}
          </div>
        )}
      </Link>

      {/* Movie Information */}
      <div className="mt-2.5 flex flex-col">
        <Link
          to={`/phim/${movie.slug}`}
          title={movie.name}
          className="font-semibold text-sm text-gray-100 group-hover/card:text-brand-red transition-colors line-clamp-1 leading-snug"
        >
          {movie.name}
        </Link>
        <span className="text-xs text-gray-400 line-clamp-1 mt-0.5" title={movie.original_name}>
          {movie.original_name || movie.name}
        </span>
      </div>
    </div>
  );
}
