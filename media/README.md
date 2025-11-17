# Media Files

This folder contains all media files for your projects.

## Structure

Organize your media files by project:

```
public/media/
  project-alpha/
    image1.jpg
    image2.png
  audio-beta/
    track.mp3
    cover.jpg
  video-gamma/
    showcase.mp4
```

## How to Add Content

1. **Create a project folder** in `public/media/` with your project ID
2. **Add your media files** (images, audio, videos) to that folder
3. **Update** `src/data/projects.ts` with your project information
4. **Reference your files** as `/media/project-id/filename.ext`

## Supported Formats

- **Images**: .jpg, .png, .gif, .webp
- **Audio**: .mp3, .wav, .ogg
- **Video**: .mp4, .webm

## Example Project Entry

```typescript
{
  id: 'my-project',
  title: 'My Amazing Project',
  tags: ['Web Design', 'Sound Design'],
  categories: ['visual', 'audio'],
  media: [
    {
      type: 'image',
      url: '/media/my-project/hero.jpg',
      caption: 'Main visual'
    },
    {
      type: 'audio',
      url: '/media/my-project/soundtrack.mp3',
      thumbnail: '/media/my-project/cover.jpg'
    }
  ],
  description: 'A detailed description of your project...'
}
```
