// Hash string to number for deterministic pseudo-random counts
export function hashString(str) {
  let hash = 0;
  if (!str || str.length === 0) return 500;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// Generate base "mắt xem" (live viewers) based on movie slug
export function getBaseViewers(slug) {
  if (!slug) return 650;
  const hash = hashString(slug);
  // Returns between 250 and 3800
  return 250 + (hash % 3550);
}

// Format numbers: e.g. 1450 -> 1.5k, 12000 -> 12k, or full with commas
export function formatViewers(count, compact = true) {
  if (!count && count !== 0) return '0';
  if (compact) {
    if (count >= 1000000) return (count / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1).replace('.0', '') + 'k';
    return count.toString();
  }
  return count.toLocaleString('vi-VN');
}

// Format seconds to mm:ss or hh:mm:ss
export function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n) => (n < 10 ? '0' + n : n);

  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

// Safe image resolver with sleek fallback
export function getImageUrl(url, fallbackType = 'poster') {
  if (url && url.startsWith('http')) return url;
  if (fallbackType === 'backdrop') {
    return 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&q=80';
  }
  return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80';
}

// Convert Vietnamese genre name to standard URL slug
export function getGenreSlug(name) {
  if (!name) return 'hanh-dong';
  return name
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

