import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupabaseFetch } from './supabaseFetch.js';

const url = 'https://example.supabase.co/rest/v1/app_data';
const jwtError = { code: 'PGRST303', message: 'JWT issued at future' };
const rejected = () => Response.json(jwtError, { status: 401 });
const reset = () => new TypeError('terminated', { cause: { code: 'ECONNRESET' } });

test('retries exact JWT rejection, including writes, with bounded backoff', async () => {
  const waits = [];
  let calls = 0;
  const fetch = createSupabaseFetch({
    fetchImpl: async () => ++calls < 4 ? rejected() : Response.json({ ok: true }),
    sleep: async (ms) => waits.push(ms),
  });
  assert.deepEqual(await (await fetch(url, { method: 'POST', body: '{}' })).json(), { ok: true });
  assert.deepEqual(waits, [1000, 2000, 4000]);
});

test('returns persistent JWT rejection after four attempts', async () => {
  let calls = 0;
  const fetch = createSupabaseFetch({ fetchImpl: async () => { calls++; return rejected(); }, sleep: async () => {} });
  assert.deepEqual(await (await fetch(url)).json(), jwtError);
  assert.equal(calls, 4);
});

test('retries connection resets during read body consumption', async () => {
  let calls = 0;
  const fetch = createSupabaseFetch({
    fetchImpl: async () => ++calls === 1 ? { text: async () => { throw reset(); } } : Response.json([]),
    sleep: async () => {},
  });
  assert.deepEqual(await (await fetch(url)).json(), []);
  assert.equal(calls, 2);
});

test('does not replay writes after connection resets', async () => {
  let calls = 0;
  const fetch = createSupabaseFetch({ fetchImpl: async () => { calls++; throw reset(); } });
  await assert.rejects(fetch(url, { method: 'POST' }), /terminated/);
  assert.equal(calls, 1);
});

test('does not retry other auth errors or aborted requests', async () => {
  const fetch = createSupabaseFetch({
    fetchImpl: async () => Response.json({ code: 'PGRST303', message: 'JWT expired' }, { status: 401 }),
    sleep: async () => assert.fail('Must not retry'),
  });
  assert.equal((await fetch(url)).status, 401);
  const aborted = createSupabaseFetch({ fetchImpl: async () => { throw reset(); }, sleep: async () => assert.fail('Must not retry') });
  await assert.rejects(aborted(url, { signal: AbortSignal.abort() }));
});
