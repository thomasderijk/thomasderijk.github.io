import { useRef, ReactNode } from 'react';

// Centralized icon button styling
const ICON_BUTTON_STYLES = {
  size: 28, // Width and height in pixels
  iconSize: 20, // Icon font size in pixels
  fontSize: 16, // Base font size for alignment
  lineHeight: 1,
  padding: 0,
  display: 'inline-flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
} as const;

interface IconButtonProps {
  icon: ReactNode;
  onClick: () => void;
  backgroundColor: string;
  textColor: string;
  onHoverBackgroundColor: string;
  'aria-label'?: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  onMouseEnterExtra?: () => void;
  onMouseLeaveExtra?: () => void;
}

/**
 * Shared icon button component with consistent hover/click behavior
 * Uses CSS filter invert for color inversion on hover
 */
export const IconButton = ({
  icon,
  onClick,
  backgroundColor,
  textColor,
  onHoverBackgroundColor,
  'aria-label': ariaLabel,
  title,
  className = '',
  style = {},
  disabled = false,
  onMouseEnterExtra,
  onMouseLeaveExtra,
}: IconButtonProps) => {
  const mouseDownTimerRef = useRef<NodeJS.Timeout | null>(null);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`icon-button pointer-events-auto group ${className}`}
      aria-label={ariaLabel}
      title={title}
      style={{
        backgroundColor,
        fontSize: `${ICON_BUTTON_STYLES.fontSize}px`,
        lineHeight: ICON_BUTTON_STYLES.lineHeight,
        width: `${ICON_BUTTON_STYLES.size}px`,
        height: `${ICON_BUTTON_STYLES.size}px`,
        padding: ICON_BUTTON_STYLES.padding,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.3 : 1,
        cursor: disabled ? 'default' : 'pointer',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        onMouseEnterExtra?.();
        e.currentTarget.style.backgroundColor = onHoverBackgroundColor;
        const iconContent = e.currentTarget.querySelector('.icon-content') as HTMLElement;
        if (iconContent) iconContent.style.filter = 'invert(1)';
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        onMouseLeaveExtra?.();
        e.currentTarget.style.backgroundColor = backgroundColor;
        const iconContent = e.currentTarget.querySelector('.icon-content') as HTMLElement;
        if (iconContent) iconContent.style.filter = '';
        // Clear any pending mousedown timer
        if (mouseDownTimerRef.current) {
          clearTimeout(mouseDownTimerRef.current);
          mouseDownTimerRef.current = null;
        }
      }}
      onMouseDown={(e) => {
        if (disabled) return;
        // Clear any existing timer
        if (mouseDownTimerRef.current) {
          clearTimeout(mouseDownTimerRef.current);
        }
        e.currentTarget.style.backgroundColor = backgroundColor;
        const iconContent = e.currentTarget.querySelector('.icon-content') as HTMLElement;
        if (iconContent) iconContent.style.filter = '';
      }}
      onMouseUp={(e) => {
        if (disabled) return;
        // Hold the inverted state for 100ms after release
        e.currentTarget.style.backgroundColor = onHoverBackgroundColor;
        const iconContent = e.currentTarget.querySelector('.icon-content') as HTMLElement;
        if (iconContent) iconContent.style.filter = 'invert(1)';

        mouseDownTimerRef.current = setTimeout(() => {
          e.currentTarget.style.backgroundColor = backgroundColor;
          const iconContent = e.currentTarget.querySelector('.icon-content') as HTMLElement;
          if (iconContent) iconContent.style.filter = '';
        }, 100);
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: ICON_BUTTON_STYLES.lineHeight,
          pointerEvents: 'none',
        }}
        className="icon-content"
      >
        {icon}
      </span>
    </button>
  );
};

export { ICON_BUTTON_STYLES };
