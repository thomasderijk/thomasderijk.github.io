import { useRef, useState, useEffect } from 'react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { getCachedVideoDimensions } from '@/hooks/use-video-preloader';

interface VideoPlayerProps {
  url: string;
  autoPlay?: boolean;
}

export const VideoPlayer = ({ url, autoPlay = true }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Try to get cached dimensions immediately for instant sizing
  const cachedDimensions = getCachedVideoDimensions(url);
  const initialAspectRatio = cachedDimensions
    ? cachedDimensions.width / cachedDimensions.height
    : 16/9;

  const [aspectRatio, setAspectRatio] = useState<number>(initialAspectRatio);
  const [metadataLoaded, setMetadataLoaded] = useState(!!cachedDimensions);
  // If video was preloaded (has cached dimensions), assume first frame is also loaded
  const [hasFirstFrame, setHasFirstFrame] = useState(!!cachedDimensions);
  const { pauseForMedia, resumeAfterMedia } = useAudioPlayer();

  // Use ref to always have access to latest functions
  const pauseForMediaRef = useRef(pauseForMedia);
  const resumeAfterMediaRef = useRef(resumeAfterMedia);
  pauseForMediaRef.current = pauseForMedia;
  resumeAfterMediaRef.current = resumeAfterMedia;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPaused(false);
      // Pause the main audio player (remembers if it was playing)
      pauseForMediaRef.current();
      // Pause all other video elements when this one plays
      const allVideoElements = document.querySelectorAll('video');
      allVideoElements.forEach((otherVideo) => {
        if (otherVideo !== video && !otherVideo.paused) {
          otherVideo.pause();
        }
      });
      // Also pause all audio elements
      const allAudioElements = document.querySelectorAll('audio');
      allAudioElements.forEach((audio) => {
        if (!audio.paused) {
          audio.pause();
        }
      });
    };
    const handlePause = () => setIsPaused(true);
    const handleLoadedMetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        setAspectRatio(video.videoWidth / video.videoHeight);
        setMetadataLoaded(true);
      }
      // Check if first frame is also ready at this point
      if (video.readyState >= 2) {
        setHasFirstFrame(true);
      }
    };
    const handleLoadedData = () => {
      setHasFirstFrame(true);
    };

    // Check if metadata is already loaded (from browser cache)
    if (video.readyState >= 1 && video.videoWidth && video.videoHeight) {
      setAspectRatio(video.videoWidth / video.videoHeight);
      setMetadataLoaded(true);
    }
    // Check if first frame is already available (from browser cache)
    if (video.readyState >= 2) {
      setHasFirstFrame(true);
    }

    // Add a small timeout fallback to check readyState again
    const checkReadyStateTimeout = setTimeout(() => {
      if (video.readyState >= 2) {
        setHasFirstFrame(true);
      }
    }, 50);

    // If video is already playing (autoPlay fired before effect), pause main audio
    if (!video.paused) {
      pauseForMediaRef.current();
    }

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedData);

    return () => {
      clearTimeout(checkReadyStateTimeout);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      // Resume main audio when component unmounts (modal closes)
      resumeAfterMediaRef.current();
    };
  }, []);

  const showControls = isHovered || isPaused;

  // Categorize by aspect ratio
  const isWideLandscape = aspectRatio >= 1.7; // 16:9 and wider
  const is4by3Landscape = aspectRatio >= 1.2 && aspectRatio < 1.7; // 4:3 range
  const isSquare = aspectRatio >= 0.9 && aspectRatio < 1.2; // Square-ish
  const isPortrait = aspectRatio < 0.9; // Portrait/standing

  return (
    <div className="flex justify-center w-full">
      <div
        className="inline-block max-w-full rounded-lg overflow-hidden relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Always reserve space with correct aspect ratio */}
        <div
          className={`block w-full h-auto ${isWideLandscape ? 'min-w-[65vw] max-h-[80vh]' : ''} ${is4by3Landscape ? 'max-h-[80vh]' : ''} ${isSquare ? 'max-h-[70vh]' : ''} ${isPortrait ? 'max-h-[75vh]' : ''}`}
          style={{ aspectRatio: aspectRatio, maxWidth: '100%' }}
        >
          {/* Black placeholder shown only when video not ready AND not cached */}
          {!hasFirstFrame && !cachedDimensions && (
            <div className="absolute inset-0 bg-black" />
          )}
          <video
            ref={videoRef}
            src={url}
            controls={showControls}
            autoPlay={autoPlay}
            loop
            controlsList="nodownload noplaybackrate"
            className="block w-full h-auto"
            style={{ display: 'block', maxWidth: '100%' }}
            preload="auto"
            playsInline
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
};
