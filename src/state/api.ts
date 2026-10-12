// Calls to the server (server/app.ts). The session cookie is sent by the browser itself.

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** No answer at all (no internet, server stopped): status 0. */
export const offline = (e: unknown) => e instanceof ApiError && e.status === 0;

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init?.method ?? (init?.body !== undefined ? 'POST' : 'GET'),
      headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(0, 'Pas de connexion au serveur. Vérifiez internet.');
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.error ?? (res.status >= 500 ? 'Le serveur ne répond pas. Réessayez dans un moment.' : 'Le serveur a rencontré un problème.'));
  return json as T;
}
