import { useRef, useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

interface AudioPlaylistMinimalProps {
  urls: string[];
  allowSimultaneousPlayback?: boolean;
}

// Minimal player with shared controls
// Single row of controls with track list below
export const AudioPlaylistMinimal = ({ urls, allowSimultaneousPlayback = false }: AudioPlaylistMinimalProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { pauseForMedia, resumeAfterMedia } = useAudioPlayer();

  const pauseForMediaRef = useRef(pauseForMedia);
  const resumeAfterMediaRef = useRef(resumeAfterMedia);
  pauseForMediaRef.current = pauseForMedia;
  resumeAfterMediaRef.current = resumeAfterMedia;

  const getFileName = (url: string) => {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    // Remove extension, then strip leading number prefixes like "01_", "1_", "01-", "1-"
    const name = decodeURIComponent(filename.replace(/\.[^.]+$/, ''));
    return name.replace(/^\d+[-_]\s*/, '');
  };

  const isSingleTrack = urls.length === 1;

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsPlaying(true);
      pauseForMediaRef.current();
      // Pause other audio elements
      document.querySelectorAll('audio').forEach((el) => {
        if (el !== audio && !(el as HTMLMediaElement).paused) {
          (el as HTMLMediaElement).pause();
        }
      });
      // Only pause video if simultaneous playback is not allowed
      if (!allowSimultaneousPlayback) {
        document.querySelectorAll('video').forEach((el) => {
          if (!(el as HTMLMediaElement).paused) {
            (el as HTMLMediaElement).pause();
          }
        });
      }
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      if (currentTrack < urls.length - 1) {
        setCurrentTrack(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      resumeAfterMediaRef.current();
    };
  }, [currentTrack, urls.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = urls[currentTrack];
    // Only autoplay if user has already interacted (for iOS compatibility)
    if (hasUserInteracted) {
      audio.play().catch(() => {
        // Silently handle autoplay failures on iOS
      });
    }
  }, [currentTrack, urls, hasUserInteracted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setHasUserInteracted(true);
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const prevTrack = () => {
    if (currentTrack > 0) {
      setCurrentTrack(prev => prev - 1);
    }
  };

  const nextTrack = () => {
    if (currentTrack < urls.length - 1) {
      setCurrentTrack(prev => prev + 1);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  };

  const handleProgressTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const percent = (touch.clientX - rect.left) / rect.width;
    audio.currentTime = Math.max(0, Math.min(1, percent)) * audio.duration;
  };

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <audio ref={audioRef} playsInline preload="metadata" />

      {/* Current track info */}
      <p className="text-foreground text-sm mb-2 truncate min-w-0">{getFileName(urls[currentTrack])}</p>

      {/* Progress bar */}
      <div
        className="h-4 flex items-center cursor-pointer mb-2 touch-none"
        onClick={handleProgressClick}
        onTouchMove={handleProgressTouch}
      >
        <div className="h-1 bg-foreground/20 rounded w-full relative">
          <div
            className="h-full bg-foreground rounded transition-all absolute top-0 left-0"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Time and controls */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-foreground/50 text-xs">{formatTime(currentTime)}</span>

        <div className="flex items-center gap-3">
          {!isSingleTrack && (
            <button onClick={prevTrack} disabled={currentTrack === 0} className="disabled:opacity-30">
              <SkipBack className="w-4 h-4 text-foreground" strokeWidth={1.5} />
            </button>
          )}
          <button onClick={togglePlay} className="w-8 h-8 flex items-center justify-center rounded-full bg-foreground/10">
            {isPlaying ? (
              <Pause className="w-4 h-4 text-foreground" strokeWidth={1.5} />
            ) : (
              <Play className="w-4 h-4 text-foreground ml-0.5" strokeWidth={1.5} />
            )}
          </button>
          {!isSingleTrack && (
            <button onClick={nextTrack} disabled={currentTrack === urls.length - 1} className="disabled:opacity-30">
              <SkipForward className="w-4 h-4 text-foreground" strokeWidth={1.5} />
            </button>
          )}
        </div>

        <span className="text-foreground/50 text-xs">{formatTime(duration)}</span>
      </div>

      {/* Track list - hidden for single track */}
      {!isSingleTrack && (
        <div className="space-y-0 border-t border-foreground/10 pt-2 min-w-0">
          {urls.map((url, index) => (
            <button
              key={url}
              onClick={() => { setHasUserInteracted(true); setCurrentTrack(index); }}
              className={`w-full flex items-center px-2 py-1 text-xs rounded transition-colors ${
                index === currentTrack
                  ? 'bg-foreground/10 text-foreground'
                  : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              <span className="opacity-50 w-6 text-left flex-shrink-0">{index + 1}.</span>
              <span className="truncate">{getFileName(url)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
