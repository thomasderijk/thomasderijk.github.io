import { useState, useEffect, useRef } from 'react';
import { useInvert } from '@/contexts/InvertContext';
import { useShuffle } from '@/contexts/ShuffleContext';
import { StaggeredMirrorText } from '@/components/StaggeredMirrorText';
import { TopRightMenu } from '@/components/TopRightMenu';

interface LetterState {
  char: string;
  isCopiedText: boolean;
  isMirror: boolean;
  isItalic: boolean;
  isCaps: boolean;
}

const Links = () => {
  const { isInverted } = useInvert();
  const { shuffleKey } = useShuffle();
  const [letterStates, setLetterStates] = useState<LetterState[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isEmailHovered, setIsEmailHovered] = useState(false);

  type ColorOption = 'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light';

  // Generate colors ensuring each is different from the previous one
  const generateColors = (count: number): ColorOption[] => {
    const colors: ColorOption[] = [];
    const options: ColorOption[] = ['white-on-black', 'black-on-white', 'white-on-dark', 'black-on-light'];

    for (let i = 0; i < count; i++) {
      let availableOptions = options;
      if (i > 0) {
        // Filter out the previous color
        availableOptions = options.filter(opt => opt !== colors[i - 1]);
      }
      const randomIndex = Math.floor(Math.random() * availableOptions.length);
      colors.push(availableOptions[randomIndex]);
    }
    return colors;
  };

  // Generate 6 colors total: 5 for links + 1 for email
  const [allColors, setAllColors] = useState<ColorOption[]>(() => generateColors(6));

  // Split colors: first 5 for links, last one for email
  const linkColors = allColors.slice(0, 5);
  const textBackground = allColors[5];

  // Regenerate colors when shuffle is triggered
  useEffect(() => {
    setAllColors(generateColors(6));
  }, [shuffleKey]);

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
    <>
      <TopRightMenu />
      <div className="relative z-10 flex items-start justify-center px-4 pointer-events-none" style={{ minHeight: 'calc(100vh - 64px)', paddingTop: 'calc(50vh - 32px - 6em)', paddingBottom: '80px' }}>
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
                  className="font-display font-light whitespace-nowrap"
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
              onMouseEnter={() => setIsEmailHovered(true)}
              onMouseLeave={() => setIsEmailHovered(false)}
              style={{
                display: 'inline-block',
                backgroundColor: isEmailHovered ? (
                  textBackground === 'white-on-black' || textBackground === 'white-on-dark'
                    ? 'hsl(0, 0%, 100%)'
                    : 'hsl(0, 0%, 0%)'
                ) : (
                  textBackground === 'white-on-black' ? 'hsl(0, 0%, 10%)' :
                  textBackground === 'black-on-white' ? 'hsl(0, 0%, 90%)' :
                  textBackground === 'white-on-dark' ? 'hsl(0, 0%, 20%)' :
                  'hsl(0, 0%, 80%)' // black-on-light
                ),
                color: isEmailHovered ? (
                  textBackground === 'white-on-black' ? 'hsl(0, 0%, 10%)' :
                  textBackground === 'black-on-white' ? 'hsl(0, 0%, 90%)' :
                  textBackground === 'white-on-dark' ? 'hsl(0, 0%, 20%)' :
                  'hsl(0, 0%, 80%)' // black-on-light
                ) : (
                  textBackground === 'white-on-black' || textBackground === 'white-on-dark'
                    ? 'hsl(0, 0%, 100%)'
                    : 'hsl(0, 0%, 0%)'
                ),
                padding: '2px 4px',
                lineHeight: '1.84em',
                transition: 'background-color 0s, color 0s',
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
                      fontWeight: 300,
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
    </>
  );
};

export default Links;
