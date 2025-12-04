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

async function generateJpegThumbnails() {
  try {
    // Find all video thumbnail files recursively
    const findVideoThumbnails = async (dir) => {
      let videoThumbnails = [];
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          const subThumbnails = await findVideoThumbnails(fullPath);
          videoThumbnails = videoThumbnails.concat(subThumbnails);
        } else if (entry.isFile() && entry.name.includes('_thumbnail.') && /\.(mov|mp4|webm|mkv)$/i.test(entry.name)) {
          videoThumbnails.push(fullPath);
        }
      }

      return videoThumbnails;
    };

    const videoThumbnails = await findVideoThumbnails(MEDIA_DIR);
    console.log(`Found ${videoThumbnails.length} video thumbnails`);

    let generatedCount = 0;
    let skippedCount = 0;

    for (const videoPath of videoThumbnails) {
      // Generate JPEG path (same name but .jpg extension)
      const jpegPath = videoPath.replace(/\.(mov|mp4|webm|mkv)$/i, '.jpg');

      // Check if JPEG already exists
      try {
        await fs.access(jpegPath);
        console.log(`Skipping ${path.basename(videoPath)} - JPEG already exists`);
        skippedCount++;
        continue;
      } catch {
        // JPEG doesn't exist, generate it
      }

      try {
        console.log(`Generating JPEG for ${path.basename(videoPath)}...`);

        // Use ffmpeg to extract first frame as JPEG with high quality
        await execFileAsync('/opt/homebrew/bin/ffmpeg', [
          '-i', videoPath,           // Input video
          '-vframes', '1',            // Extract 1 frame
          '-q:v', '2',                // High quality (2-5 is good, 2 is higher quality)
          '-y',                       // Overwrite output file if exists
          jpegPath                    // Output JPEG
        ]);

        generatedCount++;
        console.log(`✓ Generated ${path.basename(jpegPath)}`);
      } catch (error) {
        console.error(`✗ Failed to generate JPEG for ${path.basename(videoPath)}:`, error.message);
      }
    }

    console.log(`\nDone! Generated ${generatedCount} JPEGs, skipped ${skippedCount} existing files.`);
  } catch (err) {
    console.error('Failed to generate JPEG thumbnails:', err);
    process.exit(1);
  }
}

generateJpegThumbnails();
