import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Tv,
  Film,
  Flame,
  Search,
  Lock,
  Play,
  Sparkles,
  Eye,
  Radio,
  Clock,
  ShieldAlert
} from 'lucide-react';
import CreateWatchPartyModal from '../components/CreateWatchPartyModal';
import { watchPartyApi } from '../api/watchPartyApi';
import { useAuth } from '../context/AuthContext';



export default function WatchPartyLobbyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // all | hot | my_rooms
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Load rooms from watchPartyApi (server + local fallback)
  useEffect(() => {
    let isMounted = true;
    async function fetchRooms() {
      const data = await watchPartyApi.getAllRooms();
      if (isMounted) {
        setRooms(data);
      }
    }
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isCreateModalOpen]);

  // Filtered rooms
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.movieName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.hostName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'my_rooms') {
      return user && (room.hostId === user.id || room.hostName === user.name);
    }
    if (filterTab === 'hot') {
      return (room.viewersCount || 0) >= 5;
    }
    return true;
  });

  // Calculate live total viewers across active rooms
  const totalLiveViewers = rooms.reduce((acc, r) => acc + (r.viewersCount || 1), 0);

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 pb-20">
      {/* Top Banner Hero */}
      <div className="relative overflow-hidden border-b border-dark-border bg-gradient-to-b from-red-950/40 via-dark-bg to-dark-bg pt-8 pb-12 md:pt-10 md:pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600/15 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-brand-red text-xs font-bold uppercase tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span>Phòng Xem Phim Trực Tuyến RoPhim Live</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Xem Chung Cùng Bạn Bè & Cộng Đồng
              </h1>

              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                Tạo phòng xem phim đồng bộ, trò chuyện thời gian thực với thanh{' '}
                <strong className="text-white">YouTube Live Chat</strong>, đếm mắt xem trực tiếp,
                thả tim biểu cảm bùng nổ cùng hàng ngàn mọt phim.
              </p>

              {/* Stats ticker */}
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-400">
                {totalLiveViewers > 0 && (
                  <div className="flex items-center gap-1.5 bg-dark-card/80 px-3 py-1.5 rounded-lg border border-dark-border">
                    <Eye className="w-4 h-4 text-brand-red animate-pulse" />
                    <span className="text-white font-bold">{totalLiveViewers.toLocaleString()}</span> người đang xem
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-dark-card/80 px-3 py-1.5 rounded-lg border border-dark-border">
                  <Radio className="w-4 h-4 text-brand-gold" />
                  <span className="text-white font-bold">{rooms.length}</span> phòng đang phát
                </div>
                <div className="flex items-center gap-1.5 bg-dark-card/80 px-3 py-1.5 rounded-lg border border-dark-border">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Realtime 100% không giật lag</span>
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-red to-red-600 hover:from-brand-redHover hover:to-red-500 text-white font-bold text-sm shadow-xl shadow-brand-red/30 hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>Tạo Phòng Xem Chung Mới</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Controls Bar: Search & Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-dark-border">
          {/* Tabs */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                filterTab === 'all'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-dark-card text-gray-300 hover:bg-dark-hover border border-dark-border'
              }`}
            >
              Tất cả phòng ({rooms.length})
            </button>
            <button
              onClick={() => setFilterTab('hot')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                filterTab === 'hot'
                  ? 'bg-brand-red text-white shadow-md shadow-brand-red/30'
                  : 'bg-dark-card text-gray-300 hover:bg-dark-hover border border-dark-border'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Phòng đông người</span>
            </button>
            <button
              onClick={() => setFilterTab('my_rooms')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                filterTab === 'my_rooms'
                  ? 'bg-brand-gold text-black shadow-md'
                  : 'bg-dark-card text-gray-300 hover:bg-dark-hover border border-dark-border'
              }`}
            >
              Phòng của tôi
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên phim, phòng, host..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-dark-card border border-dark-border rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red transition-all"
            />
          </div>
        </div>

        {/* Room Grid */}
        {filteredRooms.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-white/5 border border-dark-border flex items-center justify-center text-gray-400">
              <Film className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Chưa tìm thấy phòng nào phù hợp</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Hãy thử tìm kiếm với từ khóa khác, hoặc bạn có thể tự mình tạo một phòng xem chung mới ngay bây giờ!
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-red text-white text-xs font-bold hover:bg-brand-redHover transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo phòng ngay</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pt-6">
            {filteredRooms.map((room) => {
              const viewers = room.viewersCount || 1;
              const handleEnterRoom = () => {
                const targetUrl = watchPartyApi.generateShareUrl(room);
                navigate(targetUrl.replace(window.location.origin, ''));
              };

              return (
                <div
                  key={room.id}
                  onClick={handleEnterRoom}
                  className="group relative bg-dark-card border border-dark-border hover:border-brand-red/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-brand-red/10 transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1"
                >
                  {/* Poster Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-black/50">
                    <img
                      src={room.moviePoster}
                      alt={room.movieName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80';
                      }}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-transparent to-black/60" />

                    {/* Live Badge & Viewers */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        <span>LIVE</span>
                      </span>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-[10px] font-bold">
                        <Eye className="w-3 h-3 text-red-400" />
                        <span>{viewers.toLocaleString()}</span>
                      </span>
                    </div>

                    {/* Private room indicator */}
                    {room.isPrivate && (
                      <div className="absolute top-2.5 right-2.5 p-1 rounded-md bg-black/70 text-amber-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}

                    {/* Episode Tag */}
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-brand-gold text-black text-[11px] font-black">
                      Tập {room.currentEpisode?.name || '01'}
                    </div>

                    {/* Play Hover Overlay Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <div className="w-12 h-12 rounded-full bg-brand-red text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                        <Play className="w-6 h-6 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Room Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-brand-red transition-colors leading-snug">
                        {room.title}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-1 font-medium">
                        Phim: <span className="text-gray-300 font-semibold">{room.movieName}</span>
                      </p>
                    </div>

                    {/* Host info & Enter button */}
                    <div className="pt-2 border-t border-dark-border/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-red to-orange-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                          {room.hostName.charAt(0)}
                        </div>
                        <span className="text-gray-400 font-medium truncate max-w-[110px]">
                          {room.hostName}
                        </span>
                      </div>

                      <span className="text-brand-red font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Vào xem</span>
                        <span>→</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      <CreateWatchPartyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
