import { useState, useEffect } from 'react';

interface NavSpacerProps {
  enabled?: boolean;
  minBlocks?: number;
  maxBlocks?: number;
  minWidth?: number;
  maxWidth?: number;
  height?: number;
  regenerateKey?: number;
}

type ColorOption = 'white-on-black' | 'black-on-white' | 'white-on-dark' | 'black-on-light';

interface Block {
  width: number;
  color: ColorOption;
}

export const NavSpacer = ({
  enabled = true,
  minBlocks = 1,
  maxBlocks = 20,
  minWidth = 1,
  maxWidth = 9,
  height = 28,
  regenerateKey = 0,
}: NavSpacerProps) => {
  const [blocks, setBlocks] = useState<Block[]>([]);

  // Simple noise function for weighted placement
  const noise = (seed: number): number => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const generateBlocks = (): Block[] => {
    if (!enabled) return [];

    const options: ColorOption[] = ['white-on-black', 'black-on-white', 'white-on-dark', 'black-on-light'];
    const numBlocks = Math.floor(Math.random() * (maxBlocks - minBlocks + 1)) + minBlocks;
    const blocks: Block[] = [];

    // Helper to generate weighted width (heavily biased towards smaller widths)
    const getWeightedWidth = (): number => {
      // Use power function to heavily bias towards smaller values
      // random^3 gives much stronger bias towards 0
      const random = Math.random();
      const biased = Math.pow(random, 3); // Cube for strong bias
      return Math.floor(biased * (maxWidth - minWidth + 1)) + minWidth;
    };

    // Generate first block with weighted width
    const firstWidth = getWeightedWidth();
    const firstColor = options[Math.floor(Math.random() * options.length)];
    blocks.push({ width: firstWidth, color: firstColor });

    // Generate remaining blocks with weighted placement and clustering
    for (let i = 1; i < numBlocks; i++) {
      const prevWidth = blocks[i - 1].width;
      const prevColor = blocks[i - 1].color;

      // Use noise function to determine if we should cluster similar widths
      const noiseSeed = i * 12.9898 + prevWidth * 78.233;
      const noiseValue = noise(noiseSeed);

      // If noise is high (>0.6), prefer similar widths to previous block
      // This creates clustering of narrow and wide blocks
      let width: number;
      if (noiseValue > 0.6) {
        // Cluster similar widths - pick within ±8px of previous width
        const range = 8;
        const minCluster = Math.max(minWidth, prevWidth - range);
        const maxCluster = Math.min(maxWidth, prevWidth + range);
        width = Math.floor(Math.random() * (maxCluster - minCluster + 1)) + minCluster;
      } else {
        // Use weighted random for width (heavily biased towards smaller)
        width = getWeightedWidth();
      }

      // Color must be different from previous
      const availableColors = options.filter(opt => opt !== prevColor);
      const color = availableColors[Math.floor(Math.random() * availableColors.length)];

      blocks.push({ width, color });
    }

    return blocks;
  };

  // Generate blocks on mount and when regenerateKey changes
  useEffect(() => {
    setBlocks(generateBlocks());
  }, [regenerateKey, enabled]);

  if (!enabled || blocks.length === 0) {
    return null;
  }

  const getColors = (variant: ColorOption) => {
    const bgColor =
      variant === 'white-on-black' ? 'hsl(0, 0%, 10%)' :
      variant === 'black-on-white' ? 'hsl(0, 0%, 90%)' :
      variant === 'white-on-dark' ? 'hsl(0, 0%, 20%)' :
      'hsl(0, 0%, 80%)';
    return bgColor;
  };

  return (
    <div className="flex items-center gap-0 pointer-events-none" style={{ height: `${height}px` }}>
      {blocks.map((block, index) => (
        <div
          key={index}
          style={{
            width: `${block.width}px`,
            height: `${height}px`,
            backgroundColor: getColors(block.color),
          }}
        />
      ))}
    </div>
  );
};
