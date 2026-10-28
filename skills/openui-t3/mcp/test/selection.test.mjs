import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selectedItems, visibleItems, validateItems } from '../selection.mjs';
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
test('personal envelopes identify the matching contract and only opted-in reactive state', () => {
  const selection = selectState({ $selectedOptions: { z: true }, $reviewFocus: 'risks', $secret: 'omit' }, ['selectedOptions', 'reviewFocus']);
  assert.deepEqual(envelope('frame-1', 'Review', selection, 'openui-personal@1'), {
    version: 1, library: 'openui-personal@1', interfaceId: 'frame-1', title: 'Review', selection: { selectedOptions: { z: true }, reviewFocus: 'risks' },
  });
});
