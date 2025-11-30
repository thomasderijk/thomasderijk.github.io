import { useRef, useState, useEffect } from 'react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

interface AudioPlaylistMinimalProps {
  urls: string[];
  allowSimultaneousPlayback?: boolean;
}

// SoundCloud-inspired minimal player with waveform visualization
export const AudioPlaylistMinimal = ({ urls, allowSimultaneousPlayback = false }: AudioPlaylistMinimalProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const { pauseForMedia, resumeAfterMedia } = useAudioPlayer();

  const pauseForMediaRef = useRef(pauseForMedia);
  const resumeAfterMediaRef = useRef(resumeAfterMedia);
  pauseForMediaRef.current = pauseForMedia;
  resumeAfterMediaRef.current = resumeAfterMedia;

  const getFileName = (url: string) => {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
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

  // Generate waveform data from audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const generateWaveform = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const response = await fetch(urls[currentTrack]);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const rawData = audioBuffer.getChannelData(0);
        const samples = 100; // Number of bars in waveform
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData = [];

        for (let i = 0; i < samples; i++) {
          let blockStart = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[blockStart + j]);
          }
          filteredData.push(sum / blockSize);
        }

        // Normalize the data
        const max = Math.max(...filteredData);
        const normalizedData = filteredData.map(n => n / max);
        setWaveformData(normalizedData);
      } catch (error) {
        console.error('Error generating waveform:', error);
        // Generate a simple placeholder waveform
        const placeholderData = Array.from({ length: 100 }, () => Math.random() * 0.8 + 0.2);
        setWaveformData(placeholderData);
      }
    };

    generateWaveform();
  }, [currentTrack, urls]);

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = waveformContainerRef.current;
    if (!canvas || !container || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw waveform
    const barWidth = rect.width / waveformData.length;
    const barGap = barWidth * 0.3;
    const actualBarWidth = barWidth - barGap;
    const centerY = rect.height / 2;
    const maxBarHeight = rect.height * 0.9;

    waveformData.forEach((value, index) => {
      const barHeight = value * maxBarHeight / 2;
      const x = index * barWidth;

      // Determine if this bar is in the played portion
      const barProgress = (index / waveformData.length) * 100;
      const isPlayed = barProgress <= progress;

      // Draw bar (centered vertically, extending up and down)
      // Use actual RGB white color instead of HSL variable
      ctx.fillStyle = isPlayed
        ? 'rgba(255, 255, 255, 1)'
        : 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x, centerY - barHeight, actualBarWidth, barHeight * 2);
    });

    // Draw progress cursor line
    const cursorX = (progress / 100) * rect.width;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cursorX, 0);
    ctx.lineTo(cursorX, rect.height);
    ctx.stroke();
  }, [waveformData, progress]);

  // Resize canvas on window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = waveformContainerRef.current;
      if (!canvas || !container) return;

      // Trigger redraw
      setProgress(prev => prev);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsPlaying(true);
      pauseForMediaRef.current();
      document.querySelectorAll('audio').forEach((el) => {
        if (el !== audio && !(el as HTMLMediaElement).paused) {
          (el as HTMLMediaElement).pause();
        }
      });
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
  }, [currentTrack, urls.length, allowSimultaneousPlayback]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = urls[currentTrack];
    if (hasUserInteracted) {
      audio.play().catch(() => {});
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

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    setHasUserInteracted(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  };

  const handleWaveformTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    setHasUserInteracted(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const percent = (touch.clientX - rect.left) / rect.width;
    audio.currentTime = Math.max(0, Math.min(1, percent)) * audio.duration;
  };

  // Determine if we should use compact spacing (for many tracks)
  const isCompact = urls.length > 7;

  return (
    <div className="w-full min-w-0">
      <audio ref={audioRef} playsInline preload="metadata" />

      {/* Main player controls */}
      <div className={`flex items-center gap-4 ${isCompact ? 'mb-3' : 'mb-4'}`}>
        {/* Play/Pause button */}
        <button
          onClick={togglePlay}
          className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-foreground hover:bg-foreground/90 transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <span className="text-background" style={{ fontSize: '20px', lineHeight: '1' }}>
            {isPlaying ? '❚❚' : '▶'}
          </span>
        </button>

        {/* Track info and waveform */}
        <div className="flex-1 min-w-0">
          {/* Current track title */}
          <p className="text-foreground text-sm font-medium mb-4 truncate">
            {getFileName(urls[currentTrack])}
          </p>

          {/* Waveform visualization */}
          <div
            ref={waveformContainerRef}
            className="relative h-12 cursor-pointer touch-none"
            onClick={handleWaveformClick}
            onTouchStart={handleWaveformTouch}
            onTouchMove={handleWaveformTouch}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
            />
          </div>

          {/* Time display */}
          <div className="flex items-center justify-between mt-1">
            <span className="text-foreground/50 text-xs">
              {formatTime(currentTime)}
            </span>
            <span className="text-foreground/50 text-xs">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Track list - only show for multiple tracks */}
      {!isSingleTrack && (
        <div className={`space-y-0 border-t border-foreground/10 ${isCompact ? 'pt-2' : 'pt-3'}`}>
          {urls.map((url, index) => (
            <button
              key={url}
              onClick={() => {
                setHasUserInteracted(true);
                setCurrentTrack(index);
              }}
              className={`w-full flex items-center gap-3 px-2 ${isCompact ? 'py-1.5' : 'py-2'} ${isCompact ? 'text-xs' : 'text-sm'} transition-colors ${
                index === currentTrack
                  ? 'bg-foreground/10 text-foreground'
                  : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              <span className={`text-foreground/40 w-6 text-left flex-shrink-0 ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="truncate text-left flex-1">
                {getFileName(url)}
              </span>
              {index === currentTrack && isPlaying && (
                <span className={`text-foreground/40 flex-shrink-0 ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
                  Playing
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
