import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, Heart, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import LiveViewersBadge from './LiveViewersBadge';
import { useWatch } from '../context/WatchContext';

export default function HeroSlider({ movies = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { isFavorite, toggleFavorite } = useWatch();

  // Take top 6 movies for the hero slider
  const featured = movies.slice(0, 6);

  // Auto slide every 6 seconds
  useEffect(() => {
    if (featured.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featured.length]);

  if (!featured || featured.length === 0) return null;

  const currentMovie = featured[currentIndex];
  const favorited = currentMovie ? isFavorite(currentMovie.slug) : false;
  const backdropUrl = currentMovie?.poster_url || currentMovie?.thumb_url;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % featured.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + featured.length) % featured.length);
  };

  return (
    <div className="relative w-full h-[460px] sm:h-[520px] md:h-[580px] lg:h-[640px] rounded-2xl overflow-hidden bg-dark-surface border border-dark-border shadow-2xl mb-10">
      {/* Background Backdrop with Overlays */}
      <div className="absolute inset-0">
        <img
          src={backdropUrl}
          alt={currentMovie.name}
          className="w-full h-full object-cover object-center transition-all duration-700 ease-out scale-100"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&q=80';
          }}
        />
        {/* Dark filmic gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-bg via-dark-bg/85 to-transparent w-full md:w-3/4" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/40 to-transparent" />
        <div className="absolute inset-0 bg-radial-gradient" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-8 md:px-12 flex flex-col justify-end pb-10 md:pb-16">
        <div className="max-w-2xl animate-fade-in key={currentMovie.slug}">
          {/* Top badges & Live viewers */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-gold text-black text-xs font-extrabold uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 fill-current" /> Đề xuất
            </span>
            {currentMovie.quality && (
              <span className="px-2.5 py-1 rounded-md bg-brand-red text-white text-xs font-bold uppercase tracking-wider">
                {currentMovie.quality}
              </span>
            )}
            {currentMovie.language && (
              <span className="px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md text-gray-200 text-xs font-semibold">
                {currentMovie.language}
              </span>
            )}
            {currentMovie.current_episode && (
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                {currentMovie.current_episode}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md line-clamp-2">
            {currentMovie.name}
          </h1>

          {/* Original Title & Year */}
          <p className="text-sm sm:text-base text-gray-300 font-medium mt-1 mb-3 line-clamp-1">
            {currentMovie.original_name} {currentMovie.year ? `• (${currentMovie.year})` : ''}
          </p>

          {/* Description */}
          <p className="text-xs sm:text-sm text-gray-300 line-clamp-3 mb-6 max-w-xl text-justify font-light leading-relaxed">
            {currentMovie.description || 'Xem phim online chất lượng cao miễn phí Vietsub, Thuyết minh cực nhanh trên RoPhim.'}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              to={`/phim/${currentMovie.slug}`}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-brand-red to-red-600 hover:from-brand-redHover hover:to-red-500 text-white font-bold text-xs sm:text-base shadow-lg shadow-brand-red/30 hover:shadow-brand-red/50 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              Xem Ngay
            </Link>

            <button
              type="button"
              onClick={() => toggleFavorite(currentMovie)}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl backdrop-blur-md border text-xs sm:text-sm font-semibold transition-all ${
                favorited
                  ? 'bg-brand-red/20 border-brand-red text-red-400'
                  : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
              }`}
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${favorited ? 'fill-current text-brand-red' : ''}`} />
              {favorited ? 'Đã Lưu' : 'Lưu Phim'}
            </button>

            <Link
              to={`/phim/${currentMovie.slug}`}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-dark-card/80 hover:bg-dark-card border border-dark-border text-gray-300 hover:text-white text-xs sm:text-sm font-medium transition-colors"
            >
              <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Chi tiết
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Arrows (Desktop) */}
      <button
        onClick={prevSlide}
        aria-label="Phim trước"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-brand-red text-white backdrop-blur-md border border-white/10 transition-all opacity-70 hover:opacity-100 hidden sm:flex"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Phim kế tiếp"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-brand-red text-white backdrop-blur-md border border-white/10 transition-all opacity-70 hover:opacity-100 hidden sm:flex"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Indicators Dots at bottom */}
      <div className="absolute bottom-4 right-6 sm:right-12 z-20 flex items-center gap-2">
        {featured.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Chuyển tới slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex
                ? 'w-7 bg-brand-red'
                : 'w-2 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
