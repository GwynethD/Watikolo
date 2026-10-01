const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');

const host = '0.0.0.0';
const publicHost = 'watikolo.localhost';
const port = 5173;
const backendHost = '127.0.0.1';
const backendPort = 3001;
const url = `http://${publicHost}:${port}/`;
const backendUrl = `http://${backendHost}:${backendPort}/`;

function isPortFree(portToCheck, hostToCheck) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(portToCheck, hostToCheck);
  });
}

async function main() {
  let backend = null;
  if (await isPortFree(backendPort, backendHost)) {
    backend = spawn(process.execPath, [path.join(__dirname, '..', 'server', 'server.js')], {
      stdio: 'inherit',
      shell: false,
    });
  } else {
    console.log(`Backend already running: ${backendUrl}`);
  }

  if (!(await isPortFree(port, host))) {
    console.log(`Dev server already running: ${url}`);
    backend?.kill();
    return;
  }

  const viteBin = path.join(__dirname, '..', 'node_modules', 'vite', 'bin', 'vite.js');
  console.log(`Watikolo demo: ${url}`);

  const vite = spawn(process.execPath, [viteBin, '--host', host, '--port', String(port), '--strictPort'], {
    stdio: 'inherit',
    shell: false,
  });

  vite.on('error', (error) => {
    console.error(`Failed to start Vite: ${error.message}`);
    backend?.kill();
    process.exit(1);
  });

  vite.on('close', (code) => {
    backend?.kill();
    process.exit(code ?? 0);
  });

  process.on('SIGINT', () => {
    backend?.kill();
    vite.kill();
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
