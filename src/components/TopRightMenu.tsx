import { useState, useEffect } from 'react';
import { IntenseGlitchText } from './IntenseGlitchText';
import { NavSpacer } from './NavSpacer';
import { useShuffle } from '@/contexts/ShuffleContext';
import { useProjectDetail } from '@/contexts/ProjectDetailContext';

type ColorOption = 'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light';

/**
 * Top right menu displaying "Thomas de Rijk" with nav spacers and intense glitch effects
 */
export const TopRightMenu = () => {
  const words = ['Thomas', 'de', 'Rijk'];
  const { shuffleKey } = useShuffle();
  const { isProjectOpen } = useProjectDetail();

  // Don't render when project detail is open
  if (isProjectOpen) {
    return null;
  }

  // Generate random colors for each word (ensuring adjacent words don't match)
  const generateWordColors = (): ColorOption[] => {
    const options: ColorOption[] = ['white-on-black', 'black-on-white', 'white-on-dark', 'black-on-light'];
    const colors: ColorOption[] = [];

    // First word - random choice
    colors[0] = options[Math.floor(Math.random() * options.length)];

    // Second word - must differ from first
    const availableForSecond = options.filter(opt => opt !== colors[0]);
    colors[1] = availableForSecond[Math.floor(Math.random() * availableForSecond.length)];

    // Third word - must differ from second
    const availableForThird = options.filter(opt => opt !== colors[1]);
    colors[2] = availableForThird[Math.floor(Math.random() * availableForThird.length)];

    return colors;
  };

  const [wordColors, setWordColors] = useState<ColorOption[]>(() => generateWordColors());

  // Counter for regenerating spacers (increments to force re-randomization)
  const [spacerKey1, setSpacerKey1] = useState(0);
  const [spacerKey2, setSpacerKey2] = useState(0);
  const [spacerKey3, setSpacerKey3] = useState(0);

  // Re-randomize word colors and spacers when shuffle is triggered
  useEffect(() => {
    setWordColors(generateWordColors());
    setSpacerKey1(prev => prev + 1);
    setSpacerKey2(prev => prev + 1);
    setSpacerKey3(prev => prev + 1);
  }, [shuffleKey]);

  // Re-randomize spacers periodically (optional, mimics nav behavior)
  useEffect(() => {
    const interval = setInterval(() => {
      setSpacerKey1(prev => prev + 1);
      setSpacerKey2(prev => prev + 1);
      setSpacerKey3(prev => prev + 1);
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="fixed top-0 right-0 z-20 flex items-center pointer-events-none" style={{ lineHeight: 1, fontSize: '16px' }}>
      <div className="flex items-center gap-0">
        <div className="pointer-events-auto">
          <IntenseGlitchText text={words[0]} forcedVariant={wordColors[0]} />
        </div>
        <NavSpacer regenerateKey={spacerKey1} />
        <div className="pointer-events-auto">
          <IntenseGlitchText text={words[1]} forcedVariant={wordColors[1]} />
        </div>
        <NavSpacer regenerateKey={spacerKey2} />
        <div className="pointer-events-auto">
          <IntenseGlitchText text={words[2]} forcedVariant={wordColors[2]} />
        </div>
        <NavSpacer regenerateKey={spacerKey3} />
      </div>
    </nav>
  );
};
