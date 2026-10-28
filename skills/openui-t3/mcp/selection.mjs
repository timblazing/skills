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
export function visibleItems(items, query = '', status = '', sort = 'source') {
  const result = items.filter(row => (!status || row.status === status) && JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
  return sort === 'source' ? result : result.sort((a, b) => String(a[sort]).localeCompare(String(b[sort])));
}
