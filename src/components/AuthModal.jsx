import React, { useState } from 'react';
import { X, Lock, Mail, User, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    setAuthModalTab,
    login,
    register,
    loginAsGuest
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Vui lòng điền đầy đủ email và mật khẩu!');
      return;
    }

    if (authModalTab === 'login') {
      const res = login(email, password);
      if (!res.success) {
        setError(res.message);
      }
    } else {
      if (!name) {
        setError('Vui lòng nhập họ và tên của bạn!');
        return;
      }
      const res = register(name, email, password);
      if (!res.success) {
        setError(res.message);
      } else {
        setSuccess('Đăng ký tài khoản thành công!');
      }
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-dark-card border border-dark-border rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1.5 bg-gradient-to-r from-transparent via-brand-red to-transparent rounded-full" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-white hover:bg-dark-hover transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Thành Viên RoPhim
          </div>
          <h3 className="text-2xl font-black text-white">
            {authModalTab === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản Mới'}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Lưu danh sách phim yêu thích và đồng bộ tiến trình xem dở mọi lúc
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 p-1 bg-dark-surface rounded-xl border border-dark-border mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthModalTab('login');
              setError('');
            }}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              authModalTab === 'login'
                ? 'bg-brand-red text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthModalTab('register');
              setError('');
            }}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              authModalTab === 'register'
                ? 'bg-brand-red text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Đăng Ký
          </button>
        </div>

        {/* Alert notification */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs mb-4">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authModalTab === 'register' && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Họ và tên
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-surface border border-dark-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tenban@email.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-surface border border-dark-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-surface border border-dark-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-red to-red-600 hover:from-brand-redHover hover:to-red-500 text-white font-bold text-sm shadow-lg shadow-brand-red/30 transition-all duration-300 transform active:scale-98 mt-2"
          >
            {authModalTab === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản'}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dark-border"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-dark-card px-2 text-gray-500 uppercase tracking-wider">
              Hoặc
            </span>
          </div>
        </div>

        {/* Quick Guest Login button */}
        <button
          type="button"
          onClick={handleGuestLogin}
          className="w-full py-2.5 rounded-xl bg-dark-surface hover:bg-dark-hover border border-dark-border hover:border-brand-gold/40 text-gray-200 text-sm font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-brand-gold" />
          <span>Trải Nghiệm Nhanh Với Khách VIP</span>
        </button>
      </div>
    </div>
  );
}
