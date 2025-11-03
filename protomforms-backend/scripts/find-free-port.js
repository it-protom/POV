const net = require('net');
const { execSync } = require('child_process');

// Funzione per verificare se una porta è in uso
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => {
      resolve(true);
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

// Funzione per trovare una porta libera
async function findFreePort(startPort = 3002, maxPort = 3999) {
  for (let port = startPort; port <= maxPort; port++) {
    const inUse = await isPortInUse(port);
    if (!inUse) {
      return port;
    }
  }
  throw new Error('No free ports found in the specified range');
}

// Funzione principale
async function main() {
  try {
    // Trova una porta libera
    const port = await findFreePort();
    console.log(`Found free port: ${port}`);
    
    // Imposta NEXTAUTH_URL
    const baseUrl = `http://localhost:${port}`;
    process.env.NEXTAUTH_URL = baseUrl;
    
    console.log(`Setting NEXTAUTH_URL to: ${baseUrl}`);
    
    // Avvia Next.js
    const nextCommand = process.argv.slice(2).join(' ');
    execSync(`next ${nextCommand}`, { stdio: 'inherit' });
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main(); 