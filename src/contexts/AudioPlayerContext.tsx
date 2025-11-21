import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

// List of all available MP3 files
const AUDIO_FILES = [
  '/media/slavic/slavic phantasmagoria ost.mp3',
  '/media/doodverderf/mp3/a1 I Am Thou.mp3',
  '/media/doodverderf/mp3/a2 ondersteboven.mp3',
  '/media/doodverderf/mp3/a3 I wish for feathers to sprout from my skin.mp3',
  '/media/doodverderf/mp3/a4 sterven = leven.mp3',
  '/media/doodverderf/mp3/a5 manoeuvre.mp3',
  '/media/doodverderf/mp3/b1 core stability.mp3',
  '/media/doodverderf/mp3/b2 stoffelijk overschot.mp3',
  '/media/doodverderf/mp3/b3 release your inhibitions, feel the acid rain on your skin.mp3',
  '/media/doodverderf/mp3/b4 foraging.mp3',
  '/media/doodverderf/mp3/b5 Thou Art I.mp3',
  '/media/plmaith/mp3/1_Please_master.mp3',
  '/media/plmaith/mp3/2_Let Me_master.mp3',
  '/media/plmaith/mp3/3_Assimilate_master.mp3',
  '/media/plmaith/mp3/4_Into The_master.mp3',
  '/media/plmaith/mp3/5_Hivemind_master.mp3',
  '/media/djbuntitled/01 Lots of Oil.mp3',
  '/media/djbuntitled/02 Atlantic.mp3',
  '/media/djbuntitled/03 NYSE.mp3',
  '/media/djbuntitled/04 40,000k Vanilla.mp3',
  '/media/djbuntitled/05 Multiple Mishaps.mp3',
  '/media/djbuntitled/06 XMTR.mp3',
  '/media/djbuntitled/07 Below Average.mp3',
  '/media/djbuntitled/08 Slow Rise.mp3',
  '/media/djbuntitled/09 Procter & Gamble.mp3',
  '/media/djbuntitled/10 DJX.mp3',
  '/media/djbuntitled/11 Above Average.mp3',
];

interface AudioPlayerContextType {
  isPlaying: boolean;
  currentTrack: string | null;
  play: () => void;
  pause: () => void;
  pauseForMedia: () => void;
  resumeAfterMedia: () => void;
  togglePlay: () => void;
  nextTrack: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wasPlayingBeforePauseRef = useRef(false);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = 0.7;

    // Handle track ending - play next random track
    const handleEnded = () => {
      nextTrack();
    };

    audioRef.current.addEventListener('ended', handleEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const getRandomTrack = (excludeCurrent?: string): string => {
    const availableTracks = excludeCurrent
      ? AUDIO_FILES.filter(track => track !== excludeCurrent)
      : AUDIO_FILES;
    return availableTracks[Math.floor(Math.random() * availableTracks.length)];
  };

  const play = () => {
    if (!audioRef.current) return;

    if (!currentTrack) {
      // First time playing - pick a random track
      const track = getRandomTrack();
      setCurrentTrack(track);
      audioRef.current.src = track;
    }
    // Note: Don't reset src if track exists - this would reset playback position

    audioRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch((error) => {
      console.error('Error playing audio:', error);
    });
  };

  const pause = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const pauseForMedia = () => {
    if (!audioRef.current) return;
    wasPlayingBeforePauseRef.current = isPlaying;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumeAfterMedia = () => {
    if (!audioRef.current) return;
    if (wasPlayingBeforePauseRef.current && currentTrack) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.error('Error resuming audio:', error);
      });
    }
    wasPlayingBeforePauseRef.current = false;
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const nextTrack = () => {
    if (!audioRef.current) return;

    const newTrack = getRandomTrack(currentTrack || undefined);
    setCurrentTrack(newTrack);
    audioRef.current.src = newTrack;

    audioRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch((error) => {
      console.error('Error playing next track:', error);
    });
  };

  return (
    <AudioPlayerContext.Provider value={{
      isPlaying,
      currentTrack,
      play,
      pause,
      pauseForMedia,
      resumeAfterMedia,
      togglePlay,
      nextTrack,
    }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  }
  return context;
}
