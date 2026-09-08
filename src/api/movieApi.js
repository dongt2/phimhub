// API Service for phim.nguonc.com with Smart Multi-Server Backup

const API_BASE_DIRECT = 'https://phim.nguonc.com';
const API_BASE_PROXY = ''; // uses Vite dev proxy /api

// Cache memory to prevent excessive requests
const cache = new Map();

async function fetchFromApi(endpoint) {
  if (cache.has(endpoint)) {
    return cache.get(endpoint);
  }

  // Try proxy first if in dev, fallback to direct
  const urlsToTry = [
    `${API_BASE_PROXY}${endpoint}`,
    `${API_BASE_DIRECT}${endpoint}`
  ];

  let lastError = null;
  for (const url of urlsToTry) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data && (data.status === 'success' || data.items || data.movie)) {
        cache.set(endpoint, data);
        return data;
      }
    } catch (err) {
      lastError = err;
    }
  }

  console.error(`Fetch failed for ${endpoint}:`, lastError);
  throw lastError;
}

// Helper tải 20 phim mỗi trang (gọi 2 trang API song song) để lấp đầy bố cục 5 cột cân đối, không bị khuyết ô
async function fetch20Items(endpointBuilder, page = 1) {
  const p1 = (page - 1) * 2 + 1;
  const p2 = (page - 1) * 2 + 2;

  try {
    const [res1, res2] = await Promise.all([
      fetchFromApi(endpointBuilder(p1)).catch(() => null),
      fetchFromApi(endpointBuilder(p2)).catch(() => null)
    ]);

    const items1 = res1?.items || [];
    const items2 = res2?.items || [];
    const combinedItems = [...items1, ...items2];

    const rawTotalPages = res1?.paginate?.total_page || res2?.paginate?.total_page || 1;
    const rawTotalItems = res1?.paginate?.total_items || combinedItems.length;

    return {
      status: 'success',
      items: combinedItems,
      paginate: {
        current_page: page,
        total_page: Math.ceil(rawTotalPages / 2),
        total_items: rawTotalItems,
        items_per_page: combinedItems.length
      }
    };
  } catch (err) {
    return await fetchFromApi(endpointBuilder(page));
  }
}

export const movieApi = {
  // 1. Phim mới cập nhật (20 phim / trang)
  getNewUpdatedMovies: async (page = 1) => {
    return await fetch20Items((p) => `/api/films/phim-moi-cap-nhat?page=${p}`, page);
  },

  // 2. Phim theo danh mục (20 phim / trang)
  getMoviesByCategory: async (categorySlug, page = 1) => {
    return await fetch20Items((p) => `/api/films/danh-sach/${categorySlug}?page=${p}`, page);
  },

  // 3. Chi tiết phim kèm tích hợp đa server thông minh (Server VIP HLS tốc độ cao + Server NguonC)
  getMovieDetail: async (slug) => {
    const data = await fetchFromApi(`/api/film/${slug}`);
    if (data && data.movie) {
      try {
        const backupServers = await movieApi.getBackupEpisodes(data.movie);
        if (backupServers && backupServers.length > 0) {
          const originalEpisodes = (data.movie.episodes || []).map((srv, idx) => ({
            ...srv,
            server_name: srv.server_name ? `${srv.server_name} (NguonC)` : `Server NguonC #${idx + 1}`
          }));
          // Put VIP Server first for instant uninterrupted streaming
          data.movie.episodes = [...backupServers, ...originalEpisodes];
        }
      } catch (err) {
        console.warn('Backup server retrieval skipped:', err);
      }
    }
    return data;
  },

  // Helper tìm kiếm đa tầng server dự phòng VIP tốc độ cao
  getBackupEpisodes: async (movie) => {
    if (!movie) return [];
    try {
      const candidates = [];
      // 1. Tên gốc / Tên tiếng Anh (chuẩn xác nhất cho phim quốc tế / anime)
      if (movie.original_name) {
        movie.original_name.split(/[,;\/]/).forEach((part) => {
          const p = part.trim();
          if (p.length > 2) candidates.push(p);
        });
      }

      // 2. Tên tiếng Việt / Tên phát hành
      if (movie.name) {
        candidates.push(movie.name);
        // Làm sạch số mùa, tập, ký tự đặc biệt
        const cleaned = movie.name
          .replace(/[!?:,\-_]/g, ' ')
          .replace(/\b(\d+(st|nd|rd|th)|season|phan|phần|tap|tập|part)\b/gi, '')
          .trim();
        if (cleaned && cleaned !== movie.name) candidates.push(cleaned);

        // Lấy 2 từ đầu của tên nếu dài
        const words = cleaned.split(/\s+/).filter((w) => w.length > 2);
        if (words.length >= 2) candidates.push(words.slice(0, 2).join(' '));
      }

      // 3. Slug dạng từ khóa tìm kiếm (thay gạch nối bằng khoảng trắng)
      if (movie.slug) {
        candidates.push(movie.slug.replace(/-/g, ' '));
      }

      const queries = [...new Set(candidates.filter(Boolean))];

      for (const q of queries) {
        try {
          // Luôn tìm kiếm qua endpoint tim-kiem (endpoint này luôn trả về 200 OK, không bao giờ 404)
          const sRes = await fetch(`https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(q)}`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null);

          if (sRes?.data?.items?.length > 0) {
            // Duyệt tối đa 2 kết quả tìm kiếm đầu tiên
            for (const match of sRes.data.items.slice(0, 2)) {
              if (!match.slug) continue;
              // Gọi slug đã được API xác nhận tồn tại -> Đảm bảo luôn 200 OK
              const detail = await fetch(`https://phimapi.com/phim/${match.slug}`)
                .then((r) => (r.ok ? r.json() : null))
                .catch(() => null);

              if (detail?.status && detail?.episodes?.[0]?.server_data?.length) {
                return detail.episodes.map((srv, idx) => ({
                  server_name: `Server VIP #${idx + 1} (Tốc độ cao)`,
                  items: srv.server_data.map((item) => ({
                    name: item.name.replace(/^Tập\s+/i, ''),
                    slug: item.slug,
                    embed: item.link_embed,
                    m3u8: item.link_m3u8
                  }))
                }));
              }
            }
          }
        } catch (subErr) {
          // Bỏ qua và thử từ khóa tiếp theo
        }
      }
    } catch (e) {
      console.warn('Backup server search error:', e);
    }
    return [];
  },

  // 4. Phim theo thể loại (20 phim / trang)
  getMoviesByGenre: async (genreSlug, page = 1) => {
    return await fetch20Items((p) => `/api/films/the-loai/${genreSlug}?page=${p}`, page);
  },

  // 5. Phim theo quốc gia (20 phim / trang)
  getMoviesByCountry: async (countrySlug, page = 1) => {
    return await fetch20Items((p) => `/api/films/quoc-gia/${countrySlug}?page=${p}`, page);
  },

  // 6. Phim theo năm (20 phim / trang)
  getMoviesByYear: async (year, page = 1) => {
    return await fetch20Items((p) => `/api/films/nam-phat-hanh/${year}?page=${p}`, page);
  },

  // 7. Tìm kiếm phim
  searchMovies: async (keyword) => {
    if (!keyword || !keyword.trim()) return { status: 'success', items: [] };
    return await fetchFromApi(`/api/films/search?keyword=${encodeURIComponent(keyword.trim())}`);
  }
};

// Available genres for filters
export const GENRES = [
  { slug: 'hanh-dong', name: 'Hành Động' },
  { slug: 'phieu-luu', name: 'Phiêu Lưu' },
  { slug: 'hoat-hinh', name: 'Hoạt Hình' },
  { slug: 'phim-hai', name: 'Phim Hài' },
  { slug: 'hinh-su', name: 'Hình Sự' },
  { slug: 'tai-lieu', name: 'Tài Liệu' },
  { slug: 'chinh-kich', name: 'Chính Kịch' },
  { slug: 'gia-dinh', name: 'Gia Đình' },
  { slug: 'gia-tuong', name: 'Giả Tưởng' },
  { slug: 'lich-su', name: 'Lịch Sử' },
  { slug: 'kinh-di', name: 'Kinh Dị' },
  { slug: 'phim-nhac', name: 'Phim Nhạc' },
  { slug: 'bi-an', name: 'Bí Ẩn' },
  { slug: 'lang-man', name: 'Lãng Mạn' },
  { slug: 'khoa-hoc-vien-tuong', name: 'Khoa Học Viễn Tưởng' },
  { slug: 'gay-can', name: 'Gây Cấn' },
  { slug: 'chien-tranh', name: 'Chiến Tranh' },
  { slug: 'tam-ly', name: 'Tâm Lý' },
  { slug: 'tinh-cam', name: 'Tình Cảm' },
  { slug: 'co-trang', name: 'Cổ Trang' },
  { slug: 'mien-tay', name: 'Miền Tây' },
];

export const COUNTRIES = [
  { slug: 'au-my', name: 'Âu Mỹ' },
  { slug: 'han-quoc', name: 'Hàn Quốc' },
  { slug: 'trung-quoc', name: 'Trung Quốc' },
  { slug: 'nhat-ban', name: 'Nhật Bản' },
  { slug: 'viet-nam', name: 'Việt Nam' },
  { slug: 'thai-lan', name: 'Thái Lan' },
  { slug: 'hong-kong', name: 'Hồng Kông' },
  { slug: 'dai-loan', name: 'Đài Loan' },
  { slug: 'anh', name: 'Anh' },
  { slug: 'phap', name: 'Pháp' },
  { slug: 'an-do', name: 'Ấn Độ' },
];

export const YEARS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018'];
