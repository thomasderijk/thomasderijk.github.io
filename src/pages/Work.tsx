import { useState, useMemo, useEffect, useRef } from 'react';
import { projects } from '@/data/projects';
import { GridCardTitle } from '@/components/GridCardTitle';
import { SegmentedBorder } from '@/components/SegmentedBorder';
import { VideoThumbnail } from '@/components/VideoThumbnail';
import { MediaRenderer } from '@/components/MediaRenderer';
import { TagDisplay } from '@/components/TagDisplay';
import { ProjectMetadata, ProjectMetadataSplit } from '@/components/ProjectMetadata';
import { Project, MediaItem } from '@/types/project';
import { useProjectSort } from '@/hooks/use-project-sort';
import { useCommercial } from '@/contexts/CommercialContext';
import { useProjectDetail } from '@/contexts/ProjectDetailContext';
import { AudioPlaylistMinimal } from '@/components/AudioPlaylistMinimal';

// Unified padding for both grid and project detail views
const TOP_PADDING = 56;
const SIDE_PADDING = 28;
const GRID_GAP = 28;

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
  const { setIsProjectOpen, setCloseHandler, setOpenProjectHandler } = useProjectDetail();
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

  // Register handler to open project by title
  useEffect(() => {
    const openByTitle = (projectTitle: string) => {
      const project = projects.find(p => p.title === projectTitle);
      if (project) {
        setSelectedProject(project);
      }
    };
    setOpenProjectHandler(openByTitle);
    return () => setOpenProjectHandler(null);
  }, [setOpenProjectHandler]);

  // Listen for custom event to open project (from List page)
  useEffect(() => {
    const handleOpenProject = (event: CustomEvent<string>) => {
      const projectTitle = event.detail;
      const project = projects.find(p => p.title === projectTitle);
      if (project) {
        setSelectedProject(project);
      }
    };
    window.addEventListener('openProject', handleOpenProject as EventListener);
    return () => window.removeEventListener('openProject', handleOpenProject as EventListener);
  }, []);

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
  }, [isRandomized, showCommercial, categoryFilter, shuffleCount]);

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
      {selectedProject ? (
        /* Project Detail View - Full Page */
        <div
          ref={detailScrollRef}
          className="fixed top-0 left-0 right-0 bottom-0 overflow-auto z-[6] pointer-events-none-desktop"
          onClick={() => setSelectedProject(null)}
        >
          <div className="relative pointer-events-auto">
              <div className="container mx-auto" style={{ paddingTop: `${TOP_PADDING}px`, paddingLeft: `${SIDE_PADDING}px`, paddingRight: `${SIDE_PADDING}px`, paddingBottom: `${SIDE_PADDING}px` }}>
                <div className="flex flex-col max-w-[95vw] mx-auto relative">
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
                    <div className="inline-block">
                      <div>
                        {(() => {
                          const { audioMedia, nonAudioMedia, hasMultipleAudio } = getDetailMedia(selectedProject);
                          const audioUrls = audioMedia.map(m => m.url);
                          const useSideBySide = selectedProject.layout === 'sidebyside' && nonAudioMedia.length > 0;

                          return (
                            <>
                              {useSideBySide ? (
                                /* Side-by-side layout */
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-[28px] md:gap-x-[28px] md:gap-y-0 md:items-start">
                                  {/* First visual media */}
                                  <div className="min-w-0">
                                    <MediaRenderer media={nonAudioMedia[0]} isFirstVideo={nonAudioMedia[0].type === 'video'} allowSimultaneousPlayback={selectedProject.allowSimultaneousPlayback} />
                                  </div>
                                  {/* Rest of content: title + audio + remaining metadata */}
                                  <div className="min-w-0 flex flex-col">
                                    {/* Remaining visual media */}
                                    {nonAudioMedia.slice(1).length > 0 && (
                                      <div className="space-y-[28px] mb-[28px]">
                                        {nonAudioMedia.slice(1).map((mediaItem, index) => (
                                          <div key={`visual-${index}`}>
                                            <MediaRenderer media={mediaItem} isFirstVideo={false} allowSimultaneousPlayback={selectedProject.allowSimultaneousPlayback} />
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {/* Title (only when audio is present) */}
                                    {audioMedia.length > 0 && (
                                      <div className="mb-[28px]">
                                        <ProjectMetadataSplit project={selectedProject} showTitle={true} />
                                      </div>
                                    )}
                                    {/* Audio */}
                                    {audioMedia.length > 0 && (
                                      <div className="mb-[28px]">
                                        {hasMultipleAudio ? (
                                          <AudioPlaylistMinimal urls={audioUrls} allowSimultaneousPlayback={selectedProject.allowSimultaneousPlayback} />
                                        ) : (
                                          audioMedia.map((mediaItem, index) => (
                                            <div key={`audio-${index}`}>
                                              <MediaRenderer media={mediaItem} allowSimultaneousPlayback={selectedProject.allowSimultaneousPlayback} />
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    )}
                                    {/* Metadata (full when no audio, description/tags/year when audio) */}
                                    <div>
                                      {audioMedia.length > 0 ? (
                                        /* Only description, tags, year - title already shown above audio */
                                        <ProjectMetadataSplit project={selectedProject} showTitle={false} />
                                      ) : (
                                        /* No audio - show full metadata including title */
                                        <ProjectMetadata project={selectedProject} />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {/* Default layout: Media with spacing */}
                                  <div className="space-y-3">
                                    {/* Non-audio media */}
                                    {nonAudioMedia.map((mediaItem, index) => (
                                      <div key={index}>
                                        <MediaRenderer media={mediaItem} isFirstVideo={index === 0 && mediaItem.type === 'video'} allowSimultaneousPlayback={selectedProject.allowSimultaneousPlayback} />
                                      </div>
                                    ))}

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
                                  </div>

                                  {/* Metadata - directly attached to last media element with no spacing */}
                                  <ProjectMetadata project={selectedProject} />
                                </>
                              )}
                            </>
                          );
                        })()}
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
              <div className="relative" style={{ paddingTop: `${TOP_PADDING}px`, paddingLeft: `${SIDE_PADDING}px`, paddingRight: `${SIDE_PADDING}px`, paddingBottom: `${SIDE_PADDING}px` }}>
                {/* Scroll indicator for grid */}
                {showScrollIndicator && !selectedProject && (
                  <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none z-[100]">
                    <div className="animate-bounce">
                      <span className="text-2xl text-foreground">⌄</span>
                    </div>
                  </div>
                )}
                <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-3 rounded-xl pointer-events-auto" style={{ gap: `${GRID_GAP}px` }}>
                  {audioProjects.map((project, index) => {
                    const key = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${project.date}-${shuffleCount}`;
                    const isHovered = hoveredCard === key;
                    const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                    const shouldShowInfo = isHovered || isMobile;

                    const cappedDelay = Math.min(index * 30, 300);

                    return (
                      <div
                        key={key}
                        onClick={() => setSelectedProject(project)}
                        onMouseEnter={() => setHoveredCard(key)}
                        onMouseLeave={() => setHoveredCard(null)}
                        className="group relative overflow-visible cursor-pointer break-inside-avoid pointer-events-auto"
                        style={{ marginBottom: `${GRID_GAP}px` }}
                      >
                        {project.thumbnailMedia ? (
                          <VideoThumbnail
                            key={project.thumbnailMedia.url}
                            src={project.thumbnailMedia.url}
                            alt={project.title}
                            className="block w-full h-auto object-cover"
                            loadDelay={cappedDelay}
                          />
                        ) : (
                          <div className="w-full aspect-square bg-background flex items-center justify-center">
                            <span className="text-6xl text-red-500">✕</span>
                          </div>
                        )}

                        <SegmentedBorder isHovered={isHovered} />

                        {/* Tags in top-right corner - always show on mobile */}
                        <TagDisplay tags={project.tags} isHovered={shouldShowInfo} />

                        <div className="absolute inset-0 flex items-end justify-start pointer-events-none">
                          {/* Title - always show on mobile */}
                          {shouldShowInfo && (
                            <GridCardTitle
                              text={project.title}
                              isHovered={shouldShowInfo}
                              className="text-sm font-sans font-light text-foreground text-left leading-tight"
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
