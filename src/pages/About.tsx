import { useState } from 'react';
import { useInvert } from '@/contexts/InvertContext';

const About = () => {
  const { isInverted } = useInvert();
  const [textBackground] = useState<'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light'>(() => {
    const random = Math.random();
    if (random < 0.25) return 'white-on-black';      // 10% bg, 90% text
    if (random < 0.5) return 'black-on-white';       // 90% bg, 10% text
    if (random < 0.75) return 'white-on-dark';       // 20% bg, 90% text
    return 'black-on-light';                          // 80% bg, 10% text
  });
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
      <div className="w-full max-w-xs text-center pointer-events-auto">
        <p className="leading-relaxed" style={{
          backgroundColor: bgColor,
          color: textColor,
          padding: '2px 4px',
          display: 'inline-block',
        }}>
          Thomas de Rijk is an Amsterdam based audiovisual artist, 3D generalist, director, musician and sound designer.
        </p>
      </div>
    </div>
  );
};

export default About;
