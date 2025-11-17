interface YouTubePlayerProps {
  url: string;
}

export const YouTubePlayer = ({ url }: YouTubePlayerProps) => {
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
  
  // Embed URL with minimal branding and 360 support enabled
  const embedUrl = `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&controls=1&showinfo=0&fs=1`;

  return (
    <div className="w-full rounded-lg overflow-hidden flex items-center justify-center">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title="YouTube video player"
          style={{ 
            border: 'none',
            maxHeight: 'calc(90vh - 12rem)'
          }}
        />
      </div>
    </div>
  );
};
