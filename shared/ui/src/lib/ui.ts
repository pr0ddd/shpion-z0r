export function ui(): string {
  return 'ui';
}

// Generate dicebear avatar url (identicon by default) with simple in-memory cache
const _avatarCache: Record<string, string> = {};

export function dicebearAvatar(seed: string, style: string = 'identicon'): string {
  const key = `${style}:${seed}`;
  if (_avatarCache[key]) return _avatarCache[key];
  const url = `https://api.dicebear.com/8.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
  _avatarCache[key] = url;
  return url;
}
