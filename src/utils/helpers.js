// Format price in PKR
export const formatPrice = (price) => {
  if (price === null || price === undefined) return '---';
  return `₨${parseFloat(price).toFixed(2)}`;
};

// Format volume
export const formatVolume = (volume) => {
  if (!volume) return '---';
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(2)}M`;
  }
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toString();
};

// Format percentage
export const formatPercent = (percent) => {
  if (percent === null || percent === undefined) return '---';
  const value = parseFloat(percent).toFixed(2);
  return `${value > 0 ? '+' : ''}${value}%`;
};

// Get color based on value
export const getColorByChange = (value) => {
  if (value > 0) return '#22c55e';
  if (value < 0) return '#ef4444';
  return '#94a3b8';
};

// Get signal color
export const getSignalColor = (signal) => {
  const colors = {
    'BUY_OVERSOLD': '#22c55e',
    'STRONG_BUY': '#16a34a',
    'BUY_VOLUME': '#4ade80',
    'SELL_OVERBOUGHT': '#ef4444',
    'STRONG_SELL': '#dc2626',
    'SELL_VOLUME': '#f87171',
    'NEUTRAL': '#94a3b8',
    'NO_DATA': '#64748b',
  };
  return colors[signal] || '#94a3b8';
};

// Get signal label
export const getSignalLabel = (signal) => {
  const labels = {
    'BUY_OVERSOLD': 'BUY',
    'STRONG_BUY': 'STRONG BUY',
    'BUY_VOLUME': 'BUY',
    'SELL_OVERBOUGHT': 'SELL',
    'STRONG_SELL': 'STRONG SELL',
    'SELL_VOLUME': 'SELL',
    'NEUTRAL': 'NEUTRAL',
    'NO_DATA': 'NO DATA',
  };
  return labels[signal] || signal;
};

// Format time from timestamp
export const formatTime = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Calculate time ago
export const timeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};