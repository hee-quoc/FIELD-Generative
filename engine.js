/* ==========================================================
   FIELD GENERATIVE — ENGINE
   Grid • Draw • Noise • Camera
========================================================== */
let noiseStride = 2;

/* ==========================================================
   INIT GRID
========================================================== */
function initGrid() {
  grid = [];
  for (let x = 0; x < gridSizeX; x++) {
    grid[x] = [];
    for (let y = 0; y < gridSizeY; y++) {
      grid[x][y] = {
        perl: noise(x * noiseScale, y * noiseScale)
      };
    }
  }
}

/* ==========================================================
   DRAW FIELD
   FIX (carried): only use visibleGradients (gradientCount - 2)
========================================================== */
function drawField() {
  fieldBuffer.clear();
  fieldBuffer.background(0);
  fieldBuffer.noStroke();

  let ctx = fieldBuffer.drawingContext;

  fieldBuffer.push();
  fieldBuffer.translate(width / 2, height / 2);
  fieldBuffer.translate(offsetX, offsetY);
  fieldBuffer.scale(scaleFactor);
  fieldBuffer.translate(-width / 2, -height / 2);

  let cellW = width / gridSizeX;
  let cellH = height / gridSizeY;

  const visibleGradients = gradients.slice(0, Math.max(1, gradientCount - 2));

  for (let x = 0; x < gridSizeX; x++) {
    for (let y = 0; y < gridSizeY; y++) {
      let perl = grid[x][y].perl;

      let gPos = perl * (visibleGradients.length - 1);
      let idx  = floor(gPos);
      let frac = gPos - idx;

      let c1 = visibleGradients[idx].levels;
      let c2 = visibleGradients[min(idx + 1, visibleGradients.length - 1)].levels;

      let r = c1[0] + (c2[0] - c1[0]) * frac;
      let g = c1[1] + (c2[1] - c1[1]) * frac;
      let b = c1[2] + (c2[2] - c1[2]) * frac;

      ctx.fillStyle = `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;

      let px = cellW * (x + 0.5);
      let py = cellH * (y + 0.5);
      let w  = max(cellW + 1.4, baseElementSize * scaleFactor);
      let h  = max(cellH + 1.4, baseElementSize * scaleFactor);

      ctx.fillRect(px - w / 2, py - h / 2, w, h);

      if ((x + y + frameCount) % noiseStride === 0) {
        grid[x][y].perl =
          noise(x * noiseScale + t, y * noiseScale + t) * 0.6 +
          noise(x * noiseScale - t, y * noiseScale - t) * 0.4;
      }
    }
  }

  fieldBuffer.pop();

  clear();
  if (blurAmount > 0) {
    drawingContext.filter = `blur(${blurAmount}px)`;
  }
  image(fieldBuffer, 0, 0);
  drawingContext.filter = "none";
}

/* ==========================================================
   DRAW GRID PIXEL
========================================================== */
function drawGridPixel(x, y, cellW, cellH) {
  let px = cellW * (x + 0.5);
  let py = cellH * (y + 0.5);
  let w  = max(cellW + 1.4, baseElementSize * scaleFactor);
  let h  = max(cellH + 1.4, baseElementSize * scaleFactor);
  rect(px, py, w, h);
}

/* ==========================================================
   HUD
========================================================== */
function drawHUD() {
  push();
  fill(255, 180);
  textAlign(RIGHT, BOTTOM);
  textSize(12);
  text(`Zoom: Scroll  |  Pan: Drag  |  Reset: 0`, width - 14, height - 14);
  pop();
}

/* ==========================================================
   HELPERS — panel hit-test
   Returns true when the pointer is currently inside any
   fixed UI panel so wheel / drag events can be suppressed.
========================================================== */
function _cursorOverPanel() {
  const ids = ["fg-ui", "fg-help"];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (
      mouseX >= r.left && mouseX <= r.right &&
      mouseY >= r.top  && mouseY <= r.bottom
    ) return true;
  }
  return false;
}

/* ==========================================================
   ZOOM / PAN
   FIX Bug #2 — ignore wheel/drag when cursor is over a panel
   so scrolling the slider list never zooms the visual.
========================================================== */
function mouseWheel(ev) {
  if (_cursorOverPanel()) {
    // Let the browser handle native panel scrolling
    return;
  }

  let newScale = scaleFactor - ev.delta * 0.0004;
  newScale = constrain(newScale, minScale, maxScale);

  let worldX = (mouseX - offsetX) / scaleFactor;
  let worldY = (mouseY - offsetY) / scaleFactor;

  offsetX = mouseX - worldX * newScale;
  offsetY = mouseY - worldY * newScale;

  scaleFactor = newScale;
  return false; // prevent page scroll only while actually zooming
}

function mousePressed() {
  if (_cursorOverPanel()) return;
  isDragging = true;
  lastMouseX = mouseX;
  lastMouseY = mouseY;
}

function mouseDragged() {
  if (!isDragging) return;
  offsetX += mouseX - lastMouseX;
  offsetY += mouseY - lastMouseY;
  lastMouseX = mouseX;
  lastMouseY = mouseY;
}

function mouseReleased() {
  isDragging = false;
}

function keyPressed() {
  if (key === "0") {
    offsetX     = 0;
    offsetY     = 0;
    scaleFactor = 1.0;
  }
}
