import { MediaItem } from '@/types/project';
import { AudioPlayer } from './AudioPlayer';
import { VideoPlayer } from './VideoPlayer';
import { ImageGallery } from './ImageGallery';
import { YouTubePlayer } from './YouTubePlayer';

interface MediaRendererProps {
  media: MediaItem;
  isFirstVideo?: boolean;
  allowSimultaneousPlayback?: boolean;
}

export const MediaRenderer = ({ media, isFirstVideo = false, allowSimultaneousPlayback = false }: MediaRendererProps) => {
  switch (media.type) {
    case 'audio':
      return <AudioPlayer url={media.url} allowSimultaneousPlayback={allowSimultaneousPlayback} />;
    case 'video':
      return <VideoPlayer url={media.url} autoPlay={isFirstVideo} allowSimultaneousPlayback={allowSimultaneousPlayback} />;
    case 'image':
      return <ImageGallery url={media.url} />;
    case 'youtube':
      return <YouTubePlayer url={media.url} />;
    default:
      return null;
  }
};
