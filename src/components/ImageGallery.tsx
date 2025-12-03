interface ImageGalleryProps {
  url: string;
  caption?: string;
}

export const ImageGallery = ({ url, caption }: ImageGalleryProps) => {
  return (
    <img
      src={url}
      alt={caption || 'Project image'}
      className="w-full h-auto"
      style={{
        maxHeight: '70vh',
        objectFit: 'contain'
      }}
    />
  );
};
