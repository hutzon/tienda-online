import { apiFetch } from './client';

export interface DevTokenResponse {
  token: string;
  expiresIn: number;
  warning: string;
}

export function requestDevToken(username: string, role: string): Promise<DevTokenResponse> {
  return apiFetch<DevTokenResponse>('/api/v1/auth/dev/token', {
    method: 'POST',
    body: JSON.stringify({ username, role }),
  });
}
