import { setTimeout as delay } from 'node:timers/promises';

// Authentication rejection happens before a write executes. Network failures,
// however, are safe to replay only for reads: a write may already have committed.
export function createSupabaseFetch({ fetchImpl = globalThis.fetch, sleep = delay } = {}) {
  return async function supabaseFetch(input, init) {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (!url.pathname.startsWith('/rest/v1/')) return fetchImpl(input, init);

    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
    const waits = [1000, 2000, 4000];
    for (let attempt = 0; ; attempt += 1) {
      let response;
      let body;
      try {
        response = await fetchImpl(input instanceof Request ? input.clone() : input, init);
        // A connection reset can occur after headers arrive, while reading JSON.
        body = await response.text();
      } catch (error) {
        const code = error?.cause?.code ?? error?.code;
        const transient = ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'UND_ERR_SOCKET', 'UND_ERR_CONNECT_TIMEOUT'].includes(code);
        if (signal?.aborted || !['GET', 'HEAD'].includes(method) || !transient || attempt >= waits.length) throw error;
        await sleep(waits[attempt], undefined, { signal });
        continue;
      }

      let futureJwt = false;
      if (response.status === 401) {
        try {
          const error = JSON.parse(body);
          futureJwt = error.code === 'PGRST303' && error.message === 'JWT issued at future';
        } catch { /* Return unexpected response bodies unchanged. */ }
      }
      if (futureJwt && attempt < waits.length && !signal?.aborted) {
        await sleep(waits[attempt], undefined, { signal });
        continue;
      }
      return new Response(method === 'HEAD' || [204, 205, 304].includes(response.status) ? null : body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }
  };
}
