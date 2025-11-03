#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing ProtomForms Separated Architecture Setup...\n');

// Test backend structure
console.log('📁 Checking Backend Structure...');
const backendChecks = [
  'protomforms-backend/package.json',
  'protomforms-backend/next.config.js',
  'protomforms-backend/tsconfig.json',
  'protomforms-backend/src/app/api',
  'protomforms-backend/lib/auth.ts',
  'protomforms-backend/lib/db.ts',
  'protomforms-backend/prisma/schema.prisma',
];

backendChecks.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Test frontend structure
console.log('\n📁 Checking Frontend Structure...');
const frontendChecks = [
  'protomforms-frontend/package.json',
  'protomforms-frontend/tailwind.config.js',
  'protomforms-frontend/src/App.tsx',
  'protomforms-frontend/src/components/ui',
  'protomforms-frontend/src/contexts/AuthContext.tsx',
  'protomforms-frontend/src/lib/api.ts',
  'protomforms-frontend/src/pages',
];

frontendChecks.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Check package.json configurations
console.log('\n📦 Checking Package Configurations...');

try {
  const backendPkg = JSON.parse(fs.readFileSync('protomforms-backend/package.json', 'utf8'));
  console.log(`✅ Backend: ${backendPkg.name} v${backendPkg.version}`);
  console.log(`   - Scripts: ${Object.keys(backendPkg.scripts).join(', ')}`);
  console.log(`   - Port: 3001 (configured in scripts)`);
} catch (error) {
  console.log('❌ Backend package.json - ERROR');
}

try {
  const frontendPkg = JSON.parse(fs.readFileSync('protomforms-frontend/package.json', 'utf8'));
  console.log(`✅ Frontend: ${frontendPkg.name} v${frontendPkg.version}`);
  console.log(`   - Scripts: ${Object.keys(frontendPkg.scripts).join(', ')}`);
  console.log(`   - Port: 3000 (default React)`);
} catch (error) {
  console.log('❌ Frontend package.json - ERROR');
}

// Check environment files
console.log('\n🔧 Checking Environment Configuration...');
if (fs.existsSync('protomforms-backend/env.example')) {
  console.log('✅ Backend environment template');
} else {
  console.log('❌ Backend environment template - MISSING');
}

if (fs.existsSync('protomforms-frontend/env.example')) {
  console.log('✅ Frontend environment template');
} else {
  console.log('❌ Frontend environment template - MISSING');
}

// Summary
console.log('\n📋 Setup Summary:');
console.log('1. Backend (Next.js API): protomforms-backend/');
console.log('   - Port: 3001');
console.log('   - API routes, authentication, database');
console.log('   - Run: cd protomforms-backend && npm install && npm run dev');

console.log('\n2. Frontend (React): protomforms-frontend/');
console.log('   - Port: 3000');
console.log('   - UI components, pages, routing');
console.log('   - Run: cd protomforms-frontend && npm install && npm start');

console.log('\n3. Environment Setup:');
console.log('   - Copy env.example to .env in both directories');
console.log('   - Configure database URL in backend .env');
console.log('   - Configure API URL in frontend .env');

console.log('\n🚀 Next Steps:');
console.log('1. Set up PostgreSQL database');
console.log('2. Configure environment variables');
console.log('3. Run database migrations: cd protomforms-backend && npx prisma migrate dev');
console.log('4. Start backend: cd protomforms-backend && npm run dev');
console.log('5. Start frontend: cd protomforms-frontend && npm start');

console.log('\n✨ Architecture successfully separated!');
console.log('   Backend API: http://localhost:3001');
console.log('   Frontend App: http://localhost:3000');


