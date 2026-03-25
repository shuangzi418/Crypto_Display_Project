const fs = require('fs');
const net = require('net');
const path = require('path');
const { spawnSync } = require('child_process');

const isWindows = process.platform === 'win32';
const projectRoot = path.resolve(__dirname, '..');
const backendEnvPath = path.resolve(projectRoot, 'backend', '.env');
const ruoyiRoot = path.resolve(projectRoot, 'admin', 'ruoyi-vue');
const ruoyiUiRoot = path.resolve(ruoyiRoot, 'ruoyi-ui');
const ruoyiAdminJar = path.resolve(ruoyiRoot, 'ruoyi-admin', 'target', 'ruoyi-admin.jar');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  });

  return env;
}

function loadBackendEnv() {
  return parseEnvFile(backendEnvPath);
}

function buildRuoyiBackendEnv() {
  const backendEnv = loadBackendEnv();

  return {
    MYSQL_HOST: backendEnv.DB_HOST || '127.0.0.1',
    MYSQL_PORT: backendEnv.DB_PORT || '3306',
    MYSQL_DB: backendEnv.DB_NAME || 'crypto_quiz',
    MYSQL_USER: backendEnv.DB_USER || 'root',
    MYSQL_PASSWORD: backendEnv.DB_PASSWORD || '',
    REDIS_HOST: backendEnv.REDIS_HOST || '127.0.0.1',
    REDIS_PORT: backendEnv.REDIS_PORT || '6379'
  };
}

function resolveJavaCommand() {
  const javaHome = process.env.JAVA_HOME || '';
  if (javaHome) {
    const candidate = path.resolve(javaHome, 'bin', isWindows ? 'java.exe' : 'java');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return isWindows ? 'java.exe' : 'java';
}

function resolveNpmCommand() {
  return isWindows ? 'npm.cmd' : 'npm';
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: isWindows,
    ...options
  });

  return {
    success: result.status === 0,
    status: result.status,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim()
  };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function canAutoStartLocalRedis(host) {
  return host === '127.0.0.1' || host === 'localhost';
}

function isPortOpen(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const finish = (value) => {
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(1000);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(Number(port), host);
  });
}

function isLocalHost(host) {
  return host === '127.0.0.1' || host === 'localhost' || host === '0.0.0.0';
}

function isLocalPortAvailable(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.unref();
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        resolve(false);
        return;
      }

      resolve(false);
    });

    server.listen({ port: Number(port), host }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function ensureTcpServiceReachable({ name, host, port }) {
  const reachable = await isPortOpen(host, port);
  if (!reachable) {
    throw new Error(`${name} is unreachable at ${host}:${port}. Check backend/.env and ensure the service is running.`);
  }

  return { name, host, port, reachable: true };
}

async function ensureLocalPortAvailable({ name, port, host = '127.0.0.1' }) {
  const available = await isLocalPortAvailable(port, host);
  if (!available) {
    throw new Error(`${name} cannot start because port ${port} is already in use. Run \`npm run stop\` or free the port manually.`);
  }

  return { name, port, host, available: true };
}

async function ensureRedisAvailable({ host = '127.0.0.1', port = '6379', containerName = 'cryptoquiz-redis' } = {}) {
  if (await isPortOpen(host, port)) {
    return { mode: 'existing', host, port };
  }

  if (!canAutoStartLocalRedis(host)) {
    throw new Error(`Redis not reachable at ${host}:${port}. Auto-start only supports localhost/127.0.0.1.`);
  }

  const dockerVersion = runCommand('docker', ['version', '--format', '{{.Server.Version}}']);
  if (!dockerVersion.success) {
    throw new Error(`Redis not reachable at ${host}:${port}, and Docker is unavailable.`);
  }

  const existing = runCommand('docker', ['ps', '-a', '--filter', `name=^/${containerName}$`, '--format', '{{.Names}}|{{.Status}}']);
  const existingLine = existing.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith(`${containerName}|`));

  if (existingLine) {
    const started = runCommand('docker', ['start', containerName]);
    if (!started.success) {
      throw new Error(`Failed to start Redis container ${containerName}: ${started.stderr || started.stdout}`);
    }
  }
  else
  {
    const created = runCommand('docker', ['run', '-d', '--name', containerName, '-p', `${port}:6379`, 'redis:7-alpine']);
    if (!created.success) {
      throw new Error(`Failed to create Redis container ${containerName}: ${created.stderr || created.stdout}`);
    }
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await isPortOpen(host, port)) {
      return { mode: 'docker', host, port, containerName };
    }
    await wait(1000);
  }

  throw new Error(`Redis container ${containerName} started but ${host}:${port} is still unreachable.`);
}

module.exports = {
  isWindows,
  projectRoot,
  ruoyiRoot,
  ruoyiUiRoot,
  ruoyiAdminJar,
  loadBackendEnv,
  buildRuoyiBackendEnv,
  ensureRedisAvailable,
  ensureTcpServiceReachable,
  ensureLocalPortAvailable,
  isLocalHost,
  isLocalPortAvailable,
  resolveJavaCommand,
  resolveNpmCommand
};
