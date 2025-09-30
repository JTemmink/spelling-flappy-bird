const fs = require('fs');
const { createCanvas } = require('canvas');

// Create sprites directory if it doesn't exist
if (!fs.existsSync('assets/sprites')) {
    fs.mkdirSync('assets/sprites', { recursive: true });
}

// Generate bird sprite (40x40)
const birdCanvas = createCanvas(40, 40);
const birdCtx = birdCanvas.getContext('2d');
birdCtx.fillStyle = '#FFD700';
birdCtx.fillRect(0, 0, 40, 40);
birdCtx.strokeStyle = '#000000';
birdCtx.lineWidth = 2;
birdCtx.strokeRect(0, 0, 40, 40);
const birdBuffer = birdCanvas.toBuffer('image/png');
fs.writeFileSync('assets/sprites/bird.png', birdBuffer);

// Generate top pipe sprite (80x200)
const topPipeCanvas = createCanvas(80, 200);
const topPipeCtx = topPipeCanvas.getContext('2d');
topPipeCtx.fillStyle = '#228B22';
topPipeCtx.fillRect(0, 0, 80, 200);
topPipeCtx.strokeStyle = '#000000';
topPipeCtx.lineWidth = 2;
topPipeCtx.strokeRect(0, 0, 80, 200);
const topPipeBuffer = topPipeCanvas.toBuffer('image/png');
fs.writeFileSync('assets/sprites/pipe-top.png', topPipeBuffer);

// Generate bottom pipe sprite (80x200)
const bottomPipeCanvas = createCanvas(80, 200);
const bottomPipeCtx = bottomPipeCanvas.getContext('2d');
bottomPipeCtx.fillStyle = '#228B22';
bottomPipeCtx.fillRect(0, 0, 80, 200);
bottomPipeCtx.strokeStyle = '#000000';
bottomPipeCtx.lineWidth = 2;
bottomPipeCtx.strokeRect(0, 0, 80, 200);
const bottomPipeBuffer = bottomPipeCanvas.toBuffer('image/png');
fs.writeFileSync('assets/sprites/pipe-bottom.png', bottomPipeBuffer);

// Generate background sprite (800x600)
const backgroundCanvas = createCanvas(800, 600);
const backgroundCtx = backgroundCanvas.getContext('2d');
backgroundCtx.fillStyle = '#87CEEB';
backgroundCtx.fillRect(0, 0, 800, 600);
const backgroundBuffer = backgroundCanvas.toBuffer('image/png');
fs.writeFileSync('assets/sprites/background.png', backgroundBuffer);

console.log('Placeholder sprite files generated in assets/sprites/');
