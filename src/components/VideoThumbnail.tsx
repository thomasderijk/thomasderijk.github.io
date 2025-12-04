import { useEffect, useRef, useState } from 'react';

interface VideoThumbnailProps {
  src: string;
  alt: string;
  className?: string;
  loadDelay?: number; // Optional stagger delay
}

// Simple aspect ratio detection from common thumbnail sizes
const estimateAspectRatio = (src: string): number => {
  // Most thumbnails are square or close to square for grid display
  // Default to 1:1 (square) which is common for grid thumbnails
  return 1;
};

export function VideoThumbnail({ src, alt, className = '', loadDelay = 0 }: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const loadingBatchRef = useRef<NodeJS.Timeout | null>(null);

  // Determine if this is an image or video based on file extension
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(src);

  // Estimate aspect ratio for placeholder
  const aspectRatio = estimateAspectRatio(src);

  // Check if element is visible in viewport (simple check)
  const isVisible = () => {
    if (!containerRef.current) return false;
    const rect = containerRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    // Check if element is in viewport
    return (
      rect.top < windowHeight &&
      rect.bottom > 0 &&
      rect.left < windowWidth &&
      rect.right > 0
    );
  };

  // Load visible thumbnails immediately, others with stagger delay
  useEffect(() => {
    const checkAndLoad = () => {
      if (isVisible()) {
        // Visible: load immediately (no delay)
        setIsLoaded(true);
      } else {
        // Not visible: load with stagger delay
        loadingBatchRef.current = setTimeout(() => {
          setIsLoaded(true);
        }, loadDelay);
      }
    };

    // Check on mount
    checkAndLoad();

    return () => {
      if (loadingBatchRef.current) {
        clearTimeout(loadingBatchRef.current);
      }
    };
  }, [loadDelay]);

  // Detect if device is mobile (user agent only, not window width)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Handle hover play/pause for videos (desktop only)
  const handleMouseEnter = () => {
    const video = videoRef.current;
    if (video && !isImage && !isMobile) {
      video.play().catch(() => {
        // Ignore play errors
      });
    }
  };

  const handleMouseLeave = () => {
    const video = videoRef.current;
    if (video && !isImage && !isMobile) {
      video.pause();
    }
  };

  // Autoplay on mobile when video is visible
  useEffect(() => {
    if (!isMobile || isImage) return;

    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      video.play().catch(() => {
        // Ignore autoplay errors
      });
    };

    video.addEventListener('canplay', handleCanPlay);

    // Try to play immediately if already can play
    if (video.readyState >= 3) {
      video.play().catch(() => {
        // Ignore autoplay errors
      });
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [isMobile, isImage]);

  // Set random start time for videos
  useEffect(() => {
    if (isImage) return;

    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (video.duration && isFinite(video.duration)) {
        video.currentTime = Math.random() * video.duration * 0.8;
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [isImage]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isImage ? (
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className={className}
          loading="eager"
          decoding="async"
          style={{
            opacity: 1,
            transition: 'opacity 0.3s ease-in-out'
          }}
        />
      ) : (
        <video
          ref={videoRef}
          src={src}
          className={className}
          loop
          muted
          playsInline
          preload="metadata"
          disablePictureInPicture
          disableRemotePlayback
          aria-label={alt}
          style={{
            objectFit: 'cover',
            backgroundColor: 'transparent',
            opacity: 1,
            transition: 'opacity 0.3s ease-in-out'
          }}
        />
      )}
    </div>
  );
}
