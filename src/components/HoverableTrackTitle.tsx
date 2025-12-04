import { useState, useRef, useEffect } from 'react';

interface HoverableTrackTitleProps {
  title: string;
  backgroundColor: string;
  textColor: string;
  height: number;
  onClick: () => void;
}

interface LetterState {
  char: string;
  isHoverText: boolean; // true = "go to project", false = original title
  isMirror: boolean;
  isItalic: boolean;
  isCaps: boolean;
}

export const HoverableTrackTitle = ({
  title,
  backgroundColor,
  textColor,
  height,
  onClick
}: HoverableTrackTitleProps) => {
  const [letterStates, setLetterStates] = useState<LetterState[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const originalText = title;
  const hoverText = 'go to project';

  // Initialize with original text
  useEffect(() => {
    setLetterStates(originalText.split('').map(char => ({
      char,
      isHoverText: false,
      isMirror: false,
      isItalic: false,
      isCaps: false
    })));
  }, [originalText]);

  useEffect(() => {
    // Clear any existing timers
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];

    if (isHovered) {
      // Transform to "go to project" - 50% faster with linear timing
      const targetChars = hoverText.split('');
      const numChars = Math.max(originalText.length, targetChars.length);
      const transformOrder = [...Array(numChars).keys()].sort(() => Math.random() - 0.5);

      transformOrder.forEach((charIndex, orderIndex) => {
        const progress = orderIndex / (transformOrder.length - 1);
        // Linear progression for even transition speed
        const delay = 17 + progress * 117; // 50% faster, linear timing

        const timer = setTimeout(() => {
          setLetterStates(prev => {
            const updated = [...prev];
            // Ensure we have enough slots
            while (updated.length <= charIndex) {
              updated.push({ char: '', isHoverText: false, isMirror: false, isItalic: false, isCaps: false });
            }

            if (charIndex < targetChars.length) {
              updated[charIndex] = {
                char: targetChars[charIndex],
                isHoverText: true,
                isMirror: Math.random() < 0.5,
                isItalic: Math.random() < 0.5,
                isCaps: Math.random() < 0.3
              };
            } else {
              // Remove extra characters
              updated[charIndex] = { char: '', isHoverText: false, isMirror: false, isItalic: false, isCaps: false };
            }

            return updated;
          });
        }, delay);

        timersRef.current.push(timer);

        // Clear effects with random duration for each letter (100-400ms)
        const randomClearDelay = Math.random() * 300 + 100;
        const clearTimer = setTimeout(() => {
          setLetterStates(prev => {
            const updated = [...prev];
            if (charIndex < updated.length && updated[charIndex].isHoverText) {
              updated[charIndex] = {
                ...updated[charIndex],
                isMirror: false,
                isItalic: false,
                isCaps: false
              };
            }
            return updated;
          });
        }, delay + randomClearDelay);

        timersRef.current.push(clearTimer);
      });
    } else {
      // Transform back to original text - 50% faster with linear timing
      const targetChars = originalText.split('');
      const numChars = Math.max(hoverText.length, targetChars.length);
      const transformOrder = [...Array(numChars).keys()].sort(() => Math.random() - 0.5);

      transformOrder.forEach((charIndex, orderIndex) => {
        const progress = orderIndex / (transformOrder.length - 1);
        // Linear progression for even transition speed
        const delay = 17 + progress * 117; // 50% faster, linear timing

        const timer = setTimeout(() => {
          setLetterStates(prev => {
            const updated = [...prev];

            // Ensure we have enough slots
            while (updated.length <= charIndex) {
              updated.push({ char: '', isHoverText: false, isMirror: false, isItalic: false, isCaps: false });
            }

            if (charIndex < targetChars.length) {
              updated[charIndex] = {
                char: targetChars[charIndex],
                isHoverText: false,
                isMirror: false,
                isItalic: false,
                isCaps: false
              };
            } else {
              updated[charIndex] = { char: '', isHoverText: false, isMirror: false, isItalic: false, isCaps: false };
            }

            // Trim to original text length
            if (updated.length > targetChars.length) {
              updated.length = targetChars.length;
            }

            return updated;
          });
        }, delay);

        timersRef.current.push(timer);
      });
    }

    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, [isHovered, originalText]);

  return (
    <div
      className="pointer-events-auto cursor-pointer"
      style={{
        backgroundColor,
        color: textColor,
        padding: '2px 4px',
        fontSize: '16px',
        lineHeight: 1,
        height: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '100%',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {letterStates.map((state, index) => {
        const displayChar = state.isCaps ? state.char.toUpperCase() : state.char;

        return (
          <span
            key={index}
            style={{
              fontStyle: state.isItalic ? 'italic' : 'normal',
              transform: state.isMirror ? 'scaleX(-1)' : 'scaleX(1)',
              display: 'inline-block'
            }}
          >
            {displayChar === ' ' ? '\u00A0' : displayChar}
          </span>
        );
      })}
    </div>
  );
};
