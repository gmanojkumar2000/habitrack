import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { startApiServer } from '../server/index.mjs';

const dbPath = path.join(process.cwd(), '.e2e', 'habitrack.sqlite');
fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });

const apiServer = await startApiServer({
  host: '127.0.0.1',
  port: 3121,
  serveStatic: false,
  database: { dbPath }
});
const viteBin = path.join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');
const vite = spawn(process.execPath, [viteBin, '--host', '127.0.0.1', '--port', '3120'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    API_TARGET: 'http://127.0.0.1:3121'
  },
  stdio: 'inherit'
});

const shutdown = () => {
  vite.kill();
  apiServer.close(() => process.exit(0));
};

vite.on('exit', (code) => {
  apiServer.close(() => process.exit(code ?? 0));
});
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
