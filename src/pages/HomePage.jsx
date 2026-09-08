import React, { useState, useEffect } from 'react';
import HeroSlider from '../components/HeroSlider';
import MovieRow from '../components/MovieRow';
import ContinueWatchingRow from '../components/ContinueWatchingRow';
import RecommendedMoviesRow from '../components/RecommendedMoviesRow';
import { movieApi } from '../api/movieApi';
import { Sparkles, Flame, Film, Tv, PlaySquare } from 'lucide-react';

export default function HomePage() {
  const [newMovies, setNewMovies] = useState([]);
  const [singleMovies, setSingleMovies] = useState([]);
  const [seriesMovies, setSeriesMovies] = useState([]);
  const [animeMovies, setAnimeMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadHomeData() {
      setLoading(true);
      try {
        const [resNew, resSingle, resSeries, resAnime] = await Promise.allSettled([
          movieApi.getNewUpdatedMovies(1),
          movieApi.getMoviesByCategory('phim-le', 1),
          movieApi.getMoviesByCategory('phim-bo', 1),
          movieApi.getMoviesByGenre('hoat-hinh', 1)
        ]);

        if (isMounted) {
          if (resNew.status === 'fulfilled' && resNew.value?.items) {
            setNewMovies(resNew.value.items);
          }
          if (resSingle.status === 'fulfilled' && resSingle.value?.items) {
            setSingleMovies(resSingle.value.items);
          }
          if (resSeries.status === 'fulfilled' && resSeries.value?.items) {
            setSeriesMovies(resSeries.value.items);
          }
          if (resAnime.status === 'fulfilled' && resAnime.value?.items) {
            setAnimeMovies(resAnime.value.items);
          }
        }
      } catch (err) {
        console.error('Error fetching home movies:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadHomeData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute "phim nhiều người xem" (sorted by highest simulated viewers or top picks)
  const trendingMovies = [...newMovies]
    .sort((a, b) => (b.slug?.length || 0) - (a.slug?.length || 0))
    .slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. Hero Carousel: Slide đề xuất phim mới, phim nhiều lượt xem */}
      <HeroSlider movies={newMovies.length > 0 ? newMovies : singleMovies} />

      {/* 2. Phim đang xem (Continue Watching) */}
      <ContinueWatchingRow showTitle={true} />

      {/* 2.5 Gợi ý phim theo thể loại đã xem (Personalized Genre Recommendations) */}
      <RecommendedMoviesRow />

      {/* 3. Phim nhiều người xem / Thịnh hành (Top 10) */}
      <MovieRow
        title="Thịnh Hành & Nhiều Người Xem Nhất"
        subtitle="Các bộ phim được cộng đồng theo dõi đông đảo nhất hôm nay"
        movies={trendingMovies}
        isTopRank={true}
        icon={Flame}
        loading={loading}
      />

      {/* 4. Phim mới cập nhật */}
      <MovieRow
        title="Phim Mới Cập Nhật"
        subtitle="Vừa lên sóng bản đẹp Vietsub và Thuyết minh chất lượng cao"
        movies={newMovies}
        viewAllLink="/phim-moi"
        icon={Sparkles}
        loading={loading}
      />

      {/* 5. Phim Lẻ Nổi Bật */}
      <MovieRow
        title="Phim Lẻ Chiếu Rạp & Đặc Sắc"
        subtitle="Kho phim điện ảnh bom tấn quốc tế và trong nước"
        movies={singleMovies}
        viewAllLink="/phim-le"
        icon={Film}
        loading={loading}
      />

      {/* 6. Phim Bộ Chọn Lọc */}
      <MovieRow
        title="Phim Bộ Dài Tập Mới Nhất"
        subtitle="Hàn Quốc, Trung Quốc, Âu Mỹ cập nhật từng tập liên tục"
        movies={seriesMovies}
        viewAllLink="/phim-bo"
        icon={Tv}
        loading={loading}
      />

      {/* 7. Hoạt hình & Anime */}
      {animeMovies.length > 0 && (
        <MovieRow
          title="Anime & Hoạt Hình Hấp Dẫn"
          subtitle="Thế giới hoạt họa sống động chuẩn HD sắc nét"
          movies={animeMovies}
          viewAllLink="/phim-le?the-loai=hoat-hinh"
          icon={PlaySquare}
          loading={loading}
        />
      )}
    </div>
  );
}
