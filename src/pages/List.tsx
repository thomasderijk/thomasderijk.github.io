import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { projects } from '@/data/projects';
import { Project, MediaItem } from '@/types/project';
import { HoverableTrackTitle } from '@/components/HoverableTrackTitle';
import { useProjectDetail } from '@/contexts/ProjectDetailContext';
import { tagIcons } from '@/config/tagIcons';
import { MediaRenderer } from '@/components/MediaRenderer';
import { AudioPlaylistMinimal } from '@/components/AudioPlaylistMinimal';

type ColorOption = 'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light';

const TOP_PADDING = 56;
const SIDE_PADDING = 28;

// Helper to generate random colors for metadata
const generateMetadataColors = () => {
  const options: ColorOption[] = ['white-on-black', 'black-on-white', 'white-on-dark', 'black-on-light'];
  const selectedColors: ColorOption[] = [];

  // Title (index 0) - random choice
  selectedColors[0] = options[Math.floor(Math.random() * options.length)];

  // Description (index 1) - must differ from title (index 0)
  let availableForDescription = options.filter(opt => opt !== selectedColors[0]);
  selectedColors[1] = availableForDescription[Math.floor(Math.random() * availableForDescription.length)];

  // Tags (index 2) - must differ from description (index 1)
  let availableForTags = options.filter(opt => opt !== selectedColors[1]);
  selectedColors[2] = availableForTags[Math.floor(Math.random() * availableForTags.length)];

  // Year (index 3) - must differ from tags (index 2)
  let availableForYear = options.filter(opt => opt !== selectedColors[2]);
  selectedColors[3] = availableForYear[Math.floor(Math.random() * availableForYear.length)];

  return selectedColors;
};

// Helper to get colors from variant
const getColorsFromVariant = (variant: ColorOption) => {
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

const ProjectMetadata = ({ project }: { project: Project }) => {
  const [colors] = useState<ColorOption[]>(() => generateMetadataColors());

  const titleColors = getColorsFromVariant(colors[0]);
  const descriptionColors = getColorsFromVariant(colors[1]);
  const tagsColors = getColorsFromVariant(colors[2]);
  const yearColors = getColorsFromVariant(colors[3]);

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

      {/* Tags and Year */}
      <div style={{ display: 'flex', gap: 0 }}>
        <span style={{
          backgroundColor: tagsColors.bgColor,
          color: tagsColors.textColor,
          padding: '2px 4px',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          fontSize: '16px',
          lineHeight: 1.5,
        }}>
          {project.tags.join(', ')}
        </span>
        <span style={{
          backgroundColor: yearColors.bgColor,
          color: yearColors.textColor,
          padding: '2px 4px',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          fontSize: '16px',
          lineHeight: 1.5,
        }}>
          {project.date}
        </span>
      </div>
    </div>
  );
};

const ProjectMetadataSplit = ({ project, showTitle }: { project: Project; showTitle: boolean }) => {
  const [colors] = useState<ColorOption[]>(() => generateMetadataColors());

  const titleColors = getColorsFromVariant(colors[0]);
  const descriptionColors = getColorsFromVariant(colors[1]);
  const tagsColors = getColorsFromVariant(colors[2]);
  const yearColors = getColorsFromVariant(colors[3]);

  const spanStyle = {
    padding: '2px 4px',
    display: 'inline-block' as const,
    fontFamily: "'Inter', sans-serif",
    fontWeight: 300,
    fontSize: '16px',
    lineHeight: 1.5,
  };

  if (showTitle) {
    return (
      <div style={{ fontSize: 0, lineHeight: 0 }}>
        <div>
          <span style={{ ...spanStyle, backgroundColor: titleColors.bgColor, color: titleColors.textColor }}>
            {project.title}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontSize: 0, lineHeight: 0 }}>
      {project.description && (
        <div>
          <span style={{ ...spanStyle, backgroundColor: descriptionColors.bgColor, color: descriptionColors.textColor }}>
            {project.description}
          </span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 0 }}>
        <span style={{ ...spanStyle, backgroundColor: tagsColors.bgColor, color: tagsColors.textColor }}>
          {project.tags.join(', ')}
        </span>
        <span style={{ ...spanStyle, backgroundColor: yearColors.bgColor, color: yearColors.textColor }}>
          {project.date}
        </span>
      </div>
    </div>
  );
};

const List = () => {
  const navigate = useNavigate();
  const { setIsProjectOpen, setCloseHandler, setOpenProjectHandler } = useProjectDetail();
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Filter out commercial projects
  const filteredProjects = projects.filter(project => !project.categories.includes('commercial'));

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
              {/* Project Title with Hoverable Effect */}
              <HoverableTrackTitle
                title={project.title}
                backgroundColor={titleColors.bg}
                textColor={titleColors.text}
                height={28}
                onClick={() => handleProjectClick(project.title)}
              />

              {/* Spacer to push tags and year to the right */}
              <div style={{ flex: 1 }} />

              {/* Tags */}
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
                        }}
                      >
                        {tag}
                        <span>{icon}</span>
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
                }}
              >
                {project.date}
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
