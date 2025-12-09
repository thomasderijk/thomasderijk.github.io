import { useState } from 'react';
import { Project } from '@/types/project';
import { tagIcons } from '@/config/tagIcons';
import { SvgIcon } from '@/components/icons/SvgIcon';

type ColorOption = 'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light';

// Helper to generate random colors for metadata
export const generateMetadataColors = () => {
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
export const getColorsFromVariant = (variant: ColorOption) => {
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

// Component for full metadata (title, description, tags, year) - used in detail view
export const ProjectMetadata = ({ project }: { project: Project }) => {
  // Generate colors for each tag ensuring adjacent colors are different
  const generateTagColors = (): ColorOption[] => {
    const options: ColorOption[] = ['white-on-black', 'black-on-white', 'white-on-dark', 'black-on-light'];
    const colors: ColorOption[] = [];

    for (let i = 0; i < project.tags.length; i++) {
      let availableOptions = options;
      if (i > 0) {
        // Filter out the previous color
        availableOptions = options.filter(opt => opt !== colors[i - 1]);
      }
      const randomIndex = Math.floor(Math.random() * availableOptions.length);
      colors.push(availableOptions[randomIndex]);
    }

    return colors;
  };

  // Generate random colors ensuring adjacent colors are different
  const [colors] = useState<ColorOption[]>(() => generateMetadataColors());
  const [tagColors] = useState<ColorOption[]>(() => generateTagColors());

  const titleColors = getColorsFromVariant(colors[0]);
  const descriptionColors = getColorsFromVariant(colors[1]);
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

      {/* Tags - each with its own color */}
      <div>
        {project.tags.map((tag, index) => {
          const tagColor = getColorsFromVariant(tagColors[index]);
          const icon = tagIcons[tag] || '◆';

          return (
            <span key={tag} style={{
              backgroundColor: tagColor.bgColor,
              color: tagColor.textColor,
              padding: '2px 4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: '16px',
              lineHeight: 1.5,
            }}>
              {tag.toLowerCase()} <SvgIcon char={icon} size={16} color={tagColor.textColor} />
            </span>
          );
        })}
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

// Component for split metadata (title separate, rest together) - used in side-by-side audio layout
export const ProjectMetadataSplit = ({ project, showTitle }: { project: Project; showTitle: boolean }) => {
  // Generate colors for each tag ensuring adjacent colors are different
  const generateTagColors = (): ColorOption[] => {
    const options: ColorOption[] = ['white-on-black', 'black-on-white', 'white-on-dark', 'black-on-light'];
    const colors: ColorOption[] = [];

    for (let i = 0; i < project.tags.length; i++) {
      let availableOptions = options;
      if (i > 0) {
        // Filter out the previous color
        availableOptions = options.filter(opt => opt !== colors[i - 1]);
      }
      const randomIndex = Math.floor(Math.random() * availableOptions.length);
      colors.push(availableOptions[randomIndex]);
    }

    return colors;
  };

  // Generate colors once and store them
  const [colors] = useState<ColorOption[]>(() => generateMetadataColors());
  const [tagColors] = useState<ColorOption[]>(() => generateTagColors());

  const titleColors = getColorsFromVariant(colors[0]);
  const descriptionColors = getColorsFromVariant(colors[1]);
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
    // Just the title
    return (
      <div style={{ fontSize: 0, lineHeight: 0 }}>
        <span style={{
          ...spanStyle,
          backgroundColor: titleColors.bgColor,
          color: titleColors.textColor,
        }}>
          {project.title}
        </span>
      </div>
    );
  }

  // Description, tags, and year
  return (
    <div style={{ fontSize: 0, lineHeight: 0 }}>
      {project.description && (
        <div>
          <span style={{
            ...spanStyle,
            backgroundColor: descriptionColors.bgColor,
            color: descriptionColors.textColor,
          }}>
            {project.description}
          </span>
        </div>
      )}
      <div>
        {project.tags.map((tag, index) => {
          const tagColor = getColorsFromVariant(tagColors[index]);
          const icon = tagIcons[tag] || '◆';

          return (
            <span key={tag} style={{
              ...spanStyle,
              backgroundColor: tagColor.bgColor,
              color: tagColor.textColor,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              {tag.toLowerCase()} <SvgIcon char={icon} size={16} color={tagColor.textColor} />
            </span>
          );
        })}
      </div>
      <div>
        <span style={{
          ...spanStyle,
          backgroundColor: yearColors.bgColor,
          color: yearColors.textColor,
        }}>
          {new Date(project.date).getFullYear()}
        </span>
      </div>
    </div>
  );
};
