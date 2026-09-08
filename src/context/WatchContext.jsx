import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const WatchContext = createContext();

export function WatchProvider({ children }) {
  const { user } = useAuth();

  // Storage keys depending on user id or guest
  const historyKey = user ? `rophim_history_${user.id}` : 'rophim_history_guest';
  const favKey = user ? `rophim_favs_${user.id}` : 'rophim_favs_guest';

  // Watch history / Continue watching items
  const [watchHistory, setWatchHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(historyKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Favorite movies
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(favKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync state when user changes
  useEffect(() => {
    try {
      const savedHist = localStorage.getItem(historyKey);
      let loadedHist = savedHist ? JSON.parse(savedHist) : [];

      const savedFavs = localStorage.getItem(favKey);
      let loadedFavs = savedFavs ? JSON.parse(savedFavs) : [];

      // If user just logged in, merge guest history/favorites if user's own history is empty
      if (user) {
        const guestHist = localStorage.getItem('rophim_history_guest');
        if (guestHist) {
          const parsedGuest = JSON.parse(guestHist);
          if (parsedGuest.length > 0) {
            // merge unique by slug
            const map = new Map();
            [...loadedHist, ...parsedGuest].forEach((item) => {
              if (!map.has(item.slug)) map.set(item.slug, item);
            });
            loadedHist = Array.from(map.values());
          }
        }

        const guestFavs = localStorage.getItem('rophim_favs_guest');
        if (guestFavs) {
          const parsedGuestFavs = JSON.parse(guestFavs);
          if (parsedGuestFavs.length > 0) {
            const map = new Map();
            [...loadedFavs, ...parsedGuestFavs].forEach((item) => {
              if (!map.has(item.slug)) map.set(item.slug, item);
            });
            loadedFavs = Array.from(map.values());
          }
        }
      }

      setWatchHistory(loadedHist);
      setFavorites(loadedFavs);
    } catch (e) {
      console.error(e);
    }
  }, [historyKey, favKey, user]);

  // Save history on changes
  useEffect(() => {
    try {
      localStorage.setItem(historyKey, JSON.stringify(watchHistory));
    } catch (e) {
      console.error(e);
    }
  }, [watchHistory, historyKey]);

  // Save favorites on changes
  useEffect(() => {
    try {
      localStorage.setItem(favKey, JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites, favKey]);

  // Save or update watching progress
  const saveWatchProgress = ({
    slug,
    name,
    original_name,
    thumb_url,
    poster_url,
    quality,
    year,
    genres = [],
    episodeSlug,
    episodeName,
    currentTime = 0,
    duration = 0
  }) => {
    if (!slug) return;

    setWatchHistory((prev) => {
      const filtered = prev.filter((item) => item.slug !== slug);
      const percent = duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0;
      
      const newEntry = {
        slug,
        name: name || slug,
        original_name: original_name || '',
        thumb_url,
        poster_url,
        quality: quality || 'HD',
        year: year || '',
        genres: Array.isArray(genres) ? genres : [],
        episodeSlug: episodeSlug || 'tap-1',
        episodeName: episodeName || 'Tập 1',
        currentTime: Math.floor(currentTime),
        duration: Math.floor(duration),
        percent,
        updatedAt: Date.now()
      };

      // Keep max 30 items
      return [newEntry, ...filtered].slice(0, 30);
    });
  };

  // Get specific progress for a movie
  const getWatchProgress = (slug) => {
    return watchHistory.find((item) => item.slug === slug) || null;
  };

  // Get top genres watched by the user
  const getFavoriteGenres = (limit = 4) => {
    const genreMap = {};
    watchHistory.forEach((item) => {
      if (Array.isArray(item.genres)) {
        item.genres.forEach((g) => {
          if (!g || !g.slug) return;
          if (!genreMap[g.slug]) {
            genreMap[g.slug] = {
              slug: g.slug,
              name: g.name || g.slug,
              count: 0
            };
          }
          genreMap[g.slug].count += 1;
        });
      }
    });

    const sorted = Object.values(genreMap).sort((a, b) => b.count - a.count);
    return sorted.slice(0, limit);
  };

  // Remove single item from continue watching
  const removeWatchProgress = (slug) => {
    setWatchHistory((prev) => prev.filter((item) => item.slug !== slug));
  };

  // Clear all continue watching history
  const clearWatchHistory = () => {
    setWatchHistory([]);
  };

  // Toggle favorite movie
  const toggleFavorite = (movie) => {
    if (!movie || !movie.slug) return;
    setFavorites((prev) => {
      const exists = prev.some((item) => item.slug === movie.slug);
      if (exists) {
        return prev.filter((item) => item.slug !== movie.slug);
      } else {
        return [
          {
            slug: movie.slug,
            name: movie.name,
            original_name: movie.original_name,
            thumb_url: movie.thumb_url,
            poster_url: movie.poster_url,
            quality: movie.quality || 'HD',
            language: movie.language || 'Vietsub',
            year: movie.year || '',
            total_episodes: movie.total_episodes,
            current_episode: movie.current_episode,
            genres: (movie.category?.['2']?.list || []).map((g) => ({ name: g.name, slug: g.slug })),
            addedAt: Date.now()
          },
          ...prev
        ];
      }
    });
  };

  const isFavorite = (slug) => {
    return favorites.some((item) => item.slug === slug);
  };

  return (
    <WatchContext.Provider
      value={{
        watchHistory,
        saveWatchProgress,
        getWatchProgress,
        getFavoriteGenres,
        removeWatchProgress,
        clearWatchHistory,
        favorites,
        toggleFavorite,
        isFavorite
      }}
    >
      {children}
    </WatchContext.Provider>
  );
}

export function useWatch() {
  return useContext(WatchContext);
}
