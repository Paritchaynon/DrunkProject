from cairosvg import svg2png
import os

# Read the SVG file
with open('favicon.svg', 'rb') as f:
    svg_data = f.read()

# Generate different sizes
sizes = {
    'favicon-16x16.png': 16,
    'favicon-32x32.png': 32,
    'apple-touch-icon.png': 180
}

for filename, size in sizes.items():
    svg2png(bytestring=svg_data,
            write_to=filename,
            output_width=size,
            output_height=size) 