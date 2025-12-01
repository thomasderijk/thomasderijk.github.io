import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface ShuffleContextType {
  shuffleKey: number;
  triggerShuffle: () => void;
}

const ShuffleContext = createContext<ShuffleContextType | null>(null);

export function ShuffleProvider({ children }: { children: ReactNode }) {
  const [shuffleKey, setShuffleKey] = useState(0);

  const triggerShuffle = () => {
    setShuffleKey(prev => prev + 1);
  };

  return (
    <ShuffleContext.Provider value={{ shuffleKey, triggerShuffle }}>
      {children}
    </ShuffleContext.Provider>
  );
}

export function useShuffle() {
  const context = useContext(ShuffleContext);
  if (!context) {
    throw new Error('useShuffle must be used within ShuffleProvider');
  }
  return context;
}
