import { useRef, useState, useEffect, useCallback } from 'react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

interface VideoPlayerProps {
  url: string;
  autoPlay?: boolean;
}

export const VideoPlayer = ({ url, autoPlay = true }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(16/9); // Default to 16:9 to prevent layout shift
  const [metadataLoaded, setMetadataLoaded] = useState(false);
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
    };

    // Check if metadata is already loaded (from browser cache)
    if (video.readyState >= 1 && video.videoWidth && video.videoHeight) {
      setAspectRatio(video.videoWidth / video.videoHeight);
      setMetadataLoaded(true);
    }

    // If video is already playing (autoPlay fired before effect), pause main audio
    if (!video.paused) {
      pauseForMediaRef.current();
    }

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
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
        className="inline-block max-w-full rounded-lg overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <video
          ref={videoRef}
          src={url}
          controls={showControls}
          autoPlay={autoPlay}
          loop
          controlsList="nodownload noplaybackrate"
          className={`block w-full h-auto ${isWideLandscape ? 'min-w-[65vw] max-h-[80vh]' : ''} ${is4by3Landscape ? 'max-h-[80vh]' : ''} ${isSquare ? 'max-h-[70vh]' : ''} ${isPortrait ? 'max-h-[75vh]' : ''}`}
          style={{ display: 'block', maxWidth: '100%' }}
          preload="auto" // Full preload for modal viewing
          playsInline
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};
