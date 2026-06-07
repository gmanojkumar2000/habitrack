import { giftEmoji } from './avatars';

const invalidRewardIcons = new Set(['', '??', '?', 'Gift']);

function fallbackRewardIcon(title?: string | null) {
  const normalizedTitle = String(title || '').toLowerCase();

  if (normalizedTitle.includes('disney') || normalizedTitle.includes('trip')) {
    return '\u{1F3F0}';
  }

  return giftEmoji;
}

export function displayRewardIcon(icon?: string | null, title?: string | null) {
  const value = String(icon || '').trim();
  return invalidRewardIcons.has(value) ? fallbackRewardIcon(title) : value;
}
