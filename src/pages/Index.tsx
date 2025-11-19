import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { StaggeredMirrorText } from '@/components/StaggeredMirrorText';

const Index = () => {
  // Generate coordinated animation schedule for all letters across all words
  const animationSchedules = useMemo(() => {
    const words = ['audio', 'visual', 'about', 'links', 'contact'];

    // Create a flat list of all letters with their word index
    const allLetters: { wordIndex: number; letterIndex: number }[] = [];
    words.forEach((word, wordIndex) => {
      word.split('').forEach((_, letterIndex) => {
        allLetters.push({ wordIndex, letterIndex });
      });
    });

    // Shuffle all letters randomly
    const shuffled = [...allLetters].sort(() => Math.random() - 0.5);

    // Assign timing to each letter (50-150ms apart)
    const schedules: number[][] = words.map(word => new Array(word.length).fill(0));

    shuffled.forEach((letter, orderIndex) => {
      const delay = orderIndex * (5 + Math.random() * 25);
      schedules[letter.wordIndex][letter.letterIndex] = delay;
    });

    return schedules;
  }, []);

  return (
    <div
      className="relative z-10 flex flex-col items-center justify-center min-h-screen gap-0 text-center px-4 pointer-events-none"
    >
      <Link to="/audio" className="text-2xl md:text-4xl font-display font-bold text-foreground pointer-events-auto">
        <StaggeredMirrorText text="audio" animateOnLoad animationSchedule={animationSchedules[0]} />
      </Link>
      <Link to="/visual" className="text-2xl md:text-4xl font-display font-bold text-foreground pointer-events-auto">
        <StaggeredMirrorText text="visual" animateOnLoad animationSchedule={animationSchedules[1]} />
      </Link>
      <Link to="/about" className="text-2xl md:text-4xl font-display font-bold text-foreground pointer-events-auto">
        <StaggeredMirrorText text="about" animateOnLoad animationSchedule={animationSchedules[2]} />
      </Link>
      <Link to="/links" className="text-2xl md:text-4xl font-display font-bold text-foreground pointer-events-auto">
        <StaggeredMirrorText text="links" animateOnLoad animationSchedule={animationSchedules[3]} />
      </Link>
      <a href="mailto:thomasderijk@me.com" className="text-2xl md:text-4xl font-display font-bold text-foreground pointer-events-auto">
        <StaggeredMirrorText text="contact" animateOnLoad animationSchedule={animationSchedules[4]} />
      </a>
    </div>
  );
};

export default Index;
