import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Allowed tags - only keep these
const allowedTags = new Set([
  'music',
  'sound design',
  'installation',
  'video',
  'artwork',
  'interactive',
  'music video',
  'sculpture',
  'direction',
  'animation'
]);

// Find all data.txt files in public/media
const dataFiles = await glob('public/media/*/data.txt');

console.log(`Found ${dataFiles.length} data.txt files`);

let updatedCount = 0;

dataFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    let modified = false;
    const newLines = lines.map(line => {
      if (line.startsWith('tags:')) {
        const tagsLine = line.substring(5).trim();
        const oldTags = tagsLine.split(',').map(t => t.trim()).filter(t => t.length > 0);

        // Keep only allowed tags
        const newTags = oldTags.filter(tag => allowedTags.has(tag));

        const newTagsLine = `tags: ${newTags.join(', ')}`;

        if (newTagsLine !== line) {
          modified = true;
          console.log(`\nUpdating ${filePath}:`);
          console.log(`  Old: ${line}`);
          console.log(`  New: ${newTagsLine}`);
        }

        return newTagsLine;
      }
      return line;
    });

    if (modified) {
      fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
      updatedCount++;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n✓ Updated ${updatedCount} files`);
