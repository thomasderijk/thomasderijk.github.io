import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { projects } from '@/data/projects';
import { Project, MediaItem } from '@/types/project';
import { HoverableTrackTitle } from '@/components/HoverableTrackTitle';
import { useProjectDetail } from '@/contexts/ProjectDetailContext';
import { ProjectMetadata, ProjectMetadataSplit } from '@/components/ProjectMetadata';
import { tagIcons } from '@/config/tagIcons';
import { MediaRenderer } from '@/components/MediaRenderer';
import { AudioPlaylistMinimal } from '@/components/AudioPlaylistMinimal';
import { SvgIcon } from '@/components/icons/SvgIcon';

type ColorOption = 'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light';

const TOP_PADDING = 56;
const SIDE_PADDING = 28;

const List = () => {
  const navigate = useNavigate();
  const { setIsProjectOpen, setCloseHandler, setOpenProjectHandler } = useProjectDetail();
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Detect mobile for icon-only tag display
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && (window.innerWidth < 768)
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getColors = (variant: ColorOption): { bg: string; text: string } => {
    const bgColor =
      variant === 'white-on-black' ? 'hsl(0, 0%, 10%)' :
      variant === 'black-on-white' ? 'hsl(0, 0%, 90%)' :
      variant === 'white-on-dark' ? 'hsl(0, 0%, 20%)' :
      'hsl(0, 0%, 80%)';
    const textColor =
      variant === 'white-on-black' || variant === 'white-on-dark'
        ? 'hsl(0, 0%, 90%)'
        : 'hsl(0, 0%, 10%)';
    return { bg: bgColor, text: textColor };
  };

  // Generate random color for each project title
  const generateTitleColor = (): ColorOption => {
    const options: ColorOption[] = ['white-on-black', 'black-on-white', 'white-on-dark', 'black-on-light'];
    return options[Math.floor(Math.random() * options.length)];
  };

  // Filter out commercial projects and sort by date (newest first)
  const filteredProjects = projects
    .filter(project => !project.categories.includes('commercial'))
    .sort((a, b) => {
      // Sort by date descending (newest first)
      // Dates are in ISO format (YYYY-MM-DD), so string comparison works
      return b.date.localeCompare(a.date);
    });

  const [rowColors] = useState<Map<string, { year: ColorOption; tags: ColorOption[] }>>(() => {
    const colorMap = new Map<string, { year: ColorOption; tags: ColorOption[] }>();
    const options: ColorOption[] = ['white-on-black', 'black-on-white', 'white-on-dark', 'black-on-light'];

    filteredProjects.forEach(project => {
      // Generate tag colors ensuring adjacent tags have different colors
      const tagColors: ColorOption[] = [];
      for (let i = 0; i < project.tags.length; i++) {
        let availableOptions = options;
        if (i > 0) {
          availableOptions = options.filter(opt => opt !== tagColors[i - 1]);
        }
        tagColors.push(availableOptions[Math.floor(Math.random() * availableOptions.length)]);
      }

      colorMap.set(project.title, {
        year: options[Math.floor(Math.random() * options.length)],
        tags: tagColors
      });
    });
    return colorMap;
  });

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

  const handleProjectClick = (projectTitle: string) => {
    const project = projects.find(p => p.title === projectTitle);
    if (project) {
      setSelectedProject(project);
    }
  };

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

    const audioMedia = filtered.filter(m => m.type === 'audio');
    const nonAudioMedia = filtered.filter(m => m.type !== 'audio');

    return { audioMedia, nonAudioMedia, hasMultipleAudio: audioMedia.length > 1 };
  };

  return (
    <>
      {selectedProject ? (
        /* Project Detail View */
        <div
          className="fixed top-0 left-0 right-0 bottom-0 overflow-auto z-[6] pointer-events-none-desktop"
          onClick={() => setSelectedProject(null)}
        >
          <div className="relative pointer-events-auto">
            <div className="container mx-auto" style={{ paddingTop: `${TOP_PADDING}px`, paddingLeft: `${SIDE_PADDING}px`, paddingRight: `${SIDE_PADDING}px`, paddingBottom: `${SIDE_PADDING}px` }}>
              <div className="flex flex-col max-w-[95vw] mx-auto relative">
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
                                {/* Rest of content */}
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
                                  {/* Title */}
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
                                {/* Default layout */}
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
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div
          style={{
            paddingTop: '56px',
            paddingBottom: '80px',
            paddingLeft: '28px',
            paddingRight: '28px',
          }}
        >
          <div
            className="mx-auto list-container"
            style={{
              maxWidth: 'calc(66.67vw - 56px)', // 33% narrower on desktop, accounting for padding
            }}
          >
        <style>
          {`
            @media (max-width: 1024px) {
              .list-container {
                max-width: none !important;
              }
            }
          `}
        </style>
        <div className="space-y-0">
        {filteredProjects.map((project) => {
          const isHovered = hoveredProject === project.title;
          const titleColor = rowColors.get(project.title)?.year || 'white-on-black';
          const titleColors = getColors(titleColor);
          const yearColors = getColors(rowColors.get(project.title)?.year || 'white-on-black');
          const projectColors = rowColors.get(project.title);

          return (
            <div
              key={project.title}
              style={{ position: 'relative' }}
            >
              <div
                className="flex items-center gap-0"
                style={{ height: '28px', fontSize: 0, lineHeight: 0 }}
                onMouseEnter={() => setHoveredProject(project.title)}
                onMouseLeave={() => setHoveredProject(null)}
              >
              {/* Project Title with Hoverable Effect - allows shrinking at intersection point */}
              <div style={{
                minWidth: 0,
                flex: '0 1 auto',
                overflow: 'hidden',
                display: 'flex'
              }}>
                <HoverableTrackTitle
                  title={project.title}
                  backgroundColor={titleColors.bg}
                  textColor={titleColors.text}
                  height={28}
                  onClick={() => handleProjectClick(project.title)}
                />
              </div>

              {/* Spacer to push tags and year to the right - collapses when needed */}
              <div style={{ flex: '1 1 auto', minWidth: 0 }} />

              {/* Tags - icon only on mobile, full text on desktop */}
              {project.tags.length > 0 && projectColors && (
                <>
                  {project.tags.map((tag, index) => {
                    const tagColor = projectColors.tags[index] || 'white-on-black';
                    const tagColors = getColors(tagColor);
                    const icon = tagIcons[tag] || '◆';
                    return (
                      <div
                        key={index}
                        style={{
                          backgroundColor: tagColors.bg,
                          color: tagColors.text,
                          padding: '2px 4px',
                          fontSize: '16px',
                          lineHeight: 1.5,
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 300,
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {!isMobile && tag}
                        <SvgIcon char={icon} size={16} color={tagColors.text} />
                      </div>
                    );
                  })}
                </>
              )}

              {/* Year */}
              <div
                style={{
                  backgroundColor: yearColors.bg,
                  color: yearColors.text,
                  padding: '2px 4px',
                  fontSize: '16px',
                  lineHeight: 1.5,
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {project.date.slice(0, 4)}
              </div>
              </div>

              {/* Hover Preview - DISABLED (archived for potential reactivation) */}
              {/* {isHovered && project.description && (
                <div
                  style={{
                    height: '28px',
                    backgroundColor: 'hsl(0, 0%, 10%)',
                    color: 'hsl(0, 0%, 90%)',
                    padding: '2px 4px',
                    fontSize: '16px',
                    lineHeight: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 300,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {project.description}
                </div>
              )} */}
            </div>
          );
        })}
        </div>
      </div>
    </div>
      )}
    </>
  );
};

export default List;
