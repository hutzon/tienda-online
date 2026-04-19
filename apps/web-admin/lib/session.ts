const TOKEN_COOKIE = 'admin_token';
const EXPIRY_DAYS = 1;

export function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${TOKEN_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export function setToken(token: string): void {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setDate(expires.getDate() + EXPIRY_DAYS);
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
}

export function clearToken(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${TOKEN_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}
