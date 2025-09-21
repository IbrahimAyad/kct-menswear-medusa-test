const fs = require('fs');
const path = require('path');

// List of directories and files that need dynamic rendering
const authPaths = [
  'src/app/account',
  'src/app/account-temp', 
  'src/app/account-new',
  'src/app/account-section',
  'src/app/orders',
  'src/app/cart',
  'src/app/auth',
  'src/app/auth-new',
  'src/app/login',
  'src/app/register'
];

function addDynamicExport(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if dynamic export already exists
  if (content.includes("export const dynamic")) {
    console.log(`✓ Already has dynamic export: ${filePath}`);
    return false;
  }
  
  // Add the export at the end of the file
  const newContent = content + "\n\nexport const dynamic = 'force-dynamic'\n";
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`✅ Fixed: ${filePath}`);
  return true;
}

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  // Check for page.tsx in the directory
  const pagePath = path.join(dir, 'page.tsx');
  addDynamicExport(pagePath);
  
  // Process subdirectories
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory()) {
      processDirectory(path.join(dir, item.name));
    }
  }
}

console.log('Fixing dynamic rendering for auth-related pages...\n');

let fixedCount = 0;
authPaths.forEach(dir => {
  processDirectory(dir);
});

console.log('\n✨ Done! Fixed dynamic rendering for auth pages.');