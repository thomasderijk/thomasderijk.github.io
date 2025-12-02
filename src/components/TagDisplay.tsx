import { useState, useEffect } from 'react';
import { tagIcons } from '@/config/tagIcons';

interface TagDisplayProps {
  tags: string[];
  isHovered: boolean;
}

type ColorOption = 'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light';

export const TagDisplay = ({ tags, isHovered }: TagDisplayProps) => {
  // Generate random colors ensuring adjacent tags have different colors
  const generateColors = (): ColorOption[] => {
    const options: ColorOption[] = ['white-on-black', 'black-on-white', 'white-on-dark', 'black-on-light'];
    const colors: ColorOption[] = [];

    for (let i = 0; i < tags.length; i++) {
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

  const [tagColors, setTagColors] = useState<ColorOption[]>(() => generateColors());

  // Regenerate colors when hover state changes to true
  useEffect(() => {
    if (isHovered) {
      setTagColors(generateColors());
    }
  }, [isHovered]);

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

  if (!isHovered || tags.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute top-0 right-0 flex gap-0 pointer-events-none z-10"
      style={{ lineHeight: 1 }}
    >
      {tags.map((tag, index) => {
        const icon = tagIcons[tag] || '◆';
        const colors = getColors(tagColors[index]);

        return (
          <div
            key={index}
            style={{
              backgroundColor: colors.bgColor,
              color: colors.textColor,
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              lineHeight: 1,
            }}
          >
            {icon}
          </div>
        );
      })}
    </div>
  );
};
