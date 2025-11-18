import { useEffect, useRef } from 'react';
import { projects } from '@/data/projects';
import { Project, MediaItem } from '@/types/project';

// Cache for preloaded metadata
const preloadedVideos = new Set<string>();
const preloadedImages = new Set<string>();

// Helper function to get thumbnail media from project (same logic as in Visual/Audio pages)
const getThumbnailMedia = (project: Project): MediaItem | null => {
  const thumbnailVideos = project.media.filter(m =>
    m.type === 'video' && m.url.toLowerCase().includes('_thumbnail.')
  );
  const thumbnailImages = project.media.filter(m =>
    m.type === 'image' && m.url.toLowerCase().includes('_thumbnail.')
  );

  const allImages = project.media.filter(m => m.type === 'image');
  const hasAudio = project.media.some(m => m.type === 'audio');

  if (thumbnailVideos.length > 0) {
    return thumbnailVideos[0]; // Just preload the first one
  }

  if (thumbnailImages.length > 0) {
    return thumbnailImages[0];
  }

  if (allImages.length === 1 && hasAudio) {
    return allImages[0];
  }

  return null;
};

// Preload a single video's metadata
const preloadVideoMetadata = (url: string): Promise<void> => {
  if (preloadedVideos.has(url)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.style.display = 'none';

    const cleanup = () => {
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
      preloadedVideos.add(url);
      resolve();
    };

    video.addEventListener('loadedmetadata', cleanup, { once: true });
    video.addEventListener('error', cleanup, { once: true });

    // Timeout fallback
    setTimeout(cleanup, 5000);

    video.src = url;
    document.body.appendChild(video);
  });
};

// Preload a single image
const preloadImage = (url: string): Promise<void> => {
  if (preloadedImages.has(url)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const img = new Image();

    const cleanup = () => {
      preloadedImages.add(url);
      resolve();
    };

    img.onload = cleanup;
    img.onerror = cleanup;

    img.src = url;
  });
};

// Main preload function
export const preloadAllThumbnails = async () => {
  // Get all visual and audio projects
  const relevantProjects = projects.filter(p =>
    p.categories.includes('visual') || p.categories.includes('audio')
  );

  const thumbnails = relevantProjects
    .map(project => getThumbnailMedia(project))
    .filter((media): media is MediaItem => media !== null);

  // Separate videos and images
  const videoThumbnails = thumbnails.filter(m => m.type === 'video');
  const imageThumbnails = thumbnails.filter(m => m.type === 'image');

  // Preload images first (they're usually faster)
  await Promise.all(imageThumbnails.map(m => preloadImage(m.url)));

  // Preload videos in parallel batches of 4 to avoid overwhelming the browser
  const batchSize = 4;
  for (let i = 0; i < videoThumbnails.length; i += batchSize) {
    const batch = videoThumbnails.slice(i, i + batchSize);
    await Promise.all(batch.map(m => preloadVideoMetadata(m.url)));
  }
};

// Hook to trigger preloading
export const useThumbnailPreload = () => {
  const hasPreloaded = useRef(false);

  useEffect(() => {
    if (hasPreloaded.current) return;
    hasPreloaded.current = true;

    // Start preloading after a short delay to not block initial render
    const timer = setTimeout(() => {
      preloadAllThumbnails();
    }, 500);

    return () => clearTimeout(timer);
  }, []);
};

// Check if a specific URL has been preloaded
export const isPreloaded = (url: string): boolean => {
  return preloadedVideos.has(url) || preloadedImages.has(url);
};
