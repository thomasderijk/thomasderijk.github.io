import { useState } from 'react';
import { useInvert } from '@/contexts/InvertContext';

const About = () => {
  const { isInverted } = useInvert();
  const [textBackground] = useState<'white-on-black' | 'black-on-white'>(Math.random() < 0.5 ? 'white-on-black' : 'black-on-white');
  const bgColor = textBackground === 'white-on-black' ? '#000000' : '#ffffff';
  const textColor = textBackground === 'white-on-black' ? '#ffffff' : '#000000';

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
