#!/usr/bin/env node

/**
 * Environment Configuration Checker
 *
 * This script verifies that your local development environment is configured correctly.
 * Run this before starting development to ensure you're not accidentally using production APIs.
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Checking Environment Configuration...\n');

// Read .env.local
const envLocalPath = path.join(__dirname, '../.env.local');
const envLocalExists = fs.existsSync(envLocalPath);

if (!envLocalExists) {
  console.error('❌ ERROR: .env.local file not found!');
  console.error('   Create it from .env.example and set NEXT_PUBLIC_API_URL=http://localhost:3000');
  process.exit(1);
}

const envLocalContent = fs.readFileSync(envLocalPath, 'utf-8');

// Check API URL
const apiUrlMatch = envLocalContent.match(/^NEXT_PUBLIC_API_URL=(.+)$/m);
if (!apiUrlMatch) {
  console.error('❌ ERROR: NEXT_PUBLIC_API_URL not set in .env.local');
  console.error('   Add: NEXT_PUBLIC_API_URL=http://localhost:3000');
  process.exit(1);
}

const apiUrl = apiUrlMatch[1].trim();
if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
  console.log('✅ API URL correctly set to localhost:', apiUrl);
} else {
  console.error('❌ ERROR: API URL is not localhost!');
  console.error('   Current value:', apiUrl);
  console.error('   Expected: http://localhost:3000');
  console.error('   You are currently pointing to PRODUCTION API!');
  process.exit(1);
}

// Check APP URL
const appUrlMatch = envLocalContent.match(/^NEXT_PUBLIC_APP_URL=(.+)$/m);
if (appUrlMatch) {
  const appUrl = appUrlMatch[1].trim();
  if (appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
    console.log('✅ APP URL correctly set to localhost:', appUrl);
  } else {
    console.warn('⚠️  WARNING: APP URL is not localhost:', appUrl);
  }
}

console.log('\n✨ Environment configuration looks good!\n');
console.log('You can now run:');
console.log('  npm run dev\n');
