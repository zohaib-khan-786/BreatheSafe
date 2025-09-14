// scripts/copy-assets.js
const fs = require('fs');
const path = require('path');

console.log('Copying assets for standalone build...');

const sourceDirs = ['public', '.next/static'];
const targetDir = 'standalone';

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy public folder
if (fs.existsSync('public')) {
  fs.cpSync('public', path.join(targetDir, 'public'), { recursive: true });
  console.log('✓ Copied public folder');
}

// Copy static assets
if (fs.existsSync('.next/static')) {
  fs.cpSync('.next/static', path.join(targetDir, '.next/static'), { recursive: true });
  console.log('✓ Copied static assets');
}

// Copy .env file if it exists
if (fs.existsSync('.env')) {
  fs.copyFileSync('.env', path.join(targetDir, '.env'));
  console.log('✓ Copied .env file');
}

console.log('✓ All assets copied to standalone folder');