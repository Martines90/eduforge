/**
 * Script to set CORS configuration on Firebase Storage bucket
 * Run with: npx ts-node src/scripts/set-storage-cors.ts
 */

import { initializeFirebase, getFirebaseApp } from '../config/firebase.config';
import { getStorage } from 'firebase-admin/storage';
import * as https from 'https';

async function setStorageCors() {
  console.log('🔧 Setting CORS configuration for Firebase Storage...\n');

  // Initialize Firebase
  initializeFirebase();
  const app = getFirebaseApp();
  const storage = getStorage(app);
  const bucket = storage.bucket();

  console.log(`📦 Bucket: ${bucket.name}`);

  // CORS configuration
  const corsConfig = [
    {
      origin: ['*'],
      method: ['GET', 'HEAD'],
      responseHeader: ['Content-Type', 'Access-Control-Allow-Origin', 'Cache-Control'],
      maxAgeSeconds: 3600,
    },
  ];

  try {
    // Set CORS using the bucket's setCorsConfiguration method
    await bucket.setCorsConfiguration(corsConfig);

    console.log('✅ CORS configuration set successfully!');
    console.log('\nCORS Configuration:');
    console.log(JSON.stringify(corsConfig, null, 2));

    // Verify the configuration
    const [metadata] = await bucket.getMetadata();
    console.log('\n📋 Current bucket CORS configuration:');
    console.log(JSON.stringify(metadata.cors, null, 2));

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Failed to set CORS configuration:', error.message);
    console.error('\nPlease run this command manually:');
    console.error(`gsutil cors set cors.json gs://${bucket.name}`);
    process.exit(1);
  }
}

setStorageCors();
