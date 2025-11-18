#!/bin/bash

# Convert all _thumbnail.mov files to half-resolution .mp4 files (no audio)
# Original .mov files are moved to a backup folder

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the project root directory (parent of scripts folder)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Source directory for media files
PUBLIC_DIR="$PROJECT_ROOT/public"

# Backup directory (outside of public, won't be included in build)
BACKUP_DIR="$PROJECT_ROOT/.thumbnail-backups"

echo -e "${YELLOW}Converting thumbnail .mov files to .mp4...${NC}"
echo "Project root: $PROJECT_ROOT"
echo "Public directory: $PUBLIC_DIR"
echo "Backup directory: $BACKUP_DIR"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Counter for processed files
converted=0
skipped=0
errors=0

# Count files first
file_count=$(find "$PUBLIC_DIR" -type f -iname "*_thumbnail.mov" 2>/dev/null | wc -l | tr -d ' ')

if [ "$file_count" -eq 0 ]; then
    echo "No _thumbnail.mov files found in $PUBLIC_DIR"
    exit 0
fi

echo "Found $file_count thumbnail .mov files"
echo ""

# Process each file
find "$PUBLIC_DIR" -type f -iname "*_thumbnail.mov" -print0 2>/dev/null | while IFS= read -r -d '' mov_file; do
    # Get the relative path from public directory
    rel_path="${mov_file#$PUBLIC_DIR/}"

    # Create the output filename (replace .mov with .mp4)
    mp4_file="${mov_file%.[mM][oO][vV]}.mp4"

    # Create backup path (preserving directory structure)
    backup_path="$BACKUP_DIR/$rel_path"
    backup_dir="$(dirname "$backup_path")"

    echo -e "Processing: ${YELLOW}$rel_path${NC}"

    # Check if mp4 already exists
    if [ -f "$mp4_file" ]; then
        echo -e "  ${YELLOW}Skipping: .mp4 already exists${NC}"
        skipped=$((skipped + 1))
        echo ""
        continue
    fi

    # Get original video dimensions
    dimensions=$(/opt/homebrew/bin/ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$mov_file" 2>/dev/null)

    if [ -z "$dimensions" ]; then
        echo -e "  ${RED}Error: Could not get video dimensions${NC}"
        errors=$((errors + 1))
        echo ""
        continue
    fi

    # Parse width and height
    width=$(echo "$dimensions" | cut -d'x' -f1)
    height=$(echo "$dimensions" | cut -d'x' -f2)

    # Calculate 360p resolution (scale to 360p height, maintain aspect ratio)
    # Ensure even numbers for codec compatibility
    if [ "$height" -gt "$width" ]; then
        # Portrait: width becomes 360
        new_width=360
        new_height=$(( (360 * height / width + 1) / 2 * 2 ))
    else
        # Landscape or square: height becomes 360
        new_height=360
        new_width=$(( (360 * width / height + 1) / 2 * 2 ))
    fi

    echo "  Original: ${width}x${height} -> New: ${new_width}x${new_height} (360p)"

    # Convert to mp4 with half resolution, no audio
    # Using libx264 for broad compatibility, crf 23 for good quality/size balance
    if /opt/homebrew/bin/ffmpeg -i "$mov_file" \
        -vf "scale=${new_width}:${new_height}" \
        -c:v libx264 \
        -preset medium \
        -crf 23 \
        -an \
        -movflags +faststart \
        -y \
        "$mp4_file" 2>/dev/null; then

        echo -e "  ${GREEN}Converted successfully${NC}"

        # Create backup directory structure
        mkdir -p "$backup_dir"

        # Move original to backup
        mv "$mov_file" "$backup_path"
        echo -e "  ${GREEN}Original backed up to: .thumbnail-backups/$rel_path${NC}"

        converted=$((converted + 1))
    else
        echo -e "  ${RED}Error: Conversion failed${NC}"
        # Remove partial output if it exists
        rm -f "$mp4_file"
        errors=$((errors + 1))
    fi

    echo ""
done

echo -e "${GREEN}Conversion complete!${NC}"
echo ""
echo -e "${YELLOW}Note: Original .mov files are backed up in .thumbnail-backups/${NC}"
echo "This folder is not included in the build."
