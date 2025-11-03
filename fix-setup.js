#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 ProtomForms Setup Fix Script\n');

// Check and fix common issues
const fixes = [
  {
    name: 'Backend Dependencies',
    check: () => fs.existsSync('protomforms-backend/node_modules'),
    fix: () => {
      console.log('Installing backend dependencies...');
      execSync('npm install', { cwd: 'protomforms-backend', stdio: 'inherit' });
    }
  },
  {
    name: 'Frontend Dependencies',
    check: () => fs.existsSync('protomforms-frontend/node_modules'),
    fix: () => {
      console.log('Installing frontend dependencies...');
      execSync('npm install', { cwd: 'protomforms-frontend', stdio: 'inherit' });
    }
  },
  {
    name: 'Backend Environment',
    check: () => fs.existsSync('protomforms-backend/.env'),
    fix: () => {
      console.log('Creating backend .env file...');
      if (fs.existsSync('protomforms-backend/env.example')) {
        fs.copyFileSync('protomforms-backend/env.example', 'protomforms-backend/.env');
        console.log('⚠️  Please edit protomforms-backend/.env with your configuration');
      }
    }
  },
  {
    name: 'Frontend Environment',
    check: () => fs.existsSync('protomforms-frontend/.env'),
    fix: () => {
      console.log('Creating frontend .env file...');
      if (fs.existsSync('protomforms-frontend/env.example')) {
        fs.copyFileSync('protomforms-frontend/env.example', 'protomforms-frontend/.env');
      }
    }
  }
];

// Run fixes
fixes.forEach(fix => {
  console.log(`Checking ${fix.name}...`);
  if (!fix.check()) {
    console.log(`❌ ${fix.name} - Fixing...`);
    try {
      fix.fix();
      console.log(`✅ ${fix.name} - Fixed`);
    } catch (error) {
      console.log(`❌ ${fix.name} - Failed: ${error.message}`);
    }
  } else {
    console.log(`✅ ${fix.name} - OK`);
  }
});

console.log('\n📋 Next Steps:');
console.log('1. Configure database URL in protomforms-backend/.env');
console.log('2. Run: cd protomforms-backend && npx prisma migrate dev');
console.log('3. Start development: node start-dev.js');

console.log('\n✨ Setup fix completed!');


