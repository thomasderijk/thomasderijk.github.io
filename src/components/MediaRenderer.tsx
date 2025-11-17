import { MediaItem } from '@/types/project';
import { AudioPlayer } from './AudioPlayer';
import { VideoPlayer } from './VideoPlayer';
import { ImageGallery } from './ImageGallery';
import { YouTubePlayer } from './YouTubePlayer';

interface MediaRendererProps {
  media: MediaItem;
  isFirstVideo?: boolean;
}

export const MediaRenderer = ({ media, isFirstVideo = false }: MediaRendererProps) => {
  switch (media.type) {
    case 'audio':
      return <AudioPlayer url={media.url} />;
    case 'video':
      return <VideoPlayer url={media.url} autoPlay={isFirstVideo} />;
    case 'image':
      return <ImageGallery url={media.url} />;
    case 'youtube':
      return <YouTubePlayer url={media.url} />;
    default:
      return null;
  }
};
