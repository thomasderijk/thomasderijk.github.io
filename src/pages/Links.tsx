import { useState, useEffect, useRef } from 'react';
import { useInvert } from '@/contexts/InvertContext';
import { StaggeredMirrorText } from '@/components/StaggeredMirrorText';

interface LetterState {
  char: string;
  isCopiedText: boolean;
  isMirror: boolean;
  isItalic: boolean;
  isCaps: boolean;
}

const Links = () => {
  const { isInverted } = useInvert();
  const [letterStates, setLetterStates] = useState<LetterState[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [textBackground] = useState<'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light'>(() => {
    const random = Math.random();
    if (random < 0.25) return 'white-on-black';      // 10% bg, 90% text
    if (random < 0.5) return 'black-on-white';       // 90% bg, 10% text
    if (random < 0.75) return 'white-on-dark';       // 20% bg, 90% text
    return 'black-on-light';                          // 80% bg, 10% text
  });

  // Random color variant for each link
  const [linkColors] = useState<('white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light')[]>(() => {
    const getRandomVariant = () => {
      const random = Math.random();
      if (random < 0.25) return 'white-on-black';
      if (random < 0.5) return 'black-on-white';
      if (random < 0.75) return 'white-on-dark';
      return 'black-on-light';
    };
    return [
      getRandomVariant(), // Instagram
      getRandomVariant(), // YouTube
      getRandomVariant(), // SoundCloud
      getRandomVariant(), // Bandcamp
      getRandomVariant(), // GitHub
    ];
  });

  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const email = 'thomasderijk@me.com';
  const copiedText = 'copied to clipboard';

  const links = [
    { name: 'Instagram', url: 'https://instagram.com/thomas_djb' },
    { name: 'YouTube', url: 'https://youtube.com/thomasderijk' },
    { name: 'SoundCloud', url: 'https://soundcloud.com/djbdjbdjb' },
    { name: 'Bandcamp', url: 'https://djbdjbdjb.bandcamp.com/' },
    { name: 'GitHub', url: 'https://github.com/thomasderijk' },
  ];

  // Initialize with email
  useEffect(() => {
    setLetterStates(email.split('').map(char => ({
      char,
      isCopiedText: false,
      isMirror: false,
      isItalic: false,
      isCaps: false
    })));

    // Cleanup all timers on unmount to prevent memory leaks
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  const handleClick = () => {
    if (isAnimating) return;

    navigator.clipboard.writeText(email).then(() => {
      startAnimation();
    }).catch(() => {
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

    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];

    const emailChars = email.split('');
    const targetChars = copiedText.split('');

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
            updated[charIndex] = { char: '', isCopiedText: false, isMirror: false, isItalic: false, isCaps: false };
          }

          return updated;
        });
      }, delay);

      timersRef.current.push(timer);

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

          if (updated.length > emailChars.length) {
            updated.length = emailChars.length;
          }

          return updated;
        });
      }, delay);

      timersRef.current.push(timer);
    });

    const endTimer = setTimeout(() => {
      setIsAnimating(false);
    }, phase2Start + 666);

    timersRef.current.push(endTimer);
  };

  return (
    <div className="relative z-10 flex items-start justify-center px-4 pointer-events-none" style={{ height: 'calc(100vh - 64px)', paddingTop: 'calc(50vh - 32px - 6em)' }}>
      <div className="w-full max-w-md pointer-events-auto">
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center">
            {links.map((link, linkIndex) => {
              const linkVariant = linkColors[linkIndex];
              return (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display font-normal whitespace-nowrap"
                >
                  <StaggeredMirrorText text={link.name} forcedVariant={linkVariant} />
                </a>
              );
            })}
          </div>

          <div className="w-full max-w-xs flex justify-center">
            <p
              className="cursor-pointer transition-opacity"
              onClick={handleClick}
              style={{
                display: 'inline-block',
                backgroundColor:
                  textBackground === 'white-on-black' ? 'hsl(0, 0%, 10%)' :
                  textBackground === 'black-on-white' ? 'hsl(0, 0%, 90%)' :
                  textBackground === 'white-on-dark' ? 'hsl(0, 0%, 20%)' :
                  'hsl(0, 0%, 80%)', // black-on-light
                color:
                  textBackground === 'white-on-black' || textBackground === 'white-on-dark'
                    ? 'hsl(0, 0%, 100%)'
                    : 'hsl(0, 0%, 0%)',
                padding: '2px 4px',
                lineHeight: '1.84em',
              }}
            >
              {letterStates.map((state, index) => {
                const displayChar = state.isCaps ? state.char.toUpperCase() : state.char;

                return (
                  <span
                    key={index}
                    className={state.isCopiedText ? 'font-display' : ''}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '1.84em',
                      lineHeight: '1.84em',
                      fontWeight: 400,
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
      </div>
    </div>
  );
};

export default Links;
