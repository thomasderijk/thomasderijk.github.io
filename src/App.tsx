import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation, Link, useNavigate } from "react-router-dom";
// Icons replaced with Unicode symbols - no dependencies needed
import { useProjectSort } from "@/hooks/use-project-sort";
import { StaggeredMirrorText } from "@/components/StaggeredMirrorText";
import { NavDot } from "@/components/NavDot";
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
  const { isPlaying, togglePlay, nextTrack } = useAudioPlayer();
  const { isInverted, toggleInvert } = useInvert();
  const showShuffleButton = location.pathname === '/work' || location.pathname === '/audio' || location.pathname === '/visual' || location.pathname === '/';
  const allowScroll = location.pathname === '/work' || location.pathname === '/audio' || location.pathname === '/visual' || location.pathname === '/';
  const iframeLoaded = true; // No iframe anymore, always show content
  const [workMenuOpen, setWorkMenuOpen] = useState(false);
  const isWorkPage = location.pathname === '/work' || location.pathname === '/audio' || location.pathname === '/visual' || location.pathname === '/';

  // Random icon colors
  const [shuffleIconColor] = useState<'white' | 'black'>(Math.random() < 0.5 ? 'white' : 'black');
  const [closeIconColor] = useState<'white' | 'black'>(Math.random() < 0.5 ? 'white' : 'black');
  const [playIconColor] = useState<'white' | 'black'>(Math.random() < 0.5 ? 'white' : 'black');
  const [nextIconColor] = useState<'white' | 'black'>(Math.random() < 0.5 ? 'white' : 'black');


  return (
    <div className={`relative ${allowScroll ? 'min-h-screen' : 'h-screen overflow-hidden'}`} style={{ backgroundColor: 'rgb(128, 128, 128)' }}>
      {/* Iframe background disabled - using 50% grey instead */}


      {iframeLoaded && (
        <>
        <nav className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between py-2 px-2 pointer-events-none">
          {/* Left: shuffle button */}
          <div className="flex items-center gap-2">
            {showShuffleButton && (
              <button
                onClick={toggleRandomize}
                className="icon-button pointer-events-auto transition-opacity hover:opacity-80"
                aria-label="Randomize projects"
                title={isRandomized ? 'Sorted randomly' : 'Sort by date'}
                style={{
                  color: shuffleIconColor,
                  padding: '2px 4px',
                }}
              >
                ⇄
              </button>
            )}
          </div>

          {/* Center: menu items */}
          <div className="flex items-center gap-2">
            <div
              className="relative pointer-events-auto"
              onMouseEnter={() => setWorkMenuOpen(true)}
              onMouseLeave={() => setWorkMenuOpen(false)}
            >
              <Link
                to="/work"
                onClick={() => setWorkMenuOpen(!workMenuOpen)}
                className="font-display font-normal whitespace-nowrap"
              >
                <StaggeredMirrorText text="work" isActive={isWorkPage} />
              </Link>
              {workMenuOpen && (
                <div className="absolute top-full left-0 flex flex-col gap-0 mt-0">
                  <Link to="/audio" className="font-display font-normal whitespace-nowrap">
                    <StaggeredMirrorText text="audio" isActive={location.pathname === '/audio'} />
                  </Link>
                  <Link to="/visual" className="font-display font-normal whitespace-nowrap">
                    <StaggeredMirrorText text="visual" isActive={location.pathname === '/visual'} />
                  </Link>
                </div>
              )}
            </div>
            <NavDot className="text-foreground" />
            <Link to="/about" className="font-display font-normal pointer-events-auto whitespace-nowrap">
              <StaggeredMirrorText text="about" isActive={location.pathname === '/about'} />
            </Link>
            <NavDot className="text-foreground" />
            <Link to="/links" className="font-display font-normal pointer-events-auto whitespace-nowrap">
              <StaggeredMirrorText text="links" isActive={location.pathname === '/links'} />
            </Link>
          </div>

          {/* Right: close button */}
          <div className="flex items-center gap-2">
            {isProjectOpen && closeHandler && (
              <button
                onClick={closeHandler}
                className="icon-button pointer-events-auto transition-opacity hover:opacity-80"
                aria-label="Close project"
                style={{
                  color: closeIconColor,
                  padding: '2px 4px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </nav>

      {children}

      {/* Audio player controls - bottom left */}
      <div className="fixed bottom-1.5 sm:bottom-2 md:bottom-3 lg:bottom-4 left-1.5 sm:left-2 md:left-3 lg:left-4 z-20 flex flex-col-reverse items-start -space-y-reverse -space-y-1">
        <button
          onClick={togglePlay}
          className="icon-button pointer-events-auto transition-opacity hover:opacity-80"
          aria-label={isPlaying ? "Pause" : "Play"}
          style={{
            fontSize: '20px',
            color: playIconColor,
            padding: '8px',
            lineHeight: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
        <button
          onClick={nextTrack}
          className={`icon-button pointer-events-auto transition-all duration-300 ease-out ${
            isPlaying
              ? 'opacity-100 translate-y-0 hover:opacity-80'
              : 'opacity-0 translate-y-full pointer-events-none'
          }`}
          aria-label="Next track"
          style={{
            fontSize: '20px',
            color: nextIconColor,
            padding: '8px',
            lineHeight: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ⏭
        </button>
      </div>

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
