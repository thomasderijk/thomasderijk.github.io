import { useEffect, useRef } from 'react';
import { projects } from '@/data/projects';

// Global cache to store video dimensions and preloaded video elements
export const videoMetadataCache = new Map<string, { width: number; height: number }>();
export const preloadedVideoElements = new Map<string, HTMLVideoElement>();

// Preload all videos - load first frame and keep elements in DOM
export function useVideoPreloader() {
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Collect all video URLs from projects
    const videoUrls: string[] = [];
    projects.forEach(project => {
      project.media.forEach(media => {
        if (media.type === 'video' && !media.url.toLowerCase().includes('_thumbnail.')) {
          videoUrls.push(media.url);
        }
      });
    });

    // Create hidden container for preloaded videos
    const container = document.createElement('div');
    container.id = 'video-preload-container';
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.visibility = 'hidden';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);

    // Preload videos in batches
    const BATCH_SIZE = 3;
    let currentIndex = 0;

    const preloadBatch = () => {
      const batch = videoUrls.slice(currentIndex, currentIndex + BATCH_SIZE);
      if (batch.length === 0) return;

      batch.forEach(url => {
        if (preloadedVideoElements.has(url)) return;

        const video = document.createElement('video');
        video.preload = 'auto'; // Changed to 'auto' for faster/more aggressive preloading
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';

        // When metadata loads, cache dimensions
        video.addEventListener('loadedmetadata', () => {
          if (video.videoWidth && video.videoHeight) {
            videoMetadataCache.set(url, {
              width: video.videoWidth,
              height: video.videoHeight
            });
          }
        });

        // When first frame loads, keep the element
        video.addEventListener('loadeddata', () => {
          preloadedVideoElements.set(url, video);
        });

        video.addEventListener('error', (e) => {
          console.error(`[Preloader] Error loading ${url.substring(url.lastIndexOf('/') + 1)}:`, e);
        });

        video.src = url;
        container.appendChild(video);
      });

      currentIndex += BATCH_SIZE;

      if (currentIndex < videoUrls.length) {
        setTimeout(preloadBatch, 200); // Reduced from 500ms to 200ms for faster loading
      }
    };

    // Start preloading immediately (reduced from 1000ms)
    setTimeout(preloadBatch, 100);

    return () => {
      // Cleanup on unmount
      const cont = document.getElementById('video-preload-container');
      if (cont) {
        document.body.removeChild(cont);
      }
    };
  }, []);
}

// Helper to get cached dimensions
export function getCachedVideoDimensions(url: string): { width: number; height: number } | null {
  return videoMetadataCache.get(url) || null;
}

// Helper to get preloaded video element
export function getPreloadedVideo(url: string): HTMLVideoElement | null {
  return preloadedVideoElements.get(url) || null;
}
