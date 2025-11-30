import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

// List of all available MP3 files
const AUDIO_FILES = [
  '/media/slavic/slavic phantasmagoria ost.mp3',
  '/media/doodverderf/mp3/01_I Am Thou.mp3',
  '/media/doodverderf/mp3/02_ondersteboven.mp3',
  '/media/doodverderf/mp3/03_I wish for feathers to sprout from my skin.mp3',
  '/media/doodverderf/mp3/04_sterven = leven.mp3',
  '/media/doodverderf/mp3/05_manoeuvre.mp3',
  '/media/doodverderf/mp3/06_core stability.mp3',
  '/media/doodverderf/mp3/07_stoffelijk overschot.mp3',
  '/media/doodverderf/mp3/08_release your inhibitions, feel the acid rain on your skin.mp3',
  '/media/doodverderf/mp3/09_foraging.mp3',
  '/media/doodverderf/mp3/10_Thou Art I.mp3',
  '/media/plmaith/mp3/01_Please.mp3',
  '/media/plmaith/mp3/02_Let Me.mp3',
  '/media/plmaith/mp3/03_Assimilate.mp3',
  '/media/plmaith/mp3/04_Into The.mp3',
  '/media/plmaith/mp3/05_Hivemind.mp3',
  '/media/djbuntitled/01_Lots of Oil.mp3',
  '/media/djbuntitled/02_Atlantic.mp3',
  '/media/djbuntitled/03_NYSE.mp3',
  '/media/djbuntitled/04_40,000k Vanilla.mp3',
  '/media/djbuntitled/05_Multiple Mishaps.mp3',
  '/media/djbuntitled/06_XMTR.mp3',
  '/media/djbuntitled/07_Below Average.mp3',
  '/media/djbuntitled/08_Slow Rise.mp3',
  '/media/djbuntitled/09_Procter & Gamble.mp3',
  '/media/djbuntitled/10_DJX.mp3',
  '/media/djbuntitled/11_Above Average.mp3',
];

interface AudioPlayerContextType {
  isPlaying: boolean;
  currentTrack: string | null;
  currentTime: number;
  duration: number;
  play: () => void;
  pause: () => void;
  pauseForMedia: () => void;
  resumeAfterMedia: () => void;
  togglePlay: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seek: (time: number) => void;
  getTrackTitle: (track: string | null) => string;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wasPlayingBeforePauseRef = useRef(false);
  const trackHistoryRef = useRef<string[]>([]);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = 0.7;

    const audio = audioRef.current;

    // Handle time updates
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    // Handle duration loaded
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.pause();
    };
  }, []);

  // Handle track ending
  useEffect(() => {
    if (!audioRef.current) return;

    const handleEnded = () => {
      // Call nextTrack when song ends
      if (!audioRef.current) return;

      // Add current track to history
      if (currentTrack) {
        trackHistoryRef.current.push(currentTrack);
        if (trackHistoryRef.current.length > 50) {
          trackHistoryRef.current.shift();
        }
      }

      const newTrack = getRandomTrack(currentTrack || undefined);
      setCurrentTrack(newTrack);
      audioRef.current.src = newTrack;
      setCurrentTime(0);

      // Play - browser will load and play automatically
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.error('Error playing next track:', error);
      });
    };

    audioRef.current.addEventListener('ended', handleEnded);

    return () => {
      audioRef.current?.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack]);

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

    // Set isPlaying immediately so UI updates
    setIsPlaying(true);

    // Play - browser will load and play automatically
    audioRef.current.play().catch((error) => {
      console.error('Error playing audio:', error);
      setIsPlaying(false); // Reset if play fails
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

    // Add current track to history before switching
    if (currentTrack) {
      trackHistoryRef.current.push(currentTrack);
      // Keep only last 50 tracks in history
      if (trackHistoryRef.current.length > 50) {
        trackHistoryRef.current.shift();
      }
    }

    const newTrack = getRandomTrack(currentTrack || undefined);
    setCurrentTrack(newTrack);
    audioRef.current.src = newTrack;
    setCurrentTime(0);

    // Play - browser will load and play automatically
    audioRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch((error) => {
      console.error('Error playing next track:', error);
    });
  };

  const previousTrack = () => {
    if (!audioRef.current) return;

    // If more than 3 seconds into current track, restart it
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    // Otherwise go to previous track from history
    if (trackHistoryRef.current.length > 0) {
      const previousTrack = trackHistoryRef.current.pop()!;
      setCurrentTrack(previousTrack);
      audioRef.current.src = previousTrack;
      setCurrentTime(0);

      // Play - browser will load and play automatically
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.error('Error playing previous track:', error);
      });
    } else {
      // No history, just restart current track
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const seek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const getTrackTitle = (track: string | null): string => {
    if (!track) return '';

    // Get filename from path
    const filename = track.split('/').pop() || '';

    // Remove .mp3 extension
    const nameWithoutExt = filename.replace('.mp3', '');

    // Find first underscore and remove everything before it (including the underscore)
    const underscoreIndex = nameWithoutExt.indexOf('_');
    if (underscoreIndex !== -1) {
      return nameWithoutExt.substring(underscoreIndex + 1);
    }

    // If no underscore, return as is
    return nameWithoutExt;
  };

  return (
    <AudioPlayerContext.Provider value={{
      isPlaying,
      currentTrack,
      currentTime,
      duration,
      play,
      pause,
      pauseForMedia,
      resumeAfterMedia,
      togglePlay,
      nextTrack,
      previousTrack,
      seek,
      getTrackTitle,
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
