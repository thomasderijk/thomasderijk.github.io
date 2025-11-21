import { createContext, useContext, useState, ReactNode } from 'react';

interface InvertContextType {
  isInverted: boolean;
  toggleInvert: () => void;
}

const InvertContext = createContext<InvertContextType | null>(null);

export const InvertProvider = ({ children }: { children: ReactNode }) => {
  const [isInverted, setIsInverted] = useState(false);

  const toggleInvert = () => setIsInverted((prev) => !prev);

  return (
    <InvertContext.Provider value={{ isInverted, toggleInvert }}>
      {children}
    </InvertContext.Provider>
  );
};

export const useInvert = () => {
  const context = useContext(InvertContext);
  if (!context) {
    throw new Error('useInvert must be used within an InvertProvider');
  }
  return context;
};
