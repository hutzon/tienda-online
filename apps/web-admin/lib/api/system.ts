import { apiFetch } from './client';

export interface SystemInfo {
  name: string;
  version: string;
  environment: string;
  timestamp: string;
}

export interface PingResponse {
  message: string;
}

export function getSystemInfo(): Promise<SystemInfo> {
  return apiFetch<SystemInfo>('/api/v1/system/info');
}

export function pingAdmin(): Promise<PingResponse> {
  return apiFetch<PingResponse>('/api/v1/admin/ping', { authenticated: true });
}
