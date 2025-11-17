interface ImageGalleryProps {
  url: string;
  caption?: string;
}

export const ImageGallery = ({ url, caption }: ImageGalleryProps) => {
  return (
    <div className="flex justify-center w-full">
      <div className="inline-block max-w-full rounded-lg overflow-hidden">
        <img
          src={url}
          alt={caption || 'Project image'}
          className="block w-full h-auto max-h-[70vh]"
          style={{ display: 'block', maxWidth: '100%' }}
        />
      </div>
    </div>
  );
};
