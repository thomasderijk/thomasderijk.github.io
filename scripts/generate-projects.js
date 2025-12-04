#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEDIA_DIR = path.join(__dirname, '..', 'public', 'media');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'projects.ts');
const PLACEHOLDERS = {
  image: '/media/placeholder-square.jpg',
};

const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg'];
const AUDIO_EXT = ['.mp3', '.m4a', '.wav', '.ogg', '.flac'];
const VIDEO_EXT = ['.mp4', '.webm', '.mov', '.mkv'];

function makeTitle(slug) {
  return slug
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((s) => (s.length ? s[0].toUpperCase() + s.slice(1) : s))
    .join(' ');
}

function inferMediaType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (IMAGE_EXT.includes(ext)) return 'image';
  if (AUDIO_EXT.includes(ext)) return 'audio';
  if (VIDEO_EXT.includes(ext)) return 'video';
  return null;
}

// Generate JPEG thumbnail from video thumbnail if it doesn't exist
async function ensureJpegThumbnail(videoPath) {
  if (!/\.(mov|mp4|webm|mkv)$/i.test(videoPath)) {
    return; // Not a video file
  }

  const jpegPath = videoPath.replace(/\.(mov|mp4|webm|mkv)$/i, '.jpg');

  // Check if JPEG already exists
  try {
    await fs.access(jpegPath);
    return; // JPEG already exists
  } catch {
    // JPEG doesn't exist, generate it
  }

  try {
    console.log(`  Generating JPEG for ${path.basename(videoPath)}...`);

    // Use ffmpeg to extract first frame as JPEG with high quality
    await execFileAsync('/opt/homebrew/bin/ffmpeg', [
      '-i', videoPath,           // Input video
      '-vframes', '1',            // Extract 1 frame
      '-q:v', '2',                // High quality (2-5 is good, 2 is higher quality)
      '-y',                       // Overwrite output file if exists
      jpegPath                    // Output JPEG
    ]);

    console.log(`  ✓ Generated ${path.basename(jpegPath)}`);
  } catch (error) {
    console.error(`  ✗ Failed to generate JPEG for ${path.basename(videoPath)}:`, error.message);
  }
}

(async () => {
  try {
    const entries = await fs.readdir(MEDIA_DIR, { withFileTypes: true });
    const folders = entries
      .filter((d) => d.isDirectory() && d.name !== 'thumbnail_mov_backup')
      .map((d) => d.name);

    // Read existing projects to preserve dates
    let existingProjects = [];
    try {
      const existingContent = await fs.readFile(OUTPUT_FILE, 'utf8');
      // Extract the JSON array from the TypeScript file
      const match = existingContent.match(/export const projects: Project\[\] = (.+) as Project\[\];/s);
      if (match) {
        existingProjects = JSON.parse(match[1]);
      }
    } catch (e) {
      // File doesn't exist or can't be parsed, start fresh
      existingProjects = [];
    }

    // Create a map of existing projects by title, slug, AND first tag (usually folder name) for quick lookup
    const existingProjectMap = new Map();
    for (const proj of existingProjects) {
      existingProjectMap.set(proj.title, proj);
      // Also map by slug (lowercase title with spaces replaced by hyphens)
      const slug = proj.title.toLowerCase().replace(/\s+/g, '-');
      existingProjectMap.set(slug, proj);
      // Also map by first tag (usually the folder name)
      if (proj.tags && proj.tags.length > 0) {
        existingProjectMap.set(proj.tags[0], proj);
      }
    }

    const projects = [];
    const defaultDate = new Date().toISOString().slice(0, 10);

    // helper: read image dimensions for PNG and JPEG (minimal, no external deps)
    async function getImageSize(filePath) {
      try {
        const buf = await fs.readFile(filePath);
        // PNG: width/height at fixed offsets in IHDR
        if (buf.slice(0, 8).toString('hex') === '89504e470d0a1a0a') {
          // IHDR chunk starts at byte 8+4 (length)+4 (IHDR) = 16, width at 16
          const w = buf.readUInt32BE(16);
          const h = buf.readUInt32BE(20);
          return { width: w, height: h };
        }
        // JPEG: search for SOF0/2 marker (0xFFC0 - 0xFFC3)
        if (buf[0] === 0xff && buf[1] === 0xd8) {
          let offset = 2;
          while (offset < buf.length) {
            if (buf[offset] !== 0xff) {
              offset++;
              continue;
            }
            const marker = buf[offset + 1];
            const length = buf.readUInt16BE(offset + 2);
            // SOF0/SOF2
            if (marker === 0xc0 || marker === 0xc2) {
              const height = buf.readUInt16BE(offset + 5);
              const width = buf.readUInt16BE(offset + 7);
              return { width, height };
            }
            offset += 2 + length;
          }
        }
        // GIF: header 'GIF89a' or 'GIF87a', width/height at 6
        if (buf.slice(0, 6).toString() === 'GIF89a' || buf.slice(0,6).toString() === 'GIF87a') {
          const w = buf.readUInt16LE(6);
          const h = buf.readUInt16LE(8);
          return { width: w, height: h };
        }
        // Unknown or unsupported format
        return null;
      } catch (e) {
        return null;
      }
    }

    for (const folder of folders) {
      const folderPath = path.join(MEDIA_DIR, folder);
      
      // Recursively scan for all media files
      async function scanDirectory(dir, baseFolder) {
        let allFiles = [];
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.name.startsWith('.')) continue; // Skip hidden files
          
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(path.join(MEDIA_DIR, baseFolder), fullPath);
          
          if (entry.isDirectory()) {
            // Recursively scan subdirectories
            const subFiles = await scanDirectory(fullPath, baseFolder);
            allFiles = allFiles.concat(subFiles);
          } else if (entry.isFile()) {
            const mediaType = inferMediaType(entry.name);
            if (mediaType) {
              allFiles.push({ name: relativePath, type: mediaType, fullPath });
            }
          }
        }
        return allFiles;
      }

      let files = [];
      try {
        files = await scanDirectory(folderPath, folder);
      } catch (e) {
        files = [];
      }

      // Generate JPEG thumbnails for video thumbnails
      for (const file of files) {
        if (file.type === 'video' && file.name.toLowerCase().includes('_thumbnail.')) {
          await ensureJpegThumbnail(file.fullPath);
        }
      }

      // read optional data.txt file with all project metadata
      let titleFromFile = null;
      let description = null;
      let tags = [];
      let categoriesFromFile = [];
      let dropboxUrls = [];
      let youtubeUrl = null;
      let yearFromFile = null;
      let layoutFromFile = null;
      let allowSimultaneousPlaybackFromFile = null;

      try {
        const dataPath = path.join(folderPath, 'data.txt');
        const stat = await fs.stat(dataPath).catch(() => null);
        if (stat && stat.isFile()) {
          const raw = await fs.readFile(dataPath, 'utf8');
          const lines = raw.split('\n');

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith('title:')) {
              titleFromFile = trimmed.substring(6).trim();
            } else if (trimmed.startsWith('description:')) {
              description = trimmed.substring(12).trim();
            } else if (trimmed.startsWith('category:')) {
              const categoryStr = trimmed.substring(9).trim();
              categoriesFromFile = categoryStr.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0);
            } else if (trimmed.startsWith('tags:')) {
              const tagsStr = trimmed.substring(5).trim();
              tags = tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            } else if (trimmed.startsWith('date:')) {
              yearFromFile = trimmed.substring(5).trim();
            } else if (trimmed.startsWith('year:')) {
              yearFromFile = trimmed.substring(5).trim();
            } else if (trimmed.startsWith('dropbox:')) {
              const url = trimmed.substring(8).trim();
              if (url) {
                // Convert to raw format for better streaming
                const convertedUrl = url
                  .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
                  .replace(/[?&]dl=[01]/, '')
                  .replace(/\?/, '?raw=1&')
                  .replace(/&raw=1&/, '?raw=1&');

                let finalUrl = convertedUrl;
                if (!finalUrl.includes('?')) {
                  finalUrl += '?raw=1';
                } else if (!finalUrl.includes('raw=1')) {
                  finalUrl += '&raw=1';
                }

                dropboxUrls.push(finalUrl);
              }
            } else if (trimmed.startsWith('youtube:')) {
              youtubeUrl = trimmed.substring(8).trim();
            } else if (trimmed.startsWith('layout:')) {
              layoutFromFile = trimmed.substring(7).trim();
            } else if (trimmed.startsWith('allowSimultaneousPlayback:')) {
              const value = trimmed.substring(26).trim().toLowerCase();
              allowSimultaneousPlaybackFromFile = value === 'true';
            }
          }
        }
      } catch (e) {
        // If data.txt doesn't exist, fall back to individual files
      }

      // Fallback: read individual .txt files if data.txt parsing didn't get everything
      if (!titleFromFile) {
        try {
          const titlePath = path.join(folderPath, 'title.txt');
          const titleStat = await fs.stat(titlePath).catch(() => null);
          if (titleStat && titleStat.isFile()) {
            const raw = await fs.readFile(titlePath, 'utf8');
            const trimmed = raw.trim();
            if (trimmed) titleFromFile = trimmed;
          }
        } catch (e) {}
      }

      if (!description) {
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
      }

      if (!youtubeUrl) {
        try {
          const youtubePath = path.join(folderPath, 'youtube.txt');
          const youtubeStat = await fs.stat(youtubePath).catch(() => null);
          if (youtubeStat && youtubeStat.isFile()) {
            const raw = await fs.readFile(youtubePath, 'utf8');
            const trimmed = raw.trim();
            if (trimmed) youtubeUrl = trimmed;
          }
        } catch (e) {}
      }

      if (dropboxUrls.length === 0) {
        try {
          const dropboxPath = path.join(folderPath, 'dropboxlink.txt');
          const dropboxStat = await fs.stat(dropboxPath).catch(() => null);
          if (dropboxStat && dropboxStat.isFile()) {
            const raw = await fs.readFile(dropboxPath, 'utf8');
            const trimmed = raw.trim();
            if (trimmed) {
              let dropboxUrl = trimmed
                .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
                .replace(/[?&]dl=[01]/, '')
                .replace(/\?/, '?raw=1&')
                .replace(/&raw=1&/, '?raw=1&');
              
              if (!dropboxUrl.includes('?')) {
                dropboxUrl += '?raw=1';
              } else if (!dropboxUrl.includes('raw=1')) {
                dropboxUrl += '&raw=1';
              }
              dropboxUrls.push(dropboxUrl);
            }
          }
        } catch (e) {}
      }

      if (tags.length === 0) {
        try {
          const tagsPath = path.join(folderPath, 'tags.txt');
          const tagsStat = await fs.stat(tagsPath).catch(() => null);
          if (tagsStat && tagsStat.isFile()) {
            const raw = await fs.readFile(tagsPath, 'utf8');
            const trimmed = raw.trim();
            if (trimmed) {
              tags = trimmed.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            }
          }
        } catch (e) {}
      }

      let media = [];
      const categories = new Set();

      // Add Dropbox video links from dropboxUrls array
      for (const dropboxUrl of dropboxUrls) {
        categories.add('visual');
        media.push({ type: 'video', url: dropboxUrl });
      }

      // Add YouTube embed if youtube.txt exists
      if (youtubeUrl) {
        categories.add('visual');
        media.push({ type: 'youtube', url: youtubeUrl });
      }

      // Add all media files
      for (const file of files) {
        if (file.type === 'audio') {
          categories.add('audio');
          media.push({ type: 'audio', url: `/media/${folder}/${file.name}` });
        } else if (file.type === 'video') {
          categories.add('visual');
          media.push({ type: 'video', url: `/media/${folder}/${file.name}` });
        } else if (file.type === 'image') {
          categories.add('visual');
          media.push({ type: 'image', url: `/media/${folder}/${file.name}` });
        }
      }

      // Sort media: 
      // 1. Dropbox/external videos (non-thumbnail, external URLs)
      // 2. YouTube embeds
      // 3. Local non-thumbnail videos
      // 4. Images
      // 5. Audio
      media.sort((a, b) => {
        const isAThumbnail = a.url.toLowerCase().includes('_thumbnail.');
        const isBThumbnail = b.url.toLowerCase().includes('_thumbnail.');
        const isAExternal = a.type === 'video' && (a.url.startsWith('http://') || a.url.startsWith('https://'));
        const isBExternal = b.type === 'video' && (b.url.startsWith('http://') || b.url.startsWith('https://'));
        
        // Dropbox/external videos first
        if (isAExternal && !isBExternal) return -1;
        if (!isAExternal && isBExternal) return 1;
        
        // Then by type order
        const order = { youtube: 0, video: 1, image: 2, audio: 3 };
        const typeOrder = order[a.type] - order[b.type];
        if (typeOrder !== 0) return typeOrder;
        
        // Within same type, non-thumbnails before thumbnails
        if (!isAThumbnail && isBThumbnail) return -1;
        if (isAThumbnail && !isBThumbnail) return 1;
        
        return 0;
      });

      // If no media files found, add placeholder
      if (media.length === 0) {
        categories.add('visual');
        media.push({ type: 'image', url: PLACEHOLDERS.image });
      }

      const title = makeTitle(folder);
      const existingProject = existingProjectMap.get(title) || existingProjectMap.get(folder);
      
      // Determine the final title: data.txt > existing project title > generated title
      const finalTitle = titleFromFile || existingProject?.title || title;
      
      // Determine the final categories: data.txt > existing project > scanned media types
      const finalCategories = categoriesFromFile.length > 0 
        ? categoriesFromFile 
        : (existingProject?.categories || Array.from(categories));
      
      // Determine the final date/year: data.txt year > existing project date > 2025
      const finalDate = yearFromFile || existingProject?.date || '2025';
      
      // Determine the final tags: data.txt > existing project > empty
      const finalTags = tags.length > 0 ? tags : (existingProject?.tags || []);
      
      // Build new project, preserving existing fields if project already exists
      // Description and categories are always updated from data.txt if present
      const project = {
        title: finalTitle,
        tags: finalTags,
        categories: finalCategories,
        date: finalDate,
        media,
        ...(description ? { description } : {}),
        ...(layoutFromFile ? { layout: layoutFromFile } : {}),
        ...(allowSimultaneousPlaybackFromFile !== null ? { allowSimultaneousPlayback: allowSimultaneousPlaybackFromFile } : {}),
      };

      projects.push(project);
    }

    // generate TypeScript file content
    const fileContent = `// This file is autogenerated by scripts/generate-projects.js
// Run: node scripts/generate-projects.js

import { Project } from '@/types/project';

export const projects: Project[] = ${JSON.stringify(projects, null, 2)} as Project[];
`;

    await fs.writeFile(OUTPUT_FILE, fileContent, 'utf8');
    console.log(`Wrote ${OUTPUT_FILE} with ${projects.length} projects.`);
  } catch (err) {
    console.error('Failed to generate projects:', err);
    process.exit(1);
  }
})();
