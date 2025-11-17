import { useRef, useState, useEffect } from 'react';

interface VideoPlayerProps {
  url: string;
  autoPlay?: boolean;
}

export const VideoPlayer = ({ url, autoPlay = true }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPaused(false);
    const handlePause = () => setIsPaused(true);
    const handleLoadedMetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        setAspectRatio(video.videoWidth / video.videoHeight);
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const showControls = isHovered || isPaused;
  
  // Categorize by aspect ratio
  const isWideLandscape = aspectRatio && aspectRatio >= 1.7; // 16:9 and wider
  const is4by3Landscape = aspectRatio && aspectRatio >= 1.2 && aspectRatio < 1.7; // 4:3 range
  const isSquare = aspectRatio && aspectRatio >= 0.9 && aspectRatio < 1.2; // Square-ish
  const isPortrait = aspectRatio && aspectRatio < 0.9; // Portrait/standing

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
