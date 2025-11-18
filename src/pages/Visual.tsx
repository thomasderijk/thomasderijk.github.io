import { useState, useMemo, useEffect, useRef } from 'react';
import { projects } from '@/data/projects';
import { GridCardTitle } from '@/components/GridCardTitle';
import { VideoThumbnail } from '@/components/VideoThumbnail';
import { MediaRenderer } from '@/components/MediaRenderer';
import { Project, MediaItem } from '@/types/project';
import { useProjectSort } from '@/hooks/use-project-sort';
import { useCommercial } from '@/contexts/CommercialContext';
import { useProjectDetail } from '@/contexts/ProjectDetailContext';
import { resetVideoLoadQueue } from '@/hooks/use-video-load-queue';
import { X, ChevronDown } from 'lucide-react';

// Helper function to get thumbnail media from project
const getThumbnailMedia = (project: Project): MediaItem | null => {
  // Look for files containing "_thumbnail" before the extension (case insensitive)
  const thumbnailVideos = project.media.filter(m => 
    m.type === 'video' && m.url.toLowerCase().includes('_thumbnail.')
  );
  const thumbnailImages = project.media.filter(m => 
    m.type === 'image' && m.url.toLowerCase().includes('_thumbnail.')
  );
  
  // Count all images (including thumbnails)
  const allImages = project.media.filter(m => m.type === 'image');
  const hasAudio = project.media.some(m => m.type === 'audio');
  
  // Prefer video thumbnails over image thumbnails
  if (thumbnailVideos.length > 0) {
    const randomIndex = Math.floor(Math.random() * thumbnailVideos.length);
    return thumbnailVideos[randomIndex];
  }
  
  if (thumbnailImages.length > 0) {
    const randomIndex = Math.floor(Math.random() * thumbnailImages.length);
    return thumbnailImages[randomIndex];
  }
  
  // Special case: if there's only 1 image and audio files, use the single image as thumbnail
  if (allImages.length === 1 && hasAudio) {
    return allImages[0];
  }
  
  // No thumbnail found
  return null;
};

const Visual = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const { isRandomized } = useProjectSort();
  const { showCommercial } = useCommercial();
  const { setIsProjectOpen, setCloseHandler } = useProjectDetail();
  const [shuffleCount, setShuffleCount] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  // Increment shuffle count whenever isRandomized changes
  useEffect(() => {
    setShuffleCount(prev => prev + 1);
    resetVideoLoadQueue(); // Reset the queue when shuffling
  }, [isRandomized]);

  // Ref for the detail view scroll container
  const detailScrollRef = useRef<HTMLDivElement>(null);

  // Update project detail context when selectedProject changes
  useEffect(() => {
    setIsProjectOpen(selectedProject !== null);
    setCloseHandler(selectedProject !== null ? () => setSelectedProject(null) : null);
  }, [selectedProject, setIsProjectOpen, setCloseHandler]);

  // Reset detail view scroll position when opening project
  useEffect(() => {
    if (selectedProject !== null && detailScrollRef.current) {
      detailScrollRef.current.scrollTop = 0;
    }
  }, [selectedProject]);

  // Store random media for each project, re-randomize when isRandomized changes
  const visualProjects = useMemo(() => {
    const filtered = projects.filter((p) => {
      // Show visual projects and commercial projects if in commercial mode
      if (showCommercial) {
        return p.categories.includes('visual') || p.categories.includes('commercial');
      }
      // Normal mode: only show visual, exclude commercial
      return p.categories.includes('visual') && !p.categories.includes('commercial');
    });

    if (isRandomized) {
      const shuffled = [...filtered];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled.map(project => ({
        ...project,
        thumbnailMedia: getThumbnailMedia(project)
      }));
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(project => ({
      ...project,
      thumbnailMedia: getThumbnailMedia(project)
    }));
  }, [isRandomized, showCommercial]);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isScrollable = scrollHeight > clientHeight + 1;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
        setShowScrollIndicator(isScrollable && !isAtBottom);
      }
    };

    const initialCheck = setTimeout(checkScroll, 100);
    const scrollElement = scrollContainerRef.current;

    if (scrollElement) {
      checkScroll();
      scrollElement.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);

      const intervalId = setInterval(checkScroll, 500);
      const timeoutId = setTimeout(() => clearInterval(intervalId), 3000);

      return () => {
        clearTimeout(initialCheck);
        scrollElement.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      };
    }

    return () => {
      clearTimeout(initialCheck);
    };
  }, [visualProjects, selectedProject]);

  // Handle wheel events for scroll container with pointer-events: none
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!selectedProject && scrollContainerRef.current) {
        e.preventDefault();
        scrollContainerRef.current.scrollTop += e.deltaY;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [selectedProject]);

  // Filter out thumbnail files from detail view, BUT keep single images
  const getDetailMedia = (project: Project) => {
    const allImages = project.media.filter(m => m.type === 'image');
    const hasAudio = project.media.some(m => m.type === 'audio');
    const isSingleImageWithAudio = allImages.length === 1 && hasAudio;

    return project.media.filter(mediaItem => {
      const isThumbnail = mediaItem.url.toLowerCase().includes('_thumbnail.');
      if (isThumbnail) return false;
      if (isSingleImageWithAudio && mediaItem.type === 'image') return true;
      return true;
    });
  };

  return (
    <>
      {/* Top container: transparent spacer for menubar area */}
      <div style={{ height: '64px' }} />

      {selectedProject ? (
        /* Project Detail View - Full Page */
        <div
          ref={detailScrollRef}
          className="fixed"
          style={{
            top: '64px',
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'auto',
            zIndex: 6,
          }}
          onClick={() => setSelectedProject(null)}
        >
          <div className="relative pointer-events-auto">
              <div className="container mx-auto px-4 py-4">
                <div className="flex flex-col max-w-[95vw] mx-auto relative px-6">
                  {/* Content */}
                  <div
                    className="overflow-y-auto flex-1 min-h-0 relative scrollbar-hide flex justify-center"
                    ref={scrollContainerRef}
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-block max-w-full">
                      <div className="space-y-3">
                        {getDetailMedia(selectedProject).map((mediaItem, index) => (
                          <div key={index}>
                            <MediaRenderer media={mediaItem} isFirstVideo={index === 0 && mediaItem.type === 'video'} />
                          </div>
                        ))}

                        {/* Title */}
                        <div className="text-left flex-shrink-0 mt-4">
                          <h2 className="text-xl font-normal text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                            {selectedProject.title}
                          </h2>
                        </div>

                        {selectedProject.description && (
                          <div className="prose prose-sm max-w-none mt-4">
                            <p className="text-foreground leading-relaxed text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                              {selectedProject.description}
                            </p>
                          </div>
                        )}

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mt-4">
                          {selectedProject.tags.map((tag, index) => (
                            <span key={tag} className="text-sm font-light text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                              {index > 0 && " / "}
                              {tag.toLowerCase()}
                            </span>
                          ))}
                        </div>

                        {/* Year */}
                        <div className="flex flex-wrap gap-1 mt-4">
                          <span className="text-sm font-light text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                            {new Date(selectedProject.date).getFullYear()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scroll indicator */}
                  {showScrollIndicator && (
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none z-[100]">
                      <div className="animate-bounce">
                        <ChevronDown className="w-6 h-6 text-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
          </div>
        </div>
      ) : (
        /* Grid content container with fixed viewport clip */
        <div
          ref={scrollContainerRef}
          className="fixed"
          style={{
            top: '64px',
            left: 0,
            right: 0,
            bottom: 0,
            overflowY: 'scroll',
            zIndex: 6,
            pointerEvents: 'none',
          }}
        >
          <div
            className="relative pointer-events-none"
            style={{
              marginTop: '-64px',
              paddingTop: '64px',
              minHeight: 'calc(100vh + 64px)',
            }}
          >
            <div className="relative min-h-screen">
              <div className="relative container mx-auto px-4 pt-4 pb-12 pointer-events-none">
                {/* Scroll indicator for grid */}
                {showScrollIndicator && !selectedProject && (
                  <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none z-[100]">
                    <div className="animate-bounce">
                      <ChevronDown className="w-6 h-6 text-foreground drop-shadow-lg" />
                    </div>
                  </div>
                )}
                <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 rounded-xl">
                  {visualProjects.map((project) => {
                    const key = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${project.date}-${shuffleCount}`;
                    const isHovered = hoveredCard === key;

                    return (
                      <div
                        key={key}
                        onClick={() => setSelectedProject(project)}
                        onMouseEnter={() => setHoveredCard(key)}
                        onMouseLeave={() => setHoveredCard(null)}
                        className="group relative overflow-hidden cursor-pointer mb-4 break-inside-avoid transition-transform duration-200 pointer-events-auto"
                        style={{
                          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                          contain: 'layout style paint',
                          willChange: isHovered ? 'transform' : 'auto',
                        }}
                      >
                        {project.thumbnailMedia ? (
                          project.thumbnailMedia.type === 'video' ? (
                            <VideoThumbnail
                              key={project.thumbnailMedia.url}
                              src={project.thumbnailMedia.url}
                              alt={project.title}
                              className="block w-full h-auto object-cover"
                              projectVideos={project.media
                                .filter(m => m.type === 'video' && (m.url.startsWith('http://') || m.url.startsWith('https://')))
                                .map(m => m.url)
                              }
                            />
                          ) : (
                            <VideoThumbnail
                              key={project.thumbnailMedia.url}
                              src={project.thumbnailMedia.url}
                              alt={project.title}
                              className="block w-full h-auto"
                              projectVideos={[]}
                            />
                          )
                        ) : (
                          <div className="w-full aspect-square bg-background flex items-center justify-center">
                            <X className="w-16 h-16 text-red-500" strokeWidth={3} />
                          </div>
                        )}

                        {/* Overlay: absolute so it doesn't affect layout; title always visible, tags on hover */}
                        <div className="absolute inset-0 flex items-end justify-center pointer-events-none pb-1">
                          {isHovered && (
                            <div className="bg-background px-1.5 py-1">
                              <GridCardTitle
                                text={project.title}
                                isHovered={isHovered}
                                className="text-sm font-sans font-normal text-foreground text-center leading-tight"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Visual;
