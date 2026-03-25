const { spawn } = require('child_process');
const {
  ruoyiUiRoot,
  ensureLocalPortAvailable,
  resolveNpmCommand
} = require('./ruoyiEnv');

async function main() {
  await ensureLocalPortAvailable({
    name: 'RuoYi UI',
    port: 8081
  });

  console.log('Port 8081 is available for RuoYi UI');

  const child = spawn(resolveNpmCommand(), ['run', 'dev', '--', '--port', '8081'], {
    cwd: ruoyiUiRoot,
    stdio: 'inherit',
    env: {
      ...process.env
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
