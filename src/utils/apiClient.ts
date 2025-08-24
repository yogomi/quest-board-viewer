/* 共通 API クライアント
 * - Hono サーバーの {success, code, message, data} 仕様に合わせてラップ
 * - エラー時は例外を投げる（呼び出し側でキャッチして UI 表示）
 */

import { getUrlPrefix } from 'utils/urlPrefix';

type ApiSuccess<T> = {
  success: true;
  code: string;
  message: string;
  data: T;
};

type ApiError = {
  success: false;
  code: string;
  message: string;
  data: null | Record<string, unknown>;
};

type ApiResponse<T> = ApiSuccess<T> | ApiError;

const API_BASE = `${getUrlPrefix()}/api/v1`;

function toQuery(params?: Record<string, string | number | undefined>): string {
  if (!params) return '';
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) usp.set(k, String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : '';
}

async function handle<T>(res: Response): Promise<T> {
  const json = (await res.json()) as ApiResponse<T>;
  if (!('success' in json)) {
    throw new Error('Invalid API response shape.');
  }
  if (json.success) return json.data;
  const err = new Error(json.message || 'API Error');
  (err as any).code = json.code || 'unknown_error';
  throw err;
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}${toQuery(params)}`, {
    method: 'GET',
    credentials: 'include',
  });
  return handle<T>(res);
}

export async function apiPost<T, B = unknown>(
  path: string,
  body: B
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

export async function apiPatch<T, B = unknown>(
  path: string,
  body: B
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

export async function apiDelete<T>(
  path: string
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handle<T>(res);
}
