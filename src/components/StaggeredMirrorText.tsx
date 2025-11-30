import { useState, useRef, useEffect } from 'react';

interface StaggeredMirrorTextProps {
  text: string;
  className?: string;
  isActive?: boolean;
  animateOnLoad?: boolean;
  animationSchedule?: number[]; // Array of delays for each letter, provided externally
  forcedColor?: 'white' | 'black'; // Force a specific color instead of random (legacy)
  forcedVariant?: 'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light'; // Force a specific variant
}

interface GlitchEffect {
  isCaps: boolean;
  isMirror: boolean;
  isItalic: boolean;
}

export const StaggeredMirrorText = ({ text, className = '', isActive = false, animateOnLoad = false, animationSchedule, forcedColor, forcedVariant }: StaggeredMirrorTextProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [letterDelays, setLetterDelays] = useState<number[]>([]);
  const [flippedLetters, setFlippedLetters] = useState<boolean[]>([]);
  const [glitchEffects, setGlitchEffects] = useState<(GlitchEffect | null)[]>([]);
  const [loadAnimationEffects, setLoadAnimationEffects] = useState<(GlitchEffect | null)[]>([]);
  const [visibleLetters, setVisibleLetters] = useState<boolean[]>([]);
  // Use forced variant if provided, or forced color (legacy), otherwise random from 4 options
  const [textBackground] = useState<'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light'>(() => {
    if (forcedVariant) {
      return forcedVariant;
    }
    if (forcedColor) {
      return forcedColor === 'white' ? 'white-on-black' : 'black-on-white';
    }
    const random = Math.random();
    if (random < 0.25) return 'white-on-black';      // 10% bg, 90% text
    if (random < 0.5) return 'black-on-white';       // 90% bg, 10% text
    if (random < 0.75) return 'white-on-dark';       // 20% bg, 90% text
    return 'black-on-light';                          // 80% bg, 10% text
  });
  const letters = text.split('');
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const residualTimerRef = useRef<NodeJS.Timeout | null>(null);
  const glitchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevActiveRef = useRef(isActive);
  const loadAnimationTimersRef = useRef<NodeJS.Timeout[]>([]);
  const visibilityTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Initialize glitch effects array
  useEffect(() => {
    setGlitchEffects(new Array(letters.length).fill(null));
  }, [letters.length]);

  // Load animation effect - letters appear with random glitch effects
  useEffect(() => {
    if (!animateOnLoad) {
      // If not animating, all letters are visible
      setVisibleLetters(new Array(letters.length).fill(true));
      return;
    }

    // Start with all letters invisible
    setVisibleLetters(new Array(letters.length).fill(false));

    // Initialize all letters with random glitch effects
    const initialEffects: (GlitchEffect | null)[] = letters.map(() => {
      const isMirror = Math.random() < 0.5;
      const isItalic = Math.random() < 0.5;
      // Ensure at least one effect is active
      const hasEffect = isMirror || isItalic;
      return hasEffect ? { isCaps: false, isMirror, isItalic } : { isCaps: false, isMirror: true, isItalic: false };
    });

    setLoadAnimationEffects(initialEffects);

    // Make each letter visible with timing from schedule or generate random
    const visibilityTimers: NodeJS.Timeout[] = [];
    const effectTimers: NodeJS.Timeout[] = [];

    letters.forEach((_, index) => {
      // Use provided schedule or fallback to random timing
      const appearDelay = animationSchedule?.[index] ?? (index * (50 + Math.random() * 100));

      const visTimer = setTimeout(() => {
        setVisibleLetters(prev => {
          const updated = [...prev];
          updated[index] = true;
          return updated;
        });
      }, appearDelay);
      visibilityTimers.push(visTimer);

      // Clear glitch effect after letter appears + random duration (500-2000ms from appear)
      const effectDuration = appearDelay + 500 + Math.random() * 1500;
      const effectTimer = setTimeout(() => {
        setLoadAnimationEffects(prev => {
          const updated = [...prev];
          updated[index] = null;
          return updated;
        });
      }, effectDuration);
      effectTimers.push(effectTimer);
    });

    visibilityTimersRef.current = visibilityTimers;
    loadAnimationTimersRef.current = effectTimers;

    return () => {
      visibilityTimersRef.current.forEach(timer => clearTimeout(timer));
      loadAnimationTimersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, [animateOnLoad, letters.length, animationSchedule]);

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

  // Background and text colors based on textBackground variant
  const bgColor =
    textBackground === 'white-on-black' ? 'hsl(0, 0%, 10%)' :
    textBackground === 'black-on-white' ? 'hsl(0, 0%, 90%)' :
    textBackground === 'white-on-dark' ? 'hsl(0, 0%, 20%)' :
    'hsl(0, 0%, 80%)'; // black-on-light
  const textColor =
    textBackground === 'white-on-black' || textBackground === 'white-on-dark'
      ? 'hsl(0, 0%, 100%)'
      : 'hsl(0, 0%, 0%)';

  return (
    <span
      className={`inline-block ${className}`}
      onMouseEnter={() => !isActive && setIsHovered(true)}
      onMouseLeave={() => !isActive && setIsHovered(false)}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        padding: '2px 4px',
        lineHeight: 1,
        fontSize: '16px',
      }}
    >
      {letters.map((letter, index) => {
        const glitch = glitchEffects[index];
        const loadEffect = loadAnimationEffects[index];
        const isFlipped = flippedLetters[index];
        const isVisible = visibleLetters[index] ?? true;

        // Don't render letter if not visible yet
        if (!isVisible) return null;

        // Determine if letter should be mirrored (from hover/active OR glitch OR load animation)
        const shouldMirror = (isHovered || isActive) || (glitch?.isMirror ?? false) || (loadEffect?.isMirror ?? false);

        // Determine if letter should be caps (from flip OR glitch)
        const shouldBeCaps = isFlipped || (glitch?.isCaps ?? false);

        // Determine if letter should be italic (from glitch OR load animation)
        const shouldBeItalic = (glitch?.isItalic ?? false) || (loadEffect?.isItalic ?? false);

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
  );
};
