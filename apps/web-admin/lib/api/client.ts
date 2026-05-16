import { getToken } from '../session';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends RequestInit {
  authenticated?: boolean;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { authenticated = false, ...rest } = options;

  const headers = new Headers(rest.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (authenticated) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...rest, headers });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new ApiError(response.status, text);
  }

  if (response.status === 204) return undefined as unknown as T;
  const text = await response.text();
  if (!text) return undefined as unknown as T;
  return JSON.parse(text) as T;
}
