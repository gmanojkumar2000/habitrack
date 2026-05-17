import path from 'node:path';
import { spawn } from 'node:child_process';
import { startApiServer } from './index.mjs';

const apiServer = await startApiServer({ port: 3021, serveStatic: false });
const viteBin = path.join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');
const vite = spawn(process.execPath, [viteBin, '--host', '0.0.0.0', '--port', '3020'], {
  cwd: process.cwd(),
  env: process.env,
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
