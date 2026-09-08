import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Film, Sparkles } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';
import { movieApi } from '../api/movieApi';

export default function SingleMoviesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(10);

  const selectedGenre = searchParams.get('the-loai') || '';
  const selectedCountry = searchParams.get('quoc-gia') || '';
  const selectedYear = searchParams.get('nam') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    setCurrentPage(pageParam);
  }, [pageParam]);

  useEffect(() => {
    let isMounted = true;
    async function loadMovies() {
      setLoading(true);
      try {
        let res;
        if (selectedGenre) {
          res = await movieApi.getMoviesByGenre(selectedGenre, currentPage);
        } else if (selectedCountry) {
          res = await movieApi.getMoviesByCountry(selectedCountry, currentPage);
        } else if (selectedYear) {
          res = await movieApi.getMoviesByYear(selectedYear, currentPage);
        } else {
          res = await movieApi.getMoviesByCategory('phim-le', currentPage);
        }

        if (isMounted && res) {
          setMovies(res.items || []);
          if (res.paginate?.total_page) {
            setTotalPages(res.paginate.total_page);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMovies();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
      isMounted = false;
    };
  }, [selectedGenre, selectedCountry, selectedYear, currentPage]);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-red/15 text-brand-red">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Phim Lẻ Hay Nhất
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              Tổng hợp phim điện ảnh, phim lẻ chiếu rạp Vietsub, Thuyết minh chất lượng cao
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-dark-card border border-dark-border text-brand-gold self-start sm:self-auto">
          Trang {currentPage} / {totalPages}
        </span>
      </div>

      {/* Filter Bar */}
      <FilterBar
        selectedGenre={selectedGenre}
        onSelectGenre={(g) => updateParam('the-loai', g)}
        selectedCountry={selectedCountry}
        onSelectCountry={(c) => updateParam('quoc-gia', c)}
        selectedYear={selectedYear}
        onSelectYear={(y) => updateParam('nam', y)}
        onReset={handleResetFilters}
      />

      {/* Movie Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col">
              <div className="aspect-[2/3] w-full rounded-xl bg-dark-card border border-dark-border"></div>
              <div className="mt-2.5 h-4 w-3/4 bg-dark-card rounded"></div>
              <div className="mt-1 h-3 w-1/2 bg-dark-card rounded"></div>
            </div>
          ))}
        </div>
      ) : movies.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {movies.map((movie) => (
              <MovieCard key={movie.slug} movie={movie} />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <div className="text-center py-16 bg-dark-card rounded-2xl border border-dark-border my-6">
          <p className="text-gray-400 text-sm">
            Không tìm thấy phim lẻ nào phù hợp với bộ lọc đã chọn.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-brand-red text-white text-xs font-bold"
          >
            Khôi phục bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}
