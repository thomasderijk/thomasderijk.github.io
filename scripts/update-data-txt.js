#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEDIA_DIR = path.join(__dirname, '..', 'public', 'media');
const PROJECTS_FILE = path.join(__dirname, '..', 'src', 'data', 'projects.ts');

(async () => {
  try {
    // Read existing projects to get categories
    let existingProjects = [];
    try {
      const existingContent = await fs.readFile(PROJECTS_FILE, 'utf8');
      const match = existingContent.match(/export const projects: Project\[\] = (.+) as Project\[\];/s);
      if (match) {
        existingProjects = JSON.parse(match[1]);
      }
    } catch (e) {
      console.error('Could not read existing projects');
      process.exit(1);
    }

    const entries = await fs.readdir(MEDIA_DIR, { withFileTypes: true });
    const folders = entries.filter((d) => d.isDirectory()).map((d) => d.name);

    for (const folder of folders) {
      const folderPath = path.join(MEDIA_DIR, folder);
      const dataPath = path.join(folderPath, 'data.txt');
      
      // Find the project in existing data
      const project = existingProjects.find(p => 
        p.tags && p.tags.length > 0 && p.tags[0] === folder
      );

      if (!project) {
        console.log(`Skipping ${folder} - not found in projects`);
        continue;
      }

      // Read existing data.txt
      let existingData = {};
      try {
        const dataStat = await fs.stat(dataPath).catch(() => null);
        if (dataStat && dataStat.isFile()) {
          const raw = await fs.readFile(dataPath, 'utf8');
          const lines = raw.split('\n');
          
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            if (trimmed.startsWith('title:')) {
              existingData.title = trimmed.substring(6).trim();
            } else if (trimmed.startsWith('description:')) {
              existingData.description = trimmed.substring(12).trim();
            } else if (trimmed.startsWith('tags:')) {
              existingData.tags = trimmed.substring(5).trim();
            } else if (trimmed.startsWith('category:')) {
              existingData.category = trimmed.substring(9).trim();
            } else if (trimmed.startsWith('dropbox:')) {
              existingData.dropbox = trimmed.substring(8).trim();
            } else if (trimmed.startsWith('youtube:')) {
              existingData.youtube = trimmed.substring(8).trim();
            }
          }
        }
      } catch (e) {}

      // Build new data.txt content with all fields
      let dataContent = '';
      
      // Title (from existing data.txt or project)
      const title = existingData.title || project.title;
      if (title) dataContent += `title: ${title}\n`;
      
      // Category (from project)
      const category = existingData.category || (project.categories && project.categories.length > 0 ? project.categories.join(', ') : '');
      if (category) dataContent += `category: ${category}\n`;
      
      // Tags (from existing data.txt or project)
      const tags = existingData.tags || (project.tags && project.tags.length > 0 ? project.tags.join(', ') : '');
      if (tags) dataContent += `tags: ${tags}\n`;
      
      // Description (from existing data.txt or project)
      const description = existingData.description || project.description || '';
      if (description) dataContent += `description: ${description}\n`;
      
      // Dropbox (from existing data.txt or empty)
      const dropbox = existingData.dropbox || '';
      if (dropbox) dataContent += `dropbox: ${dropbox}\n`;
      
      // YouTube (from existing data.txt or empty)
      const youtube = existingData.youtube || '';
      if (youtube) dataContent += `youtube: ${youtube}\n`;

      // Write updated data.txt
      if (dataContent.trim()) {
        await fs.writeFile(dataPath, dataContent, 'utf8');
        console.log(`Updated data.txt for ${folder}`);
      }
    }

    console.log('\nUpdate complete!');
  } catch (err) {
    console.error('Failed to update:', err);
    process.exit(1);
  }
})();
