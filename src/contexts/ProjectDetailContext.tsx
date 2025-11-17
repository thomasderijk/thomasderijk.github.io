import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ProjectDetailContextType {
  isProjectOpen: boolean;
  setIsProjectOpen: (isOpen: boolean) => void;
  closeHandler: (() => void) | null;
  setCloseHandler: (handler: (() => void) | null) => void;
}

const ProjectDetailContext = createContext<ProjectDetailContextType | undefined>(undefined);

export const ProjectDetailProvider = ({ children }: { children: ReactNode }) => {
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [closeHandler, setCloseHandler] = useState<(() => void) | null>(null);

  const updateCloseHandler = useCallback((handler: (() => void) | null) => {
    setCloseHandler(() => handler);
  }, []);

  return (
    <ProjectDetailContext.Provider value={{ isProjectOpen, setIsProjectOpen, closeHandler, setCloseHandler: updateCloseHandler }}>
      {children}
    </ProjectDetailContext.Provider>
  );
};

export const useProjectDetail = () => {
  const context = useContext(ProjectDetailContext);
  if (context === undefined) {
    throw new Error('useProjectDetail must be used within a ProjectDetailProvider');
  }
  return context;
};
