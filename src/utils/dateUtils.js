/**
 * Shared date utilities — single source of truth for the entire app.
 * All date strings are in YYYY-MM-DD format, timezone-adjusted to the user's local clock.
 */

function toLocalDate(offset = 0) {
  const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  d.setDate(d.getDate() + offset);
  return d;
}

export function getTodayString() {
  return toLocalDate(0).toISOString().split("T")[0];
}

export function getYesterdayString() {
  return toLocalDate(-1).toISOString().split("T")[0];
}

export function getMonthStartString() {
  const d = toLocalDate(0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function formatDateString(offset = 0) {
  const d = toLocalDate(offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
