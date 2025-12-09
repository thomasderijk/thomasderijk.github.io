import { useState, useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
// SVG Icons - embeds UTF-8 characters in SVG to prevent emoji rendering on iOS
import { SvgIcon, createIconArray } from "@/components/icons/SvgIcon";
import { IconButton, ICON_BUTTON_STYLES } from "@/components/IconButton";
import { useProjectSort } from "@/hooks/use-project-sort";
import { useVideoPreloader } from "@/hooks/use-video-preloader";
import { StaggeredMirrorText } from "@/components/StaggeredMirrorText";
import { HoverableTrackTitle } from "@/components/HoverableTrackTitle";
import { NavSpacer } from "@/components/NavSpacer";
import { BottomNavSpacer } from "@/components/BottomNavSpacer";
import { NavLink } from "@/components/NavLink";
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
import List from "./pages/List";
import Links from "./pages/Links";
import About from "./pages/About";
import Commercial from "./pages/Commercial";
import NotFound from "./pages/NotFound";
import { projects } from "@/data/projects";

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
  const { isProjectOpen, closeHandler, openProjectHandler } = useProjectDetail();

  // Preload all videos on app load
  useVideoPreloader();
  const { isPlaying, togglePlay, nextTrack, previousTrack, currentTime, duration, seek, currentTrack, getTrackTitle, closePlayer } = useAudioPlayer();
  const [isPlayerHovered, setIsPlayerHovered] = useState(false);
  const { isInverted, toggleInvert } = useInvert();
  const { triggerShuffle } = useShuffle();
  // Show shuffle button when close button is not visible (inverse of close button condition)
  const isOnWorkPage = location.pathname === '/work' || location.pathname === '/audio' || location.pathname === '/visual' || location.pathname === '/' || location.pathname === '/list';
  const showCloseButton = isProjectOpen && closeHandler && isOnWorkPage;
  const showShuffleButton = !showCloseButton;
  const allowScroll = location.pathname === '/work' || location.pathname === '/audio' || location.pathname === '/visual' || location.pathname === '/' || location.pathname === '/links' || location.pathname === '/list';
  const iframeLoaded = true; // No iframe anymore, always show content
  const [workMenuOpen, setWorkMenuOpen] = useState(false);
  const isWorkPage = location.pathname === '/work' || location.pathname === '/audio' || location.pathname === '/visual' || location.pathname === '/';
  const workMenuTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-close work menu on mobile after 10 seconds or on scroll
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile || !workMenuOpen) return;

    // Set 10 second timer to close menu
    workMenuTimerRef.current = setTimeout(() => {
      setWorkMenuOpen(false);
    }, 10000);

    // Close menu on scroll
    const handleScroll = () => {
      setWorkMenuOpen(false);
    };

    // Listen to scroll on the main scrollable container
    const scrollableElement = document.querySelector('.scrollable-content');
    if (scrollableElement) {
      scrollableElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (workMenuTimerRef.current) {
        clearTimeout(workMenuTimerRef.current);
      }
      if (scrollableElement) {
        scrollableElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [workMenuOpen]);

  // Top nav colors - ensuring adjacent items don't match
  type ColorOption = 'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light';

  // Generate nav colors with proper adjacency rules
  // Index mapping: 0=work, 1=overview, 2=audio, 3=visual, 4=about, 5=links
  // Adjacency rules: work≠overview, overview≠audio, audio≠visual, work≠about, about≠links
  const generateNavColors = (): ColorOption[] => {
    const options: ColorOption[] = ['white-on-black', 'black-on-white', 'white-on-dark', 'black-on-light'];
    const colors: ColorOption[] = [];

    // 0: work - random choice
    colors[0] = options[Math.floor(Math.random() * options.length)];

    // 1: overview - must differ from work (index 0)
    let availableForOverview = options.filter(opt => opt !== colors[0]);
    colors[1] = availableForOverview[Math.floor(Math.random() * availableForOverview.length)];

    // 2: audio - must differ from overview (index 1)
    let availableForAudio = options.filter(opt => opt !== colors[1]);
    colors[2] = availableForAudio[Math.floor(Math.random() * availableForAudio.length)];

    // 3: visual - must differ from audio (index 2)
    let availableForVisual = options.filter(opt => opt !== colors[2]);
    colors[3] = availableForVisual[Math.floor(Math.random() * availableForVisual.length)];

    // 4: about - must differ from work (index 0), since it's horizontally adjacent
    let availableForAbout = options.filter(opt => opt !== colors[0]);
    colors[4] = availableForAbout[Math.floor(Math.random() * availableForAbout.length)];

    // 5: links - must differ from about (index 4)
    let availableForLinks = options.filter(opt => opt !== colors[4]);
    colors[5] = availableForLinks[Math.floor(Math.random() * availableForLinks.length)];

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

  // Counter for regenerating nav spacers - separate keys for each spacer
  const [navSpacerKey1, setNavSpacerKey1] = useState(0); // Between work and about
  const [navSpacerKey2, setNavSpacerKey2] = useState(0); // Between about and links
  const [navSpacerKey3, setNavSpacerKey3] = useState(0); // Between links and icon

  // Bottom nav spacers
  const [bottomNavSpacerKey1, setBottomNavSpacerKey1] = useState(0); // Between title and progress bar
  const [bottomNavSpacerKey2, setBottomNavSpacerKey2] = useState(0); // Between progress bar and controls
  const [bottomNavSpacerKey3, setBottomNavSpacerKey3] = useState(0); // Between controls and cycle icon

  // Regenerate colors when grid is randomized
  useEffect(() => {
    setTopNavColors(generateNavColors());
    const newAudioColors = generateAudioPlayerColors();
    setAudioPlayerColors(newAudioColors);
    setBottomNavColors([newAudioColors.cycleIcon]);
    setShuffleIconColor(Math.random() < 0.5 ? 'white' : 'black');
    setNavSpacerKey1(prev => prev + 1);
    setNavSpacerKey2(prev => prev + 1);
    setNavSpacerKey3(prev => prev + 1);
    setBottomNavSpacerKey1(prev => prev + 1);
    setBottomNavSpacerKey2(prev => prev + 1);
    setBottomNavSpacerKey3(prev => prev + 1);
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

  // Close player when navigating to a new page while paused
  useEffect(() => {
    if (!isPlaying && currentTrack) {
      closePlayer();
    }
  }, [location.pathname]);

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

  // Cycling icon state - specific trigrams in order (SVG components)
  const trigramIcons = createIconArray(['☰', '☱', '☳', '☷', '☶', '☴']);
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cycleNoiseRef = useRef<number>(Math.random() * 1000); // Random seed for cycle icon noise
  const [isCycleIconHovered, setIsCycleIconHovered] = useState(false);

  // Shuffle icon state - asterisks and stars cycling (SVG components)
  const shuffleIcons = createIconArray([
    '✢', '✣', '✤', '✥', '✦', '✧',
    '✱', '✲', '✳', '✴', '✵', '✶',
    '✻', '✼', '✽', '✾', '✿', '❀',
    '❃', '❄', '❅', '❆', '❇', '❈', '❉', '❊', '❋'
  ]);
  const [currentShuffleIndex, setCurrentShuffleIndex] = useState(0);
  const shuffleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shuffleNoiseRef = useRef<number>(Math.random() * 1000); // Random seed for shuffle icon noise
  const [isShuffleIconHovered, setIsShuffleIconHovered] = useState(false);

  // Music icon state - ping pong through music notes (SVG components)
  const musicIcons = createIconArray(['♪', '♫', '♬']);
  const [currentMusicIndex, setCurrentMusicIndex] = useState(0);
  const musicDirectionRef = useRef<1 | -1>(1); // 1 = forward, -1 = backward
  const musicTimerRef = useRef<NodeJS.Timeout | null>(null);
  const musicNoiseRef = useRef<number>(Math.random() * 1000); // Random seed for music icon noise
  const [isMusicIconHovered, setIsMusicIconHovered] = useState(false);

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
      if (!isCycleIconHovered) {
        setCurrentIconIndex((prev) => (prev + 1) % trigramIcons.length);
      }

      // Base speed: 50ms + 33% = ~67ms
      // Add ±33% variation using noise: 67ms ± 22ms = 45ms to 89ms
      const baseSpeed = 67;
      const variation = 22;
      const noise = getNoise(cycleNoiseRef.current);
      const speed = baseSpeed + (noise - 0.5) * 2 * variation;

      cycleTimerRef.current = setTimeout(cycleThroughIcons, speed);
    };

    // Start cycling (don't reset the index)
    cycleThroughIcons();

    return () => {
      if (cycleTimerRef.current) {
        clearTimeout(cycleTimerRef.current);
      }
    };
  }, [isCycleIconHovered]); // Re-run when hover state changes

  // Shuffle icon effect - variable speed with noise (independent from cycle icon)
  useEffect(() => {
    const cycleThroughShuffleIcons = () => {
      if (!isShuffleIconHovered) {
        setCurrentShuffleIndex((prev) => (prev + 1) % shuffleIcons.length);
      }

      // Base speed: 50ms + 33% = ~67ms
      // Add ±33% variation using noise: 67ms ± 22ms = 45ms to 89ms
      const baseSpeed = 67;
      const variation = 22;
      const noise = getNoise(shuffleNoiseRef.current);
      const speed = baseSpeed + (noise - 0.5) * 2 * variation;

      shuffleTimerRef.current = setTimeout(cycleThroughShuffleIcons, speed);
    };

    // Start cycling (don't reset the index)
    cycleThroughShuffleIcons();

    return () => {
      if (shuffleTimerRef.current) {
        clearTimeout(shuffleTimerRef.current);
      }
    };
  }, [isShuffleIconHovered]); // Re-run when hover state changes

  // Music icon effect - ping pong with variable speed using noise (independent seed)
  useEffect(() => {
    const pingPongThroughMusicIcons = () => {
      if (!isMusicIconHovered) {
        setCurrentMusicIndex((prev) => {
          let nextIndex = prev + musicDirectionRef.current;

          // Check if we need to reverse direction
          if (nextIndex >= musicIcons.length) {
            musicDirectionRef.current = -1;
            return musicIcons.length - 2; // Bounce back
          } else if (nextIndex < 0) {
            musicDirectionRef.current = 1;
            return 1; // Bounce forward
          }

          return nextIndex;
        });
      }

      // Base speed: 50ms + 33% = ~67ms, then 33% of that = ~203ms, then 3x slower = ~609ms
      // Add ±33% variation using noise: 609ms ± 201ms = 408ms to 810ms
      const baseSpeed = 609;
      const variation = 201;
      const noise = getNoise(musicNoiseRef.current);
      const speed = baseSpeed + (noise - 0.5) * 2 * variation;

      musicTimerRef.current = setTimeout(pingPongThroughMusicIcons, speed);
    };

    // Start cycling (don't reset the index or direction)
    pingPongThroughMusicIcons();

    return () => {
      if (musicTimerRef.current) {
        clearTimeout(musicTimerRef.current);
      }
    };
  }, [isMusicIconHovered]); // Re-run when hover state changes

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
              <NavLink
                to="/work"
                onClick={() => {
                  // Keep menu open when clicking (don't toggle it closed)
                  setWorkMenuOpen(true);
                }}
                onMouseEnter={() => setWorkMenuOpen(true)}
                onMouseLeave={() => setWorkMenuOpen(false)}
                className="font-display font-light whitespace-nowrap pointer-events-auto"
              >
                <StaggeredMirrorText text="work" isActive={isWorkPage} forcedVariant={topNavColors[0]} />
              </NavLink>
              {workMenuOpen && (
                <div
                  className="absolute top-full left-0 flex flex-col gap-0 mt-0"
                  onMouseEnter={() => setWorkMenuOpen(true)}
                  onMouseLeave={() => setWorkMenuOpen(false)}
                >
                  <NavLink
                    to="/list"
                    className="font-display font-light whitespace-nowrap pointer-events-auto"
                    onClick={(e) => {
                      // Don't close menu on click, keep it open while still hovering
                      e.stopPropagation();
                    }}
                  >
                    <StaggeredMirrorText text="overview" isActive={location.pathname === '/list'} forcedVariant={topNavColors[1]} />
                  </NavLink>
                  <NavLink
                    to="/audio"
                    className="font-display font-light whitespace-nowrap pointer-events-auto"
                    onClick={(e) => {
                      // Don't close menu on click, keep it open while still hovering
                      e.stopPropagation();
                    }}
                  >
                    <StaggeredMirrorText text="audio" isActive={location.pathname === '/audio'} forcedVariant={topNavColors[2]} />
                  </NavLink>
                  <NavLink
                    to="/visual"
                    className="font-display font-light whitespace-nowrap pointer-events-auto"
                    onClick={(e) => {
                      // Don't close menu on click, keep it open while still hovering
                      e.stopPropagation();
                    }}
                  >
                    <StaggeredMirrorText text="visual" isActive={location.pathname === '/visual'} forcedVariant={topNavColors[3]} />
                  </NavLink>
                </div>
              )}
            </div>
            <NavSpacer regenerateKey={navSpacerKey1} />
            <NavLink
              to="/about"
              className="font-display font-light pointer-events-auto whitespace-nowrap"
            >
              <StaggeredMirrorText text="about" isActive={location.pathname === '/about'} forcedVariant={topNavColors[4]} />
            </NavLink>
            <NavSpacer regenerateKey={navSpacerKey2} />
            <NavLink
              to="/links"
              className="font-display font-light pointer-events-auto whitespace-nowrap"
            >
              <StaggeredMirrorText text="links" isActive={location.pathname === '/links'} forcedVariant={topNavColors[5]} />
            </NavLink>
          </div>

          {/* Right: shuffle button and close button */}
          <div className="flex items-center gap-0">
            <NavSpacer regenerateKey={navSpacerKey3} />
            {showShuffleButton && (
              <IconButton
                icon={(() => {
                  const ShuffleIconComponent = shuffleIcons[currentShuffleIndex];
                  return <ShuffleIconComponent size={ICON_BUTTON_STYLES.iconSize} color={shuffleIconColor} />;
                })()}
                onClick={() => {
                  toggleRandomize();
                  triggerShuffle();
                  setShuffleIconColor(Math.random() < 0.5 ? 'white' : 'black');
                }}
                backgroundColor={getIconBackground(shuffleIconColor)}
                textColor={shuffleIconColor}
                onHoverBackgroundColor={shuffleIconColor === 'white' ? 'hsl(0, 0%, 90%)' : 'hsl(0, 0%, 10%)'}
                aria-label="Randomize projects"
                title={isRandomized ? 'Sorted randomly' : 'Sort by date'}
                onMouseEnterExtra={() => setIsShuffleIconHovered(true)}
                onMouseLeaveExtra={() => setIsShuffleIconHovered(false)}
              />
            )}
          </div>
        </nav>

        {/* Close button - fixed to top right when project is open and on work pages */}
        {showCloseButton && (
          <IconButton
            icon={<SvgIcon char="✕" size={ICON_BUTTON_STYLES.iconSize} color={closeIconColor} />}
            onClick={closeHandler!}
            backgroundColor={getIconBackground(closeIconColor)}
            textColor={closeIconColor}
            onHoverBackgroundColor={closeIconColor === 'white' ? 'hsl(0, 0%, 90%)' : 'hsl(0, 0%, 10%)'}
            aria-label="Close project"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              zIndex: 30,
            }}
          />
        )}

      {children}

      {/* Bottom nav bar - anchored to bottom right */}
      <nav className="fixed bottom-0 right-0 z-20 flex items-center justify-end pointer-events-none" style={{ lineHeight: 1 }}>
        {/* Audio player controls */}
        <div className="flex items-center gap-0">
          {/* Track title - shows when track is loaded */}
          {currentTrack && (() => {
            // Find which project this track belongs to
            const findProjectForTrack = (trackUrl: string) => {
              return projects.find(project =>
                project.media.some(media =>
                  media.type === 'audio' && media.url === trackUrl
                )
              );
            };

            const project = findProjectForTrack(currentTrack);
            const trackTitle = getTrackTitle(currentTrack);

            const handleTrackTitleClick = () => {
              if (project) {
                // Navigate to work page if not already there
                const needsNavigation = location.pathname !== '/work' && location.pathname !== '/' && location.pathname !== '/audio';

                if (needsNavigation) {
                  navigate('/work');
                  // Wait for Work component to mount and register the handler
                  setTimeout(() => {
                    if (openProjectHandler) {
                      openProjectHandler(project.title);
                    }
                  }, 100);
                } else if (openProjectHandler) {
                  // Already on work page, open immediately
                  openProjectHandler(project.title);
                }
              }
            };

            return (
              <HoverableTrackTitle
                title={trackTitle}
                backgroundColor={getColorFromVariant(audioPlayerColors.title).bg}
                textColor={getColorFromVariant(audioPlayerColors.title).text}
                height={ICON_BUTTON_STYLES.size}
                onClick={handleTrackTitleClick}
              />
            );
          })()}

          {/* Spacer between title and progress bar */}
          {currentTrack && <BottomNavSpacer regenerateKey={bottomNavSpacerKey1} />}

          {/* Progress bar - shows when track is loaded */}
          {currentTrack && duration > 0 && (
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

          {/* Spacer between progress bar and controls */}
          {currentTrack && <BottomNavSpacer regenerateKey={bottomNavSpacerKey2} />}

          {/* Previous button - shows when track is loaded */}
          {currentTrack && (
            <IconButton
              icon={<SvgIcon char="⏮" size={ICON_BUTTON_STYLES.iconSize} color={getColorFromVariant(audioPlayerColors.controls).text} />}
              onClick={previousTrack}
              backgroundColor={getColorFromVariant(audioPlayerColors.controls).bg}
              textColor={getColorFromVariant(audioPlayerColors.controls).text}
              onHoverBackgroundColor={getColorFromVariant(audioPlayerColors.controls).text}
              aria-label="Previous"
            />
          )}

          {/* Play/Pause button - shows music note when not playing, play when hovered, pause when playing */}
          <IconButton
            icon={
              isPlaying ? (
                <SvgIcon char="❚❚" size={ICON_BUTTON_STYLES.iconSize} color={getColorFromVariant(audioPlayerColors.controls).text} />
              ) : isPlayerHovered ? (
                <SvgIcon char="▶" size={ICON_BUTTON_STYLES.iconSize} color={getColorFromVariant(audioPlayerColors.controls).text} />
              ) : (
                (() => {
                  const MusicIconComponent = musicIcons[currentMusicIndex];
                  return <MusicIconComponent size={ICON_BUTTON_STYLES.iconSize} color={getColorFromVariant(audioPlayerColors.controls).text} />;
                })()
              )
            }
            onClick={togglePlay}
            backgroundColor={getColorFromVariant(audioPlayerColors.controls).bg}
            textColor={getColorFromVariant(audioPlayerColors.controls).text}
            onHoverBackgroundColor={getColorFromVariant(audioPlayerColors.controls).text}
            aria-label={isPlaying ? "Pause" : "Play"}
            onMouseEnterExtra={() => {
              setIsPlayerHovered(true);
              setIsMusicIconHovered(true);
            }}
            onMouseLeaveExtra={() => {
              setIsPlayerHovered(false);
              setIsMusicIconHovered(false);
            }}
          />

          {/* Next button - shows when track is loaded */}
          {currentTrack && (
            <IconButton
              icon={<SvgIcon char="⏭" size={ICON_BUTTON_STYLES.iconSize} color={getColorFromVariant(audioPlayerColors.controls).text} />}
              onClick={nextTrack}
              backgroundColor={getColorFromVariant(audioPlayerColors.controls).bg}
              textColor={getColorFromVariant(audioPlayerColors.controls).text}
              onHoverBackgroundColor={getColorFromVariant(audioPlayerColors.controls).text}
              aria-label="Next"
            />
          )}

          {/* Spacer between controls and cycle icon */}
          <BottomNavSpacer regenerateKey={bottomNavSpacerKey3} />

          {/* Cycle icon */}
          <IconButton
            icon={(() => {
              const TrigramIconComponent = trigramIcons[currentIconIndex];
              return <TrigramIconComponent size={ICON_BUTTON_STYLES.iconSize} color={getColorFromVariant(cycleIconColor).text} />;
            })()}
            onClick={handleCycleIconClick}
            backgroundColor={getColorFromVariant(cycleIconColor).bg}
            textColor={getColorFromVariant(cycleIconColor).text}
            onHoverBackgroundColor={getColorFromVariant(cycleIconColor).text}
            aria-label="Cycle icon"
            onMouseEnterExtra={() => {
              const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
              if (!isMobile) {
                setIsCycleIconHovered(true);
              }
            }}
            onMouseLeaveExtra={() => {
              const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
              if (!isMobile) {
                setIsCycleIconHovered(false);
              }
            }}
          />
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
                      <Route path="/list" element={<List />} />
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
