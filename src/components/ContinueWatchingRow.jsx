import React from 'react';
import { Link } from 'react-router-dom';
import { Play, X, Clock, History } from 'lucide-react';
import { useWatch } from '../context/WatchContext';
import { formatTime } from '../utils/helpers';

export default function ContinueWatchingRow({ showTitle = true }) {
  const { watchHistory, removeWatchProgress } = useWatch();

  if (!watchHistory || watchHistory.length === 0) {
    return null;
  }

  return (
    <section className="my-8 animate-fade-in">
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-brand-red/15 text-brand-red">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Phim Đang Xem
              </h2>
              <p className="text-xs text-gray-400">Tiếp tục xem dở các tập phim của bạn</p>
            </div>
          </div>
          <span className="text-xs text-gray-400 bg-dark-card px-2.5 py-1 rounded-full border border-dark-border">
            {watchHistory.length} phim
          </span>
        </div>
      )}

      {/* Horizontal Carousel */}
      <div className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth">
        {watchHistory.map((item) => {
          const watchUrl = `/phim/${item.slug}?tap=${item.episodeSlug || 'tap-1'}&t=${item.currentTime || 0}`;
          const poster = item.thumb_url || item.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80';

          return (
            <div
              key={item.slug}
              className="group relative flex-shrink-0 w-64 md:w-72 bg-dark-card rounded-xl border border-dark-border hover:border-brand-red/40 overflow-hidden shadow-lg transition-all duration-300 hover:shadow-brand-red/10"
            >
              {/* Image banner */}
              <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                <img
                  src={poster}
                  alt={item.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80';
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-transparent to-black/60" />

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeWatchProgress(item.slug);
                  }}
                  title="Xóa khỏi danh sách đang xem"
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-red-600 text-gray-300 hover:text-white transition-colors z-10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Center play icon */}
                <Link
                  to={watchUrl}
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[1px]"
                >
                  <div className="w-10 h-10 rounded-full bg-brand-red text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    <Play className="w-5 h-5 fill-current translate-x-0.5" />
                  </div>
                </Link>

                {/* Episode label */}
                <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5 text-xs text-amber-300 font-medium bg-black/75 px-2 py-0.5 rounded-md border border-amber-500/20">
                  <span>{item.episodeName || 'Tập 1'}</span>
                  {item.currentTime > 0 && (
                    <span className="text-gray-400">• {formatTime(item.currentTime)}</span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-800 h-1 relative overflow-hidden">
                <div
                  className="bg-brand-red h-full transition-all duration-300"
                  style={{ width: `${Math.max(8, item.percent || 0)}%` }}
                />
              </div>

              {/* Details and direct continue button */}
              <div className="p-3">
                <Link
                  to={watchUrl}
                  className="block font-semibold text-sm text-gray-100 group-hover:text-brand-red transition-colors line-clamp-1"
                  title={item.name}
                >
                  {item.name}
                </Link>

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-dark-border/60">
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-500" />
                    {item.percent ? `${item.percent}% hoàn tất` : 'Chưa xem hết'}
                  </span>

                  <Link
                    to={watchUrl}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-gold hover:text-amber-300 transition-colors"
                  >
                    Xem tiếp <Play className="w-3 h-3 fill-current" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
