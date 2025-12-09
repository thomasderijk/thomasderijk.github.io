import { useState, useRef, useEffect } from 'react';

interface IntenseGlitchTextProps {
  text: string;
  className?: string;
  forcedVariant?: 'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light';
}

interface GlitchEffect {
  isCaps: boolean;
  isMirror: boolean;
  isItalic: boolean;
}

/**
 * Intensified glitch text component with 2x glitch frequency
 * Same as StaggeredMirrorText but with doubled glitch rates
 */
export const IntenseGlitchText = ({ text, className = '', forcedVariant }: IntenseGlitchTextProps) => {
  const [glitchEffects, setGlitchEffects] = useState<(GlitchEffect | null)[]>([]);
  const glitchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Random variant state - only used when no forced variant provided
  const [randomVariant] = useState<'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light'>(() => {
    const random = Math.random();
    if (random < 0.25) return 'white-on-black';
    if (random < 0.5) return 'black-on-white';
    if (random < 0.75) return 'white-on-dark';
    return 'black-on-light';
  });

  const textBackground = forcedVariant || randomVariant;
  const letters = text.split('');

  // Initialize glitch effects array
  useEffect(() => {
    setGlitchEffects(new Array(letters.length).fill(null));
  }, [letters.length]);

  // DOUBLED glitch effect - 2x frequency
  useEffect(() => {
    const triggerRandomGlitch = () => {
      // Pick TWO random letters instead of one
      const randomIndex1 = Math.floor(Math.random() * letters.length);
      let randomIndex2 = Math.floor(Math.random() * letters.length);
      // Ensure second index is different from first
      while (randomIndex2 === randomIndex1 && letters.length > 1) {
        randomIndex2 = Math.floor(Math.random() * letters.length);
      }

      const indices = letters.length > 1 ? [randomIndex1, randomIndex2] : [randomIndex1];

      indices.forEach(randomIndex => {
        // Apply random effect to this letter
        const isCaps = Math.random() < 0.5;
        const isMirror = Math.random() < 0.5;
        const isItalic = Math.random() < 0.5;

        // Ensure at least one effect is active
        const hasAnyEffect = isCaps || isMirror || isItalic;
        const finalCaps = hasAnyEffect ? isCaps : true;

        setGlitchEffects(prev => {
          const newEffects = [...prev];
          newEffects[randomIndex] = { isCaps: finalCaps, isMirror, isItalic };
          return newEffects;
        });

        // Duration: 3-20 frames (48-320ms)
        const frames = Math.floor(Math.random() * 18) + 3;
        const baseDuration = frames * 16;

        // Count active effects
        const activeEffects: ('caps' | 'mirror' | 'italic')[] = [];
        if (finalCaps) activeEffects.push('caps');
        if (isMirror) activeEffects.push('mirror');
        if (isItalic) activeEffects.push('italic');

        if (activeEffects.length > 1) {
          // Multiple effects - each ends at a different time
          const shuffled = [...activeEffects].sort(() => Math.random() - 0.5);

          let currentDuration = baseDuration;
          let currentCaps = finalCaps;
          let currentMirror = isMirror;
          let currentItalic = isItalic;

          shuffled.forEach((effect, idx) => {
            if (idx < shuffled.length - 1) {
              const lingerFrames = Math.floor(Math.random() * 9) + 2;
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
          setTimeout(() => {
            setGlitchEffects(prev => {
              const cleared = [...prev];
              cleared[randomIndex] = null;
              return cleared;
            });
          }, baseDuration);
        }
      });

      // DOUBLED frequency: half the delay times
      const randomValue = Math.random();
      const weightedRandom = Math.pow(randomValue, 3);
      // Original: 200ms to 13000ms, Doubled: 100ms to 6500ms
      const nextGlitchDelay = 100 + (1 - weightedRandom) * 6400;

      glitchTimerRef.current = setTimeout(triggerRandomGlitch, nextGlitchDelay);
    };

    // Start with doubled initial frequency
    const randomValue = Math.random();
    const weightedRandom = Math.pow(randomValue, 3);
    const initialDelay = 100 + (1 - weightedRandom) * 6400;
    glitchTimerRef.current = setTimeout(triggerRandomGlitch, initialDelay);

    return () => {
      if (glitchTimerRef.current) {
        clearTimeout(glitchTimerRef.current);
      }
    };
  }, [letters.length]);

  // Background and text colors
  const bgColor =
    textBackground === 'white-on-black' ? 'hsl(0, 0%, 10%)' :
    textBackground === 'black-on-white' ? 'hsl(0, 0%, 90%)' :
    textBackground === 'white-on-dark' ? 'hsl(0, 0%, 20%)' :
    'hsl(0, 0%, 80%)';
  const textColor =
    textBackground === 'white-on-black' || textBackground === 'white-on-dark'
      ? 'hsl(0, 0%, 100%)'
      : 'hsl(0, 0%, 0%)';

  return (
    <span
      className={`font-display font-light inline-block ${className}`}
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

        const shouldMirror = glitch?.isMirror ?? false;
        const shouldBeCaps = glitch?.isCaps ?? false;
        const shouldBeItalic = glitch?.isItalic ?? false;

        return (
          <span
            key={index}
            className="inline-block"
            style={{
              transform: shouldMirror ? 'scaleX(-1)' : 'scaleX(1)',
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
