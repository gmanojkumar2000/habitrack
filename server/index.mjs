import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { clearState, getSchema, getState, initDatabase, replaceState } from './database.mjs';

const defaultStaticDir = fs.existsSync(path.join(process.cwd(), 'www')) ? 'www' : 'dist';

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

export async function startApiServer(options = {}) {
  const port = Number(options.port || process.env.PORT || 3020);
  const host = options.host || process.env.HOST || '0.0.0.0';
  const serveStatic = options.serveStatic ?? true;
  const distDir = path.resolve(options.distDir || path.join(process.cwd(), defaultStaticDir));
  const database = await initDatabase(options.database || {});

  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

      if (requestUrl.pathname.startsWith('/api/')) {
        await handleApiRequest(req, res, requestUrl, database.dbPath);
        return;
      }

      if (serveStatic) {
        serveDist(res, distDir, requestUrl.pathname);
        return;
      }

      sendJson(res, 404, { error: 'Not found' });
    } catch (error) {
      console.error(error);
      sendJson(res, 500, { error: error.message || 'Server error' });
    }
  });

  await new Promise((resolve) => server.listen(port, host, resolve));
  console.log(`Habitrack API listening on http://${host}:${port}`);
  console.log(`SQLite database: ${database.dbPath}`);

  return server;
}

async function handleApiRequest(req, res, requestUrl, dbPath) {
  if (req.method === 'GET' && requestUrl.pathname === '/api/health') {
    sendJson(res, 200, { ok: true, dbPath });
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/schema') {
    sendJson(res, 200, { schema: getSchema() });
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/state') {
    sendJson(res, 200, getState());
    return;
  }

  if (req.method === 'PUT' && requestUrl.pathname === '/api/state') {
    const state = await readJson(req);
    sendJson(res, 200, replaceState(state));
    return;
  }

  if (req.method === 'DELETE' && requestUrl.pathname === '/api/state') {
    sendJson(res, 200, clearState());
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
}

function serveDist(res, distDir, pathname) {
  const normalizedPath = pathname === '/' ? '/index.html' : pathname;
  const requestedPath = path.normalize(decodeURIComponent(normalizedPath)).replace(/^[/\\]+/, '');
  let filePath = path.join(distDir, requestedPath);

  if (!filePath.startsWith(distDir)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    sendJson(res, 404, { error: 'Build output not found. Run npm run build first.' });
    return;
  }

  const fileName = path.basename(filePath);
  const headers = {
    'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream'
  };

  if (['index.html', 'registerSW.js', 'sw.js', 'manifest.webmanifest'].includes(fileName)) {
    headers['Cache-Control'] = 'no-store';
  }

  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
}

async function readJson(req) {
  let body = '';

  for await (const chunk of req) {
    body += chunk;
    if (body.length > 5_000_000) {
      throw new Error('Request body too large');
    }
  }

  return body ? JSON.parse(body) : {};
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  startApiServer();
}
