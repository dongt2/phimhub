import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Send, Disc as Discord, Facebook, Youtube, Twitter, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-dark-border bg-dark-surface/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Sovereignty statement banner */}
        <div className="flex items-center justify-center gap-2.5 p-3 rounded-xl bg-red-950/40 border border-red-800/30 text-red-200 text-xs sm:text-sm font-semibold mb-8 text-center">
          <span className="text-base">🇻🇳</span>
          <span>Hoàng Sa &amp; Trường Sa là lãnh thổ thiêng liêng không thể tách rời của Việt Nam!</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-dark-border">
          {/* Col 1: Brand info */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-red to-red-700 flex items-center justify-center shadow-lg shadow-brand-red/30">
                <Film className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center tracking-tight">
                <span className="text-xl font-black text-white">Ro</span>
                <span className="text-xl font-black text-brand-red">Phim</span>
                <span className="ml-1 text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-brand-gold text-black">
                  VIP
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-gray-400 max-w-lg leading-relaxed">
              RoPhim - Trang xem phim online chất lượng cao miễn phí Vietsub, thuyết minh, lồng tiếng full HD. Kho phim mới khổng lồ, phim chiếu rạp, phim bộ, phim lẻ từ nhiều quốc gia như Việt Nam, Hàn Quốc, Trung Quốc, Thái Lan, Nhật Bản, Âu Mỹ… đa dạng thể loại. Nền tảng phim trực tuyến hay nhất chất lượng đỉnh cao!
            </p>

            {/* Socials */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://t.me"
                target="_blank"
                rel="noreferrer"
                title="Telegram"
                className="p-2 rounded-lg bg-dark-card border border-dark-border text-gray-300 hover:text-white hover:border-brand-red transition-colors"
              >
                <Send className="w-4 h-4" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                title="Discord"
                className="p-2 rounded-lg bg-dark-card border border-dark-border text-gray-300 hover:text-white hover:border-brand-red transition-colors"
              >
                <Discord className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                title="Facebook"
                className="p-2 rounded-lg bg-dark-card border border-dark-border text-gray-300 hover:text-white hover:border-brand-red transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                title="Youtube"
                className="p-2 rounded-lg bg-dark-card border border-dark-border text-gray-300 hover:text-white hover:border-brand-red transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Danh mục */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Danh Mục Phim
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <Link to="/phim-moi" className="hover:text-brand-red transition-colors">Phim Mới Cập Nhật</Link>
              </li>
              <li>
                <Link to="/phim-le" className="hover:text-brand-red transition-colors">Phim Lẻ Hay</Link>
              </li>
              <li>
                <Link to="/phim-bo" className="hover:text-brand-red transition-colors">Phim Bộ Đặc Sắc</Link>
              </li>
              <li>
                <Link to="/phim-le?the-loai=hanh-dong" className="hover:text-brand-red transition-colors">Phim Hành Động</Link>
              </li>
              <li>
                <Link to="/phim-le?the-loai=hoat-hinh" className="hover:text-brand-red transition-colors">Hoạt Hình - Anime</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Hỗ trợ & Thông tin */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Thông Tin &amp; Hỗ Trợ
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <a href="#about" className="hover:text-brand-red transition-colors">Giới thiệu</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-brand-red transition-colors">Hỏi - Đáp</a>
              </li>
              <li>
                <a href="#terms" className="hover:text-brand-red transition-colors">Điều khoản sử dụng</a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-brand-red transition-colors">Chính sách bảo mật</a>
              </li>
              <li>
                <a href="#contact" className="hover:text-brand-red transition-colors">Liên hệ bản quyền</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-3">
          <p>© 2026 RoPhim (cobephim.ws) - Xem phim online miễn phí.</p>
          <p className="flex items-center gap-1">
            Thiết kế với <Heart className="w-3.5 h-3.5 text-brand-red fill-current inline" /> cho cộng đồng mê phim
          </p>
        </div>
      </div>
    </footer>
  );
}
