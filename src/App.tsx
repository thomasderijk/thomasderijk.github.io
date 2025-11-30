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

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const { isRandomized, toggleRandomize } = useProjectSort();
  const { isProjectOpen, closeHandler } = useProjectDetail();
  const { isPlaying, togglePlay, nextTrack, previousTrack, currentTime, duration, seek, currentTrack, getTrackTitle } = useAudioPlayer();
  const [isPlayerHovered, setIsPlayerHovered] = useState(false);
  const { isInverted, toggleInvert } = useInvert();
  // Show shuffle button on all pages when project is not open
  const showShuffleButton = !isProjectOpen;
  const allowScroll = location.pathname === '/work' || location.pathname === '/audio' || location.pathname === '/visual' || location.pathname === '/';
  const iframeLoaded = true; // No iframe anymore, always show content
  const [workMenuOpen, setWorkMenuOpen] = useState(false);
  const isWorkPage = location.pathname === '/work' || location.pathname === '/audio' || location.pathname === '/visual' || location.pathname === '/';

  // Top nav colors - left to right, each item can't match the one to its left
  type ColorOption = 'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light';

  // Generate random nav colors function
  const generateNavColors = (count: number): ColorOption[] => {
    const colors: ColorOption[] = [];
    const options: ColorOption[] = ['white-on-black', 'black-on-white', 'white-on-dark', 'black-on-light'];

    for (let i = 0; i < count; i++) {
      let availableOptions = options;
      if (i > 0) {
        // Filter out the previous color
        availableOptions = options.filter(opt => opt !== colors[i - 1]);
      }
      const randomIndex = Math.floor(Math.random() * availableOptions.length);
      colors.push(availableOptions[randomIndex]);
    }
    return colors;
  };

  const [topNavColors, setTopNavColors] = useState<ColorOption[]>(() => generateNavColors(5));
  const [bottomNavColors, setBottomNavColors] = useState<ColorOption[]>(() => generateNavColors(1)); // just cycle icon

  // Audio player colors - separate blocks
  const [audioPlayerColors, setAudioPlayerColors] = useState<{
    title: ColorOption;
    controls: ColorOption;
    progressBar: ColorOption;
  }>(() => {
    const options: ColorOption[] = ['white-on-black', 'black-on-white', 'white-on-dark', 'black-on-light'];
    return {
      title: options[Math.floor(Math.random() * options.length)],
      controls: options[Math.floor(Math.random() * options.length)],
      progressBar: options[Math.floor(Math.random() * options.length)],
    };
  });

  // Regenerate colors when grid is randomized
  useEffect(() => {
    setTopNavColors(generateNavColors(5));
    setBottomNavColors(generateNavColors(1));
    setAudioPlayerColors(() => {
      const options: ColorOption[] = ['white-on-black', 'black-on-white', 'white-on-dark', 'black-on-light'];
      return {
        title: options[Math.floor(Math.random() * options.length)],
        controls: options[Math.floor(Math.random() * options.length)],
        progressBar: options[Math.floor(Math.random() * options.length)],
      };
    });
  }, [isRandomized]);

  const [shuffleIconColor] = useState<'white' | 'black'>(Math.random() < 0.5 ? 'white' : 'black');
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

  // Cycling icon state - specific trigrams in order, 2x faster sine wave
  const trigramIcons = ['☰', '☱', '☳', '☷', '☶', '☴'];
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Shuffle icon state - diagonal double arrows cycling with sine wave
  const shuffleIcons = ['⇖', '⇗', '⇘', '⇙'];
  const [currentShuffleIndex, setCurrentShuffleIndex] = useState(0);
  const shuffleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shuffleStartTimeRef = useRef<number>(Date.now());

  // Cycling icon effect - sine wave speed (2x faster)
  useEffect(() => {
    const cycleThroughIcons = () => {
      // Sine wave speed - 2x faster than original
      const elapsed = Date.now() - startTimeRef.current;
      // Sine wave with period of 2 seconds (half of original 4s), oscillating between 50ms and 250ms
      const speed = 150 + 100 * Math.sin(elapsed / 500);
      setCurrentIconIndex((prev) => (prev + 1) % trigramIcons.length);
      cycleTimerRef.current = setTimeout(cycleThroughIcons, speed);
    };

    // Start cycling
    if (cycleTimerRef.current) {
      clearTimeout(cycleTimerRef.current);
    }
    setCurrentIconIndex(0);
    startTimeRef.current = Date.now();
    cycleThroughIcons();

    return () => {
      if (cycleTimerRef.current) {
        clearTimeout(cycleTimerRef.current);
      }
    };
  }, []); // No dependencies - runs once on mount

  // Shuffle icon effect - sine wave speed (same as cycle icon)
  useEffect(() => {
    const cycleThroughShuffleIcons = () => {
      // Sine wave speed - same as cycle icon
      const elapsed = Date.now() - shuffleStartTimeRef.current;
      // Sine wave with period of 2 seconds, oscillating between 50ms and 250ms
      const speed = 150 + 100 * Math.sin(elapsed / 500);
      setCurrentShuffleIndex((prev) => (prev + 1) % shuffleIcons.length);
      shuffleTimerRef.current = setTimeout(cycleThroughShuffleIcons, speed);
    };

    // Start cycling
    if (shuffleTimerRef.current) {
      clearTimeout(shuffleTimerRef.current);
    }
    setCurrentShuffleIndex(0);
    shuffleStartTimeRef.current = Date.now();
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
        <nav className="fixed top-0 left-0 right-0 z-20 flex items-center pointer-events-none" style={{ lineHeight: 1 }}>
          {/* Left: menu items */}
          <div className="flex items-center gap-0">
            <div className="relative">
              <Link
                to="/work"
                onClick={() => setWorkMenuOpen(!workMenuOpen)}
                onMouseEnter={() => setWorkMenuOpen(true)}
                onMouseLeave={() => setWorkMenuOpen(false)}
                className="font-display font-normal whitespace-nowrap pointer-events-auto"
              >
                <StaggeredMirrorText text="work" isActive={isWorkPage} forcedVariant={topNavColors[0]} />
              </Link>
              {workMenuOpen && (
                <div
                  className="absolute top-full left-0 flex flex-col gap-0 mt-0"
                  onMouseEnter={() => setWorkMenuOpen(true)}
                  onMouseLeave={() => setWorkMenuOpen(false)}
                >
                  <Link to="/audio" className="font-display font-normal whitespace-nowrap pointer-events-auto">
                    <StaggeredMirrorText text="audio" isActive={location.pathname === '/audio'} forcedVariant={topNavColors[1]} />
                  </Link>
                  <Link to="/visual" className="font-display font-normal whitespace-nowrap pointer-events-auto">
                    <StaggeredMirrorText text="visual" isActive={location.pathname === '/visual'} forcedVariant={topNavColors[2]} />
                  </Link>
                </div>
              )}
            </div>
            <Link to="/about" className="font-display font-normal pointer-events-auto whitespace-nowrap">
              <StaggeredMirrorText text="about" isActive={location.pathname === '/about'} forcedVariant={topNavColors[3]} />
            </Link>
            <Link to="/links" className="font-display font-normal pointer-events-auto whitespace-nowrap">
              <StaggeredMirrorText text="links" isActive={location.pathname === '/links'} forcedVariant={topNavColors[4]} />
            </Link>
          </div>

          {/* Right: shuffle button and close button */}
          <div className="flex items-center gap-0">
            {showShuffleButton && (
              <button
                onClick={toggleRandomize}
                className="icon-button pointer-events-auto group"
                aria-label="Randomize projects"
                title={isRandomized ? 'Sorted randomly' : 'Sort by date'}
                style={{
                  color: shuffleIconColor,
                  backgroundColor: getIconBackground(shuffleIconColor),
                  padding: '2px 4px',
                  fontSize: '20px',
                  lineHeight: 1,
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = shuffleIconColor === 'white' ? 'hsl(0, 0%, 10%)' : 'hsl(0, 0%, 90%)';
                  e.currentTarget.style.backgroundColor = shuffleIconColor === 'white' ? 'hsl(0, 0%, 90%)' : 'hsl(0, 0%, 10%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = shuffleIconColor;
                  e.currentTarget.style.backgroundColor = getIconBackground(shuffleIconColor);
                }}
              >
                {shuffleIcons[currentShuffleIndex]}
              </button>
            )}
            {isProjectOpen && closeHandler && (
              <button
                onClick={closeHandler}
                className="icon-button pointer-events-auto group"
                aria-label="Close project"
                style={{
                  color: closeIconColor,
                  backgroundColor: getIconBackground(closeIconColor),
                  padding: '2px 4px',
                  fontSize: '20px',
                  lineHeight: 1,
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = closeIconColor === 'white' ? 'hsl(0, 0%, 10%)' : 'hsl(0, 0%, 90%)';
                  e.currentTarget.style.backgroundColor = closeIconColor === 'white' ? 'hsl(0, 0%, 90%)' : 'hsl(0, 0%, 10%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = closeIconColor;
                  e.currentTarget.style.backgroundColor = getIconBackground(closeIconColor);
                }}
              >
                ✕
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
                height: '20px',
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
                height: '20px',
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
                color: getColorFromVariant(audioPlayerColors.controls).text,
                backgroundColor: getColorFromVariant(audioPlayerColors.controls).bg,
                padding: '2px 4px',
                fontSize: '20px',
                lineHeight: 1,
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                const colors = getColorFromVariant(audioPlayerColors.controls);
                e.currentTarget.style.color = colors.bg;
                e.currentTarget.style.backgroundColor = colors.text;
              }}
              onMouseLeave={(e) => {
                const colors = getColorFromVariant(audioPlayerColors.controls);
                e.currentTarget.style.color = colors.text;
                e.currentTarget.style.backgroundColor = colors.bg;
              }}
            >
              ⏮
            </button>
          )}

          {/* Play/Pause button - shows music note when not playing, play when hovered, pause when playing */}
          <button
            onClick={togglePlay}
            className="icon-button pointer-events-auto group"
            aria-label={isPlaying ? "Pause" : "Play"}
            style={{
              color: getColorFromVariant(audioPlayerColors.controls).text,
              backgroundColor: getColorFromVariant(audioPlayerColors.controls).bg,
              padding: '2px 4px',
              fontSize: '20px',
              lineHeight: 1,
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              setIsPlayerHovered(true);
              const colors = getColorFromVariant(audioPlayerColors.controls);
              e.currentTarget.style.color = colors.bg;
              e.currentTarget.style.backgroundColor = colors.text;
            }}
            onMouseLeave={(e) => {
              setIsPlayerHovered(false);
              const colors = getColorFromVariant(audioPlayerColors.controls);
              e.currentTarget.style.color = colors.text;
              e.currentTarget.style.backgroundColor = colors.bg;
            }}
          >
            {isPlaying ? '❚❚' : (isPlayerHovered ? '▶' : '♫')}
          </button>

          {/* Next button - shows when playing */}
          {isPlaying && (
            <button
              onClick={nextTrack}
              className="icon-button pointer-events-auto group"
              aria-label="Next"
              style={{
                color: getColorFromVariant(audioPlayerColors.controls).text,
                backgroundColor: getColorFromVariant(audioPlayerColors.controls).bg,
                padding: '2px 4px',
                fontSize: '20px',
                lineHeight: 1,
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                const colors = getColorFromVariant(audioPlayerColors.controls);
                e.currentTarget.style.color = colors.bg;
                e.currentTarget.style.backgroundColor = colors.text;
              }}
              onMouseLeave={(e) => {
                const colors = getColorFromVariant(audioPlayerColors.controls);
                e.currentTarget.style.color = colors.text;
                e.currentTarget.style.backgroundColor = colors.bg;
              }}
            >
              ⏭
            </button>
          )}

          {/* Cycle icon */}
          <button
            onClick={handleCycleIconClick}
            className="icon-button pointer-events-auto group"
            aria-label="Cycle icon"
            style={{
              color: getColorFromVariant(cycleIconColor).text,
              backgroundColor: getColorFromVariant(cycleIconColor).bg,
              padding: '2px 4px',
              fontSize: '20px',
              lineHeight: 1,
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              const colors = getColorFromVariant(cycleIconColor);
              e.currentTarget.style.color = colors.bg;
              e.currentTarget.style.backgroundColor = colors.text;
            }}
            onMouseLeave={(e) => {
              const colors = getColorFromVariant(cycleIconColor);
              e.currentTarget.style.color = colors.text;
              e.currentTarget.style.backgroundColor = colors.bg;
            }}
          >
            {trigramIcons[currentIconIndex]}
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
          </InvertProvider>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
