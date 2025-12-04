import { useEffect, useRef } from 'react';
import { projects } from '@/data/projects';

// Global cache to store video dimensions, preloaded video elements, and poster images
export const videoMetadataCache = new Map<string, { width: number; height: number }>();
export const preloadedVideoElements = new Map<string, HTMLVideoElement>();
export const videoPosterCache = new Map<string, string>(); // stores data URLs of first frames

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

        // When first frame loads, capture it as poster and keep the element
        video.addEventListener('loadeddata', () => {
          preloadedVideoElements.set(url, video);

          // Capture first frame as poster image
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const posterDataUrl = canvas.toDataURL('image/jpeg', 0.8);
              videoPosterCache.set(url, posterDataUrl);
            }
          } catch (e) {
            // Ignore canvas errors (CORS issues, etc.)
          }
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

// Helper to get poster image
export function getVideoPoster(url: string): string | null {
  return videoPosterCache.get(url) || null;
}
