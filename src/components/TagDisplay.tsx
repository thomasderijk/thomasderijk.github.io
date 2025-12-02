import { useState } from 'react';
import { tagIcons } from '@/config/tagIcons';

interface TagDisplayProps {
  tags: string[];
  isHovered: boolean;
}

type ColorOption = 'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light';

export const TagDisplay = ({ tags, isHovered }: TagDisplayProps) => {
  // Generate random color for each tag (cached per component instance)
  const [tagColors] = useState<ColorOption[]>(() => {
    const options: ColorOption[] = ['white-on-black', 'black-on-white', 'white-on-dark', 'black-on-light'];
    return tags.map(() => options[Math.floor(Math.random() * options.length)]);
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
