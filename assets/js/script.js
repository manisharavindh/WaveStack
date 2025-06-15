// 003
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let isDark = true;
let time = 0;
let mouseX = 0;
let mouseY = 0;
let animationId;

// Detect if device is mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                ('ontouchstart' in window) || 
                (navigator.maxTouchPoints > 0);

// Pixel settings - adjust for mobile
const PIXEL_SIZE = isMobile ? 5 : 7; // Smaller pixels on mobile for better detail
const WAVE_SPEED = 0.008; // Much slower waves (0.008)
const WAVE_HEIGHT = 6; // Reduced wave height (6)
const RIPPLE_STRENGTH = 8; // Smaller ripples (8)
const RIPPLE_RADIUS = 10; // Smaller ripple area (15)

let pixelWidth, pixelHeight;
let waveOffset = 0;

// Random seed for wave generation
const randomSeed = Math.random() * 1000;

// Color palettes
const palettes = {
   light: {
       water: [
           '#d0f0f9', // Gentle seafoam
           '#a4dcec', // Pale turquoise
           '#7fcce0', // Soft aqua
           '#5cb9d4', // Clear ocean blue
           '#40a6c8', // Moderate sea blue
           '#2a94bd', // Balanced water tone
           '#217ca6', // Coastal blue
           '#1b5e85'  // Deep coastal blue
       ],
       foam: '#e8f9ff',  // Soft foam white-blue
       bg: '#def3fa'     // Background light blue
   },
   dark: {
       water: [
           '#0a1b2a', // Deep navy
           '#123047', // Dark ocean blue
           '#18425f', // Dusk blue
           '#1f5678', // Ocean dusk
           '#266b91', // Cool deep blue
           '#2c80aa', // Muted marine blue
           '#3295c3', // Soft cyan blue
           '#39aadc'  // Shallow tropical blue
       ],
       foam: '#a9d7e7',   // Dimmed foam blue
       bg: '#091521'      // Midnight ocean background
   }
};


// FPS counter
let frameCount = 0;
let lastTime = performance.now();
let fps = 60;

init();

function init() {
   resizeCanvas();
   setupEventListeners();
   animate();
}

function resizeCanvas() {
   canvas.width = window.innerWidth;
   canvas.height = window.innerHeight;
   
   pixelWidth = Math.ceil(canvas.width / PIXEL_SIZE);
   pixelHeight = Math.ceil(canvas.height / PIXEL_SIZE);
   
   // Disable image smoothing for crisp pixels
   ctx.imageSmoothingEnabled = false;
}

function setupEventListeners() {
   window.addEventListener('resize', resizeCanvas);
   
   // Only add mouse events if not on mobile
   if (!isMobile) {
       canvas.addEventListener('mousemove', (e) => {
           const rect = canvas.getBoundingClientRect();
           // Precise cursor alignment
           mouseX = (e.clientX - rect.left) / PIXEL_SIZE - 0.6;
           mouseY = (e.clientY - rect.top) / PIXEL_SIZE - 0.5;
       });
       
       canvas.addEventListener('mouseleave', () => {
           mouseX = -999;
           mouseY = -999;
       });
   } else {
       // Disable cursor interaction on mobile
       mouseX = -999;
       mouseY = -999;
   }
}

function getWaveHeight(x, y, time) {
   // Slower, more natural wave layers with random seed
   let wave = 0;
   
   // Primary gentle waves
   wave += Math.sin(x * 0.05 + time * 1.2 + randomSeed) * 2.5;
   wave += Math.sin(y * 0.07 + time * 0.8 + randomSeed * 0.7) * 2;
   wave += Math.sin((x + y) * 0.04 + time * 0.5 + randomSeed * 1.3) * 3;
   
   // Subtle detail waves
   wave += Math.sin(x * 0.15 + time * 1.8 + randomSeed * 2.1) * 0.8;
   wave += Math.sin(y * 0.12 + time * 1.3 + randomSeed * 1.7) * 0.6;
   
   // Small, precise mouse ripples (only on desktop)
   if (!isMobile && mouseX > -999 && mouseY > -999) {
       const dx = x - mouseX;
       const dy = y - mouseY;
       const distance = Math.sqrt(dx * dx + dy * dy);
       
       if (distance < RIPPLE_RADIUS) {
           const influence = Math.pow((RIPPLE_RADIUS - distance) / RIPPLE_RADIUS, 2);
           wave += Math.sin(distance * 0.5 - time * 12) * influence * RIPPLE_STRENGTH;
       }
   }
   
   return wave;
}

function getPixelColor(waveHeight) {
   const palette = isDark ? palettes.dark : palettes.light;
   
   // Normalize wave height to 0-1 range
   const normalizedHeight = (waveHeight + WAVE_HEIGHT) / (WAVE_HEIGHT * 2);
   const clampedHeight = Math.max(0, Math.min(1, normalizedHeight));
   
   // Quantize to create pixelated effect
   const colorSteps = palette.water.length;
   const step = Math.floor(clampedHeight * (colorSteps - 1));
   
   // Foam effect for highest waves (more subtle)
   if (clampedHeight > 0.9) {
       return palette.foam;
   }
   
   return palette.water[step];
}

function drawPixelatedSea() {
   // Clear canvas
   ctx.fillStyle = isDark ? palettes.dark.bg : palettes.light.bg;
   ctx.fillRect(0, 0, canvas.width, canvas.height);
   
   // Draw pixelated water
   for (let x = 0; x < pixelWidth; x++) {
       for (let y = 0; y < pixelHeight; y++) {
           const waveHeight = getWaveHeight(x, y, time);
           const color = getPixelColor(waveHeight);
           
           ctx.fillStyle = color;
           ctx.fillRect(
               x * PIXEL_SIZE, 
               y * PIXEL_SIZE, 
               PIXEL_SIZE, 
               PIXEL_SIZE
           );
       }
   }
   
   // Remove harsh scanline effect, add subtle texture instead
   if (isDark) {
       ctx.fillStyle = 'rgba(95, 158, 160, 0.02)';
       const scanlineSpacing = isMobile ? 4 : 6; // Tighter scanlines on mobile
       for (let i = 0; i < canvas.height; i += scanlineSpacing) {
           ctx.fillRect(0, i, canvas.width, 1);
       }
   }
}

function updateFPS() {
   frameCount++;
   const currentTime = performance.now();
   
   if (currentTime - lastTime >= 1000) {
       fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
       frameCount = 0;
       lastTime = currentTime;
       document.getElementById('fps').textContent = `FPS: ${fps}`;
   }
}

function animate() {
   time += WAVE_SPEED;
   
   drawPixelatedSea();
   updateFPS();
   
   animationId = requestAnimationFrame(animate);
}

function toggleMode() {
   isDark = !isDark;
   document.body.className = isDark ? 'dark-mode' : 'light-mode';
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
   if (animationId) {
       cancelAnimationFrame(animationId);
   }
});