import { useState, useRef, useEffect } from 'react';

interface StaggeredMirrorTextProps {
  text: string;
  className?: string;
  isActive?: boolean;
}

interface GlitchEffect {
  isCaps: boolean;
  isMirror: boolean;
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
      const rand = Math.random();
      let isCaps = false;
      let isMirror = false;
      
      if (rand < 0.33) {
        // Caps only
        isCaps = true;
      } else if (rand < 0.66) {
        // Mirror only
        isMirror = true;
      } else {
        // Both caps and mirror
        isCaps = true;
        isMirror = true;
      }
      
      const newGlitchEffects = [...glitchEffects];
      newGlitchEffects[randomIndex] = { isCaps, isMirror };
      
      setGlitchEffects(newGlitchEffects);
      
      // Duration: 3-20 frames (48-320ms)
      const frames = Math.floor(Math.random() * 18) + 3; // 3-20 frames
      const baseDuration = frames * 16;
      
      // If both effects are active, make one linger 2-10 frames longer
      if (isCaps && isMirror) {
        const lingerFrames = Math.floor(Math.random() * 9) + 2; // 2-10 frames
        const lingerDuration = lingerFrames * 16;
        const whichLingers = Math.random() < 0.5 ? 'caps' : 'mirror';
        
        if (whichLingers === 'caps') {
          // Mirror ends first, caps lingers
          setTimeout(() => {
            setGlitchEffects(prev => {
              const cleared = [...prev];
              if (cleared[randomIndex]) {
                cleared[randomIndex] = { isCaps: true, isMirror: false };
              }
              return cleared;
            });
          }, baseDuration);
          
          // Clear caps after linger
          setTimeout(() => {
            setGlitchEffects(prev => {
              const cleared = [...prev];
              cleared[randomIndex] = null;
              return cleared;
            });
          }, baseDuration + lingerDuration);
        } else {
          // Caps ends first, mirror lingers
          setTimeout(() => {
            setGlitchEffects(prev => {
              const cleared = [...prev];
              if (cleared[randomIndex]) {
                cleared[randomIndex] = { isCaps: false, isMirror: true };
              }
              return cleared;
            });
          }, baseDuration);
          
          // Clear mirror after linger
          setTimeout(() => {
            setGlitchEffects(prev => {
              const cleared = [...prev];
              cleared[randomIndex] = null;
              return cleared;
            });
          }, baseDuration + lingerDuration);
        }
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
          
          return (
            <span
              key={index}
              className="inline-block transition-transform duration-0"
              style={{
                transform: shouldMirror ? 'scaleX(-1)' : 'scaleX(1)',
                transitionDelay: `${letterDelays[index] || 0}ms`,
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
