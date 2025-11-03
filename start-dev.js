#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting ProtomForms Development Environment...\n');

// Function to run a command in a specific directory
function runCommand(command, args, cwd, label, color) {
  const child = spawn(command, args, {
    cwd: path.join(__dirname, cwd),
    stdio: 'pipe',
    shell: true
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`${color}[${label}]${'\x1b[0m'} ${line}`);
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`${color}[${label}]${'\x1b[0m'} ${line}`);
    });
  });

  child.on('close', (code) => {
    console.log(`${color}[${label}]${'\x1b[0m'} Process exited with code ${code}`);
  });

  return child;
}

// Start backend
console.log('📡 Starting Backend API Server (Port 3001)...');
const backend = runCommand('npm', ['run', 'dev'], 'protomforms-backend', 'BACKEND', '\x1b[34m');

// Wait a bit then start frontend
setTimeout(() => {
  console.log('🎨 Starting Frontend Development Server (Port 3000)...');
  const frontend = runCommand('npm', ['start'], 'protomforms-frontend', 'FRONTEND', '\x1b[32m');
}, 3000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

console.log('\n📋 Development Environment Started:');
console.log('   Backend API: http://localhost:3001');
console.log('   Frontend App: http://localhost:3000');
console.log('\n💡 Press Ctrl+C to stop both servers\n');


