import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selectedItems, visibleItems, validateItems, toggleSelection } from '../selection.mjs';
import { envelope, selectState } from '../handoff.mjs';
const rows = [{ id: 'z', title: 'Zulu', status: 'pending', details: 'long evidence', criteria: {} }, { id: 'a', title: 'Alpha', status: 'complete', details: 'other evidence', criteria: {} }];
test('all review workflows retain stable selections across search, status filters and sorting', () => {
  const selection = { z: true, a: false, stale: true };
  assert.deepEqual(visibleItems(rows, '', '', 'title').map(row => row.id), ['a', 'z']);
  assert.deepEqual(visibleItems(rows, 'other', 'complete').map(row => row.id), ['a']);
  assert.deepEqual(selectedItems(rows, selection).map(row => row.id), ['z']);
  assert.deepEqual(visibleItems(rows, 'no results'), []);
  assert.deepEqual(selectedItems(rows, {}), []);
  assert.equal(rows[1].status, 'complete');
  assert.equal(validateItems(rows), null);
  assert.match(validateItems([rows[0], rows[0]]), /unique stable IDs/);
  assert.match(validateItems([{ id: '' }]), /unique stable IDs/);
  assert.match(validateItems(Array(101).fill(rows[0])), /at most 100/);
});
test('toggling emits only true entries, deletes deselected keys and keeps stable IDs and supplied status', () => {
  const plan = [{ id: 'inspect', title: 'Inspect', status: 'complete', details: '', criteria: {} }, { id: 'impl/2', title: 'Implement', status: 'pending', details: '', criteria: {} }];
  let selection = toggleSelection({}, 'impl/2');
  assert.deepEqual(selection, { 'impl/2': true });
  selection = toggleSelection(selection, 'inspect');
  selection = toggleSelection(selection, 'impl/2');
  assert.deepEqual(selection, { inspect: true });
  assert.deepEqual(toggleSelection(selection, 'inspect'), {});
  assert.deepEqual(toggleSelection({ old: false, kept: true }, 'impl/2'), { kept: true, 'impl/2': true });
  assert.deepEqual(plan.map(row => row.status), ['complete', 'pending']);
});
test('search matches visible values only, never field names or IDs', () => {
  const many = Array.from({ length: 12 }, (_, i) => ({ id: `row-${i}`, title: `Service ${i}`, status: i % 3 ? 'healthy' : 'degraded', details: i === 4 ? 'Disk nearly full' : 'Nominal', criteria: { Region: `host-${i}` }, ...(i === 7 ? { recommendation: 'Rotate keys' } : {}) }));
  for (const field of ['title', 'details', 'criteria', 'status', 'recommendation', 'Region', 'id', 'row-3']) assert.deepEqual(visibleItems(many, field), [], field);
  assert.deepEqual(visibleItems(many, 'disk').map(row => row.id), ['row-4']);
  assert.deepEqual(visibleItems(many, 'HOST-11').map(row => row.id), ['row-11']);
  assert.deepEqual(visibleItems(many, 'rotate').map(row => row.id), ['row-7']);
  assert.equal(visibleItems(many, '', 'degraded').length, 4);
  assert.deepEqual(visibleItems(many, '', '', 'status').slice(0, 4).map(row => row.status), Array(4).fill('degraded'));
  assert.equal(visibleItems(many, '  ').length, 12);
});
test('personal envelopes identify the matching contract and only opted-in reactive state', () => {
  const selection = selectState({ $selectedOptions: { z: true }, $reviewFocus: 'risks', $secret: 'omit' }, ['selectedOptions', 'reviewFocus']);
  assert.deepEqual(envelope('frame-1', 'Review', selection, 'openui-personal@1'), {
    version: 1, library: 'openui-personal@1', interfaceId: 'frame-1', title: 'Review', selection: { selectedOptions: { z: true }, reviewFocus: 'risks' },
  });
});
