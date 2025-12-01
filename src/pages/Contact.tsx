import { useState, useEffect, useRef } from 'react';

interface LetterState {
  char: string;
  isCopiedText: boolean; // true = from "copied to clipboard" (Tiepolo), false = email (Inter)
  isMirror: boolean;
  isItalic: boolean;
  isCaps: boolean;
}

const Contact = () => {
  const [letterStates, setLetterStates] = useState<LetterState[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const email = 'thomasderijk@me.com';
  const copiedText = 'copied to clipboard';

  // Initialize with email
  useEffect(() => {
    setLetterStates(email.split('').map(char => ({
      char,
      isCopiedText: false,
      isMirror: false,
      isItalic: false,
      isCaps: false
    })));
  }, []);

  const handleClick = () => {
    if (isAnimating) return;

    navigator.clipboard.writeText(email).then(() => {
      startAnimation();
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = email;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      startAnimation();
    });
  };

  const startAnimation = () => {
    setIsAnimating(true);

    // Clear previous timers
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];

    const emailChars = email.split('');
    const targetChars = copiedText.split('');

    // Create indices for transformation order (random)
    const numChars = Math.max(emailChars.length, targetChars.length);
    const transformOrder = [...Array(numChars).keys()].sort(() => Math.random() - 0.5);

    // Phase 1: Transform to "copied to clipboard"
    transformOrder.forEach((charIndex, orderIndex) => {
      const progress = orderIndex / (transformOrder.length - 1);
      const easedProgress = progress * progress;
      const delay = 33 + easedProgress * 533;

      const timer = setTimeout(() => {
        setLetterStates(prev => {
          const updated = [...prev];
          // Ensure we have enough slots
          while (updated.length <= charIndex) {
            updated.push({ char: '', isCopiedText: false, isMirror: false, isItalic: false, isCaps: false });
          }

          if (charIndex < targetChars.length) {
            updated[charIndex] = {
              char: targetChars[charIndex],
              isCopiedText: true,
              isMirror: Math.random() < 0.5,
              isItalic: Math.random() < 0.5,
              isCaps: Math.random() < 0.3
            };
          } else {
            // Remove extra characters
            updated[charIndex] = { char: '', isCopiedText: false, isMirror: false, isItalic: false, isCaps: false };
          }

          // Don't trim - preserve all characters including spaces

          return updated;
        });
      }, delay);

      timersRef.current.push(timer);

      // Clear effects 0.5s after this letter appears
      const clearTimer = setTimeout(() => {
        setLetterStates(prev => {
          const updated = [...prev];
          if (charIndex < updated.length && updated[charIndex].isCopiedText) {
            updated[charIndex] = {
              ...updated[charIndex],
              isMirror: false,
              isItalic: false,
              isCaps: false
            };
          }
          return updated;
        });
      }, delay + 500);

      timersRef.current.push(clearTimer);
    });

    // Phase 2: Transform back to email
    const phase2Start = 3333;
    const emailOrder = [...Array(Math.max(emailChars.length, targetChars.length)).keys()].sort(() => Math.random() - 0.5);

    emailOrder.forEach((charIndex, orderIndex) => {
      const progress = orderIndex / (emailOrder.length - 1);
      const easedProgress = progress * progress;
      const delay = phase2Start + 33 + easedProgress * 533;

      const timer = setTimeout(() => {
        setLetterStates(prev => {
          const updated = [...prev];

          // Ensure we have enough slots
          while (updated.length <= charIndex) {
            updated.push({ char: '', isCopiedText: false, isMirror: false, isItalic: false, isCaps: false });
          }

          if (charIndex < emailChars.length) {
            updated[charIndex] = {
              char: emailChars[charIndex],
              isCopiedText: false,
              isMirror: false,
              isItalic: false,
              isCaps: false
            };
          } else {
            updated[charIndex] = { char: '', isCopiedText: false, isMirror: false, isItalic: false, isCaps: false };
          }

          // Trim to email length
          if (updated.length > emailChars.length) {
            updated.length = emailChars.length;
          }

          return updated;
        });
      }, delay);

      timersRef.current.push(timer);
    });

    // End animation
    const endTimer = setTimeout(() => {
      setIsAnimating(false);
    }, phase2Start + 666);

    timersRef.current.push(endTimer);
  };

  return (
    <div className="relative z-10 flex items-start justify-center px-4" style={{ height: 'calc(100vh - 64px)', paddingTop: 'calc(50vh - 32px - 1em)' }}>
      <div className="w-full max-w-xs text-center">
        <p
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleClick}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignContent: 'flex-start',
            lineHeight: '1.84em',
          }}
        >
          {letterStates.map((state, index) => {
            const displayChar = state.isCaps ? state.char.toUpperCase() : state.char;

            return (
              <span
                key={index}
                className={state.isCopiedText ? 'font-display text-foreground' : 'text-foreground'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '1.84em',
                  lineHeight: '1.84em',
                  fontWeight: 300,
                  fontSize: state.isCopiedText ? '1.15em' : '1em',
                  fontStyle: state.isItalic ? 'italic' : 'normal',
                  transform: state.isMirror ? 'scaleX(-1)' : 'scaleX(1)',
                }}
              >
                {displayChar === ' ' ? '\u00A0' : displayChar}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
};

export default Contact;
