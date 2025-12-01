import { useState, useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation, Link, useNavigate } from "react-router-dom";
// Icons replaced with Unicode symbols - no dependencies needed
import { useProjectSort } from "@/hooks/use-project-sort";
import { StaggeredMirrorText } from "@/components/StaggeredMirrorText";
import { CommercialProvider } from "@/contexts/CommercialContext";
import { ProjectDetailProvider, useProjectDetail } from "@/contexts/ProjectDetailContext";
import { AudioPlayerProvider, useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { InvertProvider, useInvert } from "@/contexts/InvertContext";
import { ShuffleProvider, useShuffle } from "@/contexts/ShuffleContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Work from "./pages/Work";
import Audio from "./pages/Audio";
import Visual from "./pages/Visual";
import Links from "./pages/Links";
import About from "./pages/About";
import Commercial from "./pages/Commercial";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Centralized icon button styling - ADJUST THESE VALUES TO CHANGE ALL ICON BUTTONS
const ICON_BUTTON_STYLES = {
  size: 28, // Width and height in pixels
  iconSize: 20, // Icon font size in pixels
  fontSize: 16, // Base font size for alignment
  lineHeight: 1,
  padding: 0,
  // Alignment options - control how icons align vertically
  display: 'inline-flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
} as const;

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const { isRandomized, toggleRandomize } = useProjectSort();
  const { isProjectOpen, closeHandler } = useProjectDetail();
  const { isPlaying, togglePlay, nextTrack, previousTrack, currentTime, duration, seek, currentTrack, getTrackTitle } = useAudioPlayer();
  const [isPlayerHovered, setIsPlayerHovered] = useState(false);
  const { isInverted, toggleInvert } = useInvert();
  const { triggerShuffle } = useShuffle();
  // Show shuffle button on all pages when project is not open
  const showShuffleButton = !isProjectOpen;
  const allowScroll = location.pathname === '/work' || location.pathname === '/audio' || location.pathname === '/visual' || location.pathname === '/';
  const iframeLoaded = true; // No iframe anymore, always show content
  const [workMenuOpen, setWorkMenuOpen] = useState(false);
  const isWorkPage = location.pathname === '/work' || location.pathname === '/audio' || location.pathname === '/visual' || location.pathname === '/';

  // Top nav colors - ensuring adjacent items don't match
  type ColorOption = 'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light';

  // Generate nav colors with proper adjacency rules
  // Index mapping: 0=work, 1=audio, 2=visual, 3=about, 4=links
  // Adjacency rules: work≠audio, audio≠visual, work≠about, about≠links
  const generateNavColors = (): ColorOption[] => {
    const options: ColorOption[] = ['white-on-black', 'black-on-white', 'white-on-dark', 'black-on-light'];
    const colors: ColorOption[] = [];

    // 0: work - random choice
    colors[0] = options[Math.floor(Math.random() * options.length)];

    // 1: audio - must differ from work (index 0)
    let availableForAudio = options.filter(opt => opt !== colors[0]);
    colors[1] = availableForAudio[Math.floor(Math.random() * availableForAudio.length)];

    // 2: visual - must differ from audio (index 1)
    let availableForVisual = options.filter(opt => opt !== colors[1]);
    colors[2] = availableForVisual[Math.floor(Math.random() * availableForVisual.length)];

    // 3: about - must differ from work (index 0), since it's horizontally adjacent
    let availableForAbout = options.filter(opt => opt !== colors[0]);
    colors[3] = availableForAbout[Math.floor(Math.random() * availableForAbout.length)];

    // 4: links - must differ from about (index 3)
    let availableForLinks = options.filter(opt => opt !== colors[3]);
    colors[4] = availableForLinks[Math.floor(Math.random() * availableForLinks.length)];

    return colors;
  };

  const [topNavColors, setTopNavColors] = useState<ColorOption[]>(() => generateNavColors());

  // Audio player colors - ensuring adjacent blocks don't match
  // Order from left to right: title, progressBar, controls (prev/play/next), cycle icon
  // Adjacency rules: title≠progressBar, progressBar≠controls, controls≠cycleIcon
  const generateAudioPlayerColors = () => {
    const options: ColorOption[] = ['white-on-black', 'black-on-white', 'white-on-dark', 'black-on-light'];

    // Title - random choice
    const title = options[Math.floor(Math.random() * options.length)];

    // Progress bar - must differ from title
    const availableForProgressBar = options.filter(opt => opt !== title);
    const progressBar = availableForProgressBar[Math.floor(Math.random() * availableForProgressBar.length)];

    // Controls - must differ from progress bar
    const availableForControls = options.filter(opt => opt !== progressBar);
    const controls = availableForControls[Math.floor(Math.random() * availableForControls.length)];

    // Cycle icon - must differ from controls
    const availableForCycleIcon = options.filter(opt => opt !== controls);
    const cycleIcon = availableForCycleIcon[Math.floor(Math.random() * availableForCycleIcon.length)];

    return { title, controls, progressBar, cycleIcon };
  };

  const [audioPlayerColors, setAudioPlayerColors] = useState<{
    title: ColorOption;
    controls: ColorOption;
    progressBar: ColorOption;
    cycleIcon: ColorOption;
  }>(() => generateAudioPlayerColors());

  const [bottomNavColors, setBottomNavColors] = useState<ColorOption[]>(() => [generateAudioPlayerColors().cycleIcon]);

  // Regenerate colors when grid is randomized
  useEffect(() => {
    setTopNavColors(generateNavColors());
    const newAudioColors = generateAudioPlayerColors();
    setAudioPlayerColors(newAudioColors);
    setBottomNavColors([newAudioColors.cycleIcon]);
    setShuffleIconColor(Math.random() < 0.5 ? 'white' : 'black');
  }, [isRandomized]);

  const [shuffleIconColor, setShuffleIconColor] = useState<'white' | 'black'>(Math.random() < 0.5 ? 'white' : 'black');
  const [closeIconColor] = useState<'white' | 'black'>(Math.random() < 0.5 ? 'white' : 'black');
  const [cycleIconColor, setCycleIconColor] = useState<ColorOption>(() => {
    const options: ColorOption[] = ['white-on-black', 'black-on-white', 'white-on-dark', 'black-on-light'];
    return options[Math.floor(Math.random() * options.length)];
  });

  // Update cycle icon color when nav colors regenerate
  useEffect(() => {
    setCycleIconColor(bottomNavColors[0]);
  }, [bottomNavColors]);

  // Helper to get background color from ColorOption
  const getColorFromVariant = (variant: ColorOption): { bg: string; text: string } => {
    const bgColor =
      variant === 'white-on-black' ? 'hsl(0, 0%, 10%)' :
      variant === 'black-on-white' ? 'hsl(0, 0%, 90%)' :
      variant === 'white-on-dark' ? 'hsl(0, 0%, 20%)' :
      'hsl(0, 0%, 80%)'; // black-on-light
    const textColor =
      variant === 'white-on-black' || variant === 'white-on-dark'
        ? 'hsl(0, 0%, 100%)'
        : 'hsl(0, 0%, 0%)';
    return { bg: bgColor, text: textColor };
  };

  // Helper to get progress bar fill color - uses pure white/black
  const getProgressBarFillColor = (variant: ColorOption): string => {
    // Pure white fill on dark backgrounds (10% and 20%)
    // Pure black fill on light backgrounds (80% and 90%)
    return variant === 'white-on-black' || variant === 'white-on-dark'
      ? 'hsl(0, 0%, 100%)'
      : 'hsl(0, 0%, 0%)';
  };

  // Helper to get background color (inverse of text color, different lightness) - for legacy icons
  const getIconBackground = (textColor: 'white' | 'black') => {
    // White text gets 10% lightness black background (hsl(0, 0%, 10%))
    // Black text gets 90% lightness white background (hsl(0, 0%, 90%))
    return textColor === 'white' ? 'hsl(0, 0%, 10%)' : 'hsl(0, 0%, 90%)';
  };

  // Cycling icon state - specific trigrams in order
  const trigramIcons = ['☰', '☱', '☳', '☷', '☶', '☴'];
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cycleNoiseRef = useRef<number>(Math.random() * 1000); // Random seed for cycle icon noise

  // Shuffle icon state - asterisks and stars cycling
  const shuffleIcons = [
    '✢', '✣', '✤', '✥', '✦', '✧',
    '✱', '✲', '✳', '✴', '✵', '✶',
    '✻', '✼', '✽', '✾', '✿', '❀',
    '❃', '❄', '❅', '❆', '❇', '❈', '❉', '❊', '❋'
  ];
  const [currentShuffleIndex, setCurrentShuffleIndex] = useState(0);
  const shuffleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shuffleNoiseRef = useRef<number>(Math.random() * 1000); // Random seed for shuffle icon noise

  // Simple noise function using sine waves with different frequencies
  const getNoise = (seed: number): number => {
    const time = Date.now() / 1000; // Time in seconds
    // Combine multiple sine waves at different frequencies for organic variation
    const noise1 = Math.sin((time + seed) * 0.5);
    const noise2 = Math.sin((time + seed) * 0.3 + 1.5);
    const noise3 = Math.sin((time + seed) * 0.7 + 3.0);
    // Average and normalize to 0-1 range
    return (noise1 + noise2 + noise3) / 6 + 0.5;
  };

  // Cycling icon effect - variable speed with noise
  useEffect(() => {
    const cycleThroughIcons = () => {
      setCurrentIconIndex((prev) => (prev + 1) % trigramIcons.length);

      // Base speed: 50ms + 33% = ~67ms
      // Add ±33% variation using noise: 67ms ± 22ms = 45ms to 89ms
      const baseSpeed = 67;
      const variation = 22;
      const noise = getNoise(cycleNoiseRef.current);
      const speed = baseSpeed + (noise - 0.5) * 2 * variation;

      cycleTimerRef.current = setTimeout(cycleThroughIcons, speed);
    };

    // Start cycling
    if (cycleTimerRef.current) {
      clearTimeout(cycleTimerRef.current);
    }
    setCurrentIconIndex(0);
    cycleThroughIcons();

    return () => {
      if (cycleTimerRef.current) {
        clearTimeout(cycleTimerRef.current);
      }
    };
  }, []); // No dependencies - runs once on mount

  // Shuffle icon effect - variable speed with noise (independent from cycle icon)
  useEffect(() => {
    const cycleThroughShuffleIcons = () => {
      setCurrentShuffleIndex((prev) => (prev + 1) % shuffleIcons.length);

      // Base speed: 50ms + 33% = ~67ms
      // Add ±33% variation using noise: 67ms ± 22ms = 45ms to 89ms
      const baseSpeed = 67;
      const variation = 22;
      const noise = getNoise(shuffleNoiseRef.current);
      const speed = baseSpeed + (noise - 0.5) * 2 * variation;

      shuffleTimerRef.current = setTimeout(cycleThroughShuffleIcons, speed);
    };

    // Start cycling
    if (shuffleTimerRef.current) {
      clearTimeout(shuffleTimerRef.current);
    }
    setCurrentShuffleIndex(0);
    cycleThroughShuffleIcons();

    return () => {
      if (shuffleTimerRef.current) {
        clearTimeout(shuffleTimerRef.current);
      }
    };
  }, []); // No dependencies - runs once on mount

  const handleCycleIconClick = () => {
    const options: ColorOption[] = ['white-on-black', 'black-on-white', 'white-on-dark', 'black-on-light'];
    setCycleIconColor(prev => {
      const currentIndex = options.indexOf(prev);
      return options[(currentIndex + 1) % options.length];
    });
  };


  return (
    <div className={`relative ${allowScroll ? 'min-h-screen' : 'h-screen overflow-hidden'}`} style={{ backgroundColor: 'rgb(128, 128, 128)' }}>
      {/* Iframe background disabled - using 50% grey instead */}


      {iframeLoaded && (
        <>
        <nav className="fixed top-0 left-0 right-0 z-20 flex items-center pointer-events-none" style={{ lineHeight: 1, fontSize: '16px' }}>
          {/* Left: menu items */}
          <div className="flex items-center gap-0">
            <div className="relative">
              <Link
                to="/work"
                onClick={() => setWorkMenuOpen(!workMenuOpen)}
                onMouseEnter={() => setWorkMenuOpen(true)}
                onMouseLeave={() => setWorkMenuOpen(false)}
                className="font-display font-light whitespace-nowrap pointer-events-auto"
              >
                <StaggeredMirrorText text="work" isActive={isWorkPage} forcedVariant={topNavColors[0]} />
              </Link>
              {workMenuOpen && (
                <div
                  className="absolute top-full left-0 flex flex-col gap-0 mt-0"
                  onMouseEnter={() => setWorkMenuOpen(true)}
                  onMouseLeave={() => setWorkMenuOpen(false)}
                >
                  <Link to="/audio" className="font-display font-light whitespace-nowrap pointer-events-auto">
                    <StaggeredMirrorText text="audio" isActive={location.pathname === '/audio'} forcedVariant={topNavColors[1]} />
                  </Link>
                  <Link to="/visual" className="font-display font-light whitespace-nowrap pointer-events-auto">
                    <StaggeredMirrorText text="visual" isActive={location.pathname === '/visual'} forcedVariant={topNavColors[2]} />
                  </Link>
                </div>
              )}
            </div>
            <Link to="/about" className="font-display font-light pointer-events-auto whitespace-nowrap">
              <StaggeredMirrorText text="about" isActive={location.pathname === '/about'} forcedVariant={topNavColors[3]} />
            </Link>
            <Link to="/links" className="font-display font-light pointer-events-auto whitespace-nowrap">
              <StaggeredMirrorText text="links" isActive={location.pathname === '/links'} forcedVariant={topNavColors[4]} />
            </Link>
          </div>

          {/* Right: shuffle button and close button */}
          <div className="flex items-center gap-0">
            {showShuffleButton && (
              <button
                onClick={() => {
                  toggleRandomize();
                  triggerShuffle();
                }}
                className="icon-button pointer-events-auto group"
                aria-label="Randomize projects"
                title={isRandomized ? 'Sorted randomly' : 'Sort by date'}
                style={{
                  backgroundColor: getIconBackground(shuffleIconColor),
                  fontSize: `${ICON_BUTTON_STYLES.fontSize}px`,
                  lineHeight: ICON_BUTTON_STYLES.lineHeight,
                  width: `${ICON_BUTTON_STYLES.size}px`,
                  height: `${ICON_BUTTON_STYLES.size}px`,
                  padding: ICON_BUTTON_STYLES.padding,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = shuffleIconColor === 'white' ? 'hsl(0, 0%, 90%)' : 'hsl(0, 0%, 10%)';
                  const iconContent = e.currentTarget.querySelector('.icon-content') as HTMLElement;
                  if (iconContent) iconContent.style.color = shuffleIconColor === 'white' ? 'hsl(0, 0%, 10%)' : 'hsl(0, 0%, 90%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = getIconBackground(shuffleIconColor);
                  const iconContent = e.currentTarget.querySelector('.icon-content') as HTMLElement;
                  if (iconContent) iconContent.style.color = shuffleIconColor;
                }}
              >
                <span
                  style={{
                    fontSize: `${ICON_BUTTON_STYLES.iconSize}px`,
                    color: shuffleIconColor,
                    lineHeight: ICON_BUTTON_STYLES.lineHeight,
                  }}
                  className="icon-content"
                >
                  {shuffleIcons[currentShuffleIndex]}
                </span>
              </button>
            )}
            {isProjectOpen && closeHandler && (
              <button
                onClick={closeHandler}
                className="icon-button pointer-events-auto group"
                aria-label="Close project"
                style={{
                  backgroundColor: getIconBackground(closeIconColor),
                  fontSize: `${ICON_BUTTON_STYLES.fontSize}px`,
                  lineHeight: ICON_BUTTON_STYLES.lineHeight,
                  width: `${ICON_BUTTON_STYLES.size}px`,
                  height: `${ICON_BUTTON_STYLES.size}px`,
                  padding: ICON_BUTTON_STYLES.padding,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = closeIconColor === 'white' ? 'hsl(0, 0%, 90%)' : 'hsl(0, 0%, 10%)';
                  const iconContent = e.currentTarget.querySelector('.icon-content') as HTMLElement;
                  if (iconContent) iconContent.style.color = closeIconColor === 'white' ? 'hsl(0, 0%, 10%)' : 'hsl(0, 0%, 90%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = getIconBackground(closeIconColor);
                  const iconContent = e.currentTarget.querySelector('.icon-content') as HTMLElement;
                  if (iconContent) iconContent.style.color = closeIconColor;
                }}
              >
                <span
                  style={{
                    fontSize: `${ICON_BUTTON_STYLES.iconSize}px`,
                    color: closeIconColor,
                    lineHeight: ICON_BUTTON_STYLES.lineHeight,
                  }}
                  className="icon-content"
                >
                  ✕
                </span>
              </button>
            )}
          </div>
        </nav>

      {children}

      {/* Bottom nav bar - anchored to bottom right */}
      <nav className="fixed bottom-0 right-0 z-20 flex items-center justify-end pointer-events-none" style={{ lineHeight: 1 }}>
        {/* Audio player controls */}
        <div className="flex items-center gap-0">
          {/* Track title - shows when playing */}
          {isPlaying && currentTrack && (
            <div
              className="pointer-events-none"
              style={{
                color: getColorFromVariant(audioPlayerColors.title).text,
                backgroundColor: getColorFromVariant(audioPlayerColors.title).bg,
                padding: '2px 4px',
                fontSize: '16px',
                lineHeight: 1,
                height: `${ICON_BUTTON_STYLES.size}px`,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {getTrackTitle(currentTrack)}
            </div>
          )}

          {/* Progress bar - shows when playing */}
          {isPlaying && duration > 0 && (
            <div
              className="pointer-events-auto"
              style={{
                width: '100px',
                height: `${ICON_BUTTON_STYLES.size}px`,
                backgroundColor: getColorFromVariant(audioPlayerColors.progressBar).bg,
                position: 'relative',
                cursor: 'pointer',
              }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = x / rect.width;
                seek(percentage * duration);
              }}
            >
              <div
                style={{
                  width: `${(currentTime / duration) * 100}%`,
                  height: '100%',
                  backgroundColor: getProgressBarFillColor(audioPlayerColors.progressBar),
                }}
              />
            </div>
          )}

          {/* Previous button - shows when playing */}
          {isPlaying && (
            <button
              onClick={previousTrack}
              className="icon-button pointer-events-auto group"
              aria-label="Previous"
              style={{
                backgroundColor: getColorFromVariant(audioPlayerColors.controls).bg,
                fontSize: `${ICON_BUTTON_STYLES.fontSize}px`,
                lineHeight: ICON_BUTTON_STYLES.lineHeight,
                width: `${ICON_BUTTON_STYLES.size}px`,
                height: `${ICON_BUTTON_STYLES.size}px`,
                padding: ICON_BUTTON_STYLES.padding,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                const colors = getColorFromVariant(audioPlayerColors.controls);
                e.currentTarget.style.backgroundColor = colors.text;
                const iconContent = e.currentTarget.querySelector('.icon-content') as HTMLElement;
                if (iconContent) iconContent.style.color = colors.bg;
              }}
              onMouseLeave={(e) => {
                const colors = getColorFromVariant(audioPlayerColors.controls);
                e.currentTarget.style.backgroundColor = colors.bg;
                const iconContent = e.currentTarget.querySelector('.icon-content') as HTMLElement;
                if (iconContent) iconContent.style.color = colors.text;
              }}
            >
              <span
                style={{
                  fontSize: `${ICON_BUTTON_STYLES.iconSize}px`,
                  color: getColorFromVariant(audioPlayerColors.controls).text,
                  lineHeight: ICON_BUTTON_STYLES.lineHeight,
                }}
                className="icon-content"
              >
                ⏮
              </span>
            </button>
          )}

          {/* Play/Pause button - shows music note when not playing, play when hovered, pause when playing */}
          <button
            onClick={togglePlay}
            className="icon-button pointer-events-auto group"
            aria-label={isPlaying ? "Pause" : "Play"}
            style={{
              backgroundColor: getColorFromVariant(audioPlayerColors.controls).bg,
              fontSize: `${ICON_BUTTON_STYLES.fontSize}px`,
              lineHeight: ICON_BUTTON_STYLES.lineHeight,
              width: `${ICON_BUTTON_STYLES.size}px`,
              height: `${ICON_BUTTON_STYLES.size}px`,
              padding: ICON_BUTTON_STYLES.padding,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              setIsPlayerHovered(true);
              const colors = getColorFromVariant(audioPlayerColors.controls);
              e.currentTarget.style.backgroundColor = colors.text;
              const iconContent = e.currentTarget.querySelector('.icon-content') as HTMLElement;
              if (iconContent) iconContent.style.color = colors.bg;
            }}
            onMouseLeave={(e) => {
              setIsPlayerHovered(false);
              const colors = getColorFromVariant(audioPlayerColors.controls);
              e.currentTarget.style.backgroundColor = colors.bg;
              const iconContent = e.currentTarget.querySelector('.icon-content') as HTMLElement;
              if (iconContent) iconContent.style.color = colors.text;
            }}
          >
            <span
              style={{
                fontSize: `${ICON_BUTTON_STYLES.iconSize}px`,
                color: getColorFromVariant(audioPlayerColors.controls).text,
                lineHeight: ICON_BUTTON_STYLES.lineHeight,
              }}
              className="icon-content"
            >
              {isPlaying ? '❚❚' : (isPlayerHovered ? '▶' : '♫')}
            </span>
          </button>

          {/* Next button - shows when playing */}
          {isPlaying && (
            <button
              onClick={nextTrack}
              className="icon-button pointer-events-auto group"
              aria-label="Next"
              style={{
                backgroundColor: getColorFromVariant(audioPlayerColors.controls).bg,
                fontSize: `${ICON_BUTTON_STYLES.fontSize}px`,
                lineHeight: ICON_BUTTON_STYLES.lineHeight,
                width: `${ICON_BUTTON_STYLES.size}px`,
                height: `${ICON_BUTTON_STYLES.size}px`,
                padding: ICON_BUTTON_STYLES.padding,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                const colors = getColorFromVariant(audioPlayerColors.controls);
                e.currentTarget.style.backgroundColor = colors.text;
                const iconContent = e.currentTarget.querySelector('.icon-content') as HTMLElement;
                if (iconContent) iconContent.style.color = colors.bg;
              }}
              onMouseLeave={(e) => {
                const colors = getColorFromVariant(audioPlayerColors.controls);
                e.currentTarget.style.backgroundColor = colors.bg;
                const iconContent = e.currentTarget.querySelector('.icon-content') as HTMLElement;
                if (iconContent) iconContent.style.color = colors.text;
              }}
            >
              <span
                style={{
                  fontSize: `${ICON_BUTTON_STYLES.iconSize}px`,
                  color: getColorFromVariant(audioPlayerColors.controls).text,
                  lineHeight: ICON_BUTTON_STYLES.lineHeight,
                }}
                className="icon-content"
              >
                ⏭
              </span>
            </button>
          )}

          {/* Cycle icon */}
          <button
            onClick={handleCycleIconClick}
            className="icon-button pointer-events-auto group"
            aria-label="Cycle icon"
            style={{
              backgroundColor: getColorFromVariant(cycleIconColor).bg,
              fontSize: `${ICON_BUTTON_STYLES.fontSize}px`,
              lineHeight: ICON_BUTTON_STYLES.lineHeight,
              width: `${ICON_BUTTON_STYLES.size}px`,
              height: `${ICON_BUTTON_STYLES.size}px`,
              padding: ICON_BUTTON_STYLES.padding,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              const colors = getColorFromVariant(cycleIconColor);
              e.currentTarget.style.backgroundColor = colors.text;
              const iconContent = e.currentTarget.querySelector('.icon-content') as HTMLElement;
              if (iconContent) iconContent.style.color = colors.bg;
            }}
            onMouseLeave={(e) => {
              const colors = getColorFromVariant(cycleIconColor);
              e.currentTarget.style.backgroundColor = colors.bg;
              const iconContent = e.currentTarget.querySelector('.icon-content') as HTMLElement;
              if (iconContent) iconContent.style.color = colors.text;
            }}
          >
            <span
              style={{
                fontSize: `${ICON_BUTTON_STYLES.iconSize}px`,
                color: getColorFromVariant(cycleIconColor).text,
                lineHeight: ICON_BUTTON_STYLES.lineHeight,
              }}
              className="icon-content"
            >
              {trigramIcons[currentIconIndex]}
            </span>
          </button>
        </div>
      </nav>

{/* Invert toggle - bottom right (hidden, functionality preserved)
      <button
        onClick={toggleInvert}
        className={`fixed bottom-1.5 sm:bottom-2 md:bottom-3 lg:bottom-4 right-1.5 sm:right-2 md:right-3 lg:right-4 z-20 p-1.5 sm:p-2 md:p-2.5 lg:p-3 ${isInverted ? 'text-black hover:text-black/80' : 'text-foreground hover:text-foreground/80'} pointer-events-auto transition-colors`}
        aria-label="Toggle color inversion"
      >
        <Eclipse className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" strokeWidth={1.5} />
      </button>
      */}
        </>
      )}
    </div>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <InvertProvider>
            <ShuffleProvider>
              <AudioPlayerProvider>
                <CommercialProvider>
                  <ProjectDetailProvider>
                    <Layout>
                    <Routes>
                      <Route path="/" element={<Work />} />
                      <Route path="/work" element={<Work />} />
                      <Route path="/audio" element={<Audio />} />
                      <Route path="/visual" element={<Visual />} />
                      <Route path="/links" element={<Links />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/commercial" element={<Commercial />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                </ProjectDetailProvider>
              </CommercialProvider>
            </AudioPlayerProvider>
            </ShuffleProvider>
          </InvertProvider>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
