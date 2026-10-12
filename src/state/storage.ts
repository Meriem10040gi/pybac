// Small wrapper around localStorage: the progress stays in this browser, on this device.
// Private browsing or a full storage must not break the app, so every error is ignored.
export function getItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export function removeItem(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function keys(): string[] {
  try {
    return Object.keys(localStorage);
  } catch {
    return [];
  }
}
