import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Share2,
  ChevronLeft,
  Copy,
  Check,
  Film,
  Tv,
  Crown,
  Lock,
  Unlock,
  AlertCircle,
  Radio,
  Play,
  Volume2,
  Sparkles,
  Info
} from 'lucide-react';
import { movieApi } from '../api/movieApi';
import { watchPartyApi } from '../api/watchPartyApi';
import { useAuth } from '../context/AuthContext';
import YouTubeLiveChat from '../components/YouTubeLiveChat';
import CustomVideoPlayer from '../components/CustomVideoPlayer';

export default function WatchPartyRoomPage() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Room metadata
  const [room, setRoom] = useState(null);
  const [movieDetail, setMovieDetail] = useState(null);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Private PIN gate
  const [pinInput, setPinInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState('');

  // UI state
  const [copiedLink, setCopiedLink] = useState(false);

  // Load room information via watchPartyApi (server + URL params + local fallback)
  useEffect(() => {
    let isMounted = true;

    async function loadRoomData() {
      setLoading(true);
      setError(null);

      const querySlug = searchParams.get('slug');
      const fallbackParams = querySlug ? {
        movieSlug: querySlug,
        movieName: searchParams.get('name') || querySlug,
        moviePoster: searchParams.get('poster') || '',
        epSlug: searchParams.get('ep') || 'tap-01',
        epName: searchParams.get('epName') || '01',
        title: searchParams.get('title') || '',
        hostName: searchParams.get('host') || 'Chủ Phòng'
      } : null;

      try {
        const found = await watchPartyApi.getRoom(roomId, fallbackParams);
        if (isMounted) {
          if (found) {
            setRoom(found);
            setCurrentEpisode(found.currentEpisode);
            if (!found.isPrivate) {
              setIsUnlocked(true);
            }
          } else {
            setError('Không tìm thấy phòng xem chung này hoặc liên kết không hợp lệ.');
          }
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setError('Lỗi khi tải dữ liệu phòng.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRoomData();

    return () => {
      isMounted = false;
    };
  }, [roomId, searchParams]);

  // Load movie detail from API once room is known
  useEffect(() => {
    if (!room?.movieSlug) return;
    let isMounted = true;

    async function fetchDetail() {
      setLoading(true);
      try {
        const res = await movieApi.getMovieDetail(room.movieSlug);
        if (isMounted && res?.movie) {
          setMovieDetail(res.movie);
          // Verify episode exists
          const eps = res.movie.episodes?.[0]?.items || [];
          if (eps.length > 0 && !currentEpisode) {
            setCurrentEpisode(eps[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load movie details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [room?.movieSlug]);

  // Realtime room synchronization via SSE + BroadcastChannel
  useEffect(() => {
    if (!roomId) return;

    const cleanup = watchPartyApi.connectEvents(roomId, (event) => {
      if (event.type === 'SYNC_EPISODE' && event.payload?.episode) {
        setCurrentEpisode(event.payload.episode);
      }
    });

    return cleanup;
  }, [roomId]);

  // Handle Episode Selection
  const handleSelectEpisode = (ep) => {
    setCurrentEpisode(ep);

    // Update in room state & server
    if (room) {
      const updated = { ...room, currentEpisode: ep };
      setRoom(updated);
      watchPartyApi.createRoom(updated).catch(() => {});
    }

    // Broadcast episode sync across all connected clients
    watchPartyApi.syncEpisode(roomId, ep, user?.name || room?.hostName);
  };

  // Handle Share Link Copy (includes query params so any browser can open without desync)
  const handleCopyLink = () => {
    if (!room) return;
    const shareUrl = watchPartyApi.generateShareUrl(room, currentEpisode);
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Handle Private PIN Unlock
  const handleUnlockPin = (e) => {
    e.preventDefault();
    if (room?.pinCode && pinInput.trim() !== room.pinCode) {
      setPinError('Mã PIN không chính xác. Vui lòng hỏi chủ phòng.');
      return;
    }
    setIsUnlocked(true);
    setPinError('');
  };

  const isHost = Boolean(user && (user.id === room?.hostId || user.name === room?.hostName));

  // Determine current active episode video URL (Server VIP HLS Embed)
  const episodesList = movieDetail?.episodes?.[0]?.items || [];
  const activeEp =
    episodesList.find((e) => e.slug === currentEpisode?.slug) ||
    episodesList[0] ||
    currentEpisode;
  const embedUrl = activeEp?.embed || '';

  // Error screen if room does not exist
  if (error || (!loading && !room)) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-brand-red mx-auto" />
          <h2 className="text-lg font-bold text-white">Không tìm thấy phòng xem chung</h2>
          <p className="text-xs text-gray-400">
            {error || 'Phòng này có thể đã kết thúc hoặc liên kết không chính xác.'}
          </p>
          <Link
            to="/xem-chung"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-red text-white text-xs font-bold hover:bg-brand-redHover transition-colors"
          >
            Quay lại sảnh phòng
          </Link>
        </div>
      </div>
    );
  }

  // Private PIN Gate screen
  if (room?.isPrivate && !isUnlocked) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-scale-up">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Phòng Xem Chung Riêng Tư</h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Phòng &ldquo;{room?.title}&rdquo; được bảo vệ bằng mã PIN. Hãy nhập mã PIN được chia sẻ từ chủ phòng để tham gia.
            </p>
          </div>

          <form onSubmit={handleUnlockPin} className="space-y-4">
            <input
              type="text"
              placeholder="Nhập mã PIN 4-6 số..."
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError('');
              }}
              className="w-full text-center tracking-widest text-lg font-mono font-bold py-3 bg-dark-bg border border-dark-border rounded-xl text-white focus:outline-none focus:border-brand-red"
              maxLength={8}
              autoFocus
            />

            {pinError && (
              <p className="text-xs text-red-400 flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{pinError}</span>
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/xem-chung')}
                className="flex-1 py-2.5 rounded-xl border border-dark-border text-gray-300 hover:bg-dark-hover text-xs font-semibold"
              >
                Quay lại sảnh
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-brand-red hover:bg-brand-redHover text-white text-xs font-bold shadow-lg shadow-brand-red/30"
              >
                Vào phòng
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-gray-100 flex flex-col">
      {/* Top Breadcrumb & Room Header */}
      <div className="bg-[#141419] border-b border-dark-border px-4 py-2.5 sm:px-6">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-4">
          {/* Back & Room Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/xem-chung"
              className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Sảnh phòng</span>
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-black uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>LIVE</span>
                </span>
                <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md md:max-w-xl">
                  {room?.title || 'Phòng Xem Chung'}
                </h1>
              </div>
              <p className="text-[11px] text-gray-400 truncate hidden md:block">
                Phim: <strong className="text-gray-300">{room?.movieName}</strong>
                {activeEp?.name && (
                  <span className="ml-2 text-brand-gold font-semibold">
                    (Tập {activeEp.name})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons: Share link, Host badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isHost && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold">
                <Crown className="w-3.5 h-3.5" />
                <span>Bạn là Host</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-gray-200 transition-colors shadow-sm"
              title="Chia sẻ link phòng cho bạn bè"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Đã chép link!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mời bạn bè</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Arena: 2 Columns on Desktop, Stacked on Mobile */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1920px] w-full mx-auto p-2 sm:p-4 gap-3 lg:gap-4 overflow-hidden">
        {/* Left Column: Player & Episode Selector */}
        <div className="flex-1 flex flex-col min-w-0 space-y-3">
          {/* Cinema Player Container */}
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-dark-border/80">
            {activeEp && (activeEp.m3u8 || activeEp.embed) ? (
              <CustomVideoPlayer
                key={activeEp.slug || 'active-party-ep'}
                m3u8={activeEp.m3u8}
                embed={activeEp.embed}
                title={`${room?.movieName || 'Watch Party'} - Tập ${activeEp.name || ''}`}
                poster={room?.moviePoster}
                autoPlay={true}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 space-y-3 p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-spin">
                  <Play className="w-5 h-5 text-brand-red fill-brand-red ml-0.5" />
                </div>
                <p className="text-sm font-semibold text-gray-300">
                  Đang khởi tạo luồng phát Server VIP 1080p...
                </p>
                <p className="text-xs text-gray-500">
                  Vui lòng chờ trong giây lát hoặc chọn tập phim bên dưới.
                </p>
              </div>
            )}
          </div>

          {/* Episode List & Movie Details Row */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-4 space-y-4">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-dark-border">
              <div className="flex items-center gap-3">
                <img
                  src={room?.moviePoster}
                  alt={room?.movieName}
                  className="w-12 h-16 rounded-lg object-cover border border-dark-border flex-shrink-0"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                    {room?.movieName}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-gray-400 pt-0.5">
                    <span className="px-1.5 py-0.2 rounded bg-brand-red/20 text-brand-red font-bold text-[10px]">
                      SERVER VIP HLS
                    </span>
                    <span>•</span>
                    <span>Tập hiện tại: <strong className="text-brand-gold">{activeEp?.name || '01'}</strong></span>
                    <span>•</span>
                    <span>Chủ phòng: <strong className="text-gray-300">{room?.hostName}</strong></span>
                  </div>
                </div>
              </div>

              <Link
                to={`/phim/${room?.movieSlug}`}
                className="text-xs font-semibold text-gray-400 hover:text-brand-red flex items-center gap-1 transition-colors self-start sm:self-center"
              >
                <span>Xem chi tiết phim</span>
                <span>→</span>
              </Link>
            </div>

            {/* Episode selector buttons */}
            {episodesList.length > 1 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-300 flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-brand-red" />
                    <span>Chọn tập phim ({episodesList.length} tập)</span>
                  </span>
                  {isHost && (
                    <span className="text-[11px] text-amber-400">
                      ⚡ Bạn đổi tập sẽ tự động đồng bộ sang tất cả người xem
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-dark-border">
                  {episodesList.map((ep) => {
                    const isSelected = activeEp?.slug === ep.slug;
                    return (
                      <button
                        key={ep.slug}
                        type="button"
                        onClick={() => handleSelectEpisode(ep)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-brand-red text-white shadow-md shadow-brand-red/30 scale-105'
                            : 'bg-dark-bg text-gray-300 hover:bg-dark-hover border border-dark-border hover:text-white'
                        }`}
                      >
                        Tập {ep.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: YouTube Live Chat */}
        <div className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 flex flex-col h-[560px] lg:h-auto min-h-[500px]">
          <YouTubeLiveChat
            roomId={roomId}
            roomTitle={room?.title || 'Phòng Xem Chung'}
            hostName={room?.hostName || 'Chủ Phòng'}
            isHost={isHost}
          />
        </div>
      </div>
    </div>
  );
}
