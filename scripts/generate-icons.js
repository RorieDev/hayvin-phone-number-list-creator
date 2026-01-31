// Simple script to generate PWA icons as data URLs embedded in an HTML file
// Run this in browser console to download the icons

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

function generateIcon(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#0a0f1a');
    gradient.addColorStop(1, '#111827');

    // Rounded rect background
    const radius = size * 0.2;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, radius);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Phone icon circle
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.35, 0, Math.PI * 2);
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = size * 0.06;
    ctx.stroke();

    // Phone emoji in center
    ctx.font = `${size * 0.4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📞', size / 2, size / 2);

    return canvas.toDataURL('image/png');
}

// Generate and log icons
sizes.forEach(size => {
    const dataUrl = generateIcon(size);
    console.log(`icon-${size}x${size}.png:`, dataUrl);
});
