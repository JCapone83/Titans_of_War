import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const preferredPort = Number(process.env.PORT || 5173);

function openUrl(url) {
  if (process.env.TITANS_NO_OPEN === '1') return;

  const platform = process.platform;
  const command = platform === 'darwin'
    ? 'open'
    : platform === 'win32'
      ? 'cmd'
      : 'xdg-open';
  const args = platform === 'win32'
    ? ['/c', 'start', '', url]
    : [url];

  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
    shell: false,
  });
  child.unref();
}

const server = await createServer({
  server: {
    host: '127.0.0.1',
    port: preferredPort,
    strictPort: false,
  },
});

await server.listen();
server.printUrls();

const localUrl = server.resolvedUrls?.local?.[0] || `http://127.0.0.1:${preferredPort}/`;
console.log('');
console.log(`Titans of War is running at ${localUrl}`);
console.log('Press Control-C in this window to stop the game server.');

setTimeout(() => openUrl(localUrl), 500);

async function shutdown() {
  await server.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await new Promise(() => {});
