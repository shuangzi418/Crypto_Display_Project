const fs = require('fs');
const { spawn } = require('child_process');
const {
  isWindows,
  projectRoot,
  ruoyiUiRoot,
  ruoyiAdminJar,
  buildRuoyiBackendEnv,
  ensureRedisAvailable,
  ensureTcpServiceReachable,
  ensureLocalPortAvailable,
  resolveJavaCommand,
  resolveNpmCommand
} = require('./ruoyiEnv');

function prefixOutput(stream, prefix, target) {
  let buffer = '';

  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop();

    lines.forEach((line) => {
      if (line) {
        target.write(`${prefix} ${line}\n`);
      }
    });
  });

  stream.on('end', () => {
    if (buffer) {
      target.write(`${prefix} ${buffer}\n`);
    }
  });
}

async function main() {
  if (!fs.existsSync(ruoyiAdminJar)) {
    console.error(`Missing jar: ${ruoyiAdminJar}`);
    console.error('Run `"C:\\develop\\apache-maven-3.9.14\\bin\\mvn.cmd" -DskipTests install` in admin/ruoyi-vue first.');
    process.exit(1);
  }

  const backendEnv = buildRuoyiBackendEnv();
  await ensureTcpServiceReachable({
    name: 'MySQL',
    host: backendEnv.MYSQL_HOST,
    port: backendEnv.MYSQL_PORT
  });
  await ensureLocalPortAvailable({
    name: 'RuoYi admin',
    port: 8080
  });
  await ensureLocalPortAvailable({
    name: 'RuoYi UI',
    port: 8081
  });
  const redisState = await ensureRedisAvailable({
    host: backendEnv.REDIS_HOST,
    port: backendEnv.REDIS_PORT
  });

  console.log(`MySQL reachable at ${backendEnv.MYSQL_HOST}:${backendEnv.MYSQL_PORT}`);
  console.log('Starting RuoYi admin backend on http://localhost:8080');
  console.log('Starting RuoYi UI on http://localhost:8081');
  console.log('Ports 8080 and 8081 are available');
  console.log(`Redis ready on ${redisState.host}:${redisState.port} (${redisState.mode})`);

  const admin = spawn(resolveJavaCommand(), ['-jar', ruoyiAdminJar], {
    cwd: projectRoot,
    shell: false,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: {
      ...process.env,
      ...backendEnv
    }
  });

  const ui = spawn(resolveNpmCommand(), ['run', 'dev', '--', '--port', '8081'], {
    cwd: ruoyiUiRoot,
    shell: isWindows,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: {
      ...process.env
    }
  });

  prefixOutput(admin.stdout, '[ruoyi-admin]', process.stdout);
  prefixOutput(admin.stderr, '[ruoyi-admin]', process.stderr);
  prefixOutput(ui.stdout, '[ruoyi-ui]', process.stdout);
  prefixOutput(ui.stderr, '[ruoyi-ui]', process.stderr);

  const shutdown = () => {
    admin.kill('SIGTERM');
    ui.kill('SIGTERM');
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  admin.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[ruoyi-admin] exited with code ${code}`);
    }
  });

  ui.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[ruoyi-ui] exited with code ${code}`);
    }
  });
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
