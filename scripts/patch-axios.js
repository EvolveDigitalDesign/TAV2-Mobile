#!/usr/bin/env node

/**
 * Patch axios package.json for React Native compatibility
 * 
 * This script changes axios's main entry point from the Node.js build
 * to the browser build, which is compatible with React Native.
 * 
 * Run automatically via npm postinstall hook.
 */

const fs = require('fs');
const path = require('path');

const axiosPkgPath = path.join(__dirname, '..', 'node_modules', 'axios', 'package.json');

if (!fs.existsSync(axiosPkgPath)) {
  console.log('⚠️  axios not installed yet, skipping patch');
  process.exit(0);
}

try {
  const pkg = JSON.parse(fs.readFileSync(axiosPkgPath, 'utf8'));
  
  if (pkg.main === './dist/browser/axios.cjs') {
    console.log('✅ axios already patched for React Native');
    process.exit(0);
  }
  
  const originalMain = pkg.main;
  pkg.main = './dist/browser/axios.cjs';
  
  fs.writeFileSync(axiosPkgPath, JSON.stringify(pkg, null, 2));
  
  console.log(`✅ axios patched for React Native`);
  console.log(`   main: ${originalMain} → ${pkg.main}`);
} catch (error) {
  console.error('❌ Failed to patch axios:', error.message);
  process.exit(1);
}
