import { useEffect, useRef, useState } from 'react';

interface VideoThumbnailProps {
  src: string;
  alt: string;
  className?: string;
  loadDelay?: number; // Optional stagger delay (not used with new strategy)
}

export function VideoThumbnail({ src, alt, className = '' }: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showVideo, setShowVideo] = useState(false);

  // Determine if source is video or image
  const isVideoSource = /\.(mov|mp4|webm|mkv)$/i.test(src);

  // For video sources, get the JPEG fallback (same name, .jpg extension)
  const jpegSrc = isVideoSource ? src.replace(/\.(mov|mp4|webm|mkv)$/i, '.jpg') : src;

  // Detect if device is mobile (user agent only, not window width)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Track visibility for loading priority on both mobile and desktop
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  // Observe visibility to control video loading priority (both mobile and desktop)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setHasBeenVisible(true);
          } else {
            setIsVisible(false);
          }
        });
      },
      {
        rootMargin: '400px', // Start loading well before entering viewport
        threshold: 0.01 // Trigger as soon as even 1% is visible
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Preload video in background if source is video
  // Priority loading: wait until visible or near visible before loading
  useEffect(() => {
    if (!isVideoSource) return;

    // Don't load until visible or has been visible
    if (!hasBeenVisible) return;

    // Preload video
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = src;

    const handleCanPlay = () => {
      // Video is ready, show it
      setShowVideo(true);
    };

    video.addEventListener('canplaythrough', handleCanPlay);
    video.load();

    return () => {
      video.removeEventListener('canplaythrough', handleCanPlay);
      video.src = '';
    };
  }, [src, isVideoSource, hasBeenVisible]);

  // Handle hover play/pause for videos (desktop only)
  const handleMouseEnter = () => {
    const video = videoRef.current;
    if (video && showVideo && !isMobile) {
      video.play().catch(() => {
        // Ignore play errors
      });
    }
  };

  const handleMouseLeave = () => {
    const video = videoRef.current;
    if (video && showVideo && !isMobile) {
      video.pause();
    }
  };

  // Autoplay on mobile when video is visible, pause when not visible
  useEffect(() => {
    if (!isMobile || !showVideo) return;

    const video = videoRef.current;
    if (!video) return;

    if (isVisible) {
      // Visible: play the video
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
    } else {
      // Not visible: pause the video
      if (!video.paused) {
        video.pause();
      }
    }
  }, [isMobile, showVideo, isVisible]);

  // Set random start time for videos
  useEffect(() => {
    if (!showVideo) return;

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
  }, [showVideo]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Always show JPEG first for instant load */}
      {!isVideoSource ? (
        // For image sources, just show the image
        <img
          src={jpegSrc}
          alt={alt}
          className={className}
          loading="eager"
          decoding="async"
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            opacity: 1
          }}
        />
      ) : (
        // For video sources, show both JPEG and video (layered)
        <>
          {/* JPEG layer - always visible behind video */}
          <img
            src={jpegSrc}
            alt={alt}
            className={className}
            loading="eager"
            decoding="async"
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              opacity: 1
            }}
          />

          {/* Video layer - overlays on top when ready */}
          {showVideo && (
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
                position: 'absolute',
                top: 0,
                left: 0,
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                backgroundColor: 'transparent',
                opacity: 1
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
