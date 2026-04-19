/* ==========================================================
   FIELD GENERATIVE — MAIN ENTRY
   Global State + p5 Lifecycle
========================================================== */

let renderMode  = false;
let renderFrame = 0;
let RENDER_FPS    = 60;
let TOTAL_FRAMES  = 600; // 10s video

let grid = [];
let gridResolution  = 3;
let gridSizeX;
let gridSizeY;
let baseElementSize = gridResolution;
let fieldBuffer;
let blurAmount = 20;
let bgColor;
let noiseScale = 0.002;
let t     = 5;
let speed = 4;

// =====================
// CAMERA
// =====================
const INITIAL_CAMERA = {
  scaleFactor: 3.0,
  offsetX: 0,
  offsetY: 0,
};

let scaleFactor = INITIAL_CAMERA.scaleFactor;
let offsetX     = INITIAL_CAMERA.offsetX;
let offsetY     = INITIAL_CAMERA.offsetY;

let minScale  = 0.1;
let maxScale  = 3.0;
let isDragging  = false;
let lastMouseX  = 0;
let lastMouseY  = 0;

// =====================
// PALETTE
// =====================
let gradients     = [];
let gradientCount = 7;
let img = null;

// =====================
// UI VALUES
// =====================
let uiValues = {
  minSaturation: 80,
  brightness:    100,
  hueBins:       6,
  sampleStep:    4,
};

/* ==========================================================
   CAMERA HELPERS
========================================================== */
function resetCameraToInitial() {
  offsetX     = INITIAL_CAMERA.offsetX;
  offsetY     = INITIAL_CAMERA.offsetY;
  scaleFactor = INITIAL_CAMERA.scaleFactor;
}

/* ==========================================================
   SETUP
========================================================== */
function centerCanvas() {
  const c = document.querySelector("canvas");
  if (!c) return;
  Object.assign(c.style, {
    position: "fixed",
    left: "50%",
    top:  "50%",
    transform: "translate(-50%, -50%)",
  });
}

function setup() {
  let s = min(windowWidth, windowHeight);
  createCanvas(s, s);
  centerCanvas();

  frameRate(5);
  rectMode(CENTER);
  colorMode(RGB, 255);

  gridSizeX       = floor(width  / gridResolution);
  gridSizeY       = floor(height / gridResolution);
  baseElementSize = gridResolution;
  noiseScale      = gridResolution * 0.004;

  fieldBuffer = createGraphics(width, height);
  fieldBuffer.pixelDensity(1);

  // ── Default palette: #ff1900 → #ffe229 → #d3ff75 → #8fd100 → #ffffff
  gradients = getDefaultPalette();
  updateBodyBackground();

  initGrid();

  setTimeout(createUI,           200);
  setTimeout(addExportButtons,   400);
  // DOM-level wheel lock — must run AFTER panels are in the DOM
  setTimeout(_installWheelLock,  600);
}

function updateBodyBackground() {
  if (!gradients || gradients.length < 2) return;
  const c1 = gradients[0];
  const c2 = gradients[1] || gradients[0];
  document.body.style.background = `
    radial-gradient(
      circle at center,
      rgba(${c1.levels[0]}, ${c1.levels[1]}, ${c1.levels[2]}, 0.35),
      rgba(${Math.floor(c2.levels[0]*0.2)}, ${Math.floor(c2.levels[1]*0.2)}, ${Math.floor(c2.levels[2]*0.2)}, 1)
    )`;
}

/* ==========================================================
   DRAW LOOP
========================================================== */
function draw() {
  drawField();

  if (renderMode) {
    t += 0.02 * speed;
    saveCanvas(`frame_${nf(renderFrame, 4)}`, "png");
    renderFrame++;
    if (renderFrame >= TOTAL_FRAMES) {
      renderMode = false;
      console.log("Render finished");
      noLoop();
    }
    return;
  }

  t += 0.02 * speed;
}

/* ==========================================================
   RESIZE
========================================================== */
function windowResized() {
  let s = min(windowWidth, windowHeight);
  resizeCanvas(s, s);
  centerCanvas();
}
