// Calls to the server (server/app.ts). The session cookie is sent by the browser itself.

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** The account this tab shows (set by src/state/auth.tsx), sent with every request: the server
 * refuses to save into another account (see sameAccount in server/app.ts). */
let account: number | null = null;
export function setApiAccount(id: number | null) {
  account = id;
}

/** No answer at all (no internet, server stopped): status 0. */
export const offline = (e: unknown) => e instanceof ApiError && e.status === 0;

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init?.method ?? (init?.body !== undefined ? 'POST' : 'GET'),
      headers: {
        ...(init?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(account !== null ? { 'X-PyBac-User': String(account) } : {}),
      },
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(0, 'Impossible de joindre le serveur. Vérifiez la connexion internet, puis réessayez dans un moment.');
  }
  const json = await res.json().catch(() => null);
  // the session of this browser is now another account (logged in in another tab): start again
  // with the right account; what was not sent stays on this device, for its own account
  if (res.status === 409 && json?.code === 'other-account') window.location.reload();
  if (!res.ok) throw new ApiError(res.status, json?.error ?? (res.status >= 500 ? 'Le serveur ne répond pas. Réessayez dans un moment.' : 'Le serveur a rencontré un problème.'));
  return json as T;
}
