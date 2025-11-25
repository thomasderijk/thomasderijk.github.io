import { useEffect, useRef } from 'react';
import { projects } from '@/data/projects';
import { Project, MediaItem } from '@/types/project';

// Cache for preloaded metadata with dimensions
const preloadedVideos = new Set<string>();
const preloadedImages = new Set<string>();
export const thumbnailDimensionsCache = new Map<string, { width: number; height: number }>();

// Cache for selected thumbnails per project (persists during session)
// Key: project title, Value: selected thumbnail URL
const selectedThumbnailCache = new Map<string, string>();

// Helper function to get or select thumbnail media from project
// Uses cache to ensure consistent selection across page loads
const getThumbnailMedia = (project: Project): MediaItem | null => {
  const thumbnailVideos = project.media.filter(m =>
    m.type === 'video' && m.url.toLowerCase().includes('_thumbnail.')
  );
  const thumbnailImages = project.media.filter(m =>
    m.type === 'image' && m.url.toLowerCase().includes('_thumbnail.')
  );

  const allImages = project.media.filter(m => m.type === 'image');
  const hasAudio = project.media.some(m => m.type === 'audio');

  // Check if we already have a selected thumbnail for this project
  const cachedUrl = selectedThumbnailCache.get(project.title);

  // If cached, verify it still exists in the project's media
  if (cachedUrl) {
    const cachedMedia = project.media.find(m => m.url === cachedUrl);
    if (cachedMedia) {
      return cachedMedia;
    }
  }

  // No cache or invalid cache - select a new random thumbnail
  let selectedMedia: MediaItem | null = null;

  if (thumbnailVideos.length > 0) {
    const randomIndex = Math.floor(Math.random() * thumbnailVideos.length);
    selectedMedia = thumbnailVideos[randomIndex];
  } else if (thumbnailImages.length > 0) {
    const randomIndex = Math.floor(Math.random() * thumbnailImages.length);
    selectedMedia = thumbnailImages[randomIndex];
  } else if (allImages.length === 1 && hasAudio) {
    selectedMedia = allImages[0];
  }

  // Cache the selection
  if (selectedMedia) {
    selectedThumbnailCache.set(project.title, selectedMedia.url);
  }

  return selectedMedia;
};

// Preload a single video's first frame and cache dimensions
const preloadVideoMetadata = (url: string): Promise<void> => {
  if (preloadedVideos.has(url)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'auto'; // Load first frame, not just metadata
    video.muted = true;
    video.playsInline = true;
    video.style.display = 'none';

    const cleanup = () => {
      // Cache dimensions before cleanup
      if (video.videoWidth && video.videoHeight) {
        thumbnailDimensionsCache.set(url, {
          width: video.videoWidth,
          height: video.videoHeight
        });
      }
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
      preloadedVideos.add(url);
      resolve();
    };

    // Wait for first frame to be loaded (loadeddata), not just metadata
    video.addEventListener('loadeddata', () => {
      cleanup();
    }, { once: true });
    video.addEventListener('error', cleanup, { once: true });

    // Timeout fallback
    setTimeout(cleanup, 10000); // Increased timeout since we're loading more data

    video.src = url;
    document.body.appendChild(video);
  });
};

// Preload a single image and cache dimensions
const preloadImage = (url: string): Promise<void> => {
  if (preloadedImages.has(url)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      // Cache dimensions
      if (img.naturalWidth && img.naturalHeight) {
        thumbnailDimensionsCache.set(url, {
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      }
      preloadedImages.add(url);
      resolve();
    };

    img.onerror = () => {
      preloadedImages.add(url);
      resolve();
    };

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

// Get cached dimensions for a thumbnail
export const getCachedThumbnailDimensions = (url: string): { width: number; height: number } | null => {
  return thumbnailDimensionsCache.get(url) || null;
};

// Clear thumbnail selection cache (called when randomizing grid)
export const clearThumbnailSelectionCache = () => {
  selectedThumbnailCache.clear();
};

// Get the currently selected thumbnail for a project
export const getSelectedThumbnailForProject = (project: Project): MediaItem | null => {
  return getThumbnailMedia(project);
};
