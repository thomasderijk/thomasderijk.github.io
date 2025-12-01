import { useState, useEffect } from 'react';
import { useInvert } from '@/contexts/InvertContext';
import { useShuffle } from '@/contexts/ShuffleContext';

const About = () => {
  const { isInverted } = useInvert();
  const { shuffleKey } = useShuffle();

  const getRandomVariant = (): 'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light' => {
    const random = Math.random();
    if (random < 0.25) return 'white-on-black';      // 10% bg, 90% text
    if (random < 0.5) return 'black-on-white';       // 90% bg, 10% text
    if (random < 0.75) return 'white-on-dark';       // 20% bg, 90% text
    return 'black-on-light';                          // 80% bg, 10% text
  };

  const [textBackground, setTextBackground] = useState<'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light'>(getRandomVariant);

  // Regenerate color when shuffle is triggered
  useEffect(() => {
    setTextBackground(getRandomVariant());
  }, [shuffleKey]);
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
    <div className="relative z-10 flex items-center justify-center px-4 pointer-events-none" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="w-full max-w-xs text-center pointer-events-auto" style={{ lineHeight: 1.4 }}>
        <p className="font-display font-light" style={{
          backgroundColor: bgColor,
          color: textColor,
          padding: '2px 4px',
          display: 'inline',
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
          lineHeight: 1.4,
          fontWeight: 300,
        }}>
          Thomas de Rijk is an Amsterdam based audiovisual artist, 3D generalist, director, musician and sound designer.
        </p>
      </div>
    </div>
  );
};

export default About;
