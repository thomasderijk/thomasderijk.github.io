import { useEffect, useRef, useState } from 'react';

interface VideoThumbnailProps {
  src: string;
  alt: string;
  className?: string;
}

export function VideoThumbnail({ src, alt, className = '' }: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Determine if this is an image or video based on file extension
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(src);

  // Simple intersection observer - load when in viewport
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Load once and stop observing
        }
      },
      {
        rootMargin: '50px', // Start loading slightly before entering viewport
      }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Handle hover play/pause for videos
  const handleMouseEnter = () => {
    const video = videoRef.current;
    if (video && !isImage) {
      video.play().catch(() => {
        // Ignore play errors
      });
    }
  };

  const handleMouseLeave = () => {
    const video = videoRef.current;
    if (video && !isImage) {
      video.pause();
    }
  };

  // Set random start time for videos
  useEffect(() => {
    if (!isVisible || isImage) return;

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
  }, [isVisible, isImage]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {!isVisible && (
        <div className={className} style={{ aspectRatio: 1, backgroundColor: 'hsl(0, 0%, 10%)' }} />
      )}
      {isVisible && (
        isImage ? (
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            className={className}
            loading="lazy"
            decoding="async"
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
              backgroundColor: 'transparent'
            }}
          />
        )
      )}
    </div>
  );
}
