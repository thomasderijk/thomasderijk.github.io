import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ProjectDetailContextType {
  isProjectOpen: boolean;
  setIsProjectOpen: (isOpen: boolean) => void;
  closeHandler: (() => void) | null;
  setCloseHandler: (handler: (() => void) | null) => void;
  openProjectHandler: ((projectId: string) => void) | null;
  setOpenProjectHandler: (handler: ((projectId: string) => void) | null) => void;
}

const ProjectDetailContext = createContext<ProjectDetailContextType | undefined>(undefined);

export const ProjectDetailProvider = ({ children }: { children: ReactNode }) => {
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [closeHandler, setCloseHandler] = useState<(() => void) | null>(null);
  const [openProjectHandler, setOpenProjectHandler] = useState<((projectId: string) => void) | null>(null);

  const updateCloseHandler = useCallback((handler: (() => void) | null) => {
    setCloseHandler(() => handler);
  }, []);

  const updateOpenProjectHandler = useCallback((handler: ((projectId: string) => void) | null) => {
    setOpenProjectHandler(() => handler);
  }, []);

  return (
    <ProjectDetailContext.Provider value={{
      isProjectOpen,
      setIsProjectOpen,
      closeHandler,
      setCloseHandler: updateCloseHandler,
      openProjectHandler,
      setOpenProjectHandler: updateOpenProjectHandler
    }}>
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
