import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation, Link, useNavigate } from "react-router-dom";
import { X, Shuffle, Play, Pause, SkipForward, Eclipse } from "lucide-react";
import { useProjectSort } from "@/hooks/use-project-sort";
import { useThumbnailPreload } from "@/hooks/use-thumbnail-preload";
import { useVideoPreloader } from "@/hooks/use-video-preloader";
import { StaggeredMirrorText } from "@/components/StaggeredMirrorText";
import { NavDot } from "@/components/NavDot";
import { CommercialProvider } from "@/contexts/CommercialContext";
import { ProjectDetailProvider, useProjectDetail } from "@/contexts/ProjectDetailContext";
import { AudioPlayerProvider, useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { InvertProvider, useInvert } from "@/contexts/InvertContext";
import Index from "./pages/Index";
import Audio from "./pages/Audio";
import Visual from "./pages/Visual";
import Links from "./pages/Links";
import About from "./pages/About";
import Commercial from "./pages/Commercial";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const { isRandomized, toggleRandomize } = useProjectSort();
  const { isProjectOpen, closeHandler } = useProjectDetail();
  const { isPlaying, togglePlay, nextTrack } = useAudioPlayer();
  const { isInverted, toggleInvert } = useInvert();
  const showShuffleButton = location.pathname === '/audio' || location.pathname === '/visual';
  const allowScroll = location.pathname === '/audio' || location.pathname === '/visual';
  const shouldBlurBackground = location.pathname === '/audio' || location.pathname === '/visual';
  const [iframeSrc, setIframeSrc] = useState("/patches/");
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Preload all thumbnail metadata on app initialization
  useThumbnailPreload();

  // Preload video metadata for faster detail view loading
  useVideoPreloader();

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  // Dispatch grid view events to iframe based on route changes
  useEffect(() => {
    const iframe = document.querySelector('iframe');
    const isGridView = location.pathname === '/audio' || location.pathname === '/visual';
    const page = location.pathname.replace('/', '') as 'audio' | 'visual';

    if (iframe?.contentWindow && isGridView) {
      iframe.contentWindow.dispatchEvent(new CustomEvent('gridViewOpen', { detail: { page } }));
    }

    return () => {
      // Fire gridViewClosed when leaving a grid view page
      if (iframe?.contentWindow && isGridView) {
        iframe.contentWindow.dispatchEvent(new CustomEvent('gridViewClosed', { detail: { page } }));
      }
    };
  }, [location.pathname]);

  const reloadIframe = () => {
    setIframeSrc(`/patches/?ts=${Date.now()}`);
  };


  return (
    <div className={`relative ${allowScroll ? 'min-h-screen' : 'h-screen overflow-hidden'} ${isInverted ? 'bg-white text-black' : 'bg-[hsl(var(--background))]'}`}>
      <iframe
        src={iframeSrc}
        className="fixed bg-[hsl(var(--background))]"
        style={{
          border: 'none',
          touchAction: 'auto',
          backgroundColor: 'rgb(26, 26, 26)',
          filter: `${shouldBlurBackground ? 'blur(20px) grayscale(100%)' : ''} ${isInverted ? 'invert(1)' : ''}`.trim() || 'none',
          transition: 'filter 0.3s ease',
          top: '-40px',
          left: '-40px',
          right: '-40px',
          bottom: '-40px',
          width: 'calc(100% + 80px)',
          height: 'calc(100% + 80px)',
          pointerEvents: shouldBlurBackground ? 'none' : 'auto'
        }}
        title="Background Scene"
        onLoad={handleIframeLoad}
      />

      {/* Dark overlay for blurred background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          opacity: shouldBlurBackground ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {iframeLoaded && (
        <>
      {isHome && (
        <div className="fixed top-0 left-0 right-0 z-20 pointer-events-none">
          <div className="relative">
            <div className="py-2 md:py-4 px-2 md:px-4 invisible">
              {/* Invisible placeholder to create same height as nav */}
              <span className="text-2xl md:text-4xl font-display font-bold">placeholder</span>
            </div>
            <button
              onClick={reloadIframe}
              className={`absolute top-1/2 -translate-y-1/2 left-2 md:left-4 p-2 md:p-3 ${isInverted ? 'text-black hover:text-black/80' : 'text-foreground hover:text-foreground/80'} pointer-events-auto transition-colors`}
              aria-label="Reload background"
              title="Reload background"
            >
              <Shuffle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}
      
      {!isHome && (
        <nav className="sticky top-0 z-20 pointer-events-none">
          <div className="relative">
            <div
              className="flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 text-base sm:text-lg md:text-xl lg:text-4xl py-1.5 sm:py-2 md:py-3 lg:py-4 px-1.5 sm:px-2 md:px-3 lg:px-4"
            >
              <Link to="/audio" className={`font-display font-bold ${isInverted ? 'text-black' : 'text-foreground'} pointer-events-auto whitespace-nowrap`}>
                <StaggeredMirrorText text="audio" isActive={location.pathname === '/audio'} />
              </Link>
              <NavDot className={isInverted ? 'text-black' : 'text-foreground'} />
              <Link to="/visual" className={`font-display font-bold ${isInverted ? 'text-black' : 'text-foreground'} pointer-events-auto whitespace-nowrap`}>
                <StaggeredMirrorText text="visual" isActive={location.pathname === '/visual'} />
              </Link>
              <NavDot className={isInverted ? 'text-black' : 'text-foreground'} />
              <Link to="/about" className={`font-display font-bold ${isInverted ? 'text-black' : 'text-foreground'} pointer-events-auto whitespace-nowrap`}>
                <StaggeredMirrorText text="about" isActive={location.pathname === '/about'} />
              </Link>
              <NavDot className={isInverted ? 'text-black' : 'text-foreground'} />
              <Link to="/links" className={`font-display font-bold ${isInverted ? 'text-black' : 'text-foreground'} pointer-events-auto whitespace-nowrap`}>
                <StaggeredMirrorText text="links" isActive={location.pathname === '/links'} />
              </Link>
            </div>
            {showShuffleButton && (
              <button
                onClick={toggleRandomize}
                className={`absolute top-1/2 -translate-y-1/2 left-1.5 sm:left-2 md:left-3 lg:left-4 p-1.5 sm:p-2 md:p-2.5 lg:p-3 ${isInverted ? 'text-black hover:text-black/80' : 'text-foreground hover:text-foreground/80'} pointer-events-auto transition-colors`}
                aria-label="Randomize projects"
                title={isRandomized ? 'Sorted randomly' : 'Sort by date'}
              >
                <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" strokeWidth={1.5} />
              </button>
            )}
            <button
              onClick={() => {
                if (isProjectOpen && closeHandler) {
                  closeHandler();
                } else {
                  navigate('/');
                }
              }}
              className={`absolute top-1/2 -translate-y-1/2 right-1.5 sm:right-2 md:right-3 lg:right-4 p-1.5 sm:p-2 md:p-2.5 lg:p-3 ${isInverted ? 'text-black hover:text-black/80' : 'text-foreground hover:text-foreground/80'} pointer-events-auto transition-colors`}
              aria-label={isProjectOpen ? "Close project" : "Close and return home"}
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" strokeWidth={1.5} />
            </button>
          </div>
        </nav>
      )}

      {children}

      {/* Audio player controls - bottom left */}
      <div className="fixed bottom-1.5 sm:bottom-2 md:bottom-3 lg:bottom-4 left-1.5 sm:left-2 md:left-3 lg:left-4 z-20 flex flex-col-reverse items-start -space-y-reverse -space-y-1">
        <button
          onClick={togglePlay}
          className={`p-1.5 sm:p-2 md:p-2.5 lg:p-3 ${isInverted ? 'text-black hover:text-black/80' : 'text-foreground hover:text-foreground/80'} pointer-events-auto transition-colors`}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" strokeWidth={1.5} />
          ) : (
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" strokeWidth={1.5} />
          )}
        </button>
        <button
          onClick={nextTrack}
          className={`p-1.5 sm:p-2 md:p-2.5 lg:p-3 ${isInverted ? 'text-black hover:text-black/80' : 'text-foreground hover:text-foreground/80'} pointer-events-auto transition-all duration-300 ease-out ${
            isPlaying
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-full pointer-events-none'
          }`}
          aria-label="Next track"
        >
          <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" strokeWidth={1.5} />
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
                    <Route path="/" element={<Index />} />
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
);

export default App;
