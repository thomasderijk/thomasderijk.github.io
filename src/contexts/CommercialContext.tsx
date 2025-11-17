import { createContext, useContext, useState, ReactNode } from 'react';

interface CommercialContextType {
  showCommercial: boolean;
  setShowCommercial: (show: boolean) => void;
}

const CommercialContext = createContext<CommercialContextType | undefined>(undefined);

export const CommercialProvider = ({ children }: { children: ReactNode }) => {
  const [showCommercial, setShowCommercial] = useState(false);

  return (
    <CommercialContext.Provider value={{ showCommercial, setShowCommercial }}>
      {children}
    </CommercialContext.Provider>
  );
};

export const useCommercial = () => {
  const context = useContext(CommercialContext);
  if (context === undefined) {
    throw new Error('useCommercial must be used within a CommercialProvider');
  }
  return context;
};
