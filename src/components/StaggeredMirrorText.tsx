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
  const [isColorInverted, setIsColorInverted] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [letterDelays, setLetterDelays] = useState<number[]>([]);
  const [flippedLetters, setFlippedLetters] = useState<boolean[]>([]);
  const [glitchEffects, setGlitchEffects] = useState<(GlitchEffect | null)[]>([]);
  const [loadAnimationEffects, setLoadAnimationEffects] = useState<(GlitchEffect | null)[]>([]);
  const [visibleLetters, setVisibleLetters] = useState<boolean[]>([]);
  const [transformationEffects, setTransformationEffects] = useState<(GlitchEffect | null)[]>([]);

  // Random variant state - only used when no forced variant/color provided
  const [randomVariant] = useState<'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light'>(() => {
    const random = Math.random();
    if (random < 0.25) return 'white-on-black';
    if (random < 0.5) return 'black-on-white';
    if (random < 0.75) return 'white-on-dark';
    return 'black-on-light';
  });

  // Determine textBackground - use forced variant if provided, or forced color (legacy), otherwise use random state
  const textBackground: 'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light' =
    forcedVariant || (forcedColor ? (forcedColor === 'white' ? 'white-on-black' : 'black-on-white') : randomVariant);
  const letters = text.split('');
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const residualTimerRef = useRef<NodeJS.Timeout | null>(null);
  const glitchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevActiveRef = useRef(isActive);
  const loadAnimationTimersRef = useRef<NodeJS.Timeout[]>([]);
  const visibilityTimersRef = useRef<NodeJS.Timeout[]>([]);
  const transformationTimersRef = useRef<NodeJS.Timeout[]>([]);
  const mouseDownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTransformedRef = useRef(false); // Track if already transformed

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
      // Much higher frequency when active, normal frequency otherwise
      const randomValue = Math.random();
      // Power of 3 heavily weights towards 1 (longer delays)
      const weightedRandom = Math.pow(randomValue, 3);

      // If active, use much faster timing (10x faster), otherwise use normal timing
      const nextGlitchDelay = isActive
        ? 50 + (1 - weightedRandom) * 1300  // 50ms to 1350ms (very frequent)
        : 200 + (1 - weightedRandom) * 12800; // 200ms to 13000ms (normal)

      glitchTimerRef.current = setTimeout(triggerRandomGlitch, nextGlitchDelay);
    };

    // Start the glitch loop with initial random delay
    const randomValue = Math.random();
    const weightedRandom = Math.pow(randomValue, 3);
    const initialDelay = isActive
      ? 50 + (1 - weightedRandom) * 1300  // Very fast when active
      : 200 + (1 - weightedRandom) * 12800; // Normal when not active
    glitchTimerRef.current = setTimeout(triggerRandomGlitch, initialDelay);

    return () => {
      if (glitchTimerRef.current) {
        clearTimeout(glitchTimerRef.current);
      }
    };
  }, [letters.length, isActive]);

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

  // Generate random delays when hover/active state changes - with transformation animation
  useEffect(() => {
    if (isHovered || isActive) {
      // If already transformed, don't restart the transformation
      // This prevents restarting when transitioning from hovered to active (clicking)
      if (isTransformedRef.current) {
        return;
      }

      // Mark as transformed
      isTransformedRef.current = true;

      // Clear existing timers
      timersRef.current.forEach(timer => clearTimeout(timer));
      transformationTimersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
      transformationTimersRef.current = [];

      // Create array of indices and shuffle them for random order
      const transformOrder = [...Array(letters.length).keys()].sort(() => Math.random() - 0.5);

      // Phase 1: Transform letters with random effects, gradually moving to final state
      const newFlipped = new Array(letters.length).fill(false);
      setFlippedLetters(newFlipped);
      setTransformationEffects(new Array(letters.length).fill(null));

      // Select 1-5 random letters to linger in intermediate states
      const numLingeringLetters = Math.floor(Math.random() * 5) + 1; // 1 to 5
      const lingeringIndices = new Set<number>();
      while (lingeringIndices.size < Math.min(numLingeringLetters, letters.length)) {
        lingeringIndices.add(Math.floor(Math.random() * letters.length));
      }

      transformOrder.forEach((charIndex, orderIndex) => {
        const progress = orderIndex / (transformOrder.length - 1);
        const easedProgress = progress * progress;
        const startDelay = 33 + easedProgress * 47; // 33ms to 80ms (total 80ms / 5 frames)

        // Check if this letter should linger
        const shouldLinger = lingeringIndices.has(charIndex);
        const lingerDuration = shouldLinger ? 10 + Math.random() * 290 : 0; // 10-300ms extra

        // Show initial random transformation
        const timer1 = setTimeout(() => {
          setTransformationEffects(prev => {
            const updated = [...prev];
            updated[charIndex] = {
              isCaps: Math.random() < 0.5,
              isMirror: Math.random() < 0.5,
              isItalic: Math.random() < 0.5
            };
            return updated;
          });
        }, startDelay);
        transformationTimersRef.current.push(timer1);

        // After 50ms, transition to mostly final state but keep some randomness
        const timer2 = setTimeout(() => {
          setTransformationEffects(prev => {
            const updated = [...prev];
            updated[charIndex] = {
              isCaps: Math.random() < 0.8, // 80% chance of caps
              isMirror: Math.random() < 0.8, // 80% chance of mirror
              isItalic: Math.random() < 0.3  // 30% chance of italic
            };
            return updated;
          });
        }, startDelay + 50);
        transformationTimersRef.current.push(timer2);

        // After another 50ms, move even closer to final state
        // If lingering, stay in an intermediate state with at least one non-final attribute
        const timer3 = setTimeout(() => {
          setTransformationEffects(prev => {
            const updated = [...prev];
            if (shouldLinger) {
              // Lingering letters keep at least one non-final attribute
              const effects = [];
              if (Math.random() < 0.5) effects.push('caps'); // 50% chance to be lowercase
              if (Math.random() < 0.5) effects.push('mirror'); // 50% chance to be non-mirrored
              if (Math.random() < 0.5) effects.push('italic'); // 50% chance to be italic

              // Ensure at least one effect is different from final state
              if (effects.length === 0) {
                const randomEffect = ['caps', 'mirror', 'italic'][Math.floor(Math.random() * 3)];
                effects.push(randomEffect);
              }

              updated[charIndex] = {
                isCaps: !effects.includes('caps'),
                isMirror: !effects.includes('mirror'),
                isItalic: effects.includes('italic')
              };
            } else {
              updated[charIndex] = {
                isCaps: true,
                isMirror: true,
                isItalic: Math.random() < 0.2  // 20% chance of italic
              };
            }
            return updated;
          });

          // Also flip to final state
          setFlippedLetters(prev => {
            const updated = [...prev];
            updated[charIndex] = true;
            return updated;
          });
        }, startDelay + 100);
        transformationTimersRef.current.push(timer3);

        // Clear transformation effect to show pure final state
        // Lingering letters clear after additional delay
        const clearTimer = setTimeout(() => {
          setTransformationEffects(prev => {
            const updated = [...prev];
            updated[charIndex] = null;
            return updated;
          });
        }, startDelay + 150 + lingerDuration);
        transformationTimersRef.current.push(clearTimer);
      });
    } else {
      // Reset the transformed flag when hover/active ends
      isTransformedRef.current = false;

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
      transformationTimersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
      transformationTimersRef.current = [];
      setTransformationEffects(new Array(letters.length).fill(null));

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
      transformationTimersRef.current.forEach(timer => clearTimeout(timer));
      if (residualTimerRef.current) {
        clearTimeout(residualTimerRef.current);
      }
    };
  }, [isHovered, isActive, letters.length]);

  // Background and text colors based on textBackground variant
  const baseBgColor =
    textBackground === 'white-on-black' ? 'hsl(0, 0%, 10%)' :
    textBackground === 'black-on-white' ? 'hsl(0, 0%, 90%)' :
    textBackground === 'white-on-dark' ? 'hsl(0, 0%, 20%)' :
    'hsl(0, 0%, 80%)'; // black-on-light
  const baseTextColor =
    textBackground === 'white-on-black' || textBackground === 'white-on-dark'
      ? 'hsl(0, 0%, 100%)'
      : 'hsl(0, 0%, 0%)';

  // Swap colors when inverted (hover inverts, but mousedown inverts it back)
  const shouldInvertColors = isColorInverted && !isMouseDown;
  const bgColor = shouldInvertColors ? baseTextColor : baseBgColor;
  const textColor = shouldInvertColors ? baseBgColor : baseTextColor;

  return (
    <span
      className={`inline-block ${className}`}
      onMouseEnter={() => {
        if (!isActive) {
          setIsHovered(true);
        }
        setIsColorInverted(true);
      }}
      onMouseLeave={() => {
        if (!isActive) {
          setIsHovered(false);
        }
        setIsColorInverted(false);
        setIsMouseDown(false);
        // Clear any pending mousedown timer
        if (mouseDownTimerRef.current) {
          clearTimeout(mouseDownTimerRef.current);
          mouseDownTimerRef.current = null;
        }
      }}
      onMouseDown={() => {
        // Clear any existing timer
        if (mouseDownTimerRef.current) {
          clearTimeout(mouseDownTimerRef.current);
        }
        setIsMouseDown(true);
      }}
      onMouseUp={() => {
        // Hold the mousedown state for 100ms after release
        mouseDownTimerRef.current = setTimeout(() => {
          setIsMouseDown(false);
        }, 100);
      }}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        padding: '2px 4px',
        lineHeight: 1,
        fontSize: '16px',
        transition: 'background-color 0s, color 0s',
        cursor: 'pointer',
      }}
    >
      {letters.map((letter, index) => {
        const glitch = glitchEffects[index];
        const loadEffect = loadAnimationEffects[index];
        const transformEffect = transformationEffects[index];
        const isFlipped = flippedLetters[index];
        const isVisible = visibleLetters[index] ?? true;

        // Don't render letter if not visible yet
        if (!isVisible) return null;

        // Priority: transformation effect > glitch > hover/active > load animation
        // When a glitch is active, it overrides the hover/active state
        // Determine if letter should be mirrored
        const shouldMirror = transformEffect
          ? transformEffect.isMirror
          : glitch
          ? glitch.isMirror
          : ((isHovered || isActive) || (loadEffect?.isMirror ?? false));

        // Determine if letter should be caps
        const shouldBeCaps = transformEffect
          ? transformEffect.isCaps
          : glitch
          ? glitch.isCaps
          : isFlipped;

        // Determine if letter should be italic
        const shouldBeItalic = transformEffect
          ? transformEffect.isItalic
          : glitch
          ? glitch.isItalic
          : (loadEffect?.isItalic ?? false);

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
