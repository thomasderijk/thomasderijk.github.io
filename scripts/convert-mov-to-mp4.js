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
const BACKUP_DIR = path.join(MEDIA_DIR, 'thumbnail_mov_backup');

// Find all MOV thumbnail files recursively
async function findMovThumbnails(dir, baseDir = dir) {
  let movFiles = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip backup directory
      if (fullPath === BACKUP_DIR) continue;

      const subFiles = await findMovThumbnails(fullPath, baseDir);
      movFiles = movFiles.concat(subFiles);
    } else if (entry.isFile() && entry.name.toLowerCase().includes('_thumbnail.') && entry.name.toLowerCase().endsWith('.mov')) {
      const relativePath = path.relative(baseDir, fullPath);
      movFiles.push({ fullPath, relativePath });
    }
  }

  return movFiles;
}

// Backup a single MOV file
async function backupMovFile(sourceFile, relativePath) {
  const backupPath = path.join(BACKUP_DIR, relativePath);
  const backupDir = path.dirname(backupPath);

  // Create backup directory structure
  await fs.mkdir(backupDir, { recursive: true });

  // Copy file to backup
  await fs.copyFile(sourceFile, backupPath);
  console.log(`  ✓ Backed up: ${relativePath}`);
}

// Convert MOV to MP4
async function convertToMp4(movPath) {
  const mp4Path = movPath.replace(/\.mov$/i, '.mp4');

  try {
    console.log(`  Converting: ${path.basename(movPath)}...`);

    await execFileAsync('/opt/homebrew/bin/ffmpeg', [
      '-i', movPath,                    // Input MOV file
      '-c:v', 'libx264',                // H.264 codec
      '-crf', '18',                     // High quality (visually lossless)
      '-preset', 'slow',                // Better compression
      '-pix_fmt', 'yuv420p',           // Broad compatibility
      '-movflags', '+faststart',        // Optimize for web streaming
      '-y',                             // Overwrite if exists
      mp4Path                           // Output MP4 file
    ]);

    console.log(`  ✓ Converted: ${path.basename(mp4Path)}`);
    return mp4Path;
  } catch (error) {
    console.error(`  ✗ Failed to convert ${path.basename(movPath)}:`, error.message);
    return null;
  }
}

(async () => {
  try {
    console.log('Starting MOV to MP4 conversion process...\n');

    // Step 1: Find all MOV thumbnails
    console.log('Step 1: Finding MOV thumbnail files...');
    const movFiles = await findMovThumbnails(MEDIA_DIR);
    console.log(`Found ${movFiles.length} MOV thumbnail files.\n`);

    if (movFiles.length === 0) {
      console.log('No MOV thumbnails to convert. Exiting.');
      process.exit(0);
    }

    // Step 2: Create backup directory and backup all MOV files
    console.log('Step 2: Creating backups...');
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    for (const { fullPath, relativePath } of movFiles) {
      await backupMovFile(fullPath, relativePath);
    }
    console.log(`✓ All ${movFiles.length} files backed up to thumbnail_mov_backup/\n`);

    // Step 3: Convert each MOV to MP4
    console.log('Step 3: Converting MOV files to MP4...');
    let successCount = 0;
    let failCount = 0;

    for (const { fullPath } of movFiles) {
      const result = await convertToMp4(fullPath);
      if (result) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log(`\n✓ Conversion complete: ${successCount} successful, ${failCount} failed\n`);

    // Step 4: Delete original MOV files (only if conversion was successful)
    if (failCount === 0) {
      console.log('Step 4: Removing original MOV files...');
      for (const { fullPath } of movFiles) {
        await fs.unlink(fullPath);
        console.log(`  ✓ Deleted: ${path.basename(fullPath)}`);
      }
      console.log(`\n✓ All original MOV files removed.\n`);
    } else {
      console.log('⚠ Some conversions failed. Original MOV files have been kept.\n');
    }

    console.log('Done! Summary:');
    console.log(`  - ${movFiles.length} MOV files backed up to thumbnail_mov_backup/`);
    console.log(`  - ${successCount} files successfully converted to MP4`);
    if (failCount > 0) {
      console.log(`  - ${failCount} files failed to convert`);
    }

  } catch (err) {
    console.error('Failed to convert MOV files:', err);
    process.exit(1);
  }
})();
