import { useState, useRef, useEffect } from 'react';

interface StaggeredMirrorTextProps {
  text: string;
  className?: string;
  isActive?: boolean;
}

interface GlitchEffect {
  isCaps: boolean;
  isMirror: boolean;
  isItalic: boolean;
}

export const StaggeredMirrorText = ({ text, className = '', isActive = false }: StaggeredMirrorTextProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [letterDelays, setLetterDelays] = useState<number[]>([]);
  const [flippedLetters, setFlippedLetters] = useState<boolean[]>([]);
  const [glitchEffects, setGlitchEffects] = useState<(GlitchEffect | null)[]>([]);
  const letters = text.split('');
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const residualTimerRef = useRef<NodeJS.Timeout | null>(null);
  const glitchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevActiveRef = useRef(isActive);

  // Initialize glitch effects array
  useEffect(() => {
    setGlitchEffects(new Array(letters.length).fill(null));
  }, [letters.length]);

  // Random glitch effect that runs independently
  useEffect(() => {
    const triggerRandomGlitch = () => {
      // Pick only ONE random letter
      const randomIndex = Math.floor(Math.random() * letters.length);
      
      // Apply random effect to this letter
      // Each effect (caps, mirror, italic) has independent 50% chance
      const isCaps = Math.random() < 0.5;
      const isMirror = Math.random() < 0.5;
      const isItalic = Math.random() < 0.5;

      // Ensure at least one effect is active
      const hasAnyEffect = isCaps || isMirror || isItalic;
      const finalCaps = hasAnyEffect ? isCaps : true; // Default to caps if none selected

      const newGlitchEffects = [...glitchEffects];
      newGlitchEffects[randomIndex] = { isCaps: finalCaps, isMirror, isItalic };
      
      setGlitchEffects(newGlitchEffects);
      
      // Duration: 3-20 frames (48-320ms)
      const frames = Math.floor(Math.random() * 18) + 3; // 3-20 frames
      const baseDuration = frames * 16;

      // Count active effects
      const activeEffects: ('caps' | 'mirror' | 'italic')[] = [];
      if (finalCaps) activeEffects.push('caps');
      if (isMirror) activeEffects.push('mirror');
      if (isItalic) activeEffects.push('italic');

      if (activeEffects.length > 1) {
        // Multiple effects - each ends at a different time with lingering
        // Shuffle to randomize which effects end first
        const shuffled = [...activeEffects].sort(() => Math.random() - 0.5);

        let currentDuration = baseDuration;
        let currentCaps = finalCaps;
        let currentMirror = isMirror;
        let currentItalic = isItalic;

        // End effects one by one
        shuffled.forEach((effect, idx) => {
          if (idx < shuffled.length - 1) {
            // Not the last effect - end it and linger
            const lingerFrames = Math.floor(Math.random() * 9) + 2; // 2-10 frames
            const lingerDuration = lingerFrames * 16;

            setTimeout(() => {
              setGlitchEffects(prev => {
                const cleared = [...prev];
                if (cleared[randomIndex]) {
                  if (effect === 'caps') currentCaps = false;
                  if (effect === 'mirror') currentMirror = false;
                  if (effect === 'italic') currentItalic = false;
                  cleared[randomIndex] = { isCaps: currentCaps, isMirror: currentMirror, isItalic: currentItalic };
                }
                return cleared;
              });
            }, currentDuration);

            currentDuration += lingerDuration;
          } else {
            // Last effect - clear everything
            setTimeout(() => {
              setGlitchEffects(prev => {
                const cleared = [...prev];
                cleared[randomIndex] = null;
                return cleared;
              });
            }, currentDuration);
          }
        });
      } else {
        // Single effect, just clear after duration
        setTimeout(() => {
          setGlitchEffects(prev => {
            const cleared = [...prev];
            cleared[randomIndex] = null;
            return cleared;
          });
        }, baseDuration);
      }
      
      // Schedule next glitch with weighted randomness
      // Using exponential distribution to weight towards longer intervals
      // Most glitches will be far apart, but occasionally they can be close together
      const randomValue = Math.random();
      // Power of 3 heavily weights towards 1 (longer delays)
      const weightedRandom = Math.pow(randomValue, 3);
      // Map to range: 200ms to 13000ms (0.2s to 13s)
      // Weighted towards the longer end
      const nextGlitchDelay = 200 + (1 - weightedRandom) * 12800;
      
      glitchTimerRef.current = setTimeout(triggerRandomGlitch, nextGlitchDelay);
    };
    
    // Start the glitch loop with initial random delay
    const randomValue = Math.random();
    const weightedRandom = Math.pow(randomValue, 3);
    const initialDelay = 200 + (1 - weightedRandom) * 12800;
    glitchTimerRef.current = setTimeout(triggerRandomGlitch, initialDelay);
    
    return () => {
      if (glitchTimerRef.current) {
        clearTimeout(glitchTimerRef.current);
      }
    };
  }, [letters.length]);

  // When isActive changes from true to false, immediately clear everything
  useEffect(() => {
    if (prevActiveRef.current && !isActive) {
      // Clear all timers
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
      if (residualTimerRef.current) {
        clearTimeout(residualTimerRef.current);
      }
      // Reset to non-flipped state
      setFlippedLetters(new Array(letters.length).fill(false));
      setIsHovered(false);
    }
    prevActiveRef.current = isActive;
  }, [isActive, letters.length]);

  // Generate random delays when hover/active state changes
  useEffect(() => {
    if (isHovered || isActive) {
      // Create array of indices and shuffle them
      const indices = letters.map((_, i) => i);
      const shuffled = indices.sort(() => Math.random() - 0.5);
      
      // Assign staggered delays (total 80ms / 5 frames)
      const totalDuration = 80; // 5 frames at ~16ms per frame
      const delays = letters.map((_, i) => {
        const order = shuffled.indexOf(i);
        const increment = letters.length > 1 ? totalDuration / (letters.length - 1) : 0;
        return order * increment;
      });
      
      setLetterDelays(delays);
      
      // Clear existing timers
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
      
      // Set up timers to flip each letter after its delay
      const newFlipped = new Array(letters.length).fill(false);
      setFlippedLetters(newFlipped);
      
      delays.forEach((delay, index) => {
        const timer = setTimeout(() => {
          setFlippedLetters(prev => {
            const updated = [...prev];
            updated[index] = true;
            return updated;
          });
        }, delay);
        timersRef.current.push(timer);
      });
    } else {
      // When hover ends, randomly keep 0-all letters in caps for 3-15 frames each
      const numLettersToKeep = Math.floor(Math.random() * (letters.length + 1)); // 0 to all letters
      const indicesToKeep = new Set<number>();
      
      // Pick random letters to keep capitalized
      while (indicesToKeep.size < numLettersToKeep) {
        indicesToKeep.add(Math.floor(Math.random() * letters.length));
      }
      
      // Set the flipped state
      const residualFlipped = letters.map((_, i) => indicesToKeep.has(i));
      setFlippedLetters(residualFlipped);
      
      // Clear animation timers
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
      
      // Clear any existing residual timers
      if (residualTimerRef.current) {
        clearTimeout(residualTimerRef.current);
      }
      
      // Set random duration for each letter (3-15 frames = 48-240ms)
      const newTimers: NodeJS.Timeout[] = [];
      indicesToKeep.forEach((index) => {
        const randomFrames = Math.floor(Math.random() * 13) + 3; // 3-15 frames
        const residualDuration = randomFrames * 16;
        
        const timer = setTimeout(() => {
          setFlippedLetters(prev => {
            const updated = [...prev];
            updated[index] = false;
            return updated;
          });
        }, residualDuration);
        
        newTimers.push(timer);
      });
      
      timersRef.current = newTimers;
    }
    
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      if (residualTimerRef.current) {
        clearTimeout(residualTimerRef.current);
      }
    };
  }, [isHovered, isActive, letters.length]);

  return (
    <span
      className={`inline-block relative ${className}`}
      onMouseEnter={() => !isActive && setIsHovered(true)}
      onMouseLeave={() => !isActive && setIsHovered(false)}
    >
      <span className="invisible">{text.toUpperCase()}</span>
      <span className="absolute inset-0 flex items-center justify-center">
        {letters.map((letter, index) => {
          const glitch = glitchEffects[index];
          const isFlipped = flippedLetters[index];

          // Determine if letter should be mirrored (from hover/active OR glitch)
          const shouldMirror = (isHovered || isActive) || (glitch?.isMirror ?? false);

          // Determine if letter should be caps (from flip OR glitch)
          const shouldBeCaps = isFlipped || (glitch?.isCaps ?? false);

          // Determine if letter should be italic (from glitch only)
          const shouldBeItalic = glitch?.isItalic ?? false;

          return (
            <span
              key={index}
              className="inline-block transition-transform duration-0"
              style={{
                transform: shouldMirror ? 'scaleX(-1)' : 'scaleX(1)',
                transitionDelay: `${letterDelays[index] || 0}ms`,
                fontStyle: shouldBeItalic ? 'italic' : 'normal',
              }}
            >
              {shouldBeCaps ? letter.toUpperCase() : letter}
            </span>
          );
        })}
      </span>
    </span>
  );
};
