#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const FAVICONS_DIR = path.join(PUBLIC_DIR, 'favicons');

// All shuffle icons from App.tsx
const shuffleIcons = [
  '✢', '✣', '✤', '✥', '✦', '✧',
  '✱', '✲', '✳', '✴', '✵', '✶',
  '✻', '✼', '✽', '✾', '✿', '❀',
  '❃', '❄', '❅', '❆', '❇', '❈', '❉', '❊', '❋'
];

// Generate SVG favicon with adaptive color (white in dark mode, black in light mode)
function generateSVGFavicon(icon, index) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { fill: white; }
    @media (prefers-color-scheme: light) {
      text { fill: black; }
    }
  </style>
  <text
    x="16"
    y="16"
    font-family="Arial, sans-serif"
    font-size="30"
    text-anchor="middle"
    dominant-baseline="central"
  >${icon}</text>
</svg>`;
}

(async () => {
  try {
    console.log('Generating random favicons...\n');

    // Create favicons directory
    await fs.mkdir(FAVICONS_DIR, { recursive: true });

    // Generate SVG for each icon
    for (let i = 0; i < shuffleIcons.length; i++) {
      const icon = shuffleIcons[i];
      const svg = generateSVGFavicon(icon, i);
      const filename = `favicon-${i}.svg`;
      const filepath = path.join(FAVICONS_DIR, filename);

      await fs.writeFile(filepath, svg, 'utf8');
      console.log(`✓ Generated ${filename} with icon: ${icon}`);
    }

    console.log(`\n✓ Generated ${shuffleIcons.length} favicon SVGs in public/favicons/`);
    console.log('\nNext steps:');
    console.log('1. Add favicon randomizer to your app (see instructions below)');
    console.log('2. The favicon will randomly change on each page load\n');

  } catch (err) {
    console.error('Failed to generate favicons:', err);
    process.exit(1);
  }
})();
