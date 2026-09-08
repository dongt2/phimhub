import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Users,
  Smile,
  Pin,
  ChevronDown,
  Volume2,
  Crown,
  Heart,
  Flame,
  MessageSquare,
  Eye,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { watchPartyApi } from '../api/watchPartyApi';

// Reaction emojis that can float up the screen
const FLOATING_REACTIONS = ['❤️', '🔥', '🍿', '👏', '🤣', '💯'];



export default function YouTubeLiveChat({
  roomId,
  roomTitle = 'Phòng Xem Chung',
  hostName = 'Chủ Phòng',
  isHost = false
}) {
  const { user } = useAuth();

  // Live viewers count (realtime synchronized)
  const [liveViewers, setLiveViewers] = useState(1);

  // Messages list
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(`rophim_party_chat_${roomId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((m) => !m.id?.startsWith('bot_'));
        }
      }
    } catch {}
    return [
      {
        id: 'msg_init',
        user: {
          name: hostName,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(hostName)}`,
          isHost: true,
          badge: 'Chủ phòng'
        },
        text: `Chào mừng mọi người đến với phòng xem chung! Chúc các bạn xem phim vui vẻ ❤️`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      }
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const chatContainerRef = useRef(null);

  // 1. Realtime sync via watchPartyApi (SSE + BroadcastChannel)
  useEffect(() => {
    let isMounted = true;

    // Load message history from server
    watchPartyApi.getChatHistory(roomId).then((hist) => {
      if (isMounted && hist && hist.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const combined = [...prev];
          hist.forEach((h) => {
            if (!existingIds.has(h.id)) combined.push(h);
          });
          return combined.slice(-100);
        });
      }
    });

    const cleanup = watchPartyApi.connectEvents(roomId, (event) => {
      if (event.type === 'CHAT_MESSAGE' && event.payload) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === event.payload.id)) return prev;
          return [...prev, event.payload];
        });
        setTimeout(scrollToBottom, 50);
      } else if (event.type === 'REACTION' && event.payload?.emoji) {
        triggerFloatingReaction(event.payload.emoji, false);
      } else if (event.type === 'VIEWERS_UPDATE' && event.payload?.count) {
        setLiveViewers(event.payload.count);
      }
    });

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [roomId]);

  // Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`rophim_party_chat_${roomId}`, JSON.stringify(messages.slice(-80)));
    } catch {}
  }, [messages, roomId]);



  // Auto-scroll to bottom when new messages arrive if near bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      if (isNearBottom) {
        chatContainerRef.current.scrollTop = scrollHeight;
        setShowScrollBottom(false);
      } else {
        setShowScrollBottom(true);
      }
    }
  }, [messages]);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
      setShowScrollBottom(!isNearBottom);
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
      setShowScrollBottom(false);
    }
  };

  // 4. Send Message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const senderName = user ? user.name : 'Khán giả ' + Math.floor(Math.random() * 900 + 100);
    const senderAvatar = user
      ? user.avatar
      : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(senderName)}`;

    const newMsg = {
      id: 'usr_' + Date.now(),
      user: {
        id: user?.id || 'guest',
        name: senderName,
        avatar: senderAvatar,
        isHost: isHost,
        badge: isHost ? 'Chủ phòng' : user ? 'VIP Member' : 'Khách',
        isVip: !!user || isHost
      },
      text: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');

    // Broadcast across all clients via watchPartyApi
    watchPartyApi.sendChatMessage(roomId, newMsg).catch(console.error);

    // Scroll to bottom immediately
    setTimeout(scrollToBottom, 50);
  };

  // 5. Floating Reactions
  const triggerFloatingReaction = (emoji, broadcast = true) => {
    const reactionItem = {
      id: 'react_' + Date.now() + '_' + Math.random(),
      emoji,
      left: 15 + Math.random() * 70 // percentage across container
    };

    setFloatingEmojis((prev) => [...prev, reactionItem]);

    // Clean up floating item after animation completes (2.5s)
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((r) => r.id !== reactionItem.id));
    }, 2500);

    // Broadcast reaction to other viewers
    if (broadcast) {
      watchPartyApi.sendReaction(roomId, emoji, user?.name || 'Khách').catch(() => {});
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-card border border-dark-border rounded-2xl shadow-2xl overflow-hidden relative select-none">
      {/* ========================================================= */}
      {/* 1. YOUTUBE LIVE CHAT HEADER */}
      {/* ========================================================= */}
      <div className="px-4 py-3 bg-gradient-to-r from-dark-surface via-dark-card to-dark-surface border-b border-dark-border flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-2.5">
          {/* Live pulsing beacon */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase text-red-500 tracking-wider">
              TRỰC TIẾP
            </span>
          </div>

          {/* Realtime Live Viewers Count */}
          <div className="flex items-center gap-1 text-xs font-bold text-gray-200">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>{liveViewers.toLocaleString('vi-VN')}</span>
            <span className="text-[11px] font-normal text-gray-400">người xem</span>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-300">Live Chat</span>
          <div className="w-2 h-2 rounded-full bg-emerald-400" title="Đã kết nối thời gian thực" />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. PINNED ANNOUNCEMENT (SUPER CHAT / HOST BANNER) */}
      {/* ========================================================= */}
      <div className="px-3.5 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-200">
        <Pin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 truncate leading-tight">
          <span className="font-bold text-amber-300">{hostName} (Host): </span>
          <span>Chào mừng bạn đến với phòng xem chung! Hãy bình luận văn minh nhé 🍿</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. MESSAGES FEED CONTAINER */}
      {/* ========================================================= */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-3.5 overflow-y-auto space-y-2.5 scroll-smooth no-scrollbar relative text-xs sm:text-sm"
        style={{ minHeight: '340px', maxHeight: '560px' }}
      >
        {messages.map((msg) => {
          const isMsgHost = msg.user?.isHost;
          const isMsgVip = msg.user?.isVip;

          return (
            <div
              key={msg.id}
              className="flex items-start gap-2 hover:bg-white/[0.03] p-1.5 rounded-lg transition-colors group"
            >
              {/* Avatar */}
              <img
                src={msg.user?.avatar}
                alt={msg.user?.name}
                className={`w-6 h-6 rounded-full bg-dark-surface flex-shrink-0 object-cover mt-0.5 ${
                  isMsgHost
                    ? 'ring-1 ring-amber-400'
                    : isMsgVip
                    ? 'ring-1 ring-brand-red'
                    : 'border border-dark-border'
                }`}
              />

              {/* Message Body */}
              <div className="flex-1 leading-relaxed break-words">
                <span className="inline-flex items-center gap-1 mr-1.5">
                  {/* Host Crown Icon */}
                  {isMsgHost && (
                    <Crown className="w-3 h-3 text-amber-400 fill-amber-400 inline" />
                  )}

                  <span
                    className={`font-bold text-[12px] ${
                      isMsgHost
                        ? 'text-amber-400'
                        : isMsgVip
                        ? 'text-red-400'
                        : 'text-gray-300'
                    }`}
                  >
                    {msg.user?.name}
                  </span>

                  {/* Badges */}
                  {isMsgHost ? (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      HOST
                    </span>
                  ) : isMsgVip ? (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-brand-red/20 text-brand-red border border-brand-red/30">
                      VIP
                    </span>
                  ) : null}
                </span>

                {/* Message Text */}
                <span className="text-gray-200 text-[12px]">{msg.text}</span>

                {/* Timestamp on hover */}
                <span className="text-[10px] text-gray-500 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Floating Emojis Layer */}
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className="absolute bottom-2 pointer-events-none text-2xl animate-float-up"
            style={{ left: `${item.left}%` }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* New Messages Down Arrow Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-brand-red text-white font-bold text-[11px] shadow-lg flex items-center gap-1 animate-bounce"
        >
          <span>Tin nhắn mới</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      )}

      {/* ========================================================= */}
      {/* 4. FLOATING REACTION BUTTONS BAR */}
      {/* ========================================================= */}
      <div className="px-3 py-2 bg-dark-surface/80 border-t border-dark-border flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1 flex-shrink-0">
          <Smile className="w-3.5 h-3.5 text-brand-gold" /> Thả tim:
        </span>
        <div className="flex items-center gap-1.5">
          {FLOATING_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => triggerFloatingReaction(emoji, true)}
              className="p-1 rounded-lg hover:bg-dark-hover text-base hover:scale-125 transition-transform active:scale-95"
              title={`Thả ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. CHAT INPUT FORM */}
      {/* ========================================================= */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-dark-card border-t border-dark-border flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              user
                ? `Bình luận với tư cách ${user.name}...`
                : 'Nhập tin nhắn bình luận (Enter để gửi)...'
            }
            maxLength={200}
            className="w-full px-3.5 py-2.5 rounded-xl bg-dark-surface border border-dark-border text-white placeholder-gray-500 text-xs focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={!inputMessage.trim()}
          className="p-2.5 rounded-xl bg-brand-red hover:bg-brand-redHover disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex-shrink-0 shadow-md shadow-brand-red/20"
          title="Gửi tin nhắn"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
