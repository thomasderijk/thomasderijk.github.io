#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEDIA_DIR = path.join(__dirname, '..', 'public', 'media');

(async () => {
  try {
    const entries = await fs.readdir(MEDIA_DIR, { withFileTypes: true });
    const folders = entries.filter((d) => d.isDirectory()).map((d) => d.name);

    for (const folder of folders) {
      const folderPath = path.join(MEDIA_DIR, folder);
      const dataPath = path.join(folderPath, 'data.txt');
      
      // Check if data.txt already exists
      const dataExists = await fs.stat(dataPath).catch(() => null);
      if (dataExists) {
        console.log(`Skipping ${folder} - data.txt already exists`);
        continue;
      }

      // Read individual files
      let title = '';
      let description = '';
      let tags = '';
      let dropbox = '';
      let youtube = '';

      // Read title.txt
      try {
        const titlePath = path.join(folderPath, 'title.txt');
        const titleStat = await fs.stat(titlePath).catch(() => null);
        if (titleStat && titleStat.isFile()) {
          title = (await fs.readFile(titlePath, 'utf8')).trim();
        }
      } catch (e) {}

      // Read description.txt
      try {
        const descPath = path.join(folderPath, 'description.txt');
        const descStat = await fs.stat(descPath).catch(() => null);
        if (descStat && descStat.isFile()) {
          const raw = await fs.readFile(descPath, 'utf8');
          const trimmed = raw.trim();
          if (trimmed && !trimmed.startsWith('Project:') && !trimmed.includes('Add your project description here')) {
            description = trimmed;
          }
        }
      } catch (e) {}

      // Read tags.txt
      try {
        const tagsPath = path.join(folderPath, 'tags.txt');
        const tagsStat = await fs.stat(tagsPath).catch(() => null);
        if (tagsStat && tagsStat.isFile()) {
          tags = (await fs.readFile(tagsPath, 'utf8')).trim();
        }
      } catch (e) {}

      // Read dropboxlink.txt
      try {
        const dropboxPath = path.join(folderPath, 'dropboxlink.txt');
        const dropboxStat = await fs.stat(dropboxPath).catch(() => null);
        if (dropboxStat && dropboxStat.isFile()) {
          dropbox = (await fs.readFile(dropboxPath, 'utf8')).trim();
        }
      } catch (e) {}

      // Read youtube.txt
      try {
        const youtubePath = path.join(folderPath, 'youtube.txt');
        const youtubeStat = await fs.stat(youtubePath).catch(() => null);
        if (youtubeStat && youtubeStat.isFile()) {
          youtube = (await fs.readFile(youtubePath, 'utf8')).trim();
        }
      } catch (e) {}

      // Create data.txt content
      let dataContent = '';
      if (title) dataContent += `title: ${title}\n`;
      if (description) dataContent += `description: ${description}\n`;
      if (tags) dataContent += `tags: ${tags}\n`;
      if (dropbox) dataContent += `dropbox: ${dropbox}\n`;
      if (youtube) dataContent += `youtube: ${youtube}\n`;

      // Only create data.txt if there's any content
      if (dataContent.trim()) {
        await fs.writeFile(dataPath, dataContent.trim() + '\n', 'utf8');
        console.log(`Created data.txt for ${folder}`);

        // Remove individual files
        const filesToRemove = [
          'title.txt',
          'description.txt', 
          'tags.txt',
          'dropboxlink.txt',
          'youtube.txt'
        ];

        for (const file of filesToRemove) {
          try {
            const filePath = path.join(folderPath, file);
            const fileStat = await fs.stat(filePath).catch(() => null);
            if (fileStat && fileStat.isFile()) {
              await fs.unlink(filePath);
              console.log(`  Removed ${file}`);
            }
          } catch (e) {
            // Ignore errors when removing files
          }
        }
      } else {
        console.log(`Skipping ${folder} - no data to migrate`);
      }
    }

    console.log('\nMigration complete!');
  } catch (err) {
    console.error('Failed to migrate:', err);
    process.exit(1);
  }
})();
