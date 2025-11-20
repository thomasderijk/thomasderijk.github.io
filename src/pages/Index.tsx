import { Link } from 'react-router-dom';
import { useMemo, useRef } from 'react';
import { StaggeredMirrorText } from '@/components/StaggeredMirrorText';

// Track if initial load animation has been shown (persists across remounts)
let hasShownInitialAnimation = false;

const Index = () => {
  // Check if this is the first load
  const isFirstLoad = useRef(!hasShownInitialAnimation);

  // Mark animation as shown after first render
  if (!hasShownInitialAnimation) {
    hasShownInitialAnimation = true;
  }
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

    // Assign timing to each letter with ease-in curve (slow start, fast end)
    const schedules: number[][] = words.map(word => new Array(word.length).fill(0));
    const totalLetters = shuffled.length;
    const totalDuration = 1500; // total animation duration in ms
    const initialDelay = 100; // 100ms delay before animation starts

    shuffled.forEach((letter, orderIndex) => {
      // Quadratic ease-in: progress^2 makes early letters slower, later letters faster
      const progress = orderIndex / (totalLetters - 1);
      const easedProgress = progress * progress;
      const delay = initialDelay + (easedProgress * totalDuration);
      schedules[letter.wordIndex][letter.letterIndex] = delay;
    });

    return schedules;
  }, []);

  return (
    <div
      className="relative z-10 flex flex-col items-center justify-center min-h-screen gap-0 text-center px-4 pointer-events-none"
    >
      <Link to="/audio" className="text-4xl font-display font-bold text-foreground pointer-events-auto">
        <StaggeredMirrorText text="audio" animateOnLoad={isFirstLoad.current} animationSchedule={animationSchedules[0]} />
      </Link>
      <Link to="/visual" className="text-4xl font-display font-bold text-foreground pointer-events-auto">
        <StaggeredMirrorText text="visual" animateOnLoad={isFirstLoad.current} animationSchedule={animationSchedules[1]} />
      </Link>
      <Link to="/about" className="text-4xl font-display font-bold text-foreground pointer-events-auto">
        <StaggeredMirrorText text="about" animateOnLoad={isFirstLoad.current} animationSchedule={animationSchedules[2]} />
      </Link>
      <Link to="/links" className="text-4xl font-display font-bold text-foreground pointer-events-auto">
        <StaggeredMirrorText text="links" animateOnLoad={isFirstLoad.current} animationSchedule={animationSchedules[3]} />
      </Link>
      <Link to="/contact" className="text-4xl font-display font-bold text-foreground pointer-events-auto">
        <StaggeredMirrorText text="contact" animateOnLoad={isFirstLoad.current} animationSchedule={animationSchedules[4]} />
      </Link>
    </div>
  );
};

export default Index;
