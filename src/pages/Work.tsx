import { useState, useMemo, useEffect, useRef } from 'react';
import { projects } from '@/data/projects';
import { GridCardTitle } from '@/components/GridCardTitle';
import { VideoThumbnail } from '@/components/VideoThumbnail';
import { MediaRenderer } from '@/components/MediaRenderer';
import { Project, MediaItem } from '@/types/project';
import { useProjectSort } from '@/hooks/use-project-sort';
import { useCommercial } from '@/contexts/CommercialContext';
import { useProjectDetail } from '@/contexts/ProjectDetailContext';
import { AudioPlaylistMinimal } from '@/components/AudioPlaylistMinimal';

// Simple helper to get a random thumbnail from project
const getThumbnailMedia = (project: Project): MediaItem | null => {
  const thumbnailVideos = project.media.filter(m =>
    m.type === 'video' && m.url.toLowerCase().includes('_thumbnail.')
  );
  const thumbnailImages = project.media.filter(m =>
    m.type === 'image' && m.url.toLowerCase().includes('_thumbnail.')
  );
  const allImages = project.media.filter(m => m.type === 'image');
  const hasAudio = project.media.some(m => m.type === 'audio');

  if (thumbnailVideos.length > 0) {
    const randomIndex = Math.floor(Math.random() * thumbnailVideos.length);
    return thumbnailVideos[randomIndex];
  }
  if (thumbnailImages.length > 0) {
    const randomIndex = Math.floor(Math.random() * thumbnailImages.length);
    return thumbnailImages[randomIndex];
  }
  if (allImages.length === 1 && hasAudio) {
    return allImages[0];
  }
  return null;
};

interface WorkProps {
  categoryFilter?: 'audio' | 'visual' | null;
}

const Work = ({ categoryFilter = null }: WorkProps) => {
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
  const audioProjects = useMemo(() => {
    const filtered = projects.filter((p) => {
      // Apply category filter if specified
      if (categoryFilter) {
        if (showCommercial) {
          return p.categories.includes(categoryFilter) || p.categories.includes('commercial');
        }
        return p.categories.includes(categoryFilter) && !p.categories.includes('commercial');
      }

      // No filter: show all audio and visual projects, plus commercial if in commercial mode
      if (showCommercial) {
        return p.categories.includes('audio') || p.categories.includes('visual') || p.categories.includes('commercial');
      }
      // Normal mode: show audio and visual, exclude commercial
      return (p.categories.includes('audio') || p.categories.includes('visual')) && !p.categories.includes('commercial');
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
  }, [isRandomized, showCommercial, categoryFilter]);

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
  }, [audioProjects, selectedProject]);


  // Filter out thumbnail files from detail view, BUT keep single images
  const getDetailMedia = (project: Project) => {
    const allImages = project.media.filter(m => m.type === 'image');
    const hasAudio = project.media.some(m => m.type === 'audio');
    const isSingleImageWithAudio = allImages.length === 1 && hasAudio;

    const filtered = project.media.filter(mediaItem => {
      const isThumbnail = mediaItem.url.toLowerCase().includes('_thumbnail.');
      if (isThumbnail) return false;
      if (isSingleImageWithAudio && mediaItem.type === 'image') return true;
      return true;
    });

    // Separate audio from non-audio media
    const audioMedia = filtered.filter(m => m.type === 'audio');
    const nonAudioMedia = filtered.filter(m => m.type !== 'audio');

    return { audioMedia, nonAudioMedia, hasMultipleAudio: audioMedia.length > 1 };
  };

  return (
    <>
      {/* Top container: transparent spacer for menubar area */}
      <div className="h-8 sm:h-10 md:h-12 lg:h-16" />

      {selectedProject ? (
        /* Project Detail View - Full Page */
        <div
          ref={detailScrollRef}
          className="fixed top-8 sm:top-10 md:top-12 lg:top-16 left-0 right-0 bottom-0 overflow-auto z-[6] pointer-events-none-desktop"
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
                    <div className={`inline-block max-w-full ${selectedProject.layout === 'sidebyside' ? 'md:min-w-[900px] lg:min-w-[1100px] xl:min-w-[1300px]' : ''}`}>
                      <div className="space-y-3">
                        {(() => {
                          const { audioMedia, nonAudioMedia, hasMultipleAudio } = getDetailMedia(selectedProject);
                          const audioUrls = audioMedia.map(m => m.url);
                          const useSideBySide = selectedProject.layout === 'sidebyside' && nonAudioMedia.length > 0;

                          return (
                            <>
                              {useSideBySide ? (
                                /* Side-by-side layout */
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:items-start">
                                  {/* First visual media */}
                                  <div className="w-full">
                                    <MediaRenderer media={nonAudioMedia[0]} isFirstVideo={nonAudioMedia[0].type === 'video'} allowSimultaneousPlayback={selectedProject.allowSimultaneousPlayback} />
                                  </div>
                                  {/* Rest of content: remaining visuals + audio + metadata */}
                                  <div className="w-full flex flex-col justify-between min-h-full">
                                    {/* Top section: remaining visuals and title */}
                                    <div className={nonAudioMedia.length > 1 ? 'space-y-3' : ''}>
                                      {/* Remaining visual media */}
                                      {nonAudioMedia.slice(1).map((mediaItem, index) => (
                                        <div key={`visual-${index}`}>
                                          <MediaRenderer media={mediaItem} isFirstVideo={false} allowSimultaneousPlayback={selectedProject.allowSimultaneousPlayback} />
                                        </div>
                                      ))}
                                      {/* Title */}
                                      <div className="text-left flex-shrink-0">
                                        <h2 className="text-xl font-normal text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                                          {selectedProject.title}
                                        </h2>
                                      </div>
                                    </div>
                                    {/* Middle section: audio and description */}
                                    <div className="space-y-3 mt-3 flex-1">
                                      {/* Audio */}
                                      {hasMultipleAudio ? (
                                        <AudioPlaylistMinimal urls={audioUrls} allowSimultaneousPlayback={selectedProject.allowSimultaneousPlayback} />
                                      ) : (
                                        audioMedia.map((mediaItem, index) => (
                                          <div key={`audio-${index}`}>
                                            <MediaRenderer media={mediaItem} allowSimultaneousPlayback={selectedProject.allowSimultaneousPlayback} />
                                          </div>
                                        ))
                                      )}
                                      {/* Description */}
                                      {selectedProject.description && (
                                        <p className="text-foreground leading-relaxed text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                                          {selectedProject.description}
                                        </p>
                                      )}
                                    </div>
                                    {/* Bottom section: tags and year - aligned to bottom */}
                                    <div className="space-y-2 mt-4">
                                      {/* Tags */}
                                      <div className="flex flex-wrap gap-1">
                                        {selectedProject.tags.map((tag, index) => (
                                          <span key={tag} className="text-sm font-light text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                                            {index > 0 && " / "}
                                            {tag.toLowerCase()}
                                          </span>
                                        ))}
                                      </div>
                                      {/* Year */}
                                      <span className="text-sm font-light text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                                        {new Date(selectedProject.date).getFullYear()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {/* Default layout: Non-audio media first */}
                                  {nonAudioMedia.map((mediaItem, index) => (
                                    <div key={index}>
                                      <MediaRenderer media={mediaItem} isFirstVideo={index === 0 && mediaItem.type === 'video'} allowSimultaneousPlayback={selectedProject.allowSimultaneousPlayback} />
                                    </div>
                                  ))}

                                  {/* Audio playlist with title above */}
                                  {hasMultipleAudio ? (
                                    <>
                                      {/* Title before playlist */}
                                      <div className="text-left flex-shrink-0 mt-4 mb-6">
                                        <h2 className="text-xl font-normal text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                                          {selectedProject.title}
                                        </h2>
                                      </div>
                                      <AudioPlaylistMinimal urls={audioUrls} allowSimultaneousPlayback={selectedProject.allowSimultaneousPlayback} />
                                    </>
                                  ) : (
                                    audioMedia.map((mediaItem, index) => (
                                      <div key={`audio-${index}`}>
                                        <MediaRenderer media={mediaItem} allowSimultaneousPlayback={selectedProject.allowSimultaneousPlayback} />
                                      </div>
                                    ))
                                  )}
                                </>
                              )}
                            </>
                          );
                        })()}

                        {/* Title (only shown when not using playlist AND not sidebyside) */}
                        {!getDetailMedia(selectedProject).hasMultipleAudio && selectedProject.layout !== 'sidebyside' && (
                          <div className="text-left flex-shrink-0 mt-4">
                            <h2 className="text-xl font-normal text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                              {selectedProject.title}
                            </h2>
                          </div>
                        )}

                        {/* Description, Tags, Year - only show here for non-sidebyside layouts */}
                        {selectedProject.layout !== 'sidebyside' && (
                          <>
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
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scroll indicator */}
                  {showScrollIndicator && (
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none z-[100]">
                      <div className="animate-bounce">
                        <span className="text-2xl text-foreground">⌄</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
          </div>
        </div>
      ) : (
        /* Grid content container - no cutoff */
        <div
          ref={scrollContainerRef}
          className="relative z-[6] pointer-events-none-desktop"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="relative">
            <div className="relative">
              <div className="relative container mx-auto px-2 sm:px-3 md:px-4 pt-2 sm:pt-3 md:pt-4 pb-12">
                {/* Scroll indicator for grid */}
                {showScrollIndicator && !selectedProject && (
                  <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none z-[100]">
                    <div className="animate-bounce">
                      <span className="text-2xl text-foreground">⌄</span>
                    </div>
                  </div>
                )}
                <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-3 gap-4 rounded-xl pointer-events-auto">
                  {audioProjects.map((project) => {
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
                          <VideoThumbnail
                            key={project.thumbnailMedia.url}
                            src={project.thumbnailMedia.url}
                            alt={project.title}
                            className="block w-full h-auto object-cover"
                          />
                        ) : (
                          <div className="w-full aspect-square bg-background flex items-center justify-center">
                            <span className="text-6xl text-red-500">✕</span>
                          </div>
                        )}

                        <div className="absolute inset-0 flex items-end justify-center pointer-events-none pb-1">
                          {isHovered && (
                            <GridCardTitle
                              text={project.title}
                              isHovered={isHovered}
                              className="text-sm font-sans font-normal text-foreground text-center leading-tight"
                            />
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

export default Work;
