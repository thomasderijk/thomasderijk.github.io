import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projects } from '@/data/projects';
import { HoverableTrackTitle } from '@/components/HoverableTrackTitle';
import { useProjectDetail } from '@/contexts/ProjectDetailContext';

type ColorOption = 'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light';

const List = () => {
  const navigate = useNavigate();
  const { openProjectHandler } = useProjectDetail();
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

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

  const handleProjectClick = (projectTitle: string) => {
    // Navigate to work page
    navigate('/work');
    // Wait for Work component to mount and register the handler
    setTimeout(() => {
      if (openProjectHandler) {
        openProjectHandler(projectTitle);
      }
    }, 100);
  };

  return (
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
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 300,
                        }}
                      >
                        {tag}
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
  );
};

export default List;
