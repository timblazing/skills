// Shared pure selection semantics for all three workflow components.
export function validateItems(items) {
  if (!Array.isArray(items) || items.length > 100) return 'Supply at most 100 snapshot entries.';
  const ids = new Set();
  for (const row of items) {
    if (!row || typeof row.id !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,119}$/.test(row.id) || ids.has(row.id)) return 'Entries need unique stable IDs (1–120 safe characters).';
    ids.add(row.id);
  }
  return null;
}
export const selectedItems = (items, selection) => items.filter(row => Object.hasOwn(selection ?? {}, row.id) && selection[row.id] === true);
// Emit only true entries: deselecting deletes the key instead of storing false.
export function toggleSelection(selection, id) {
  const next = Object.fromEntries(Object.entries(selection ?? {}).filter(([, value]) => value === true));
  if (next[id]) delete next[id]; else next[id] = true;
  return next;
}
// Search only text the user can see; field names and stable IDs never match.
const searchable = row => [row.title, row.status, row.details, ...Object.values(row.criteria ?? {}), row.recommendation ?? ''].join('\n').toLowerCase();
export function visibleItems(items, query = '', status = '', sort = 'source') {
  const needle = query.trim().toLowerCase();
  const result = items.filter(row => (!status || row.status === status) && (!needle || searchable(row).includes(needle)));
  return sort === 'source' ? result : result.sort((a, b) => String(a[sort]).localeCompare(String(b[sort])));
}
