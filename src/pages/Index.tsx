import { Link } from 'react-router-dom';
import { StaggeredMirrorText } from '@/components/StaggeredMirrorText';

const Index = () => {
  return (
    <div
      className="relative z-10 flex flex-col items-center justify-center min-h-screen gap-0 text-center px-4 pointer-events-none"
    >
      <Link to="/audio" className="text-2xl md:text-4xl font-display font-bold text-foreground pointer-events-auto">
        <StaggeredMirrorText text="audio" />
      </Link>
      <Link to="/visual" className="text-2xl md:text-4xl font-display font-bold text-foreground pointer-events-auto">
        <StaggeredMirrorText text="visual" />
      </Link>
      <Link to="/about" className="text-2xl md:text-4xl font-display font-bold text-foreground pointer-events-auto">
        <StaggeredMirrorText text="about" />
      </Link>
      <Link to="/links" className="text-2xl md:text-4xl font-display font-bold text-foreground pointer-events-auto">
        <StaggeredMirrorText text="links" />
      </Link>
      <a href="mailto:thomasderijk@me.com" className="text-2xl md:text-4xl font-display font-bold text-foreground pointer-events-auto">
        <StaggeredMirrorText text="contact" />
      </a>
    </div>
  );
};

export default Index;
