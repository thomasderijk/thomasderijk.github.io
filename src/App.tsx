import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation, Link, useNavigate } from "react-router-dom";
import { X, Shuffle } from "lucide-react";
import { useProjectSort } from "@/hooks/use-project-sort";
import { useThumbnailPreload } from "@/hooks/use-thumbnail-preload";
import { StaggeredMirrorText } from "@/components/StaggeredMirrorText";
import { NavDot } from "@/components/NavDot";
import { CommercialProvider } from "@/contexts/CommercialContext";
import { ProjectDetailProvider, useProjectDetail } from "@/contexts/ProjectDetailContext";
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
  const showShuffleButton = location.pathname === '/audio' || location.pathname === '/visual';
  const allowScroll = location.pathname === '/audio' || location.pathname === '/visual';
  const shouldBlurBackground = location.pathname === '/audio' || location.pathname === '/visual';
  const [iframeSrc, setIframeSrc] = useState("/patches/");

  // Preload all thumbnail metadata on app initialization
  useThumbnailPreload();

  const reloadIframe = () => {
    setIframeSrc(`/patches/?ts=${Date.now()}`);
  };


  return (
    <div className={`relative ${allowScroll ? 'min-h-screen' : 'h-screen overflow-hidden'} bg-[hsl(var(--background))]`}>
      <iframe
        src={iframeSrc}
        className="fixed bg-[hsl(var(--background))]"
        style={{
          border: 'none',
          touchAction: 'auto',
          backgroundColor: 'hsl(var(--background))',
          filter: shouldBlurBackground ? 'blur(20px) grayscale(100%)' : 'none',
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
      />
      
      {isHome && (
        <div className="fixed top-0 left-0 right-0 z-20 pointer-events-none">
          <div className="relative">
            <div className="py-2 md:py-4 px-2 md:px-4 invisible">
              {/* Invisible placeholder to create same height as nav */}
              <span className="text-2xl md:text-4xl font-display font-bold">placeholder</span>
            </div>
            <button
              onClick={reloadIframe}
              className="absolute top-1/2 -translate-y-1/2 left-2 md:left-4 p-2 md:p-3 text-foreground hover:text-foreground/80 pointer-events-auto transition-colors"
              aria-label="Reload background"
              title="Reload background"
            >
              <Shuffle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" strokeWidth={3} />
            </button>
          </div>
        </div>
      )}
      
      {!isHome && (
        <nav className="sticky top-0 z-20 pointer-events-none">
            {showShuffleButton && (
            <button
              onClick={toggleRandomize}
              className="absolute top-1/2 -translate-y-1/2 left-2 md:left-4 p-2 md:p-3 text-foreground hover:text-foreground/80 pointer-events-auto transition-colors"
              aria-label="Randomize projects"
              title={isRandomized ? 'Sorted randomly' : 'Sort by date'}
            >
              <Shuffle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" strokeWidth={3} />
            </button>
          )}
          <div
            className="flex items-center justify-center gap-2 sm:gap-2.5 md:gap-3 text-2xl md:text-4xl py-2 md:py-4 px-2 md:px-4"
          >
            <Link to="/audio" className="font-display font-bold text-foreground pointer-events-auto whitespace-nowrap">
              <StaggeredMirrorText text="audio" isActive={location.pathname === '/audio'} />
            </Link>
            <NavDot className="text-foreground" />
            <Link to="/visual" className="font-display font-bold text-foreground pointer-events-auto whitespace-nowrap">
              <StaggeredMirrorText text="visual" isActive={location.pathname === '/visual'} />
            </Link>
            <NavDot className="text-foreground" />
            <Link to="/about" className="font-display font-bold text-foreground pointer-events-auto whitespace-nowrap">
              <StaggeredMirrorText text="about" isActive={location.pathname === '/about'} />
            </Link>
            <NavDot className="text-foreground" />
            <Link to="/links" className="font-display font-bold text-foreground pointer-events-auto whitespace-nowrap">
              <StaggeredMirrorText text="links" isActive={location.pathname === '/links'} />
            </Link>
            <NavDot className="text-foreground" />
            <a href="mailto:thomasderijk@me.com" className="font-display font-bold text-foreground pointer-events-auto whitespace-nowrap">
              <StaggeredMirrorText text="contact" />
            </a>
          </div>
          <button
            onClick={() => {
              if (isProjectOpen && closeHandler) {
                closeHandler();
              } else {
                navigate('/');
              }
            }}
            className="absolute top-1/2 -translate-y-1/2 right-2 md:right-4 p-2 md:p-3 text-foreground hover:text-foreground/80 pointer-events-auto"
            aria-label={isProjectOpen ? "Close project" : "Close and return home"}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" strokeWidth={3} />
          </button>
        </nav>
      )}
      
      {children}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
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
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
