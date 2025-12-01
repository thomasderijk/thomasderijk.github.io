import { useMemo } from 'react';

interface SegmentedBorderProps {
  isHovered: boolean;
}

export const SegmentedBorder = ({ isHovered }: SegmentedBorderProps) => {
  // Generate random border color once when component mounts
  const borderColor = useMemo(() => {
    const colorOptions = [
      'hsl(0, 0%, 10%)',  // white-on-black
      'hsl(0, 0%, 90%)',  // black-on-white
      'hsl(0, 0%, 20%)',  // white-on-dark
      'hsl(0, 0%, 80%)'   // black-on-light
    ];

    // Pick random color
    return colorOptions[Math.floor(Math.random() * colorOptions.length)];
  }, []); // Only generate once

  if (!isHovered) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        outline: `4px solid ${borderColor}`,
        outlineOffset: '0px',
        zIndex: 100
      }}
    />
  );
};
