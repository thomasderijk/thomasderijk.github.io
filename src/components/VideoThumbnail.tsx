import { useEffect, useRef, useState } from 'react';
import { useVideoLoadQueue } from '@/hooks/use-video-load-queue';

interface VideoThumbnailProps {
  src: string;
  alt: string;
  className?: string;
  projectVideos?: string[]; // All video URLs in the project for preloading
}

export function VideoThumbnail({ src, alt, className = '', projectVideos = [] }: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const hasPlayedRef = useRef(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout>();
  const [shouldAutoplay, setShouldAutoplay] = useState(false); // Changed to false - only play on hover
  const [metadataLoaded, setMetadataLoaded] = useState(false);

  // Determine if this is an image or video based on file extension
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(src);

  // Handle hover play/pause
  const handleMouseEnter = () => {
    const video = videoRef.current;
    if (video && metadataLoaded) {
      video.play().catch(() => {
        // Ignore play errors
      });
    }

    // Preload project video metadata on hover (for faster detail page load)
    if (projectVideos.length > 0) {
      projectVideos.forEach((videoUrl) => {
        // Skip if it's the same as thumbnail
        if (videoUrl === src) return;

        // Check if external video (dropbox, etc)
        if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
          // Create hidden video element to preload metadata
          const preloadVideo = document.createElement('video');
          preloadVideo.src = videoUrl;
          preloadVideo.preload = 'metadata';
          preloadVideo.style.display = 'none';
          document.body.appendChild(preloadVideo);

          // Remove after metadata is loaded or on error
          const cleanup = () => {
            if (preloadVideo.parentNode) {
              preloadVideo.parentNode.removeChild(preloadVideo);
            }
          };

          preloadVideo.addEventListener('loadedmetadata', cleanup, { once: true });
          preloadVideo.addEventListener('error', cleanup, { once: true });

          // Fallback cleanup after 10 seconds
          setTimeout(cleanup, 10000);
        }
      });
    }
  };

  const handleMouseLeave = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
    }
  };
  
  // Use queue-based loading
  const { shouldLoad, notifyLoadComplete } = useVideoLoadQueue(src, () => {
    // Media is now allowed to start loading
  });

  // Detect network conditions and disable autoplay on slow connections
  useEffect(() => {
    // Check for Network Information API support
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      const effectiveType = connection.effectiveType;
      // Disable autoplay on 2G or slow-2g connections
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        setShouldAutoplay(false);
      }
      
      // Listen for connection changes
      const handleConnectionChange = () => {
        const newType = connection.effectiveType;
        setShouldAutoplay(newType !== 'slow-2g' && newType !== '2g');
      };
      
      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        connection.removeEventListener('change', handleConnectionChange);
      };
    }
  }, []);

  // Handle intersection observer with lazy unmount (keep video in memory briefly)
  useEffect(() => {
    if (isImage || !shouldLoad) return;
    
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Clear any pending pause timeout (lazy unmount)
          if (pauseTimeoutRef.current) {
            clearTimeout(pauseTimeoutRef.current);
            pauseTimeoutRef.current = undefined;
          }

          // Only autoplay if network conditions allow
          if (shouldAutoplay && metadataLoaded) {
            hasPlayedRef.current = true;
            video.play().catch(() => {
              // Ignore play errors (e.g., if user hasn't interacted with page)
            });
          }
        } else {
          // Lazy unmount: delay pausing for 2 seconds to allow smooth scroll-back
          pauseTimeoutRef.current = setTimeout(() => {
            video.pause();
          }, 2000);
        }
      },
      {
        threshold: 0.25, // Play earlier for smoother UX
        rootMargin: '100px', // Start loading earlier
      }
    );

    observer.observe(video);

    // Check if video is already visible and start playing
    const rect = video.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (isVisible && shouldAutoplay && metadataLoaded) {
      hasPlayedRef.current = true;
      video.play().catch(() => {
        // Ignore play errors
      });
    }

    return () => {
      // Clear timeout on unmount
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
      observer.disconnect();
    };
  }, [shouldAutoplay, shouldLoad, metadataLoaded, isImage]); // Re-run if network conditions change

  // Handle metadata loading for images
  useEffect(() => {
    if (!isImage || !shouldLoad) return;
    
    const img = imageRef.current;
    if (!img) return;

    const handleLoad = () => {
      setMetadataLoaded(true);
      notifyLoadComplete();
    };

    const handleError = () => {
      // Even on error, notify so the queue continues
      notifyLoadComplete();
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    // Check if image already loaded (cached)
    if (img.complete) {
      handleLoad();
    }

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [isImage, shouldLoad, notifyLoadComplete]);

  // Handle metadata loading for videos (random start time)
  useEffect(() => {
    if (isImage || !shouldLoad) return;
    
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (video.duration && isFinite(video.duration)) {
        // Pick random time between 0 and 80% of duration
        video.currentTime = Math.random() * video.duration * 0.8;
      }
      setMetadataLoaded(true);
      // Notify queue that this video has loaded
      notifyLoadComplete();
    };

    const handleError = () => {
      // Even on error, notify so the queue continues
      notifyLoadComplete();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
    };
  }, [isImage, src, shouldLoad, notifyLoadComplete]);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {shouldLoad && (
        isImage ? (
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            className={className}
            decoding="async"
            style={{ aspectRatio: 'auto' }}
          />
        ) : (
          <video
            ref={videoRef}
            src={src}
            className={className}
            loop
            muted
            playsInline
            preload="metadata" // Always preload metadata for dimensions and first frame
            disablePictureInPicture
            disableRemotePlayback
            aria-label={alt}
            // Performance optimizations
            style={{
              objectFit: 'cover',
              backgroundColor: 'transparent'
            }}
          />
        )
      )}
    </div>
  );
}
