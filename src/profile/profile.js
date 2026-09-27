export const AVATARS = ['😎', '🦊', '🐱', '🐼', '🦁', '🐸', '🐙', '🦄', '🤖', '👾', '🐯', '🐧'];

export const MAX_NAME_LENGTH = 16;

export const defaultProfile = () => ({
  name: '',
  avatar: AVATARS[0],
  symbol: 'X',
});

export function sanitizeName(name) {
  return String(name ?? '')
    .replace(/[\u0000-\u001f<>]/g, '')
    .trim()
    .slice(0, MAX_NAME_LENGTH);
}
