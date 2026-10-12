// An admin lands in the back-office (/admin). "Voir le site élève" opens the student pages for the
// rest of the visit (this tab); logging in again, or "Retour au back-office", goes back.
const KEY = 'pybac-student-view';

export function studentView(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function setStudentView(on: boolean) {
  try {
    if (on) sessionStorage.setItem(KEY, '1');
    else sessionStorage.removeItem(KEY);
  } catch {}
}
