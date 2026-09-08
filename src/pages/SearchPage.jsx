import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Film, AlertCircle } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { movieApi } from '../api/movieApi';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function performSearch() {
      if (!query.trim()) {
        setMovies([]);
        return;
      }

      setLoading(true);
      try {
        const res = await movieApi.searchMovies(query);
        if (isMounted) {
          setMovies(res?.items || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    performSearch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
      isMounted = false;
    };
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-dark-border">
        <div className="p-2.5 rounded-xl bg-brand-red/15 text-brand-red">
          <Search className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Kết quả tìm kiếm cho: <span className="text-brand-red">"{query}"</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Tìm thấy {movies.length} kết quả phù hợp
          </p>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col">
              <div className="aspect-[2/3] w-full rounded-xl bg-dark-card border border-dark-border"></div>
              <div className="mt-2.5 h-4 w-3/4 bg-dark-card rounded"></div>
              <div className="mt-1 h-3 w-1/2 bg-dark-card rounded"></div>
            </div>
          ))}
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {movies.map((movie) => (
            <MovieCard key={movie.slug} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-dark-card rounded-2xl border border-dark-border">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            Không tìm thấy phim nào phù hợp với từ khóa "{query}"
          </h3>
          <p className="text-xs text-gray-400 mb-6">
            Hãy thử tìm bằng tên tiếng Anh, tên viết tắt hoặc duyệt các mục phim gợi ý bên dưới.
          </p>
          <Link
            to="/phim-le"
            className="px-5 py-2.5 rounded-xl bg-brand-red text-white text-xs font-bold"
          >
            Khám phá Phim Lẻ
          </Link>
        </div>
      )}
    </div>
  );
}
