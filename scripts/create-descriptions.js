import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mediaDir = path.join(__dirname, '..', 'public', 'media');

// Get all project folders
const projectFolders = fs.readdirSync(mediaDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name)
  .filter(name => name !== 'README.md'); // Skip non-folder items

console.log(`Found ${projectFolders.length} project folders`);

let created = 0;
let skipped = 0;

projectFolders.forEach(folderName => {
  const folderPath = path.join(mediaDir, folderName);
  const descriptionPath = path.join(folderPath, 'description.txt');
  
  // Check if description.txt already exists
  if (fs.existsSync(descriptionPath)) {
    console.log(`⏭️  Skipped: ${folderName} (description.txt already exists)`);
    skipped++;
    return;
  }
  
  // Create a default description based on the folder name
  const defaultDescription = `Project: ${folderName}

Add your project description here.`;
  
  fs.writeFileSync(descriptionPath, defaultDescription, 'utf8');
  console.log(`✅ Created: ${folderName}/description.txt`);
  created++;
});

console.log(`\n📊 Summary:`);
console.log(`   Created: ${created} files`);
console.log(`   Skipped: ${skipped} files (already exist)`);
console.log(`   Total:   ${projectFolders.length} project folders`);
