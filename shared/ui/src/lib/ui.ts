export function ui(): string {
  return 'ui';
}

// Generate dicebear avatar url (identicon by default)
export function dicebearAvatar(seed: string, style: string = 'identicon'): string {
  return `https://api.dicebear.com/8.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}
