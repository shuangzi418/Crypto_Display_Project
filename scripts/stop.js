const fs = require('fs');
const path = require('path');
const kill = require('kill-port');

const portsFile = path.resolve(__dirname, '..', '.dev-ports.json');

async function main() {
  const ports = new Set([3001, 5000, 8080, 8081]);

  if (fs.existsSync(portsFile)) {
    try {
      const saved = JSON.parse(fs.readFileSync(portsFile, 'utf8'));
      if (saved.backendPort) {
        ports.add(saved.backendPort);
      }
      if (saved.frontendPort) {
        ports.add(saved.frontendPort);
      }
    } catch (error) {
      console.error(`Failed to read ${portsFile}: ${error.message}`);
    }
  }

  for (const port of ports) {
    try {
      await kill(port);
      console.log(`Stopped process on port ${port}`);
    } catch (error) {
      if (!String(error.message).includes('No process running on port')) {
        console.error(`Failed to stop port ${port}: ${error.message}`);
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
