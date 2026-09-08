import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Users,
  Search,
  Sparkles,
  Lock,
  Globe,
  Film,
  Tv,
  CheckCircle2,
  Play
} from 'lucide-react';
import { movieApi } from '../api/movieApi';
import { watchPartyApi } from '../api/watchPartyApi';
import { useAuth } from '../context/AuthContext';

export default function CreateWatchPartyModal({
  isOpen,
  onClose,
  initialMovie = null
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [roomTitle, setRoomTitle] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(initialMovie);
  const [selectedEpisode, setSelectedEpisode] = useState({ name: '01', slug: 'tap-01' });
  const [isPrivate, setIsPrivate] = useState(false);
  const [pinCode, setPinCode] = useState('');

  // Movie search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Available episodes for selected movie
  const [episodesList, setEpisodesList] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  // Sync initial movie if passed
  useEffect(() => {
    if (initialMovie) {
      setSelectedMovie(initialMovie);
      setRoomTitle(`Cùng cày ${initialMovie.name} 🍿`);
    } else {
      setRoomTitle('Phòng xem phim cùng bạn bè 🍿');
    }
  }, [initialMovie, isOpen]);

  // Load episodes when a movie is selected
  useEffect(() => {
    if (!selectedMovie?.slug) return;
    let isMounted = true;

    async function fetchEpisodes() {
      setLoadingEpisodes(true);
      try {
        const detail = await movieApi.getMovieDetail(selectedMovie.slug);
        if (isMounted && detail?.movie) {
          setSelectedMovie(detail.movie);
          const eps = detail.movie.episodes?.[0]?.items || [];
          setEpisodesList(eps);
          if (eps.length > 0) {
            setSelectedEpisode(eps[0]);
          }
        }
      } catch (e) {
        console.error('Failed to fetch movie episodes:', e);
      } finally {
        if (isMounted) setLoadingEpisodes(false);
      }
    }

    fetchEpisodes();

    return () => {
      isMounted = false;
    };
  }, [selectedMovie?.slug]);

  // Live search for movies
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await movieApi.searchMovies(searchQuery);
        setSearchResults(res?.items?.slice(0, 6) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelectMovieFromSearch = (m) => {
    setSelectedMovie(m);
    setRoomTitle(`Cùng cày ${m.name} 🍿`);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!selectedMovie) return;

    const hostDisplayName = user ? user.name : 'Chủ Phòng ' + Math.floor(Math.random() * 900 + 100);
    const roomId = 'room_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4);

    const newRoom = {
      id: roomId,
      title: roomTitle.trim() || `Phòng xem ${selectedMovie.name}`,
      movieSlug: selectedMovie.slug,
      movieName: selectedMovie.name,
      moviePoster: selectedMovie.poster_url || selectedMovie.thumb_url,
      currentEpisode: selectedEpisode || { name: '01', slug: 'tap-01' },
      isPrivate,
      pinCode: isPrivate ? pinCode.trim() : null,
      hostName: hostDisplayName,
      hostId: user?.id || 'host_' + Date.now(),
      createdAt: Date.now(),
      viewersCount: 1
    };

    // Save via watchPartyApi (server + localStorage)
    watchPartyApi.createRoom(newRoom).catch(console.error);

    // Build URL with query params for 100% resilient cross-browser sharing
    const queryParams = new URLSearchParams({
      slug: newRoom.movieSlug,
      name: newRoom.movieName,
      poster: newRoom.moviePoster || '',
      ep: newRoom.currentEpisode?.slug || 'tap-01',
      epName: newRoom.currentEpisode?.name || '01',
      title: newRoom.title,
      host: newRoom.hostName
    });

    onClose();
    navigate(`/xem-chung/${roomId}?${queryParams.toString()}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-xl bg-dark-card border border-dark-border rounded-2xl shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-dark-surface via-dark-card to-dark-surface border-b border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-brand-red to-red-700 text-white shadow-md shadow-brand-red/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Tạo Phòng Xem Chung Mới
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-brand-gold text-black">
                  LIVE
                </span>
              </h3>
              <p className="text-xs text-gray-400">Xem phim đồng bộ và chat trực tiếp cùng bạn bè</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleCreateRoom} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto no-scrollbar">
          {/* 1. Tên Phòng */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Tên phòng xem chung <span className="text-brand-red">*</span>
            </label>
            <input
              type="text"
              value={roomTitle}
              onChange={(e) => setRoomTitle(e.target.value)}
              placeholder="Nhập tên phòng (vd: Xem phim cuối tuần cùng hội bạn)..."
              required
              className="w-full px-4 py-2.5 rounded-xl bg-dark-surface border border-dark-border text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
            />
          </div>

          {/* 2. Chọn Phim */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Bộ phim trình chiếu <span className="text-brand-red">*</span>
            </label>

            {/* Currently Selected Movie Card */}
            {selectedMovie ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-dark-surface border border-dark-border mb-2.5">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedMovie.poster_url || selectedMovie.thumb_url}
                    alt={selectedMovie.name}
                    className="w-12 h-16 rounded-lg object-cover bg-black border border-dark-border flex-shrink-0"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">
                      {selectedMovie.name}
                    </h4>
                    <p className="text-xs text-gray-400 line-clamp-1">
                      {selectedMovie.original_name || 'Phim HD Vietsub'}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-brand-red/20 text-brand-red border border-brand-red/30">
                      {selectedMovie.quality || 'FHD 1080p'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMovie(null)}
                  className="text-xs text-gray-400 hover:text-brand-gold underline font-semibold transition-colors flex-shrink-0"
                >
                  Đổi phim khác
                </button>
              </div>
            ) : (
              /* Movie Search Box */
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên phim bất kỳ (vd: Iruma, One Piece, Điệp Thần...)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-surface border border-dark-border text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-red"
                  />
                </div>

                {/* Autocomplete dropdown results */}
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 p-2 bg-dark-card border border-dark-border rounded-xl shadow-2xl z-30 max-h-56 overflow-y-auto no-scrollbar space-y-1">
                    {searchResults.map((item) => (
                      <div
                        key={item.slug}
                        onClick={() => handleSelectMovieFromSearch(item)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-hover cursor-pointer transition-colors"
                      >
                        <img
                          src={item.poster_url || item.thumb_url}
                          alt={item.name}
                          className="w-8 h-11 rounded object-cover bg-black"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{item.name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{item.original_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Chọn Tập Phim (Nếu có nhiều tập) */}
          {selectedMovie && episodesList.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-brand-gold" /> Chọn tập phát bắt đầu ({episodesList.length} tập):
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto pr-1 no-scrollbar">
                {episodesList.map((ep, idx) => {
                  const isChosen = selectedEpisode?.slug === ep.slug;
                  return (
                    <button
                      key={ep.slug || idx}
                      type="button"
                      onClick={() => setSelectedEpisode(ep)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all truncate text-center ${
                        isChosen
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
          )}

          {/* 4. Chế độ phòng: Công Khai / Riêng Tư */}
          <div className="pt-2 border-t border-dark-border">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Quyền riêng tư của phòng
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  !isPrivate
                    ? 'bg-brand-red/10 border-brand-red text-white'
                    : 'bg-dark-surface border-dark-border text-gray-400 hover:text-gray-200'
                }`}
              >
                <Globe className={`w-4 h-4 mt-0.5 ${!isPrivate ? 'text-brand-red' : ''}`} />
                <div>
                  <p className="text-xs font-bold">Công khai</p>
                  <p className="text-[11px] text-gray-400">Hiển thị ở sảnh, ai cũng có thể vào xem</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  isPrivate
                    ? 'bg-brand-gold/10 border-brand-gold text-white'
                    : 'bg-dark-surface border-dark-border text-gray-400 hover:text-gray-200'
                }`}
              >
                <Lock className={`w-4 h-4 mt-0.5 ${isPrivate ? 'text-brand-gold' : ''}`} />
                <div>
                  <p className="text-xs font-bold">Riêng tư</p>
                  <p className="text-[11px] text-gray-400">Cần mã PIN để tham gia</p>
                </div>
              </button>
            </div>

            {/* PIN Code input if private */}
            {isPrivate && (
              <div className="mt-3 animate-fade-in">
                <input
                  type="text"
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="Nhập mã PIN phòng (vd: 1234)..."
                  required={isPrivate}
                  className="w-full px-4 py-2 rounded-xl bg-dark-surface border border-dark-border text-white text-xs placeholder-gray-500 focus:outline-none focus:border-brand-gold"
                />
              </div>
            )}
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-dark-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-dark-surface hover:bg-dark-hover text-gray-300 text-xs font-bold transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={!selectedMovie}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-red to-red-700 hover:from-red-600 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-lg shadow-brand-red/30 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Tạo phòng xem ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
