import { useState, useEffect, useRef } from 'react';

interface LetterState {
  char: string;
  isCopiedText: boolean; // true = from "copied to clipboard" (Tiepolo), false = email (Inter)
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
      isCopiedText: false
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
      const delay = 50 + easedProgress * 800;

      const timer = setTimeout(() => {
        setLetterStates(prev => {
          const updated = [...prev];
          // Ensure we have enough slots
          while (updated.length <= charIndex) {
            updated.push({ char: '', isCopiedText: false });
          }

          if (charIndex < targetChars.length) {
            updated[charIndex] = {
              char: targetChars[charIndex],
              isCopiedText: true
            };
          } else {
            // Remove extra characters
            updated[charIndex] = { char: '', isCopiedText: false };
          }

          // Trim empty characters from end
          while (updated.length > 0 && updated[updated.length - 1].char === '') {
            updated.pop();
          }

          return updated;
        });
      }, delay);

      timersRef.current.push(timer);
    });

    // Phase 2: Transform back to email
    const phase2Start = 10000;
    const emailOrder = [...Array(Math.max(emailChars.length, targetChars.length)).keys()].sort(() => Math.random() - 0.5);

    emailOrder.forEach((charIndex, orderIndex) => {
      const progress = orderIndex / (emailOrder.length - 1);
      const easedProgress = progress * progress;
      const delay = phase2Start + 50 + easedProgress * 800;

      const timer = setTimeout(() => {
        setLetterStates(prev => {
          const updated = [...prev];

          // Ensure we have enough slots
          while (updated.length <= charIndex) {
            updated.push({ char: '', isCopiedText: false });
          }

          if (charIndex < emailChars.length) {
            updated[charIndex] = {
              char: emailChars[charIndex],
              isCopiedText: false
            };
          } else {
            updated[charIndex] = { char: '', isCopiedText: false };
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
      setLetterStates(email.split('').map(char => ({
        char,
        isCopiedText: false
      })));
    }, phase2Start + 1000);

    timersRef.current.push(endTimer);
  };

  return (
    <div className="relative z-10 flex items-center justify-center px-4" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="w-full max-w-xs text-center">
        <p
          className="text-foreground leading-relaxed cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleClick}
        >
          {letterStates.map((state, index) => (
            <span
              key={index}
              style={{
                fontFamily: state.isCopiedText ? 'Tiepolo, serif' : 'Inter, sans-serif',
                fontStyle: 'normal',
              }}
            >
              {state.char}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
};

export default Contact;
