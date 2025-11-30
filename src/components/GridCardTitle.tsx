import { useState, useRef, useEffect } from 'react';

interface GridCardTitleProps {
  text: string;
  className?: string;
  isHovered?: boolean;
}

export const GridCardTitle = ({ text, className = '', isHovered = false }: GridCardTitleProps) => {
  const [visibleLetters, setVisibleLetters] = useState<Set<number>>(new Set());
  const [flippedLetters, setFlippedLetters] = useState<Set<number>>(new Set());
  const [textBackground] = useState<'white-on-black' | 'black-on-white'>(Math.random() < 0.5 ? 'white-on-black' : 'black-on-white');
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const lingeringTimersRef = useRef<NodeJS.Timeout[]>([]);

  const letters = text.split('');

  useEffect(() => {
    if (isHovered) {
      // Clear any existing timers
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
      lingeringTimersRef.current.forEach(timer => clearTimeout(timer));
      lingeringTimersRef.current = [];
      
      // Create shuffled indices for random reveal order
      const indices = letters.map((_, i) => i);
      const shuffled = indices.sort(() => Math.random() - 0.5);
      
      // Split into 5 groups (5 frames)
      const lettersPerFrame = Math.ceil(letters.length / 5);
      const frame1Indices = shuffled.slice(0, lettersPerFrame);
      const frame2Indices = shuffled.slice(lettersPerFrame, lettersPerFrame * 2);
      const frame3Indices = shuffled.slice(lettersPerFrame * 2, lettersPerFrame * 3);
      const frame4Indices = shuffled.slice(lettersPerFrame * 3, lettersPerFrame * 4);
      const frame5Indices = shuffled.slice(lettersPerFrame * 4);
      
      // Randomly pick letters to flip (mirror) during animation
      const numFlipped = Math.floor(Math.random() * (letters.length / 2));
      const flippedIndices = new Set<number>();
      while (flippedIndices.size < numFlipped) {
        flippedIndices.add(Math.floor(Math.random() * letters.length));
      }
      
      // Pick 1-10 random letters for lingering mirror effect
      const numLingeringLetters = Math.floor(Math.random() * 10) + 1; // 1 to 10
      const lingeringIndices = new Set<number>();
      while (lingeringIndices.size < Math.min(numLingeringLetters, letters.length)) {
        lingeringIndices.add(Math.floor(Math.random() * letters.length));
      }
      
      // Combine animation flips with lingering flips
      const combinedFlips = new Set([...flippedIndices, ...lingeringIndices]);
      
      // Frame 1: Show first batch
      setVisibleLetters(new Set(frame1Indices));
      setFlippedLetters(combinedFlips);
      
      // Set random duration for each lingering letter (3-10 frames = 48-160ms)
      lingeringIndices.forEach((index) => {
        const randomFrames = Math.floor(Math.random() * 8) + 3; // 3-10 frames
        const lingeringDuration = randomFrames * 16;
        
        const timer = setTimeout(() => {
          setFlippedLetters(prev => {
            const updated = new Set(prev);
            updated.delete(index);
            return updated;
          });
        }, lingeringDuration);
        
        lingeringTimersRef.current.push(timer);
      });
      
      // Frame 2: Add second batch (after ~16ms)
      timersRef.current.push(setTimeout(() => {
        setVisibleLetters(new Set([...frame1Indices, ...frame2Indices]));
        
        // Frame 3: Add third batch
        timersRef.current.push(setTimeout(() => {
          setVisibleLetters(new Set([...frame1Indices, ...frame2Indices, ...frame3Indices]));
          
          // Frame 4: Add fourth batch
          timersRef.current.push(setTimeout(() => {
            setVisibleLetters(new Set([...frame1Indices, ...frame2Indices, ...frame3Indices, ...frame4Indices]));
            
            // Frame 5: Add final batch and un-flip animation letters only
            timersRef.current.push(setTimeout(() => {
              setVisibleLetters(new Set(indices));
              // Remove only animation flip letters, keep lingering ones
              setFlippedLetters(prev => {
                const updated = new Set(prev);
                flippedIndices.forEach(index => updated.delete(index));
                return updated;
              });
            }, 16));
          }, 16));
        }, 16));
      }, 16));
      
    } else {
      // On hover out, hide all letters and clear all timers
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
      lingeringTimersRef.current.forEach(timer => clearTimeout(timer));
      lingeringTimersRef.current = [];
      
      setVisibleLetters(new Set());
      setFlippedLetters(new Set());
    }
    
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      lingeringTimersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, [isHovered, letters.length]);

  // White text gets 10% lightness black background, black text gets 90% lightness white background
  const bgColor = textBackground === 'white-on-black' ? 'hsl(0, 0%, 10%)' : 'hsl(0, 0%, 90%)';
  const textColor = textBackground === 'white-on-black' ? 'hsl(0, 0%, 90%)' : 'hsl(0, 0%, 10%)';

  return (
    <h3 className={`${className} break-words`} style={{
      backgroundColor: bgColor,
      color: textColor,
      padding: '2px 4px',
      display: 'inline-block',
    }}>
      {letters.map((letter, index) => {
        const isVisible = visibleLetters.has(index);
        const isFlipped = flippedLetters.has(index);

        return (
          <span
            key={index}
            style={{
              display: 'inline',
              opacity: isVisible ? 1 : 0,
              transform: isFlipped ? 'scaleX(-1)' : 'none',
            }}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        );
      })}
    </h3>
  );
};
