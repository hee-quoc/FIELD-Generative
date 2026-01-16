/* ==========================================================
   FIELD GENERATIVE — MAIN ENTRY
   Global State + p5 Lifecycle
========================================================== */

// =====================
// GRID & NOISE
// =====================
let grid = [];
let gridResolution = 3;
let gridSizeX;
let gridSizeY;
let baseElementSize = gridResolution;
let fieldBuffer;
let blurAmount = 20; // khách muốn blur
let bgColor;
let noiseScale = 0.002;
let t = 5;
let speed = 10; // khách muốn nhanh hơn

// =====================
// CAMERA
// =====================
let scaleFactor = 3.0;
let offsetX = 0;
let offsetY = 0;
let minScale = 0.1;
let maxScale = 3.0;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// =====================
// PALETTE
// =====================
let gradients = [];
let gradientCount = 7;
let img = null;

// =====================
// UI VALUES
// =====================
let uiValues = {
  minSaturation: 80,
  brightness: 100,
  hueBins: 6,
  sampleStep: 4,
};

// =====================
// CCAPTURE LOADER
// =====================


/* ==========================================================
   SETUP
========================================================== */
function setup() {
  let s = min(windowWidth, windowHeight);
createCanvas(s, s);
  frameRate(30);
  rectMode(CENTER);
  colorMode(RGB, 255);
  // Grid sizing
  gridSizeX = floor(width / gridResolution);
  gridSizeY = floor(height / gridResolution);
  baseElementSize = gridResolution;

  // Noise scale auto follow resolution
  noiseScale = gridResolution * 0.004;

	fieldBuffer = createGraphics(windowWidth, windowHeight);
fieldBuffer.pixelDensity(1);

	
  // Init palette
  randomizePaletteWithConstraints();
  ensureFullPalette();

  // Init grid
  initGrid();

  // Init UI & Export tools
  setTimeout(createUI, 200);
  setTimeout(addExportButtons, 400);
}

/* ==========================================================
   DRAW LOOP
========================================================== */
function draw() {
  drawField();

  // CCapture hook (BẮT BUỘC PHẢI Ở ĐÂY)
  recordFrameIfNeeded();

  t += 0.02 * speed;
}

/* ==========================================================
   RESIZE
========================================================== */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
