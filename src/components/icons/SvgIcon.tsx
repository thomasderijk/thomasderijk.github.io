// SVG icon component that embeds UTF-8 characters as text in SVG
// This prevents iOS from rendering them as colorful emojis
// Uses the same approach as the favicon SVGs

interface SvgIconProps {
  char: string;
  size?: number;
  color?: string;
  className?: string;
}

export const SvgIcon = ({ char, size = 20, color = 'currentColor', className }: SvgIconProps) => {
  // Calculate font size - slightly larger than viewBox to match UTF-8 character appearance
  const fontSize = size * 1.5;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
    >
      <text
        x={size / 2}
        y={size / 2}
        fontFamily="Arial, sans-serif"
        fontSize={fontSize}
        fill={color}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {char}
      </text>
    </svg>
  );
};

// Helper function to create icon array with SVG wrappers
export const createIconArray = (chars: string[]) => {
  return chars.map(char => (props: Omit<SvgIconProps, 'char'>) => (
    <SvgIcon char={char} {...props} />
  ));
};
