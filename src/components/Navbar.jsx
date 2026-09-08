import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Film, User, Heart, Clock, LogOut, Menu, X, ChevronDown, Play, Sparkles } from 'lucide-react';
import { movieApi, GENRES, COUNTRIES } from '../api/movieApi';
import { useAuth } from '../context/AuthContext';
import { useWatch } from '../context/WatchContext';

export default function Navbar() {
  const { user, openAuthModal, logout } = useAuth();
  const { watchHistory, favorites } = useWatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Dropdown states
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  // Debounced search for navbar preview
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const data = await movieApi.searchMovies(searchTerm);
        if (data && data.items) {
          setSearchResults(data.items.slice(0, 5));
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error(err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Close search preview & dropdowns on outside click or route change
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setIsSearchOpen(false);
      navigate(`/tim-kiem?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-nav transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-3 md:gap-6">
          
          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-dark-hover"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-brand-red to-red-700 flex items-center justify-center shadow-lg shadow-brand-red/30 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center tracking-tight">
                <span className="text-xl md:text-2xl font-black text-white">Ro</span>
                <span className="text-xl md:text-2xl font-black text-brand-red">Phim</span>
                <span className="ml-1 text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-brand-gold text-black">
                  VIP
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium tracking-wide -mt-1 hidden sm:block">
                cobephim.ws
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-gray-300">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-lg transition-colors ${
                location.pathname === '/' ? 'text-white bg-white/10' : 'hover:text-white hover:bg-white/5'
              }`}
            >
              Trang Chủ
            </Link>

            <Link
              to="/phim-le"
              className={`px-3.5 py-2 rounded-lg transition-colors ${
                location.pathname === '/phim-le' ? 'text-white bg-white/10' : 'hover:text-white hover:bg-white/5'
              }`}
            >
              Phim Lẻ
            </Link>

            <Link
              to="/phim-bo"
              className={`px-3.5 py-2 rounded-lg transition-colors ${
                location.pathname === '/phim-bo' ? 'text-white bg-white/10' : 'hover:text-white hover:bg-white/5'
              }`}
            >
              Phim Bộ
            </Link>

            <Link
              to="/xem-chung"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
                location.pathname.startsWith('/xem-chung')
                  ? 'text-white bg-red-600/20 border border-red-500/30'
                  : 'hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>Xem Chung</span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-600 text-white leading-none shadow-sm">
                LIVE
              </span>
            </Link>

            {/* Thể loại dropdown */}
            <div className="relative" onMouseEnter={() => setIsGenreOpen(true)} onMouseLeave={() => setIsGenreOpen(false)}>
              <button className="flex items-center gap-1 px-3.5 py-2 rounded-lg hover:text-white hover:bg-white/5 transition-colors">
                <span>Thể Loại</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {isGenreOpen && (
                <div className="absolute top-full left-0 w-80 p-3 bg-dark-card border border-dark-border rounded-xl shadow-2xl grid grid-cols-2 gap-1 animate-fade-in z-50">
                  {GENRES.slice(0, 12).map((g) => (
                    <Link
                      key={g.slug}
                      to={`/phim-le?the-loai=${g.slug}`}
                      className="px-2.5 py-1.5 rounded-md text-xs text-gray-300 hover:text-white hover:bg-brand-red/15 hover:text-brand-red transition-colors"
                    >
                      {g.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quốc gia dropdown */}
            <div className="relative" onMouseEnter={() => setIsCountryOpen(true)} onMouseLeave={() => setIsCountryOpen(false)}>
              <button className="flex items-center gap-1 px-3.5 py-2 rounded-lg hover:text-white hover:bg-white/5 transition-colors">
                <span>Quốc Gia</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {isCountryOpen && (
                <div className="absolute top-full left-0 w-48 p-2.5 bg-dark-card border border-dark-border rounded-xl shadow-2xl flex flex-col gap-0.5 animate-fade-in z-50">
                  {COUNTRIES.map((c) => (
                    <Link
                      key={c.slug}
                      to={`/phim-le?quoc-gia=${c.slug}`}
                      className="px-2.5 py-1.5 rounded-md text-xs text-gray-300 hover:text-white hover:bg-brand-red/15 hover:text-brand-red transition-colors"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Search Bar on Desktop with Live Preview Autocomplete */}
          <div ref={searchRef} className="relative hidden sm:block flex-1 max-w-xs sm:max-w-sm md:max-w-md">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Tìm kiếm phim, diễn viên..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-dark-card border border-dark-border rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-brand-red/70 focus:ring-1 focus:ring-brand-red/50 transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </form>

            {/* Live Search Results Popup */}
            {isSearchOpen && searchTerm.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-dark-card border border-dark-border rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-gray-400">
                    <span className="inline-block animate-spin mr-2">⟳</span> Đang tìm kiếm...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {searchResults.map((item) => (
                      <Link
                        key={item.slug}
                        to={`/phim/${item.slug}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-hover transition-colors group"
                      >
                        <img
                          src={item.thumb_url || item.poster_url}
                          alt={item.name}
                          className="w-10 h-14 object-cover rounded bg-black/50 flex-shrink-0"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100&q=80';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-brand-red transition-colors truncate">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            {item.original_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {item.year && (
                              <span className="text-[10px] text-gray-400">{item.year}</span>
                            )}
                            {item.current_episode && (
                              <span className="text-[10px] text-amber-400 font-medium">
                                {item.current_episode}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="w-full py-2 text-center text-xs font-semibold text-brand-gold hover:text-amber-300 border-t border-dark-border mt-1 block"
                    >
                      Xem tất cả kết quả cho "{searchTerm}" →
                    </button>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-gray-400">
                    Không tìm thấy phim phù hợp
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Account & Mobile Search Button */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Search Icon Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="sm:hidden p-2 rounded-xl text-gray-300 hover:text-white hover:bg-dark-hover transition-colors"
              aria-label="Tìm kiếm phim"
            >
              <Search className="w-5 h-5" />
            </button>
            {user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 sm:px-3 sm:py-1.5 rounded-full bg-dark-card border border-dark-border hover:border-brand-red/50 transition-colors"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-red/20 object-cover"
                  />
                  <span className="hidden sm:block text-xs font-semibold text-gray-200 max-w-[110px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-dark-card border border-dark-border rounded-xl shadow-2xl p-2 z-50 animate-fade-in">
                    <div className="px-3 py-2 border-b border-dark-border mb-1">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/tai-khoan"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-dark-hover rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4 text-blue-400" />
                      <span>Thông tin tài khoản</span>
                    </Link>

                    <Link
                      to="/tai-khoan?tab=favorites"
                      className="flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-dark-hover rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Heart className="w-4 h-4 text-red-400" />
                        <span>Phim yêu thích</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-red/20 text-red-400 font-bold">
                        {favorites.length}
                      </span>
                    </Link>

                    <Link
                      to="/tai-khoan?tab=history"
                      className="flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-dark-hover rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>Phim đang xem</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                        {watchHistory.length}
                      </span>
                    </Link>

                    <div className="border-t border-dark-border my-1" />

                    <button
                      type="button"
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-brand-red to-red-600 hover:from-brand-redHover hover:to-red-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-brand-red/20 transition-all duration-300"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Thành viên</span>
                <span className="sm:hidden">Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-dark-card border-b border-dark-border px-4 py-3 space-y-2 animate-fade-in">
          <Link
            to="/"
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-gray-200 hover:bg-dark-hover"
          >
            Trang Chủ
          </Link>
          <Link
            to="/phim-le"
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-gray-200 hover:bg-dark-hover"
          >
            Phim Lẻ
          </Link>
          <Link
            to="/phim-bo"
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-gray-200 hover:bg-dark-hover"
          >
            Phim Bộ
          </Link>
          <Link
            to="/xem-chung"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-gray-200 hover:bg-dark-hover"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>Xem Chung</span>
            </div>
            <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-red-600 text-white leading-none">
              LIVE
            </span>
          </Link>
          <Link
            to="/tai-khoan"
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-gray-200 hover:bg-dark-hover"
          >
            Tài Khoản & Lịch Sử Xem
          </Link>
        </div>
      )}

      {/* Mobile Search Drawer */}
      {isMobileSearchOpen && (
        <div className="sm:hidden bg-dark-bg/95 border-b border-dark-border px-4 py-3 animate-fade-in shadow-xl">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Tìm kiếm phim, diễn viên..."
              autoFocus
              className="w-full pl-9 pr-9 py-2 text-xs bg-dark-card border border-dark-border rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Autocomplete Results for Mobile */}
          {isSearchOpen && searchTerm.trim().length > 0 && (
            <div className="mt-2 bg-dark-card border border-dark-border rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
              {isSearching ? (
                <div className="p-3 text-center text-xs text-gray-400">
                  <span className="inline-block animate-spin mr-2">⟳</span> Đang tìm kiếm...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="p-1.5 space-y-1">
                  {searchResults.map((item) => (
                    <Link
                      key={item.slug}
                      to={`/phim/${item.slug}`}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setIsMobileSearchOpen(false);
                      }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-hover transition-colors"
                    >
                      <img
                        src={item.thumb_url || item.poster_url}
                        alt={item.name}
                        className="w-10 h-14 object-cover rounded bg-black/50 flex-shrink-0"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100&q=80';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                          {item.original_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {item.year && (
                            <span className="text-[10px] text-gray-400">{item.year}</span>
                          )}
                          {item.current_episode && (
                            <span className="text-[10px] text-amber-400 font-medium">
                              {item.current_episode}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="w-full py-2 text-center text-xs font-semibold text-brand-gold hover:text-amber-300 border-t border-dark-border mt-1 block"
                  >
                    Xem tất cả kết quả cho "{searchTerm}" →
                  </button>
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-gray-400">
                  Không tìm thấy phim phù hợp
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
