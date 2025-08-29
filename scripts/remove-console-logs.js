#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to match console.log statements
const consoleLogPattern = /console\.(log|error|warn|info|debug)\([^;]*\);?/g;

// Directories to exclude
const excludeDirs = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
  'scripts',
  'public',
  'docs'
];

// File extensions to process
const fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];

function removeConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Count occurrences for reporting
    const matches = content.match(consoleLogPattern);
    const count = matches ? matches.length : 0;
    
    if (count > 0) {
      // Remove console statements
      content = content.replace(consoleLogPattern, '');
      
      // Clean up empty lines that might be left
      content = content.replace(/^\s*[\r\n]/gm, '\n');
      
      // Write back to file
      fs.writeFileSync(filePath, content, 'utf8');
      
      return { filePath, count, removed: true };
    }
    
    return { filePath, count: 0, removed: false };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return { filePath, count: 0, removed: false, error: error.message };
  }
}

function shouldProcessFile(filePath) {
  // Check if file is in excluded directory
  for (const dir of excludeDirs) {
    if (filePath.includes(`/${dir}/`) || filePath.includes(`\\${dir}\\`)) {
      return false;
    }
  }
  
  // Check file extension
  const ext = path.extname(filePath);
  return fileExtensions.includes(ext);
}

function main() {
  console.log('🔍 Searching for console.log statements...\n');
  
  // Find all TypeScript and JavaScript files
  const pattern = path.join(__dirname, '..', 'src', '**', '*');
  const files = glob.sync(pattern, { nodir: true });
  
  let totalFiles = 0;
  let filesModified = 0;
  let totalRemoved = 0;
  const results = [];
  
  files.forEach(file => {
    if (shouldProcessFile(file)) {
      totalFiles++;
      const result = removeConsoleLogs(file);
      if (result.removed) {
        filesModified++;
        totalRemoved += result.count;
        results.push(result);
      }
    }
  });
  
  // Report results
  console.log('📊 Results:\n');
  console.log(`Total files scanned: ${totalFiles}`);
  console.log(`Files modified: ${filesModified}`);
  console.log(`Console statements removed: ${totalRemoved}\n`);
  
  if (results.length > 0) {
    console.log('📝 Modified files:');
    results.forEach(({ filePath, count }) => {
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`  - ${relativePath} (${count} removed)`);
    });
  }
  
  console.log('\n✅ Console.log cleanup complete!');
  
  // Create a backup record
  const backupLog = {
    date: new Date().toISOString(),
    filesModified,
    totalRemoved,
    files: results.map(r => ({
      path: path.relative(process.cwd(), r.filePath),
      removed: r.count
    }))
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'console-cleanup-log.json'),
    JSON.stringify(backupLog, null, 2)
  );
  
  console.log('\n📄 Cleanup log saved to scripts/console-cleanup-log.json');
}

// Run the script
if (require.main === module) {
  main();
}