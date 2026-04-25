import { apiFetch, getApiBaseUrl, StorefrontApiError } from './client';

export interface SystemInfo {
  name: string;
  version: string;
  environment: string;
  timestamp: string;
}

export interface SystemInfoStatus {
  status: 'online' | 'offline';
  baseUrl: string;
  message: string;
  info?: SystemInfo;
}

export async function getSystemInfo() {
  return apiFetch<SystemInfo>('/api/v1/system/info');
}

export async function getSystemInfoSafe(): Promise<SystemInfoStatus> {
  const baseUrl = getApiBaseUrl();

  try {
    const info = await getSystemInfo();

    return {
      status: 'online',
      baseUrl,
      message: 'El storefront pudo consultar /api/v1/system/info correctamente.',
      info,
    };
  } catch (error) {
    const message =
      error instanceof StorefrontApiError
        ? `La API respondió ${error.status}.`
        : 'La API no estuvo disponible durante esta consulta.';

    return {
      status: 'offline',
      baseUrl,
      message,
    };
  }
}
