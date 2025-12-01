import { useState, useMemo, useEffect, useRef } from 'react';
import { projects } from '@/data/projects';
import { GridCardTitle } from '@/components/GridCardTitle';
import { SegmentedBorder } from '@/components/SegmentedBorder';
import { VideoThumbnail } from '@/components/VideoThumbnail';
import { MediaRenderer } from '@/components/MediaRenderer';
import { Project, MediaItem } from '@/types/project';
import { useProjectSort } from '@/hooks/use-project-sort';
import { useCommercial } from '@/contexts/CommercialContext';
import { useProjectDetail } from '@/contexts/ProjectDetailContext';
import { AudioPlaylistMinimal } from '@/components/AudioPlaylistMinimal';

// Helper component for project metadata with colored backgrounds
type ColorOption = 'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light';

const ProjectMetadata = ({ project }: { project: Project }) => {
  // Generate 4 random colors ensuring adjacent colors are different
  const [colors] = useState<ColorOption[]>(() => {
    const options: ColorOption[] = ['white-on-black', 'black-on-white', 'white-on-dark', 'black-on-light'];
    const colors: ColorOption[] = [];

    // First color - random choice
    colors[0] = options[Math.floor(Math.random() * options.length)];

    // Description - must differ from title
    const availableForDescription = options.filter(opt => opt !== colors[0]);
    colors[1] = availableForDescription[Math.floor(Math.random() * availableForDescription.length)];

    // Tags - must differ from description
    const availableForTags = options.filter(opt => opt !== colors[1]);
    colors[2] = availableForTags[Math.floor(Math.random() * availableForTags.length)];

    // Year - must differ from tags
    const availableForYear = options.filter(opt => opt !== colors[2]);
    colors[3] = availableForYear[Math.floor(Math.random() * availableForYear.length)];

    return colors;
  });

  const getColors = (variant: ColorOption) => {
    const bgColor =
      variant === 'white-on-black' ? 'hsl(0, 0%, 10%)' :
      variant === 'black-on-white' ? 'hsl(0, 0%, 90%)' :
      variant === 'white-on-dark' ? 'hsl(0, 0%, 20%)' :
      'hsl(0, 0%, 80%)';
    const textColor =
      variant === 'white-on-black' || variant === 'white-on-dark'
        ? 'hsl(0, 0%, 100%)'
        : 'hsl(0, 0%, 0%)';
    return { bgColor, textColor };
  };

  const titleColors = getColors(colors[0]);
  const descriptionColors = getColors(colors[1]);
  const tagsColors = getColors(colors[2]);
  const yearColors = getColors(colors[3]);

  return (
    <div style={{ fontSize: 0, lineHeight: 0 }}>
      {/* Title */}
      <div>
        <span style={{
          backgroundColor: titleColors.bgColor,
          color: titleColors.textColor,
          padding: '2px 4px',
          display: 'inline-block',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          fontSize: '16px',
          lineHeight: 1.5,
        }}>
          {project.title}
        </span>
      </div>

      {/* Description */}
      {project.description && (
        <div>
          <span style={{
            backgroundColor: descriptionColors.bgColor,
            color: descriptionColors.textColor,
            padding: '2px 4px',
            display: 'inline-block',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: '16px',
            lineHeight: 1.5,
          }}>
            {project.description}
          </span>
        </div>
      )}

      {/* Tags */}
      <div>
        <span style={{
          backgroundColor: tagsColors.bgColor,
          color: tagsColors.textColor,
          padding: '2px 4px',
          display: 'inline-block',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          fontSize: '16px',
          lineHeight: 1.5,
        }}>
          {project.tags.map((tag, index) => (
            <span key={tag}>
              {index > 0 && " / "}
              {tag.toLowerCase()}
            </span>
          ))}
        </span>
      </div>

      {/* Year */}
      <div>
        <span style={{
          backgroundColor: yearColors.bgColor,
          color: yearColors.textColor,
          padding: '2px 4px',
          display: 'inline-block',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          fontSize: '16px',
          lineHeight: 1.5,
        }}>
          {new Date(project.date).getFullYear()}
        </span>
      </div>
    </div>
  );
};

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
                      <div>
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
                                    </div>
                                    {/* Middle section: audio */}
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
                                    </div>
                                    {/* Bottom section: metadata */}
                                    <div>
                                      <ProjectMetadata project={selectedProject} />
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
              <div className="relative px-4 pb-12" style={{ paddingTop: '20px' }}>
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
                        className="group relative overflow-visible cursor-pointer mb-4 break-inside-avoid pointer-events-auto"
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

                        <SegmentedBorder isHovered={isHovered} />

                        <div className="absolute inset-0 flex items-end justify-start pointer-events-none">
                          {isHovered && (
                            <GridCardTitle
                              text={project.title}
                              isHovered={isHovered}
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
