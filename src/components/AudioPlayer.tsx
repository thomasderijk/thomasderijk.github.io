import { useRef, useEffect } from 'react';

interface AudioPlayerProps {
  url: string;
  thumbnail?: string;
}

export const AudioPlayer = ({ url, thumbnail }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Extract filename from URL and remove extension
  const getFileName = (url: string) => {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    // Remove extension
    return filename.replace(/\.[^.]+$/, '');
  };

  const fileName = getFileName(url);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handlePlay = () => {
      // Pause all other audio elements when this one plays
      const allAudioElements = document.querySelectorAll('audio');
      allAudioElements.forEach((audio) => {
        if (audio !== audioElement && !audio.paused) {
          audio.pause();
        }
      });
      // Also pause all video elements
      const allVideoElements = document.querySelectorAll('video');
      allVideoElements.forEach((video) => {
        if (!video.paused) {
          video.pause();
        }
      });
    };

    audioElement.addEventListener('play', handlePlay);

    return () => {
      audioElement.removeEventListener('play', handlePlay);
    };
  }, []);

  return (
    <div className="relative w-full">
      {thumbnail && (
        <img
          src={thumbnail}
          alt="Audio thumbnail"
          className="w-full h-auto object-contain rounded-lg mb-4"
          style={{ display: 'block' }}
        />
      )}
      <div className="pl-12 -mb-3">
        <p className="text-foreground text-sm leading-relaxed m-0">{fileName}</p>
      </div>
      <audio 
        ref={audioRef}
        src={url} 
        controls 
        controlsList="nodownload noplaybackrate"
        className="audio-player w-full rounded-none bg-transparent outline-none"
        style={{
          background: 'transparent',
          colorScheme: 'dark'
        }}
      />
    </div>
  );
};
