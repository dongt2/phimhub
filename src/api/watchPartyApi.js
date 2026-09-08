/**
 * Watch Party Realtime API & Storage Service
 * Handles room synchronization across different browsers, profiles, and devices
 */

// Clear all demo rooms - only real user-created rooms
const DEFAULT_SEEDED_ROOMS = [];

export const watchPartyApi = {
  getDefaultRooms() {
    return DEFAULT_SEEDED_ROOMS;
  },

  /**
   * Fetch all active rooms from server API with localStorage fallback
   */
  async getAllRooms() {
    const isDemoRoom = (r) => {
      if (!r) return true;
      if (['room_iruma_s4_party', 'room_diep_than_party', 'room_one_piece_fan', 'room_hoa_thien_cot'].includes(r.id)) return true;
      if (r.hostId === 'system_admin' || r.hostId?.startsWith('bot_host')) return true;
      if (r.hostName === 'Admin RoPhim' || r.hostName === 'Mọt Phim 24/7' || r.hostName === 'Luffy Mũ Rơm' || r.hostName === 'Tiểu Cốt') return true;
      return false;
    };

    try {
      const res = await fetch('/party-api/rooms');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const realRooms = data.filter((r) => !isDemoRoom(r));
          try {
            localStorage.setItem('rophim_watch_parties', JSON.stringify(realRooms));
          } catch {}
          return realRooms;
        }
      }
    } catch (e) {
      console.warn('Could not fetch rooms from server, using local fallback:', e);
    }

    // Fallback to localStorage
    try {
      const local = JSON.parse(localStorage.getItem('rophim_watch_parties') || '[]');
      if (Array.isArray(local)) {
        const realRooms = local.filter((r) => !isDemoRoom(r));
        return realRooms;
      }
    } catch {}

    return [];
  },

  /**
   * Fetch single room by roomId from server or fallback
   */
  async getRoom(roomId, fallbackParams = null) {
    if (!roomId) return null;
    if (['room_iruma_s4_party', 'room_diep_than_party', 'room_one_piece_fan', 'room_hoa_thien_cot'].includes(roomId)) {
      return null;
    }

    // 1. Try server endpoint
    try {
      const res = await fetch(`/party-api/rooms/${roomId}`);
      if (res.ok) {
        const room = await res.json();
        if (room && room.id) {
          return room;
        }
      }
    } catch (e) {
      console.warn('Server room fetch error:', e);
    }

    // 2. Try localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('rophim_watch_parties') || '[]');
      const found = stored.find((r) => r.id === roomId);
      if (found) return found;
    } catch {}

    // 3. Try fallback URL query parameters
    if (fallbackParams && fallbackParams.movieSlug) {
      const paramRoom = {
        id: roomId,
        title: fallbackParams.title || `Phòng xem ${fallbackParams.movieName || 'phim'}`,
        movieSlug: fallbackParams.movieSlug,
        movieName: fallbackParams.movieName || fallbackParams.movieSlug,
        moviePoster: fallbackParams.moviePoster || '',
        currentEpisode: {
          name: fallbackParams.epName || '01',
          slug: fallbackParams.epSlug || 'tap-01'
        },
        isPrivate: false,
        hostName: fallbackParams.hostName || 'Chủ Phòng',
        hostId: 'shared_host',
        createdAt: Date.now(),
        viewersCount: 1
      };

      // Register this room with server in background
      this.createRoom(paramRoom).catch(() => {});
      return paramRoom;
    }

    // 4. Default seeded match
    const defaultMatch = DEFAULT_SEEDED_ROOMS.find((r) => r.id === roomId);
    if (defaultMatch) return defaultMatch;

    return null;
  },

  /**
   * Create or update a watch party room
   */
  async createRoom(roomData) {
    // 1. Save to local storage
    try {
      const stored = JSON.parse(localStorage.getItem('rophim_watch_parties') || '[]');
      const updated = [roomData, ...stored.filter((r) => r.id !== roomData.id)];
      localStorage.setItem('rophim_watch_parties', JSON.stringify(updated));
    } catch {}

    // 2. Send to server
    try {
      await fetch('/party-api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData)
      });
    } catch (e) {
      console.warn('Server room save error:', e);
    }

    return roomData;
  },

  /**
   * Fetch chat messages for room
   */
  async getChatHistory(roomId) {
    try {
      const res = await fetch(`/party-api/chat/${roomId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    // Fallback to local
    try {
      return JSON.parse(localStorage.getItem(`rophim_party_chat_${roomId}`) || '[]');
    } catch {}

    return [];
  },

  /**
   * Send a chat message
   */
  async sendChatMessage(roomId, messageObj) {
    // 1. Save to local storage
    try {
      const key = `rophim_party_chat_${roomId}`;
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = [...saved, messageObj].slice(-100);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {}

    // 2. Send to server
    try {
      await fetch(`/party-api/chat/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageObj)
      });
    } catch {}

    return messageObj;
  },

  /**
   * Send floating reaction
   */
  async sendReaction(roomId, emoji, user = null) {
    try {
      await fetch(`/party-api/reaction/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, user })
      });
    } catch {}
  },

  /**
   * Sync episode change across clients
   */
  async syncEpisode(roomId, episode, by = null) {
    try {
      await fetch(`/party-api/sync/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'SYNC_EPISODE', episode, by })
      });
    } catch {}
  },

  /**
   * Connect to Realtime EventSource (SSE) with fallback to BroadcastChannel
   */
  connectEvents(roomId, onEvent) {
    let eventSource = null;
    let bc = null;

    // 1. Server-Sent Events (cross-browser / cross-profile sync)
    try {
      eventSource = new EventSource(`/party-api/events/${roomId}`);

      eventSource.addEventListener('message', (e) => {
        try {
          const data = JSON.parse(e.data);
          onEvent({ type: 'CHAT_MESSAGE', payload: data });
        } catch {}
      });

      eventSource.addEventListener('reaction', (e) => {
        try {
          const data = JSON.parse(e.data);
          onEvent({ type: 'REACTION', payload: data });
        } catch {}
      });

      eventSource.addEventListener('sync', (e) => {
        try {
          const data = JSON.parse(e.data);
          onEvent({ type: 'SYNC_EPISODE', payload: data });
        } catch {}
      });

      eventSource.addEventListener('viewers', (e) => {
        try {
          const data = JSON.parse(e.data);
          onEvent({ type: 'VIEWERS_UPDATE', payload: data });
        } catch {}
      });

      eventSource.onerror = () => {
        // SSE auto-reconnects
      };
    } catch (err) {
      console.warn('SSE not supported, using BroadcastChannel:', err);
    }

    // 2. BroadcastChannel (same-browser tabs)
    try {
      bc = new BroadcastChannel(`rophim_party_chat_${roomId}`);
      bc.onmessage = (e) => {
        if (e.data) {
          onEvent(e.data);
        }
      };
    } catch {}

    // Return cleanup function
    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (bc) {
        bc.close();
      }
    };
  },

  /**
   * Generate robust shareable room URL with query params
   */
  generateShareUrl(room, currentEpisode = null) {
    const origin = window.location.origin;
    const activeEp = currentEpisode || room.currentEpisode || { name: '01', slug: 'tap-01' };

    const params = new URLSearchParams({
      slug: room.movieSlug || '',
      name: room.movieName || '',
      poster: room.moviePoster || '',
      ep: activeEp.slug || 'tap-01',
      epName: activeEp.name || '01',
      title: room.title || '',
      host: room.hostName || 'Chủ Phòng'
    });

    return `${origin}/xem-chung/${room.id}?${params.toString()}`;
  }
};
