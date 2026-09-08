import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function watchPartyServerPlugin() {
  const roomsMap = new Map();
  const chatsMap = new Map();
  const roomClients = new Map(); // roomId -> Set of res

  // Clear all demo rooms - only real user-created rooms
  const DEFAULT_ROOMS = [];

  return {
    name: 'watch-party-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url.startsWith('/party-api')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost');
        const path = url.pathname;

        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        // Helper: read JSON body
        const readBody = (callback) => {
          const chunks = [];
          req.on('data', (chunk) => chunks.push(chunk));
          req.on('end', () => {
            try {
              const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
              callback(null, body);
            } catch (err) {
              callback(err, null);
            }
          });
        };

        // 1. GET /party-api/rooms
        if (req.method === 'GET' && path === '/party-api/rooms') {
          for (const [id, room] of roomsMap.entries()) {
            if (
              ['room_iruma_s4_party', 'room_diep_than_party', 'room_one_piece_fan', 'room_hoa_thien_cot'].includes(id) ||
              room?.hostId === 'system_admin' ||
              room?.hostId?.startsWith('bot_host')
            ) {
              roomsMap.delete(id);
            }
          }
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          return res.end(JSON.stringify(Array.from(roomsMap.values())));
        }

        // 2. POST /party-api/rooms
        if (req.method === 'POST' && path === '/party-api/rooms') {
          return readBody((err, room) => {
            if (err || !room?.id) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'Invalid room' }));
            }
            roomsMap.set(room.id, room);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify({ success: true, room }));
          });
        }

        // 3. GET /party-api/rooms/:id
        const roomMatch = path.match(/^\/party-api\/rooms\/([^/]+)$/);
        if (req.method === 'GET' && roomMatch) {
          const roomId = roomMatch[1];
          const room = roomsMap.get(roomId);
          if (room) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify(room));
          } else {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: 'Room not found' }));
          }
        }

        // 4. GET /party-api/chat/:roomId
        const chatMatch = path.match(/^\/party-api\/chat\/([^/]+)$/);
        if (req.method === 'GET' && chatMatch) {
          const roomId = chatMatch[1];
          const history = chatsMap.get(roomId) || [];
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          return res.end(JSON.stringify(history));
        }

        // 5. POST /party-api/chat/:roomId
        if (req.method === 'POST' && chatMatch) {
          const roomId = chatMatch[1];
          return readBody((err, msg) => {
            if (!chatsMap.has(roomId)) chatsMap.set(roomId, []);
            const history = chatsMap.get(roomId);
            const message = {
              id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              ...msg
            };
            history.push(message);
            if (history.length > 100) history.shift();

            // Broadcast SSE
            const clients = roomClients.get(roomId);
            if (clients) {
              const payload = `event: message\ndata: ${JSON.stringify(message)}\n\n`;
              clients.forEach((c) => {
                try {
                  c.write(payload);
                } catch {}
              });
            }

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify({ success: true, message }));
          });
        }

        // 6. POST /party-api/reaction/:roomId
        const reactionMatch = path.match(/^\/party-api\/reaction\/([^/]+)$/);
        if (req.method === 'POST' && reactionMatch) {
          const roomId = reactionMatch[1];
          return readBody((err, data) => {
            const clients = roomClients.get(roomId);
            if (clients) {
              const payload = `event: reaction\ndata: ${JSON.stringify(data)}\n\n`;
              clients.forEach((c) => {
                try {
                  c.write(payload);
                } catch {}
              });
            }
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify({ success: true }));
          });
        }

        // 7. POST /party-api/sync/:roomId
        const syncMatch = path.match(/^\/party-api\/sync\/([^/]+)$/);
        if (req.method === 'POST' && syncMatch) {
          const roomId = syncMatch[1];
          return readBody((err, data) => {
            if (data?.episode && roomsMap.has(roomId)) {
              const r = roomsMap.get(roomId);
              r.currentEpisode = data.episode;
            }
            const clients = roomClients.get(roomId);
            if (clients) {
              const payload = `event: sync\ndata: ${JSON.stringify(data)}\n\n`;
              clients.forEach((c) => {
                try {
                  c.write(payload);
                } catch {}
              });
            }
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify({ success: true }));
          });
        }

        // 8. GET /party-api/events/:roomId (SSE stream)
        const eventsMatch = path.match(/^\/party-api\/events\/([^/]+)$/);
        if (req.method === 'GET' && eventsMatch) {
          const roomId = eventsMatch[1];
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          });

          if (!roomClients.has(roomId)) {
            roomClients.set(roomId, new Set());
          }
          const clients = roomClients.get(roomId);
          clients.add(res);

          // Send current viewers count
          const count = Math.max(clients.size, 1) + 280;
          res.write(`event: viewers\ndata: ${JSON.stringify({ count })}\n\n`);

          // Heartbeat interval
          const keepAlive = setInterval(() => {
            try {
              res.write(': heartbeat\n\n');
            } catch {}
          }, 15000);

          req.on('close', () => {
            clearInterval(keepAlive);
            clients.delete(res);
          });
          return;
        }

        return next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), watchPartyServerPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://phim.nguonc.com',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
