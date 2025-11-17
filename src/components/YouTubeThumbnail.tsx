interface YouTubeThumbnailProps {
  url: string;
  alt: string;
  className?: string;
}

export const YouTubeThumbnail = ({ url, alt, className = '' }: YouTubeThumbnailProps) => {
  // Extract video ID from various YouTube URL formats
  const getVideoId = (youtubeUrl: string) => {
    const trimmed = youtubeUrl.trim();
    
    // Handle youtu.be short links
    if (trimmed.includes('youtu.be/')) {
      return trimmed.split('youtu.be/')[1].split(/[?&]/)[0];
    }
    
    // Handle youtube.com/watch?v= links
    if (trimmed.includes('youtube.com/watch?v=')) {
      return trimmed.split('v=')[1].split(/[?&]/)[0];
    }
    
    // Handle youtube.com/embed/ links
    if (trimmed.includes('youtube.com/embed/')) {
      return trimmed.split('embed/')[1].split(/[?&]/)[0];
    }
    
    // If it's just an ID
    return trimmed;
  };

  const videoId = getVideoId(url);
  
  // Use YouTube's high quality thumbnail
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <img 
      src={thumbnailUrl} 
      alt={alt} 
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
};
