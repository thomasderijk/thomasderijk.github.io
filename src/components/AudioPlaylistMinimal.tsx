import { useRef, useState, useEffect } from 'react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { PlaylistNavSpacer } from './PlaylistNavSpacer';
import { SvgIcon } from '@/components/icons/SvgIcon';
import { IconButton, ICON_BUTTON_STYLES } from '@/components/IconButton';

interface AudioPlaylistMinimalProps {
  urls: string[];
  allowSimultaneousPlayback?: boolean;
}

// Audio playlist matching the main audio player layout
export const AudioPlaylistMinimal = ({ urls, allowSimultaneousPlayback = false }: AudioPlaylistMinimalProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { pauseForMedia, resumeAfterMedia, isPlaying: globalIsPlaying } = useAudioPlayer();

  // Spacer keys for each track
  const [spacerKeys, setSpacerKeys] = useState<number[]>(() => urls.map(() => 0));

  // Color system
  type ColorOption = 'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light';

  // Generate random colors for each track ensuring adjacent elements have different colors
  // and vertical coordination (title colors differ from track above)
  const generateTrackColors = () => {
    const options: ColorOption[] = ['white-on-black', 'black-on-white', 'white-on-dark', 'black-on-light'];
    const allColors: ColorOption[][] = [];

    urls.forEach((_, index) => {
      // For each track: [title, progressBar, controls]
      const colors: ColorOption[] = [];

      // Title color (different from track above)
      let titleOptions = options;
      if (index > 0 && allColors[index - 1]) {
        // Filter out the previous track's title color
        const prevTitleColor = allColors[index - 1][0];
        titleOptions = options.filter(opt => opt !== prevTitleColor);
      }
      colors.push(titleOptions[Math.floor(Math.random() * titleOptions.length)]);

      // Progress bar color (different from title)
      const progressOptions = options.filter(opt => opt !== colors[0]);
      colors.push(progressOptions[Math.floor(Math.random() * progressOptions.length)]);

      // Controls color (different from progress bar)
      const controlsOptions = options.filter(opt => opt !== colors[1]);
      colors.push(controlsOptions[Math.floor(Math.random() * controlsOptions.length)]);

      allColors.push(colors);
    });

    return allColors;
  };

  const [trackColors, setTrackColors] = useState<ColorOption[][]>(() => generateTrackColors());

  // Helper to get colors from ColorOption
  const getColors = (variant: ColorOption): { bg: string; text: string } => {
    const bgColor =
      variant === 'white-on-black' ? 'hsl(0, 0%, 10%)' :
      variant === 'black-on-white' ? 'hsl(0, 0%, 90%)' :
      variant === 'white-on-dark' ? 'hsl(0, 0%, 20%)' :
      'hsl(0, 0%, 80%)'; // black-on-light
    const textColor =
      variant === 'white-on-black' || variant === 'white-on-dark'
        ? 'hsl(0, 0%, 90%)'
        : 'hsl(0, 0%, 10%)';
    return { bg: bgColor, text: textColor };
  };

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

  // Auto-play first track on mount if global player is not playing
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || hasUserInteracted || globalIsPlaying) return;

    // Start playing the first track automatically
    setHasUserInteracted(true);
    audio.play().catch(() => {});
  }, [globalIsPlaying, hasUserInteracted]);

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

  const handlePrevious = () => {
    if (currentTrack > 0) {
      setCurrentTrack(prev => prev - 1);
      setHasUserInteracted(true);
    }
  };

  const handleNext = () => {
    if (currentTrack < urls.length - 1) {
      setCurrentTrack(prev => prev + 1);
      setHasUserInteracted(true);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    setHasUserInteracted(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  };

  const handleTrackClick = (index: number) => {
    setHasUserInteracted(true);
    setCurrentTrack(index);

    // Regenerate spacers for this track
    setSpacerKeys(prev => {
      const newKeys = [...prev];
      newKeys[index] = (newKeys[index] || 0) + 1;
      return newKeys;
    });

    // Regenerate progress bar and controls colors based on current title color
    setTrackColors(prev => {
      const newColors = [...prev];
      const options: ColorOption[] = ['white-on-black', 'black-on-white', 'white-on-dark', 'black-on-light'];
      const titleColor = newColors[index][0];

      // Progress bar color (different from title)
      const progressOptions = options.filter(opt => opt !== titleColor);
      newColors[index][1] = progressOptions[Math.floor(Math.random() * progressOptions.length)];

      // Controls color (different from progress bar)
      const controlsOptions = options.filter(opt => opt !== newColors[index][1]);
      newColors[index][2] = controlsOptions[Math.floor(Math.random() * controlsOptions.length)];

      return newColors;
    });
  };

  return (
    <div className="w-full min-w-0" style={{ fontSize: 0, lineHeight: 0 }}>
      <audio ref={audioRef} playsInline preload="metadata" />

      {/* Track list */}
      <div style={{ fontSize: 0, lineHeight: 0 }}>
        {urls.map((url, index) => (
          <div key={url}>
            {/* Track row with controls when playing */}
            {index === currentTrack && hasUserInteracted ? (
              <div
                className="flex items-center gap-0"
                style={{
                  height: '28px',
                  fontSize: 0,
                  lineHeight: 0,
                }}
              >
                {/* Track title (clickable) */}
                <button
                  onClick={togglePlay}
                  onMouseEnter={(e) => {
                    const colors = getColors(trackColors[index][0]);
                    e.currentTarget.style.backgroundColor = colors.text;
                    e.currentTarget.style.color = colors.bg;
                  }}
                  onMouseLeave={(e) => {
                    const colors = getColors(trackColors[index][0]);
                    e.currentTarget.style.backgroundColor = colors.bg;
                    e.currentTarget.style.color = colors.text;
                  }}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 300,
                    fontSize: '16px',
                    lineHeight: 1.5,
                    padding: '2px 4px',
                    backgroundColor: getColors(trackColors[index][0]).bg,
                    color: getColors(trackColors[index][0]).text,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'left',
                    border: 'none',
                    cursor: 'pointer',
                    flexShrink: 1,
                    minWidth: 0,
                    transition: 'background-color 0s, color 0s',
                  }}
                >
                  {getFileName(url)}
                </button>

                {/* Spacer between title and progress bar */}
                <PlaylistNavSpacer regenerateKey={spacerKeys[index] || 0} />

                {/* Progress bar (flexible) */}
                <div
                  onClick={handleProgressClick}
                  style={{
                    flexGrow: 1,
                    height: '28px',
                    backgroundColor: getColors(trackColors[index][1]).bg,
                    position: 'relative',
                    cursor: 'pointer',
                    minWidth: '100px',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: `${progress}%`,
                      height: '100%',
                      backgroundColor: getColors(trackColors[index][1]).text,
                    }}
                  />
                </div>

                {/* Spacer between progress bar and controls */}
                <PlaylistNavSpacer regenerateKey={spacerKeys[index] || 0} />

                {/* Controls block - treated as one unit */}
                <div
                  style={{
                    display: 'flex',
                    height: '28px',
                    backgroundColor: getColors(trackColors[index][2]).bg,
                    flexShrink: 0,
                  }}
                >
                  {/* Previous button */}
                  <IconButton
                    icon={<SvgIcon char="⏮" size={ICON_BUTTON_STYLES.iconSize} color={getColors(trackColors[index][2]).text} />}
                    onClick={handlePrevious}
                    backgroundColor="transparent"
                    textColor={getColors(trackColors[index][2]).text}
                    onHoverBackgroundColor={getColors(trackColors[index][2]).text}
                    aria-label="Previous"
                    disabled={currentTrack === 0}
                  />

                  {/* Play/Pause button */}
                  <IconButton
                    icon={
                      isPlaying ? (
                        <SvgIcon char="❚❚" size={ICON_BUTTON_STYLES.iconSize} color={getColors(trackColors[index][2]).text} />
                      ) : (
                        <SvgIcon char="▶" size={ICON_BUTTON_STYLES.iconSize} color={getColors(trackColors[index][2]).text} />
                      )
                    }
                    onClick={togglePlay}
                    backgroundColor="transparent"
                    textColor={getColors(trackColors[index][2]).text}
                    onHoverBackgroundColor={getColors(trackColors[index][2]).text}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  />

                  {/* Next button */}
                  <IconButton
                    icon={<SvgIcon char="⏭" size={ICON_BUTTON_STYLES.iconSize} color={getColors(trackColors[index][2]).text} />}
                    onClick={handleNext}
                    backgroundColor="transparent"
                    textColor={getColors(trackColors[index][2]).text}
                    onHoverBackgroundColor={getColors(trackColors[index][2]).text}
                    aria-label="Next"
                    disabled={currentTrack === urls.length - 1}
                  />
                </div>
              </div>
            ) : (
              /* Non-playing track - just the title */
              <div
                className="flex items-center gap-0"
                style={{
                  height: '28px',
                  fontSize: 0,
                  lineHeight: 0,
                }}
              >
                {/* Track title (clickable to play) */}
                <button
                  onClick={() => handleTrackClick(index)}
                  onMouseEnter={(e) => {
                    const colors = getColors(trackColors[index][0]);
                    e.currentTarget.style.backgroundColor = colors.text;
                    e.currentTarget.style.color = colors.bg;
                  }}
                  onMouseLeave={(e) => {
                    const colors = getColors(trackColors[index][0]);
                    e.currentTarget.style.backgroundColor = colors.bg;
                    e.currentTarget.style.color = colors.text;
                  }}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 300,
                    fontSize: '16px',
                    lineHeight: 1.5,
                    padding: '2px 4px',
                    backgroundColor: getColors(trackColors[index][0]).bg,
                    color: getColors(trackColors[index][0]).text,
                    whiteSpace: 'nowrap',
                    textAlign: 'left',
                    border: 'none',
                    cursor: 'pointer',
                    width: 'auto',
                    display: 'inline-block',
                    transition: 'background-color 0s, color 0s',
                  }}
                >
                  {getFileName(url)}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
