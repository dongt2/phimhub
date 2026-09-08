import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Heart,
  Share2,
  Tv,
  Server,
  Star,
  Clock,
  Calendar,
  Globe,
  Film,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Users
} from 'lucide-react';
import { movieApi } from '../api/movieApi';
import { useWatch } from '../context/WatchContext';
import LiveViewersBadge from '../components/LiveViewersBadge';
import MovieCard from '../components/MovieCard';
import MovieReviewSection from '../components/MovieReviewSection';
import CreateWatchPartyModal from '../components/CreateWatchPartyModal';
import CustomVideoPlayer from '../components/CustomVideoPlayer';
import { formatTime, getGenreSlug } from '../utils/helpers';

export default function WatchMoviePage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { saveWatchProgress, getWatchProgress, isFavorite, toggleFavorite } = useWatch();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Server & Episode selection
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);
  const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState(0);

  // Theater / Cinema mode
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [isLightsOff, setIsLightsOff] = useState(false);
  const [isWatchPartyModalOpen, setIsWatchPartyModalOpen] = useState(false);

  // Resume prompt state
  const [savedProgress, setSavedProgress] = useState(null);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [playerInitialTime, setPlayerInitialTime] = useState(0);

  // Related movies
  const [relatedMovies, setRelatedMovies] = useState([]);

  // Fetch movie details
  useEffect(() => {
    let isMounted = true;
    setSelectedServerIndex(0);
    setSelectedEpisodeIndex(0);
    async function loadMovieDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await movieApi.getMovieDetail(slug);
        if (isMounted) {
          if (res && res.movie) {
            setMovie(res.movie);

            // Check if there was previously saved progress for this movie
            const progress = getWatchProgress(slug);
            if (progress) {
              setSavedProgress(progress);
              setShowResumeBanner(true);
            }

            // Find episode from query param ?tap=
            const tapParam = searchParams.get('tap');
            const targetItems = res.movie.episodes?.[0]?.items;
            if (tapParam && targetItems) {
              const epIdx = targetItems.findIndex(
                (item) =>
                  item.slug === tapParam ||
                  item.name === tapParam ||
                  parseInt(item.name, 10) === parseInt(tapParam, 10)
              );
              if (epIdx !== -1) {
                setSelectedEpisodeIndex(epIdx);
              }
            } else if (progress && progress.episodeSlug && targetItems) {
              // Optionally select the last watched episode
              const epIdx = targetItems.findIndex(
                (item) =>
                  item.slug === progress.episodeSlug ||
                  item.name === progress.episodeSlug ||
                  parseInt(item.name, 10) === parseInt(progress.episodeSlug, 10)
              );
              if (epIdx !== -1) {
                setSelectedEpisodeIndex(epIdx);
              }
            }
            // Also fetch some related movies by genre
            const rawGenres = res.movie.category?.['2']?.list || [];
            const movieGenres = rawGenres.map((g) => ({
              name: g.name,
              slug: getGenreSlug(g.name)
            }));
            loadRelated(movieGenres);
          } else {
            setError('Không tìm thấy thông tin phim này.');
          }
        }
      } catch (err) {
        if (isMounted) setError('Không thể kết nối đến máy chủ phim.');
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMovieDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fetch related movies by genre or fallback to new movies
    async function loadRelated(genresList = []) {
      try {
        let rel = null;
        if (genresList.length > 0 && genresList[0]?.slug) {
          rel = await movieApi.getMoviesByGenre(genresList[0].slug, 1);
        }
        if (!rel?.items || rel.items.length === 0) {
          rel = await movieApi.getNewUpdatedMovies(1);
        }
        if (isMounted && rel?.items) {
          setRelatedMovies(rel.items.filter((m) => m.slug !== slug).slice(0, 6));
        }
      } catch (e) {
        console.error(e);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const episodesList = movie?.episodes?.[selectedServerIndex]?.items || [];
  const currentEpisode = episodesList[selectedEpisodeIndex] || episodesList[0];

  // Auto-save watch progress periodically or on episode change (including genres for personalized recommendations)
  useEffect(() => {
    if (!movie || !currentEpisode) return;

    const movieGenres = (movie.category?.['2']?.list || []).map((g) => ({
      name: g.name,
      slug: getGenreSlug(g.name)
    }));

    // Save progress to WatchContext
    saveWatchProgress({
      slug: movie.slug,
      name: movie.name,
      original_name: movie.original_name,
      thumb_url: movie.thumb_url,
      poster_url: movie.poster_url,
      quality: movie.quality,
      year: movie.year,
      genres: movieGenres,
      episodeSlug: currentEpisode.slug,
      episodeName: `Tập ${currentEpisode.name}`,
      currentTime: savedProgress?.currentTime || 120, // default placeholder or tracked seconds
      duration: 2700 // default ~45 mins
    });
  }, [movie?.slug, selectedEpisodeIndex]);

  // Handle episode select
  const handleSelectEpisode = (index) => {
    setSelectedEpisodeIndex(index);
    setPlayerInitialTime(0);
    setShowResumeBanner(false);
    const ep = episodesList[index];
    if (ep) {
      setSearchParams({ tap: ep.slug });
    }
  };

  // Reload player key
  const [reloadKey, setReloadKey] = useState(0);

  // Resume playback action
  const handleResume = () => {
    setShowResumeBanner(false);
    if (savedProgress?.episodeSlug) {
      const epIdx = episodesList.findIndex((item) => item.slug === savedProgress.episodeSlug);
      if (epIdx !== -1) {
        setSelectedEpisodeIndex(epIdx);
      }
    }
    if (savedProgress?.currentTime) {
      setPlayerInitialTime(savedProgress.currentTime);
    }
  };

  // Realtime time tracking from video player
  const handleTimeUpdate = (current, dur) => {
    if (!movie || !currentEpisode) return;
    const movieGenres = (movie.category?.['2']?.list || []).map((g) => ({
      name: g.name,
      slug: getGenreSlug(g.name)
    }));

    saveWatchProgress({
      slug: movie.slug,
      name: movie.name,
      original_name: movie.original_name,
      thumb_url: movie.thumb_url,
      poster_url: movie.poster_url,
      quality: movie.quality,
      year: movie.year,
      genres: movieGenres,
      episodeSlug: currentEpisode.slug,
      episodeName: `Tập ${currentEpisode.name}`,
      currentTime: current,
      duration: dur || 2700
    });
  };

  // Handle next episode when ended
  const handleVideoEnded = () => {
    if (selectedEpisodeIndex < episodesList.length - 1) {
      handleSelectEpisode(selectedEpisodeIndex + 1);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="aspect-video w-full rounded-2xl bg-dark-card border border-dark-border animate-pulse mb-6" />
        <div className="h-8 w-1/3 bg-dark-card rounded mb-4 animate-pulse" />
        <div className="h-4 w-2/3 bg-dark-card rounded animate-pulse" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-brand-red mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">{error || 'Không tìm thấy phim'}</h2>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-red text-white font-semibold text-sm"
        >
          Quay lại Trang Chủ
        </Link>
      </div>
    );
  }

  const favorited = isFavorite(movie.slug);
  const currentServerName = movie.episodes?.[selectedServerIndex]?.server_name || 'Server VIP';

  return (
    <div className={`transition-all duration-300 ${isLightsOff ? 'bg-black' : ''}`}>
      {/* Lights Off Overlay */}
      {isLightsOff && (
        <div
          className="fixed inset-0 bg-black/90 z-30 transition-opacity"
          onClick={() => setIsLightsOff(false)}
        />
      )}

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative ${isLightsOff ? 'z-40' : ''}`}>
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 overflow-x-auto no-scrollbar">
          <Link to="/" className="hover:text-white transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/phim-bo" className="hover:text-white transition-colors">Xem phim</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-200 font-medium truncate">{movie.name}</span>
        </div>

        {/* Server Quality Guide Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs bg-dark-card border border-dark-border px-4 py-2.5 rounded-xl mb-3">
          <div className="flex items-center gap-2 text-gray-300">
            <span className={`w-2 h-2 rounded-full ${currentServerName.includes('VIP') ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`}></span>
            <span>
              Đang phát qua: <strong className="text-white">{currentServerName}</strong>
              {currentServerName.includes('VIP') && (
                <span className="ml-2 text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  ⚡ 1080p FHD Cực Mượt
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="text-xs text-gray-400 hover:text-white underline transition-colors"
            >
              Tải lại player
            </button>
            {currentEpisode?.m3u8 && (
              <>
                <span className="text-gray-600">•</span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Native HLS 1080p
                </span>
              </>
            )}
            {currentEpisode?.embed && (
              <>
                <span className="text-gray-600">•</span>
                <a
                  href={currentEpisode.embed}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-gold hover:text-amber-300 underline font-semibold transition-colors"
                >
                  Mở link nhúng ↗
                </a>
              </>
            )}
          </div>
        </div>

        {/* Cảnh báo gợi ý chuyển Server VIP khi đang ở Server NguonC */}
        {!currentServerName.includes('VIP') && movie.episodes?.some((srv) => srv.server_name.includes('VIP')) && (
          <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shadow-md">
            <div className="flex items-start sm:items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5 sm:mt-0" />
              <span>
                Bạn đang xem qua Server NguonC (iFrame). Khuyên bạn nên chuyển sang <strong>Server VIP</strong> để phát trực tiếp bằng Native HLS Player mượt mà, không quảng cáo và không lỗi script.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const vipIdx = movie.episodes.findIndex((s) => s.server_name.includes('VIP'));
                if (vipIdx !== -1) setSelectedServerIndex(vipIdx);
              }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow flex items-center gap-1.5 flex-shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              Chuyển sang Server VIP ngay
            </button>
          </div>
        )}

        {/* Resume Banner Notification if previous progress exists */}
        {showResumeBanner && savedProgress && (
          <div className="mb-4 p-3.5 rounded-xl bg-brand-red/15 border border-brand-red/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-200">
              <span className="p-1 rounded-full bg-brand-red text-white flex-shrink-0">
                <RotateCcw className="w-3.5 h-3.5" />
              </span>
              <span>
                Bạn đã xem dở <strong className="text-white">{savedProgress.episodeName}</strong> (khoảng{' '}
                <strong className="text-brand-gold">{formatTime(savedProgress.currentTime)}</strong>).
                Bạn có muốn tiếp tục xem không?
              </span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleResume}
                className="px-3.5 py-1.5 rounded-lg bg-brand-red hover:bg-brand-redHover text-white text-xs font-bold transition-colors shadow"
              >
                Tiếp tục xem
              </button>
              <button
                type="button"
                onClick={() => setShowResumeBanner(false)}
                className="px-3 py-1.5 rounded-lg bg-dark-card hover:bg-dark-hover text-gray-300 text-xs font-semibold border border-dark-border"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        )}

        {/* Video Player Container */}
        <div
          className={`relative rounded-2xl overflow-hidden bg-black border border-dark-border shadow-2xl transition-all duration-300 ${
            isCinemaMode ? 'w-full ring-2 ring-brand-red/30' : 'aspect-video w-full'
          }`}
          style={isCinemaMode ? { height: 'min(78vh, 720px)' } : {}}
        >
          {currentEpisode ? (
            <CustomVideoPlayer
              key={`${selectedServerIndex}-${selectedEpisodeIndex}-${reloadKey}`}
              m3u8={currentEpisode.m3u8}
              embed={currentEpisode.embed}
              title={`${movie.name} - Tập ${currentEpisode.name}`}
              poster={movie.poster_url || movie.thumb_url}
              initialTime={playerInitialTime}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              autoPlay={true}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
              <Film className="w-12 h-12 text-gray-600 mb-3" />
              <p>Chưa có nguồn phát cho tập này hoặc đang cập nhật.</p>
            </div>
          )}
        </div>

        {/* Player Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 bg-dark-card rounded-xl border border-dark-border mt-3 shadow-md">
          {/* Left: Current Episode */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse"></span>
              Đang phát: {currentEpisode ? `Tập ${currentEpisode.name}` : 'Tập 1'}
            </span>
          </div>

          {/* Right: Player utility buttons */}
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-dark-surface border-dark-border text-gray-300 hover:text-white transition-colors"
              title="Tải lại trình phát video"
            >
              <span>Tải lại</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCinemaMode(!isCinemaMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                isCinemaMode
                  ? 'bg-brand-gold/20 border-brand-gold text-brand-gold font-bold'
                  : 'bg-dark-surface border-dark-border text-gray-300 hover:text-white'
              }`}
            >
              {isCinemaMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isCinemaMode ? 'Thu nhỏ rạp' : 'Mở rộng rạp'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLightsOff(!isLightsOff)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                isLightsOff
                  ? 'bg-brand-red text-white font-bold'
                  : 'bg-dark-surface border-dark-border text-gray-300 hover:text-white'
              }`}
            >
              <span>{isLightsOff ? 'Bật đèn' : 'Tắt đèn'}</span>
            </button>
          </div>
        </div>

        {/* Server & Episode Selector */}
        <div className="my-6 p-4 sm:p-6 bg-dark-card border border-dark-border rounded-2xl shadow-xl">
          {/* Server Switcher */}
          {movie.episodes && movie.episodes.length > 1 && (
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-dark-border">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-4 h-4 text-brand-red" /> Chọn Server:
              </span>
              <div className="flex flex-wrap gap-2">
                {movie.episodes.map((srv, sIdx) => {
                  const isVIP = srv.server_name.includes('VIP');
                  return (
                    <button
                      key={sIdx}
                      onClick={() => {
                        const currentEpName = currentEpisode?.name;
                        setSelectedServerIndex(sIdx);
                        const newEpList = movie?.episodes?.[sIdx]?.items || [];
                        const matchIdx = newEpList.findIndex(
                          (e) => e.name === currentEpName || parseInt(e.name, 10) === parseInt(currentEpName, 10)
                        );
                        if (matchIdx !== -1) {
                          setSelectedEpisodeIndex(matchIdx);
                        } else if (selectedEpisodeIndex >= newEpList.length) {
                          setSelectedEpisodeIndex(0);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        selectedServerIndex === sIdx
                          ? isVIP
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md font-extrabold'
                            : 'bg-brand-red text-white shadow-md'
                          : 'bg-dark-surface text-gray-300 hover:text-white border border-dark-border'
                      }`}
                    >
                      {isVIP && <Sparkles className="w-3.5 h-3.5 fill-current" />}
                      <span>{srv.server_name || `Server #${sIdx + 1}`}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Episode List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tv className="w-4 h-4 text-brand-gold" /> Danh Sách Tập Phim ({episodesList.length} tập):
              </span>
              <span className="text-xs text-gray-500">
                Đã chọn tập {currentEpisode?.name || '1'}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 max-h-56 overflow-y-auto pr-1">
              {episodesList.map((ep, idx) => {
                const isActive = idx === selectedEpisodeIndex;
                return (
                  <button
                    key={ep.slug || idx}
                    type="button"
                    onClick={() => handleSelectEpisode(idx)}
                    className={`py-2 px-1 rounded-lg text-xs font-bold transition-all truncate text-center ${
                      isActive
                        ? 'bg-brand-red text-white shadow-md shadow-brand-red/30 scale-105'
                        : 'bg-dark-surface hover:bg-dark-hover text-gray-300 hover:text-white border border-dark-border'
                    }`}
                  >
                    {ep.name.startsWith('Tập') ? ep.name : `Tập ${ep.name}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Movie Info & Storyline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-8">
          {/* Left / Center 2 Cols: Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {movie.name}
              </h1>
              <p className="text-sm text-gray-400 mt-1 font-medium">
                {movie.original_name} {movie.year ? `• (${movie.year})` : ''}
              </p>
            </div>

            {/* Quick meta badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {movie.quality && (
                <span className="px-2.5 py-1 rounded bg-brand-red text-white font-bold uppercase">
                  {movie.quality}
                </span>
              )}
              {movie.language && (
                <span className="px-2.5 py-1 rounded bg-dark-card border border-dark-border text-gray-300 font-semibold">
                  {movie.language}
                </span>
              )}
              {movie.time && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-dark-card border border-dark-border text-gray-300">
                  <Clock className="w-3.5 h-3.5 text-gray-400" /> {movie.time}
                </span>
              )}
              {movie.year && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-dark-card border border-dark-border text-gray-300">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" /> {movie.year}
                </span>
              )}

              <button
                type="button"
                onClick={() => toggleFavorite(movie)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-semibold transition-colors ${
                  favorited
                    ? 'bg-brand-red/20 border-brand-red text-red-400'
                    : 'bg-dark-card border-dark-border text-gray-300 hover:text-white'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-current text-brand-red' : ''}`} />
                <span>{favorited ? 'Đã yêu thích' : 'Yêu thích'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsWatchPartyModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-brand-red to-orange-600 hover:from-red-600 hover:to-orange-500 text-white font-bold transition-all shadow-md shadow-brand-red/25 hover:scale-105 active:scale-95"
                title="Tạo phòng xem chung phim này cùng bạn bè"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Xem chung</span>
              </button>
            </div>

            {/* Description */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 shadow-lg">
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Film className="w-4 h-4 text-brand-red" /> Nội Dung Phim
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed text-justify font-light">
                {movie.description || 'Nội dung phim đang được cập nhật.'}
              </p>
            </div>
          </div>

          {/* Right Col: Poster & Metadata Table */}
          <div className="space-y-6">
            <div className="relative aspect-[2/3] max-w-[260px] mx-auto rounded-2xl overflow-hidden border border-dark-border shadow-xl">
              <img
                src={movie.poster_url || movie.thumb_url}
                alt={movie.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="bg-dark-card border border-dark-border rounded-2xl p-5 text-xs space-y-3">
              <div className="flex justify-between pb-2 border-b border-dark-border/60">
                <span className="text-gray-400">Đạo diễn:</span>
                <span className="font-semibold text-gray-200 text-right">
                  {movie.director || 'Đang cập nhật'}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-dark-border/60">
                <span className="text-gray-400">Diễn viên:</span>
                <span className="font-semibold text-gray-200 text-right max-w-[170px] truncate">
                  {movie.casts || 'Đang cập nhật'}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-dark-border/60">
                <span className="text-gray-400">Tổng số tập:</span>
                <span className="font-semibold text-amber-400">
                  {movie.total_episodes || movie.current_episode || '1'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tình trạng:</span>
                <span className="font-semibold text-emerald-400">
                  {movie.current_episode || 'FULL'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Movie Ratings & Comments Discussion Section */}
        <MovieReviewSection movie={movie} currentEpisode={currentEpisode} />

        {/* Related movies */}
        {relatedMovies.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-brand-gold" />
              <h2 className="text-xl font-bold text-white">Có Thể Bạn Cũng Thích</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedMovies.map((m) => (
                <MovieCard key={m.slug} movie={m} />
              ))}
            </div>
          </div>
        )}
        {/* Create Watch Party Modal */}
        <CreateWatchPartyModal
          isOpen={isWatchPartyModalOpen}
          onClose={() => setIsWatchPartyModalOpen(false)}
          initialMovie={movie}
        />
      </div>
    </div>
  );
}
