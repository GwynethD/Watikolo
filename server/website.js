import { readFile } from 'node:fs/promises';
import path from 'node:path';

const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp4': 'video/mp4',
  '.woff': 'font/woff', '.woff2': 'font/woff2',
};
const mediaTypes = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4']);

export async function serveWebsite(request, response, pathname, rootDir) {
  if (!['GET', 'HEAD'].includes(request.method) || pathname === '/api' || pathname.startsWith('/api/')) return false;
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return false; }
  if (decoded.includes('\\') || decoded.includes('\0')) return false;
  if (decoded.split('/').some((segment) => segment.startsWith('.'))) return false;
  const legacyMedia = decoded.startsWith('/src/pictures/');
  const base = path.resolve(rootDir, legacyMedia ? 'src/pictures' : 'dist');
  const relative = legacyMedia ? decoded.slice('/src/pictures/'.length) : decoded.slice(1);
  let filename = path.resolve(base, relative || 'index.html');
  if (!filename.startsWith(base + path.sep)) return false;
  if (legacyMedia && !mediaTypes.has(path.extname(filename).toLowerCase())) return false;
  let contents;
  try {
    contents = await readFile(filename);
  } catch (error) {
    if (!['ENOENT', 'EISDIR'].includes(error.code)) throw error;
    if (legacyMedia || path.extname(decoded) || decoded.startsWith('/assets/')) return false;
    filename = path.join(base, 'index.html');
    try { contents = await readFile(filename); } catch (error) {
      if (error.code === 'ENOENT') return false;
      throw error;
    }
  }
  const contentType = types[path.extname(filename).toLowerCase()];
  if (!contentType) return false;
  response.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': contents.length,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-cache',
  });
  response.end(request.method === 'HEAD' ? undefined : contents);
  return true;
}
