#!/usr/bin/env node

/**
 * Script to prepare Knowledge Bank data for deployment
 * This will copy and process the AI suit-shirt-tie data
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = '/Users/ibrahim/Desktop/ai-suit-shirt-tie';
const DEST_DIR = path.join(process.cwd(), 'knowledge-bank-data');

// Critical files to copy
const CRITICAL_FILES = [
  // Core data
  'core-data/color-relationships-json.json',
  'core-data/never-combine-rules-json.json',
  'core-data/fabric-seasonality-json.json',
  'core-data/formality-index-json.json',
  'core-data/venue-compatibility-json.json',
  
  // AI Training
  'Ai Training Data/style-profiles-json.json',
  'Ai Training Data/customer-conversations-json.json',
  'Ai Training Data/successful-upsells-json.json',
  
  // Business Intelligence
  'Business Intelligence/conversion-rates.json',
  'Business Intelligence/cart-abandonment.json',
  'Business Intelligence/age-demographics.json',
  'Business Intelligence/regional-preferences.json',
  
  // Quick Reference
  'Quick Reference Files/top-10-all-time-json.json',
  'Quick Reference Files/seasonal-champions-json.json',
  'Quick Reference Files/trending-now-json.json',
  
  // Visual Intelligence
  'Visual Intelligence /color-hex-mapping.json',
  'Visual Intelligence /texture-compatibility.json',
  'Visual Intelligence /instagram-winners.json',
  
  // Testing
  'Testing & Validation/combination-validator.json',
  'Testing & Validation/edge-cases.json'
];

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyFile(source, destination) {
  try {
    const content = fs.readFileSync(source, 'utf8');
    fs.writeFileSync(destination, content);
    console.log(`✓ Copied: ${path.basename(source)}`);
  } catch (error) {
    console.error(`✗ Failed to copy ${source}: ${error.message}`);
  }
}

function processKnowledgeBank() {
  console.log('🚀 Preparing Knowledge Bank data for deployment...\n');

  // Create destination directory
  ensureDirectoryExists(DEST_DIR);

  // Create subdirectories
  const subdirs = ['core', 'training', 'intelligence', 'visual', 'validation'];
  subdirs.forEach(dir => {
    ensureDirectoryExists(path.join(DEST_DIR, dir));
  });

  // Copy and organize files
  CRITICAL_FILES.forEach(file => {
    const sourcePath = path.join(SOURCE_DIR, file);
    
    // Determine destination subdirectory
    let destSubdir = 'core';
    if (file.includes('Ai Training')) destSubdir = 'training';
    else if (file.includes('Business Intelligence')) destSubdir = 'intelligence';
    else if (file.includes('Visual Intelligence')) destSubdir = 'visual';
    else if (file.includes('Testing')) destSubdir = 'validation';
    else if (file.includes('Quick Reference')) destSubdir = 'intelligence';
    
    const fileName = path.basename(file).replace('-json.json', '.json');
    const destPath = path.join(DEST_DIR, destSubdir, fileName);
    
    copyFile(sourcePath, destPath);
  });

  // Create index file
  const indexContent = {
    version: '1.0.0',
    created: new Date().toISOString(),
    description: 'KCT Menswear Knowledge Bank Data',
    files: {
      core: fs.readdirSync(path.join(DEST_DIR, 'core')),
      training: fs.readdirSync(path.join(DEST_DIR, 'training')),
      intelligence: fs.readdirSync(path.join(DEST_DIR, 'intelligence')),
      visual: fs.readdirSync(path.join(DEST_DIR, 'visual')),
      validation: fs.readdirSync(path.join(DEST_DIR, 'validation'))
    }
  };

  fs.writeFileSync(
    path.join(DEST_DIR, 'index.json'),
    JSON.stringify(indexContent, null, 2)
  );

  console.log('\n✅ Knowledge Bank data prepared successfully!');
  console.log(`📁 Output directory: ${DEST_DIR}`);
  console.log('\nNext steps:');
  console.log('1. Review the prepared data');
  console.log('2. Copy to your deployment project');
  console.log('3. Update API endpoints to serve this data');
}

// Run the script
processKnowledgeBank();