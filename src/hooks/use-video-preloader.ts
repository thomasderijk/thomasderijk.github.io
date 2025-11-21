import { useEffect, useRef } from 'react';
import { projects } from '@/data/projects';

// Global cache to store video dimensions after preloading
export const videoMetadataCache = new Map<string, { width: number; height: number }>();

// Preload video metadata for faster detail view loading
// Metadata is very light (~5-20KB per video) and gives us dimensions for proper sizing
export function useVideoPreloader() {
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Collect all video URLs from projects (excluding thumbnails which are already loaded)
    const videoUrls: string[] = [];
    projects.forEach(project => {
      project.media.forEach(media => {
        if (media.type === 'video' &&
            !videoMetadataCache.has(media.url) &&
            !media.url.toLowerCase().includes('_thumbnail.')) {
          videoUrls.push(media.url);
        }
      });
    });

    // Preload videos in batches to avoid overwhelming the browser
    const BATCH_SIZE = 4;
    let currentIndex = 0;

    const preloadBatch = () => {
      const batch = videoUrls.slice(currentIndex, currentIndex + BATCH_SIZE);
      if (batch.length === 0) return;

      batch.forEach(url => {
        if (videoMetadataCache.has(url)) return;

        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        video.style.display = 'none';

        const cleanup = () => {
          if (video.parentNode) {
            video.parentNode.removeChild(video);
          }
        };

        video.addEventListener('loadedmetadata', () => {
          // Cache the dimensions
          if (video.videoWidth && video.videoHeight) {
            videoMetadataCache.set(url, {
              width: video.videoWidth,
              height: video.videoHeight
            });
          }
          cleanup();
        }, { once: true });

        video.addEventListener('error', cleanup, { once: true });

        // Fallback cleanup after 20 seconds
        setTimeout(cleanup, 20000);

        video.src = url;
        document.body.appendChild(video);
      });

      currentIndex += BATCH_SIZE;

      // Schedule next batch with delay to not block main thread
      if (currentIndex < videoUrls.length) {
        setTimeout(preloadBatch, 300);
      }
    };

    // Start preloading after a short delay to not block initial render
    const timeoutId = setTimeout(preloadBatch, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);
}

// Helper to get cached dimensions
export function getCachedVideoDimensions(url: string): { width: number; height: number } | null {
  return videoMetadataCache.get(url) || null;
}
