const fs = require('fs');
const { spawn } = require('child_process');
const {
  cryptoquizRoot,
  cryptoquizAdminJar,
  buildRuoyiBackendEnv,
  ensureRedisAvailable,
  ensureTcpServiceReachable,
  ensureLocalPortAvailable,
  resolveJavaCommand
} = require('./cryptoquizEnv');

async function main() {
  if (!fs.existsSync(cryptoquizAdminJar)) {
    console.error(`Missing jar: ${cryptoquizAdminJar}`);
    console.error('Run `"C:\\develop\\apache-maven-3.9.14\\bin\\mvn.cmd" -DskipTests install` in admin/cryptoquiz-admin first.');
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
  const redisState = await ensureRedisAvailable({
    host: backendEnv.REDIS_HOST,
    port: backendEnv.REDIS_PORT
  });

  console.log(`MySQL reachable at ${backendEnv.MYSQL_HOST}:${backendEnv.MYSQL_PORT}`);
  console.log(`Redis ready on ${redisState.host}:${redisState.port} (${redisState.mode})`);
  console.log('Port 8080 is available for RuoYi admin');

  const child = spawn(resolveJavaCommand(), ['-jar', cryptoquizAdminJar], {
    cwd: cryptoquizRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...backendEnv
    }
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
