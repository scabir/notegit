#!/usr/bin/env node

/**
 * Post-build script to fix import paths in compiled Electron main file
 * 
 * The issue: TypeScript compiles backend files into dist/electron/backend/
 * but the import path '../backend' resolves to dist/backend (which doesn't exist)
 * 
 * This script fixes the require statement to use './backend' instead
 */

const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, 'dist', 'electron', 'electron', 'main.js');

try {
  let content = fs.readFileSync(mainJsPath, 'utf8');
  
  // Fix the backend import path
  // TypeScript imports '../backend' which compiles to './backend'
  // But we need '../backend' because main.js is in electron/ subdirectory
  content = content.replace(
    /require\("\.\/backend"\)/g,
    'require("../backend")'
  );
  
  fs.writeFileSync(mainJsPath, content, 'utf8');
  console.log('✅ Fixed Electron import paths');
} catch (error) {
  console.error('❌ Failed to fix Electron imports:', error.message);
  process.exit(1);
}

