import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { User, Heart, Clock, LogOut, Shield, Film, Trash2, Play, Sparkles, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWatch } from '../context/WatchContext';
import MovieCard from '../components/MovieCard';
import RecommendedMoviesRow from '../components/RecommendedMoviesRow';
import { formatTime } from '../utils/helpers';

export default function AccountPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'history';

  const { user, logout, openAuthModal } = useAuth();
  const {
    watchHistory,
    removeWatchProgress,
    clearWatchHistory,
    favorites,
    toggleFavorite,
    getFavoriteGenres
  } = useWatch();

  const topGenres = getFavoriteGenres(4);

  const setTab = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-red/15 text-brand-red flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Đăng Nhập Thành Viên</h2>
        <p className="text-sm text-gray-400 mb-6">
          Vui lòng đăng nhập hoặc tạo tài khoản để quản lý danh sách phim yêu thích và xem tiếp các tập phim đang dở của bạn.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => openAuthModal('login')}
            className="px-6 py-2.5 rounded-xl bg-brand-red hover:bg-brand-redHover text-white font-bold text-sm shadow-lg shadow-brand-red/20 transition-all"
          >
            Đăng nhập ngay
          </button>
          <button
            onClick={() => openAuthModal('register')}
            className="px-6 py-2.5 rounded-xl bg-dark-card border border-dark-border hover:border-brand-gold text-gray-200 font-bold text-sm transition-all"
          >
            Tạo tài khoản mới
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header Banner */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 shadow-xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-20 h-20 rounded-full border-2 border-brand-red shadow-lg bg-dark-surface"
          />
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-white">{user.name}</h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-brand-gold text-black">
                VIP MEMBER
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{user.email}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Tham gia từ: {user.joinedDate || '2026'}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-surface hover:bg-red-500/10 border border-dark-border hover:border-red-500/40 text-red-400 text-xs font-semibold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-dark-border mb-8 gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setTab('history')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all flex-shrink-0 ${
            activeTab === 'history'
              ? 'border-brand-red text-brand-red'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Phim Đang Xem ({watchHistory.length})</span>
        </button>

        <button
          onClick={() => setTab('favorites')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all flex-shrink-0 ${
            activeTab === 'favorites'
              ? 'border-brand-red text-brand-red'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Phim Yêu Thích ({favorites.length})</span>
        </button>

        <button
          onClick={() => setTab('recommendations')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all flex-shrink-0 ${
            activeTab === 'recommendations'
              ? 'border-brand-red text-brand-red'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-brand-gold" />
          <span>Gợi Ý Dành Riêng Cho Bạn</span>
        </button>
      </div>

      {/* Taste Summary Banner if user has watched movies */}
      {topGenres.length > 0 && activeTab === 'history' && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-dark-card via-dark-card to-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-brand-gold border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                Gu Phim Của Bạn:
              </h4>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {topGenres.map((g) => (
                  <span
                    key={g.slug}
                    className="text-xs font-semibold px-2 py-0.5 rounded-md bg-dark-surface text-amber-300 border border-amber-500/30"
                  >
                    {g.name} ({g.count} phim)
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTab('recommendations')}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold shadow transition-colors flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            Xem Phim Đề Xuất
          </button>
        </div>
      )}

      {/* Tab 1: Continue Watching / Watch History */}
      {activeTab === 'history' && (
        <div>
          {watchHistory.length > 0 ? (
            <>
              <div className="flex justify-end mb-4">
                <button
                  onClick={clearWatchHistory}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa toàn bộ lịch sử</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {watchHistory.map((item) => {
                  const watchUrl = `/phim/${item.slug}?tap=${item.episodeSlug || 'tap-1'}&t=${item.currentTime || 0}`;
                  return (
                    <div
                      key={item.slug}
                      className="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-lg hover:border-brand-red/40 transition-all flex flex-col"
                    >
                      <div className="relative aspect-video w-full bg-black">
                        <img
                          src={item.thumb_url || item.poster_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-2 text-xs font-bold text-amber-300">
                          {item.episodeName || 'Tập 1'} {item.currentTime > 0 ? `• ${formatTime(item.currentTime)}` : ''}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-gray-800 h-1">
                        <div
                          className="bg-brand-red h-full"
                          style={{ width: `${Math.max(10, item.percent || 0)}%` }}
                        />
                      </div>

                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <h3 className="font-bold text-sm text-white line-clamp-1 mb-2">
                          {item.name}
                        </h3>

                        <div className="flex items-center justify-between pt-2 border-t border-dark-border/60">
                          <button
                            type="button"
                            onClick={() => removeWatchProgress(item.slug)}
                            className="text-xs text-gray-500 hover:text-red-400"
                          >
                            Xóa
                          </button>
                          <Link
                            to={watchUrl}
                            className="inline-flex items-center gap-1 text-xs font-bold text-brand-gold hover:text-amber-300"
                          >
                            Tiếp tục xem <Play className="w-3 h-3 fill-current" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-dark-card rounded-2xl border border-dark-border">
              <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Chưa có phim đang xem</h3>
              <p className="text-xs text-gray-400 mb-6">
                Khi bạn mở xem một bộ phim, hệ thống sẽ tự động lưu lại tiến trình xem để bạn có thể tiếp tục xem dở bất cứ lúc nào.
              </p>
              <Link
                to="/"
                className="px-5 py-2.5 rounded-xl bg-brand-red text-white text-xs font-bold"
              >
                Khám phá phim ngay
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Favorites */}
      {activeTab === 'favorites' && (
        <div>
          {favorites.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
              {favorites.map((movie) => (
                <MovieCard key={movie.slug} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-dark-card rounded-2xl border border-dark-border">
              <Heart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Chưa có phim yêu thích</h3>
              <p className="text-xs text-gray-400 mb-6">
                Nhấn vào biểu tượng trái tim trên bất kỳ poster phim nào để lưu phim vào danh sách này.
              </p>
              <Link
                to="/phim-le"
                className="px-5 py-2.5 rounded-xl bg-brand-red text-white text-xs font-bold"
              >
                Xem danh sách phim
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Recommendations based on watched genres */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6 animate-fade-in">
          <RecommendedMoviesRow title="Phim Đề Xuất Dựa Trên Gu Thể Loại Của Bạn" />
        </div>
      )}
    </div>
  );
}
