export interface MediaItem {
  type: 'audio' | 'video' | 'image' | 'youtube';
  url: string;
}

export interface Project {
  title: string;
  tags: string[];
  categories: ('audio' | 'visual' | 'commercial')[];
  media: MediaItem[];
  description?: string;
  date: string; // ISO date string for sorting (YYYY-MM-DD)
}
