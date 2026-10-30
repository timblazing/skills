import assert from 'node:assert/strict';
import { test } from 'node:test';
import { envelope, selectState, actionSelection, contextQueue, staleClearGate } from '../handoff.mjs';

test('selection includes only opted-in reactive keys, preserving IDs and empty values', () => {
  assert.deepEqual(selectState({ $ids: ['repo-123'], $empty: '', $secret: 'private', form: {} }, ['ids', 'empty']), { ids: ['repo-123'], empty: '' });
  assert.deepEqual(actionSelection({ params: { context: { id: 'a' } }, formState: { secret: 'private' } }), { id: 'a' });
  assert.equal(envelope('one', 'Review', {}).version, 1);
  assert.notEqual(envelope('one', 'Review', {}).interfaceId, envelope('two', 'Review', {}).interfaceId);
  assert.throws(() => envelope('one', 'Review', { text: '🦊'.repeat(3_000) }), /too large/);
});

test('context writes serialize, coalesce rapid changes, deduplicate and clear', async () => {
  let release;
  const sent = [], done = [];
  const queue = contextQueue(async text => {
    sent.push(text);
    if (text === 'first') await new Promise(resolve => { release = resolve; });
  });
  const pending = queue('first', () => done.push('first'));
  queue('intermediate');
  queue('latest', () => done.push('latest'));
  release();
  await pending;
  await queue('latest');
  await queue('clear');
  assert.deepEqual(sent, ['first', 'latest', 'clear']);
  assert.deepEqual(done, ['latest']);
});

test('failed context writes do not claim success or retry automatically', async () => {
  let attempts = 0, failures = 0, confirmations = 0;
  const queue = contextQueue(async () => { attempts++; throw new Error('disconnected'); });
  await queue('value', () => confirmations++, () => failures++);
  assert.equal(attempts, 1);
  assert.equal(failures, 1);
  assert.equal(confirmations, 0);
});

test('stale context clears once per completed identity, after both result and connection', () => {
  const gate = staleClearGate(), ready = { connected: true, interfaceId: 'frame-1', keys: ['selectedOptions'], canUpdate: true };
  assert.equal(gate({ ...ready, connected: false }), false, 'result before connect waits');
  assert.equal(gate({ ...ready, interfaceId: undefined }), false, 'partial input has no identity');
  assert.equal(gate({ ...ready, keys: [] }), false, 'nothing allowlisted, nothing to clear');
  assert.equal(gate({ ...ready, canUpdate: false }), false);
  assert.equal(gate(ready), true);
  assert.equal(gate(ready), false, 'once per identity');
  assert.equal(gate({ ...ready, interfaceId: 'frame-2' }), true);
});
