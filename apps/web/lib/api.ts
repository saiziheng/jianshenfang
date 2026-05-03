export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api';

export type ApiList<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ylf_token') : null;
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      cache: 'no-store'
    });
  } catch {
    throw new Error(`无法连接后端服务，请确认 API 已启动：${API_BASE}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json().catch(() => ({})) : {};
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ylf_token');
      localStorage.removeItem('ylf_admin');
      window.location.assign('/login');
    }
    throw new Error('登录已过期，请重新登录');
  }
  if (!response.ok) {
    const msg = Array.isArray(payload.message)
      ? payload.message.join('; ')
      : (payload.message ?? `请求失败（HTTP ${response.status}）`);
    throw new Error(msg);
  }
  return payload as T;
}

export function toArrayPayload<T>(payload: T[] | { items: T[] }): T[] {
  return Array.isArray(payload) ? payload : payload.items;
}
