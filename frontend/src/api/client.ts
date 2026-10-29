import { BackendApiError } from '../types';

export class ApiError extends Error {
  code: string;
  status: number;
  details: any[];

  constructor(status: number, message: string, code: string = 'API_ERROR', details: any[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 204) {
      return {} as T;
    }

    const contentType = res.headers.get('content-type');
    let data: any = null;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      let message = `Request failed with status ${res.status}`;
      let code = 'HTTP_ERROR';
      let details: any[] = [];

      if (data && typeof data === 'object') {
        const errObj = (data as BackendApiError).error || data;
        if (errObj.message) message = errObj.message;
        if (errObj.code) code = errObj.code;
        if (errObj.details) details = errObj.details;
      }

      throw new ApiError(res.status, message, code, details);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network or parser error
    throw new ApiError(
      0,
      err.message || 'Unable to connect to the backend server. Please verify it is running.',
      'NETWORK_ERROR'
    );
  }
}
