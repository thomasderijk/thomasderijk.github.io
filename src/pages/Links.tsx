import { Github, Instagram, Youtube, Music, Disc } from 'lucide-react';

const Links = () => {
  const links = [
    { name: 'Instagram', icon: Instagram, url: 'https://instagram.com/thomas_djb' },
    { name: 'YouTube', icon: Youtube, url: 'https://youtube.com/thomasderijk' },
    { name: 'SoundCloud', icon: Music, url: 'https://soundcloud.com/djbdjbdjb' },
    { name: 'Bandcamp', icon: Disc, url: 'https://djbdjbdjb.bandcamp.com/' },
    { name: 'GitHub', icon: Github, url: 'https://github.com/thomasderijk' },
  ];

  return (
    <div className="relative z-10 flex items-center justify-center px-4" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-3 hover:text-foreground/80 transition-colors"
              >
                <Icon className="w-4 h-4 text-foreground flex-shrink-0" />
                <span className="text-foreground leading-relaxed">
                  {link.name}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Links;
