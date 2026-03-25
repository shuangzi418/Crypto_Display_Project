const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

const isWindows = process.platform === 'win32';
const portsFile = path.resolve(__dirname, '..', '.dev-ports.json');

function findFreePort(startPort) {
  return new Promise((resolve, reject) => {
    const tryPort = (port) => {
      const server = net.createServer();

      server.unref();
      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          tryPort(port + 1);
          return;
        }

        reject(error);
      });

      server.listen(port, () => {
        const { port: freePort } = server.address();
        server.close(() => resolve(freePort));
      });
    };

    tryPort(startPort);
  });
}

function prefixOutput(stream, prefix, target) {
  let buffer = '';

  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop();

    lines.forEach((line) => {
      if (line.length > 0) {
        target.write(`${prefix} ${line}\n`);
      }
    });
  });

  stream.on('end', () => {
    if (buffer.length > 0) {
      target.write(`${prefix} ${buffer}\n`);
    }
  });
}

function spawnCommand(command, args, options) {
  return spawn(command, args, {
    shell: isWindows,
    stdio: ['inherit', 'pipe', 'pipe'],
    ...options
  });
}

async function main() {
  const backendPort = await findFreePort(5000);
  const frontendPort = await findFreePort(3001);
  const apiProxy = `http://localhost:${backendPort}`;

  console.log(`Starting backend on http://localhost:${backendPort}`);
  console.log(`Starting frontend on http://localhost:${frontendPort}`);
  console.log(`Frontend API proxy -> ${apiProxy}`);

  fs.writeFileSync(portsFile, JSON.stringify({ backendPort, frontendPort }, null, 2));

  const backend = spawnCommand('npm', ['run', 'dev', '--prefix', 'backend'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(backendPort)
    }
  });

  const frontend = spawnCommand('npm', ['start', '--prefix', 'frontend'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(frontendPort),
      API_PROXY: apiProxy
    }
  });

  prefixOutput(backend.stdout, '[backend]', process.stdout);
  prefixOutput(backend.stderr, '[backend]', process.stderr);
  prefixOutput(frontend.stdout, '[frontend]', process.stdout);
  prefixOutput(frontend.stderr, '[frontend]', process.stderr);

  const shutdown = (signal) => {
    backend.kill(signal);
    frontend.kill(signal);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  backend.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[backend] exited with code ${code}`);
    }
  });

  frontend.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[frontend] exited with code ${code}`);
    }
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
