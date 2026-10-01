import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { serveWebsite } from './website.js';

test('production website serves routes and media without exposing server files', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'watikolo-website-'));
  try {
    await mkdir(path.join(root, 'dist/assets'), { recursive: true });
    await mkdir(path.join(root, 'src/pictures'), { recursive: true });
    await writeFile(path.join(root, 'dist/index.html'), '<html>Watikolo</html>');
    await writeFile(path.join(root, 'dist/assets/app.js'), 'console.log(1)');
    await writeFile(path.join(root, 'src/pictures/villa.png'), 'image');
    await writeFile(path.join(root, '.env'), 'secret');
    async function request(url, method = 'GET') {
      const result = {};
      result.handled = await serveWebsite({ method }, {
        writeHead(status, headers) { Object.assign(result, { status, headers }); },
        end(body) { result.body = body?.toString(); },
      }, url, root);
      return result;
    }
    assert.equal((await request('/about')).body, '<html>Watikolo</html>');
    assert.equal((await request('/admin/bookings')).status, 200);
    assert.equal((await request('/assets/app.js')).headers['Content-Type'], 'text/javascript; charset=utf-8');
    assert.equal((await request('/src/pictures/villa.png')).body, 'image');
    assert.equal((await request('/about', 'HEAD')).body, undefined);
    for (const url of ['/api/missing', '/.env', '/%2e%2e/.env', '/src/pictures/../../.env', '/src/pictures/voucher.pdf', '/assets/missing.js', '/%ZZ']) {
      assert.equal((await request(url)).handled, false, url);
    }
    assert.equal((await request('/about', 'POST')).handled, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
