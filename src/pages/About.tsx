import { useInvert } from '@/contexts/InvertContext';

const About = () => {
  const { isInverted } = useInvert();

  return (
    <div className="relative z-10 flex items-center justify-center px-4 pointer-events-none" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="w-full max-w-xs text-center pointer-events-auto">
        <p className={`${isInverted ? 'text-black' : 'text-foreground'} leading-relaxed`}>
          Thomas de Rijk is an Amsterdam based audiovisual artist, 3D generalist, director, musician and sound designer.
        </p>
      </div>
    </div>
  );
};

export default About;
