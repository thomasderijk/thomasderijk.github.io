// Tag icon configuration
// Format: "tag name": "unicode character"
// You can modify the unicode icons for each tag here

export const tagIcons: Record<string, string> = {
  'music': '♫',           // 9835 266B BEAMED EIGHTH NOTES
  'sound design': '☊',    // 9738 260A ASCENDING NODE
  'installation': '♃',    // 9795 2643 JUPITER
  'video': '⭄',           // 11076	2B44	RIGHTWARDS ARROW THROUGH SUPERSET
  'artwork': '✦',         // 10022 2726 BLACK FOUR POINTED STAR
  'interactive': '◎',     // 9678 25CE BULLSEYE
  'music video': '⌱',     // 	9009	2331	DIMENSION ORIGIN
  'sculpture': '⚹',       // 	9913	26B9	SEXTILE
  'direction': '☡',       // 9761	2621	CAUTION SIGN
  'animation': '⛓',       // 9939	26D3	CHAINS
  'visuals': '⛬',       // 	9964	26EC	HISTORIC SITE
};

// Export list of all tags for reference
export const allTags = Object.keys(tagIcons).sort();
