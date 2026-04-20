#!/usr/bin/env node
/*
 * serve-storybook.mjs — a minimal zero-dep static file server used by
 * Playwright's webServer during `npm run test:e2e`.
 *
 * Serves the contents of ./storybook-static/ on the port given as the
 * first CLI argument (default 6106). Responds with a 404 on misses and
 * sets sane mime types on the handful of file extensions Storybook
 * produces.
 *
 * Why not sirv/serve/http-server? Dependency hygiene: DESIGN.md §Global
 * architecture line 26 is a hard ceiling on the dep tree. Every added
 * package is one more audit surface. A 40-line Node script is cheaper
 * than any of the available options.
 */

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const STATIC_DIR = resolve(ROOT, 'storybook-static');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ico':  'image/x-icon',
  '.map':  'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json'
};

async function resolvePath(urlPath) {
  let safe = decodeURIComponent(urlPath.split('?')[0]);
  if (safe.endsWith('/')) safe += 'index.html';
  // Prevent path traversal.
  const full = resolve(join(STATIC_DIR, safe));
  if (!full.startsWith(STATIC_DIR)) return null;
  try {
    const st = await stat(full);
    if (st.isDirectory()) return resolvePath(safe + '/');
    return full;
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  const full = await resolvePath(req.url || '/');
  if (!full) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }
  try {
    const body = await readFile(full);
    const mime = MIME[extname(full).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'content-type': mime,
      'cache-control': 'no-store'
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('500 ' + (err instanceof Error ? err.message : 'error'));
  }
});

const port = Number(process.argv[2] || 6106);
server.listen(port, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`serve-storybook: serving ${STATIC_DIR} on http://127.0.0.1:${port}`);
});
