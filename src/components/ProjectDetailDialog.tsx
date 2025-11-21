import { Project } from '@/types/project';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MediaRenderer } from './MediaRenderer';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AudioPlaylistMinimal } from './AudioPlaylistMinimal';

interface ProjectDetailDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProjectDetailDialog = ({ project, open, onOpenChange }: ProjectDetailDialogProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const isScrollableRef = useRef(true);

  // Reset indicator when modal opens or project changes
  useEffect(() => {
    if (open) {
      // Hide while checking
      setShowScrollIndicator(false);
      isScrollableRef.current = true;
      
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
      
      // Check scrollability after content loads
      const timer = setTimeout(() => {
        if (scrollRef.current) {
          const isScrollable = scrollRef.current.scrollHeight > scrollRef.current.clientHeight;
          console.log('CHECK:', scrollRef.current.scrollHeight, scrollRef.current.clientHeight, isScrollable);
          isScrollableRef.current = isScrollable;
          if (isScrollable) {
            setShowScrollIndicator(true);
          }
        }
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [open, project]);

  // Handle scroll
  const handleScroll = () => {
    if (scrollRef.current && isScrollableRef.current) {
      setShowScrollIndicator(scrollRef.current.scrollTop < 50);
    }
  };

  if (!project) return null;

  // Filter out thumbnail files from the modal display, BUT keep single images
  const allImages = project.media.filter(m => m.type === 'image');
  const hasAudio = project.media.some(m => m.type === 'audio');
  const isSingleImageWithAudio = allImages.length === 1 && hasAudio;
  
  const nonThumbnailMedia = project.media.filter(mediaItem => {
    const isThumbnail = mediaItem.url.toLowerCase().includes('_thumbnail.');
    
    // If it's a thumbnail file, exclude it
    if (isThumbnail) return false;
    
    // If it's the single image in a project with audio, keep it (even though it's used as thumbnail)
    if (isSingleImageWithAudio && mediaItem.type === 'image') return true;
    
    // Keep all other media
    return true;
  });

  // Separate audio files from other media
  const audioMedia = nonThumbnailMedia.filter(m => m.type === 'audio');
  const nonAudioMedia = nonThumbnailMedia.filter(m => m.type !== 'audio');
  const hasMultipleAudio = audioMedia.length > 1;
  const audioUrls = audioMedia.map(m => m.url);

  // Determine if we should use side-by-side layout
  const useSideBySide = project.layout === 'sidebyside';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-h-[95vh] !p-0 ${useSideBySide ? 'md:!min-w-[800px] lg:!min-w-[900px]' : ''}`}>
        <div className="flex flex-col max-h-[95vh] relative p-6">
          <DialogHeader className="text-left flex-shrink-0">
            <DialogTitle className="text-xl sm:text-3xl font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>
              {project.title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Project details for {project.title}
            </DialogDescription>
          </DialogHeader>

          <div 
            className="overflow-y-auto flex-1 min-h-0 relative scrollbar-hide" 
            ref={scrollRef}
            onScroll={handleScroll}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <div className="space-y-3 mt-6">
              {useSideBySide && nonAudioMedia.length > 0 ? (
                /* Side-by-side layout: first visual on left, rest on right */
                <div className="flex flex-col md:flex-row gap-4">
                  {/* First visual media */}
                  <div className="w-full md:w-1/2 flex-shrink-0">
                    <MediaRenderer media={nonAudioMedia[0]} isFirstVideo={nonAudioMedia[0].type === 'video'} />
                  </div>
                  {/* Rest of content: remaining visuals + audio */}
                  <div className="w-full md:w-1/2 flex flex-col justify-center min-w-0 space-y-3">
                    {/* Remaining visual media */}
                    {nonAudioMedia.slice(1).map((mediaItem, index) => (
                      <div key={`visual-${index}`}>
                        <MediaRenderer media={mediaItem} isFirstVideo={false} />
                      </div>
                    ))}
                    {/* Audio */}
                    {hasMultipleAudio ? (
                      <AudioPlaylistMinimal urls={audioUrls} />
                    ) : (
                      audioMedia.map((mediaItem, index) => (
                        <div key={`audio-${index}`}>
                          <MediaRenderer media={mediaItem} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Default layout: Render non-audio media first */}
                  {nonAudioMedia.map((mediaItem, index) => (
                    <div key={index}>
                      <MediaRenderer media={mediaItem} isFirstVideo={index === 0 && mediaItem.type === 'video'} />
                    </div>
                  ))}

                  {/* Audio playlist */}
                  {hasMultipleAudio ? (
                    <AudioPlaylistMinimal urls={audioUrls} />
                  ) : (
                    // Single audio file - use regular MediaRenderer
                    audioMedia.map((mediaItem, index) => (
                      <div key={`audio-${index}`}>
                        <MediaRenderer media={mediaItem} />
                      </div>
                    ))
                  )}
                </>
              )}

              {project.description && (
                <div className="prose prose-sm max-w-none mt-4">
                  <p className="text-foreground leading-relaxed text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {project.description}
                  </p>
                </div>
              )}

              {/* Tags moved to bottom after description */}
              <div className="flex flex-wrap gap-1 mt-4">
                {project.tags.map((tag, index) => (
                  <span key={tag} className="text-sm font-normal text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {index > 0 && " / "}
                    {tag.toLowerCase()}
                  </span>
                ))}
              </div>

              {/* Year */}
              <div className="flex flex-wrap gap-1 mt-4">
                <span className="text-sm font-normal text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {new Date(project.date).getFullYear()}
                </span>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          {showScrollIndicator && (
            <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none z-[100]">
              <div className="animate-bounce">
                <ChevronDown className="w-6 h-6 text-foreground animate-in fade-in duration-300" strokeWidth={1.5} />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
