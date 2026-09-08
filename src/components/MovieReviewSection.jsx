import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  Send,
  ThumbsUp,
  ThumbsDown,
  CornerDownRight,
  AlertTriangle,
  Trash2,
  Smile,
  CheckCircle2,
  Sparkles,
  User,
  Eye,
  EyeOff,
  Tv,
  Film
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Rating text labels (1 to 10)
const RATING_LABELS = {
  1: 'Quá tệ (1/10)',
  2: 'Dưới trung bình (2/10)',
  3: 'Hơi thất vọng (3/10)',
  4: 'Xem tạm được (4/10)',
  5: 'Bình thường (5/10)',
  6: 'Khá ổn (6/10)',
  7: 'Khá hay (7/10)',
  8: 'Rất hay (8/10)',
  9: 'Tuyệt phẩm (9/10)',
  10: 'Siêu phẩm đỉnh cao (10/10)'
};

const QUICK_EMOJIS = [
  { label: '🔥 Tuyệt vời', text: '🔥 Tuyệt vời quá!' },
  { label: '❤️ Rất mê', text: '❤️ Phim quá cuốn, mê luôn!' },
  { label: '🍿 Hóng tập mới', text: '🍿 Hóng tập tiếp theo quá ad ơi!' },
  { label: '🤣 Hài hước', text: '🤣 Xem cười đau cả bụng haha' },
  { label: '😭 Cảm động', text: '😭 Xem đoạn này cảm động rơi nước mắt' },
  { label: '👏 10 điểm', text: '👏 10 điểm cho chất lượng phim và server!' }
];

export default function MovieReviewSection({ movie, currentEpisode }) {
  const { user, setIsAuthModalOpen, setAuthModalTab } = useAuth();
  const slug = movie?.slug || 'movie';

  // Check if series or single movie
  const totalEps = movie?.episodes?.[0]?.items?.length || 1;
  const isSeries = totalEps > 1 || movie?.type === 'series';

  const epName = currentEpisode?.name
    ? (currentEpisode.name.toString().startsWith('Tập') ? currentEpisode.name : `Tập ${currentEpisode.name}`)
    : 'Tập 01';
  const epSlug = currentEpisode?.slug || 'tap-01';

  // Discussion scope for series: 'episode' (default) | 'all' (entire series)
  const [discussionScope, setDiscussionScope] = useState('episode');

  // Compute exact storage key
  const activeScope = isSeries ? discussionScope : 'single';
  const commentStorageKey = !isSeries
    ? `rophim_cmt_${slug}`
    : discussionScope === 'episode'
    ? `rophim_cmt_${slug}_${epSlug}`
    : `rophim_cmt_${slug}_all`;

  // ----------------------------------------------------
  // 1. RATING STATE (Global per movie)
  // ----------------------------------------------------
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [showRatingSuccess, setShowRatingSuccess] = useState(false);

  // Aggregated rating stats unique per movie
  const [stats, setStats] = useState({
    avgScore: 0,
    totalVotes: 0,
    distribution: { 10: 0, 8: 0, 6: 0, 4: 0, 2: 0 }
  });

  // Load saved rating from localStorage
  useEffect(() => {
    if (!slug) return;
    try {
      const savedUserRating = localStorage.getItem(`rophim_user_rate_${slug}`);
      if (savedUserRating) {
        setUserRating(parseInt(savedUserRating, 10));
        setHasRated(true);
      } else {
        setUserRating(0);
        setHasRated(false);
      }

      const savedStats = localStorage.getItem(`rophim_stats_${slug}`);
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      } else {
        setStats({
          avgScore: 0,
          totalVotes: 0,
          distribution: { 10: 0, 8: 0, 6: 0, 4: 0, 2: 0 }
        });
      }
    } catch {}
  }, [slug]);

  // Handle submit rating
  const handleRate = (star) => {
    setUserRating(star);
    setHasRated(true);
    setShowRatingSuccess(true);
    setTimeout(() => setShowRatingSuccess(false), 4000);

    localStorage.setItem(`rophim_user_rate_${slug}`, star.toString());

    setStats((prev) => {
      const prevTotal = prev.totalVotes;
      const newTotal = prevTotal + (hasRated ? 0 : 1);
      const newAvg = prevTotal === 0
        ? star
        : parseFloat((((prev.avgScore * prevTotal) + star) / newTotal).toFixed(1));

      const updated = {
        avgScore: Math.min(10, Math.max(1, newAvg)),
        totalVotes: newTotal,
        distribution: {
          10: star >= 9 ? 100 : 0,
          8: star >= 7 && star < 9 ? 100 : 0,
          6: star >= 5 && star < 7 ? 100 : 0,
          4: star >= 3 && star < 5 ? 100 : 0,
          2: star < 3 ? 100 : 0
        }
      };
      try {
        localStorage.setItem(`rophim_stats_${slug}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // ----------------------------------------------------
  // 2. COMMENTS STATE (Distinct per movie & per episode)
  // ----------------------------------------------------
  const [comments, setComments] = useState([]);
  const [filterSort, setFilterSort] = useState('newest'); // 'newest' | 'popular'
  const [commentText, setCommentText] = useState('');
  const [commentRating, setCommentRating] = useState(10);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [revealedSpoilers, setRevealedSpoilers] = useState({});

  // Active reply state: commentId -> boolean
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  // User reactions state (like/dislike)
  const [userReactions, setUserReactions] = useState({});

  // Load comments whenever movie, currentEpisode, or discussionScope changes
  useEffect(() => {
    if (!slug) return;
    try {
      const saved = localStorage.getItem(commentStorageKey);
      let parsed = null;
      if (saved) {
        try {
          parsed = JSON.parse(saved);
        } catch {}
      }

      if (parsed && Array.isArray(parsed)) {
        // Only load real user comments (filter out any legacy seed comments)
        const realComments = parsed.filter((c) => !c.id?.startsWith('seed_'));
        setComments(realComments);
      } else {
        setComments([]);
      }

      // Load reactions
      const reactions = localStorage.getItem(`rophim_react_${commentStorageKey}`);
      if (reactions) {
        setUserReactions(JSON.parse(reactions));
      } else {
        setUserReactions({});
      }
    } catch {
      setComments([]);
    }
    // Reset reply state
    setReplyingTo(null);
    setReplyText('');
  }, [slug, epSlug, discussionScope, isSeries]);

  // Save comments helper
  const persistComments = (newComments) => {
    setComments(newComments);
    try {
      localStorage.setItem(commentStorageKey, JSON.stringify(newComments));
    } catch {}
  };

  // Post a new comment
  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const authorName = user
      ? user.name
      : guestName.trim() || 'Khách Xem Phim';

    const authorAvatar = user
      ? user.avatar
      : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(authorName + Date.now())}`;

    const newComment = {
      id: 'cmt_' + Date.now(),
      user: {
        id: user?.id || 'guest',
        name: authorName,
        avatar: authorAvatar,
        badge: user ? 'Thành viên VIP' : 'Khách',
        isVip: !!user
      },
      rating: commentRating,
      content: commentText.trim(),
      timestamp: 'Vừa xong',
      likes: 0,
      dislikes: 0,
      isSpoiler: isSpoiler,
      replies: []
    };

    const updated = [newComment, ...comments];
    persistComments(updated);

    // Reset input
    setCommentText('');
    setIsSpoiler(false);
  };

  // Reply to a comment
  const handleSendReply = (commentId) => {
    if (!replyText.trim()) return;

    const authorName = user ? user.name : guestName.trim() || 'Khách Xem Phim';
    const authorAvatar = user
      ? user.avatar
      : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(authorName + Date.now())}`;

    const newReply = {
      id: 'rep_' + Date.now(),
      user: {
        id: user?.id || 'guest',
        name: authorName,
        avatar: authorAvatar,
        badge: user ? 'Thành viên VIP' : 'Khách',
        isVip: !!user
      },
      content: replyText.trim(),
      timestamp: 'Vừa xong',
      likes: 0
    };

    const updated = comments.map((c) => {
      if (c.id === commentId) {
        return {
          ...c,
          replies: [...(c.replies || []), newReply]
        };
      }
      return c;
    });

    persistComments(updated);
    setReplyingTo(null);
    setReplyText('');
  };

  // Like reaction
  const handleToggleLike = (commentId) => {
    const currentReaction = userReactions[commentId];
    const isLiking = currentReaction !== 'like';

    const updated = comments.map((c) => {
      if (c.id === commentId) {
        let newLikes = c.likes;
        let newDislikes = c.dislikes;

        if (isLiking) {
          newLikes += 1;
          if (currentReaction === 'dislike') newDislikes = Math.max(0, newDislikes - 1);
        } else {
          newLikes = Math.max(0, newLikes - 1);
        }

        return { ...c, likes: newLikes, dislikes: newDislikes };
      }
      return c;
    });

    persistComments(updated);

    const newReactions = {
      ...userReactions,
      [commentId]: isLiking ? 'like' : null
    };
    setUserReactions(newReactions);
    localStorage.setItem(`rophim_react_${commentStorageKey}`, JSON.stringify(newReactions));
  };

  // Dislike reaction
  const handleToggleDislike = (commentId) => {
    const currentReaction = userReactions[commentId];
    const isDisliking = currentReaction !== 'dislike';

    const updated = comments.map((c) => {
      if (c.id === commentId) {
        let newLikes = c.likes;
        let newDislikes = c.dislikes;

        if (isDisliking) {
          newDislikes += 1;
          if (currentReaction === 'like') newLikes = Math.max(0, newLikes - 1);
        } else {
          newDislikes = Math.max(0, newDislikes - 1);
        }

        return { ...c, likes: newLikes, dislikes: newDislikes };
      }
      return c;
    });

    persistComments(updated);

    const newReactions = {
      ...userReactions,
      [commentId]: isDisliking ? 'dislike' : null
    };
    setUserReactions(newReactions);
    localStorage.setItem(`rophim_react_${commentStorageKey}`, JSON.stringify(newReactions));
  };

  // Delete comment
  const handleDeleteComment = (commentId) => {
    const updated = comments.filter((c) => c.id !== commentId);
    persistComments(updated);
  };

  // Toggle spoiler view
  const toggleSpoiler = (id) => {
    setRevealedSpoilers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Sort comments
  const sortedComments = [...comments].sort((a, b) => {
    if (filterSort === 'popular') {
      return (b.likes || 0) - (a.likes || 0);
    }
    return (b.id || '').localeCompare(a.id || '');
  });

  return (
    <div className="space-y-8 my-10">
      {/* ========================================================================= */}
      {/* 1. KHU VỰC ĐÁNH GIÁ ĐIỂM PHIM (RATING SCORE & VOTING) */}
      {/* ========================================================================= */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 pb-6 border-b border-dark-border">
          {/* Left: Big Score Display */}
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-amber-500/20 to-brand-gold/10 border border-amber-500/30 flex flex-col items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/10">
              <span className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
                {stats.totalVotes > 0 ? stats.avgScore : '--'}
              </span>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                / 10 ĐIỂM
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      stats.totalVotes > 0 && star <= Math.round(stats.avgScore / 2)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-600'
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-amber-400 ml-1">
                  {stats.totalVotes > 0
                    ? stats.avgScore >= 9
                      ? 'Tuyệt phẩm'
                      : stats.avgScore >= 8
                      ? 'Rất hay'
                      : stats.avgScore >= 7
                      ? 'Khá hay'
                      : 'Bình thường'
                    : 'Chưa có đánh giá'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Đánh Giá Khán Giả: {movie?.name}
              </h3>
              <p className="text-xs text-gray-400">
                {stats.totalVotes > 0 ? (
                  <>Dựa trên <strong className="text-gray-200">{stats.totalVotes.toLocaleString('vi-VN')}</strong> lượt đánh giá từ cộng đồng</>
                ) : (
                  'Chưa có lượt đánh giá nào. Hãy là người đầu tiên chấm điểm!'
                )}
              </p>
            </div>
          </div>

          {/* Right: Distribution Bars */}
          <div className="flex-1 max-w-xs space-y-1 text-xs">
            {[
              { stars: '10★', percent: stats.distribution[10] || 0 },
              { stars: '8★', percent: stats.distribution[8] || 0 },
              { stars: '6★', percent: stats.distribution[6] || 0 },
              { stars: '4★', percent: stats.distribution[4] || 0 },
              { stars: '2★', percent: stats.distribution[2] || 0 }
            ].map((tier, idx) => (
              <div key={idx} className="flex items-center gap-2 text-gray-400 text-[11px]">
                <span className="w-6 font-semibold text-right text-gray-300">{tier.stars}</span>
                <div className="flex-1 h-1.5 rounded-full bg-dark-surface overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${tier.percent}%` }}
                  />
                </div>
                <span className="w-8 text-right text-gray-500">{tier.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Voting Bar (10 Stars) */}
        <div className="mt-6 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-white">
                Chấm điểm cho phim này:
              </span>
              <span className="text-xs text-amber-400 font-semibold italic">
                {hoverRating ? RATING_LABELS[hoverRating] : userRating ? RATING_LABELS[userRating] : 'Chọn từ 1 đến 10 sao'}
              </span>
            </div>

            {hasRated && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5" /> Bạn đã chấm {userRating}/10 sao
              </span>
            )}
          </div>

          {/* 10 Star Button Row */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
              const isFilled = hoverRating ? star <= hoverRating : star <= userRating;
              return (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => handleRate(star)}
                  className={`relative p-1.5 sm:p-2 rounded-xl transition-all duration-200 ${
                    isFilled
                      ? 'bg-amber-500/20 text-amber-400 scale-110 shadow-sm shadow-amber-500/20'
                      : 'bg-dark-surface text-gray-600 hover:text-gray-300 hover:bg-dark-hover'
                  }`}
                  title={`${star}/10 sao`}
                >
                  <Star
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${
                      isFilled ? 'fill-current' : ''
                    }`}
                  />
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold opacity-70">
                    {star}
                  </span>
                </button>
              );
            })}
          </div>

          {showRatingSuccess && (
            <div className="mt-3 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                Cảm ơn bạn đã chấm <strong>{userRating}/10 sao</strong> cho phim <strong>{movie?.name}</strong>! Đánh giá của bạn đã được ghi nhận.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. KHU VỰC BÌNH LUẬN & THẢO LUẬN (PHIM LẺ VS PHIM BỘ THEO TẬP) */}
      {/* ========================================================================= */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-7 shadow-xl">
        {/* Scope Switcher for Series (Tập này vs Toàn bộ phim) */}
        {isSeries && (
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-dark-border overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
              <Tv className="w-4 h-4 text-brand-red" /> Phạm vi:
            </span>
            <button
              type="button"
              onClick={() => setDiscussionScope('episode')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                discussionScope === 'episode'
                  ? 'bg-brand-red text-white shadow-md shadow-brand-red/20'
                  : 'bg-dark-surface text-gray-300 hover:text-white border border-dark-border'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Bình luận riêng: {epName}</span>
            </button>
            <button
              type="button"
              onClick={() => setDiscussionScope('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                discussionScope === 'all'
                  ? 'bg-brand-red text-white shadow-md shadow-brand-red/20'
                  : 'bg-dark-surface text-gray-300 hover:text-white border border-dark-border'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Thảo luận chung cả bộ</span>
            </button>
          </div>
        )}

        {/* Header & Filter Sort */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-dark-border">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-brand-red" />
            <h3 className="text-lg font-bold text-white">
              {isSeries && discussionScope === 'episode' ? (
                <>
                  Bình Luận <span className="text-brand-gold">{epName}</span> ({comments.length})
                </>
              ) : (
                <>
                  Bình Luận Phim ({comments.length})
                </>
              )}
            </h3>
            {isSeries && discussionScope === 'episode' && (
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[11px] font-semibold text-amber-300">
                Thảo luận theo tập
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Sắp xếp:</span>
            <div className="flex rounded-lg bg-dark-surface p-0.5 border border-dark-border">
              <button
                type="button"
                onClick={() => setFilterSort('newest')}
                className={`px-3 py-1 rounded-md transition-colors font-medium ${
                  filterSort === 'newest'
                    ? 'bg-brand-red text-white font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Mới nhất
              </button>
              <button
                type="button"
                onClick={() => setFilterSort('popular')}
                className={`px-3 py-1 rounded-md transition-colors font-medium ${
                  filterSort === 'popular'
                    ? 'bg-brand-red text-white font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Nhiều like
              </button>
            </div>
          </div>
        </div>

        {/* Comment Form */}
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* User Avatar */}
            <div className="w-10 h-10 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-gray-400" />
              )}
            </div>

            {/* Input Box */}
            <div className="flex-1 space-y-3">
              {/* If Guest: Allow setting a display nickname or quick login */}
              {!user && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Nhập tên hiển thị (hoặc bình luận như Khách)..."
                    className="px-3 py-1.5 rounded-lg bg-dark-surface border border-dark-border text-white placeholder-gray-500 focus:outline-none focus:border-brand-red transition-colors text-xs w-64"
                  />
                  <span className="text-gray-500">hoặc</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalTab('login');
                      setIsAuthModalOpen(true);
                    }}
                    className="text-brand-gold hover:text-amber-300 underline font-semibold transition-colors"
                  >
                    Đăng nhập tài khoản
                  </button>
                </div>
              )}

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={
                    isSeries && discussionScope === 'episode'
                      ? `Chia sẻ cảm nghĩ của bạn về ${movie?.name} - ${epName}... (Hạn chế spoil nội dung để trải nghiệm xem của mọi người trọn vẹn nhất)`
                      : `Chia sẻ cảm nghĩ của bạn về bộ phim ${movie?.name || ''}...`
                  }
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-dark-surface border border-dark-border text-white placeholder-gray-500 text-xs sm:text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all resize-none"
                />
              </div>

              {/* Quick Emojis */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                <span className="text-gray-500 text-[11px] flex items-center gap-1 flex-shrink-0 mr-1">
                  <Smile className="w-3.5 h-3.5" /> Mẫu nhanh:
                </span>
                {QUICK_EMOJIS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCommentText((prev) => (prev ? `${prev} ${item.text}` : item.text))}
                    className="px-2.5 py-1 rounded-lg bg-dark-surface hover:bg-dark-hover text-gray-300 hover:text-white border border-dark-border flex-shrink-0 transition-colors text-[11px]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Controls: Spoiler Checkbox, Rating Attached & Submit Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  {/* Spoiler Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-gray-200 select-none">
                    <input
                      type="checkbox"
                      checked={isSpoiler}
                      onChange={(e) => setIsSpoiler(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-dark-border text-brand-red focus:ring-0 cursor-pointer accent-brand-red"
                    />
                    <span className="flex items-center gap-1 text-[12px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Tiết lộ nội dung (Spoiler)
                    </span>
                  </label>

                  {/* Rating attached to comment */}
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <span className="text-[12px]">Điểm chấm:</span>
                    <select
                      value={commentRating}
                      onChange={(e) => setCommentRating(parseInt(e.target.value, 10))}
                      className="bg-dark-surface border border-dark-border text-amber-400 font-bold px-2 py-1 rounded-md text-xs focus:outline-none"
                    >
                      {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          ⭐ {n}/10 sao
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-5 py-2 rounded-xl bg-brand-red hover:bg-brand-redHover disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-md shadow-brand-red/20 transition-all flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  Gửi bình luận
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {sortedComments.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs sm:text-sm">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-600" />
              {isSeries && discussionScope === 'episode'
                ? `Chưa có bình luận nào cho ${epName}. Hãy là người đầu tiên để lại cảm nghĩ!`
                : 'Chưa có bình luận nào. Hãy là người đầu tiên để lại cảm nghĩ về bộ phim!'}
            </div>
          ) : (
            sortedComments.map((comment) => {
              const isLiked = userReactions[comment.id] === 'like';
              const isDisliked = userReactions[comment.id] === 'dislike';
              const isSpoilerHidden = comment.isSpoiler && !revealedSpoilers[comment.id];
              const isReplying = replyingTo === comment.id;

              return (
                <div
                  key={comment.id}
                  className="p-4 sm:p-5 rounded-2xl bg-dark-surface/60 border border-dark-border/80 hover:border-dark-border transition-all space-y-3"
                >
                  {/* Author Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={comment.user.avatar}
                        alt={comment.user.name}
                        className="w-9 h-9 rounded-full bg-dark-card border border-dark-border object-cover"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-white">
                            {comment.user.name}
                          </span>
                          {comment.user.isVip ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 fill-current" /> VIP
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-dark-card text-gray-400 border border-dark-border">
                              {comment.user.badge || 'Thành viên'}
                            </span>
                          )}

                          {comment.rating && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                              <Star className="w-3 h-3 fill-current" /> {comment.rating}/10
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-500">
                          {comment.timestamp}
                        </span>
                      </div>
                    </div>

                    {/* Delete button if user is author */}
                    {user && comment.user.id === user.id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-gray-500 hover:text-brand-red p-1 transition-colors"
                        title="Xóa bình luận"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Comment Content (With Spoiler Blur Support) */}
                  <div className="text-xs sm:text-sm text-gray-200 leading-relaxed pl-12">
                    {comment.isSpoiler && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Bình luận có tiết lộ nội dung:</span>
                        <button
                          type="button"
                          onClick={() => toggleSpoiler(comment.id)}
                          className="ml-2 text-xs text-brand-gold underline hover:text-amber-300 font-bold flex items-center gap-1"
                        >
                          {isSpoilerHidden ? (
                            <>
                              <Eye className="w-3 h-3" /> Xem nội dung
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" /> Ẩn lại
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <div
                      className={`transition-all duration-300 ${
                        isSpoilerHidden
                          ? 'blur-sm select-none opacity-40 bg-black/30 p-2 rounded-lg cursor-pointer'
                          : ''
                      }`}
                      onClick={() => isSpoilerHidden && toggleSpoiler(comment.id)}
                    >
                      {comment.content}
                    </div>
                  </div>

                  {/* Actions Bar: Like, Dislike, Reply */}
                  <div className="flex items-center gap-4 pl-12 text-xs text-gray-400 pt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(comment.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        isLiked ? 'text-brand-red font-bold' : 'hover:text-white'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                      <span>{comment.likes || 0}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleDislike(comment.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        isDisliked ? 'text-blue-400 font-bold' : 'hover:text-white'
                      }`}
                    >
                      <ThumbsDown className={`w-3.5 h-3.5 ${isDisliked ? 'fill-current' : ''}`} />
                      <span>{comment.dislikes || 0}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                      className="flex items-center gap-1 hover:text-white font-medium transition-colors"
                    >
                      <CornerDownRight className="w-3.5 h-3.5" />
                      <span>{isReplying ? 'Hủy trả lời' : 'Trả lời'}</span>
                    </button>
                  </div>

                  {/* Inline Reply Input */}
                  {isReplying && (
                    <div className="pl-12 pt-2 animate-fade-in">
                      <div className="flex items-start gap-2 bg-dark-card p-3 rounded-xl border border-dark-border">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={`Trả lời bình luận của ${comment.user.name}...`}
                          rows={2}
                          className="flex-1 px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-white text-xs placeholder-gray-500 focus:outline-none focus:border-brand-red resize-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSendReply(comment.id)}
                          disabled={!replyText.trim()}
                          className="px-3.5 py-2 rounded-lg bg-brand-red hover:bg-brand-redHover disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center gap-1.5 self-end"
                        >
                          <Send className="w-3 h-3" />
                          Gửi
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Nested Replies List */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="pl-12 pt-2 space-y-2.5">
                      {comment.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="p-3 rounded-xl bg-dark-card/70 border border-dark-border/60 flex items-start gap-2.5 text-xs"
                        >
                          <img
                            src={reply.user.avatar}
                            alt={reply.user.name}
                            className="w-7 h-7 rounded-full bg-dark-surface border border-dark-border object-cover flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-white text-xs">
                                {reply.user.name}
                              </span>
                              {reply.user.isVip && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-400">
                                  VIP
                                </span>
                              )}
                              <span className="text-[10px] text-gray-500">
                                {reply.timestamp}
                              </span>
                            </div>
                            <p className="text-gray-300 leading-relaxed">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
