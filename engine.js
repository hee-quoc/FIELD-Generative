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
   NOISE → COLOR INDEX REMAPPING
   
   Bug #2 fix: p5 noise() clusters ~70% of values in 0.3–0.7,
   so colours at index 0 (min) and index 4 (max) rarely appear.
   
   We apply a symmetric S-curve (smoothstep-based) that pulls
   values toward the extremes, giving colours 1 and 5 equal
   screen coverage as the middle ones.
   
   Input:  perl ∈ [0, 1]   (raw noise value)
   Output: remapped ∈ [0, 1] with boosted extremes
========================================================== */
function _remapNoise(v) {
  // Fold around 0.5, apply a cubic ease that pushes values outward,
  // then unfold. Strength controls how aggressively we spread.
  const strength = 2.2; // 1 = no remap, higher = more extreme spread
  let x = v * 2.0 - 1.0;          // [-1, 1]
  // sign-preserving power: spreads both ends equally
  x = Math.sign(x) * Math.pow(Math.abs(x), 1.0 / strength);
  return x * 0.5 + 0.5;           // back to [0, 1]
}

/* ==========================================================
   WHEEL LOCK — DOM-level fix for Bug #3
   
   p5's mouseX/mouseY are canvas-relative and do NOT match
   viewport coordinates when the canvas is CSS-transformed
   (centered with translate(-50%,-50%)).
   Using getBoundingClientRect() with the raw DOM event's
   clientX/clientY is the only reliable approach.
   
   We attach a native 'wheel' listener to the canvas that
   checks the real pointer position against the panel rects
   and calls preventDefault() to kill zoom only when the
   pointer is truly over the visual area.
========================================================== */
function _installWheelLock() {
  // Run after DOM is ready (called from setup via setTimeout)
  const canvas = document.querySelector("canvas");
  if (!canvas) return;

  canvas.addEventListener("wheel", function(ev) {
    // Use real viewport coordinates from the DOM event
    const cx = ev.clientX;
    const cy = ev.clientY;

    const leftPanel  = document.getElementById("fg-ui");
    const rightPanel = document.getElementById("fg-help");

    function hitEl(el) {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
    }

    if (hitEl(leftPanel) || hitEl(rightPanel)) {
      // Cursor is over a UI panel — do NOT zoom, let panel scroll
      ev.stopPropagation();
      return;
    }

    // Cursor over canvas — zoom and block page scroll
    ev.preventDefault();

    let newScale = scaleFactor - ev.deltaY * 0.0004;
    newScale = Math.min(Math.max(newScale, minScale), maxScale);

    // Zoom toward the cursor position in canvas space
    const cr = canvas.getBoundingClientRect();
    const relX = cx - cr.left;
    const relY = cy - cr.top;

    const worldX = (relX - offsetX) / scaleFactor;
    const worldY = (relY - offsetY) / scaleFactor;

    offsetX = relX - worldX * newScale;
    offsetY = relY - worldY * newScale;

    scaleFactor = newScale;
  }, { passive: false }); // passive:false required for preventDefault
}

/* ==========================================================
   DRAW FIELD
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

  // Only render the visible slice (gradientCount - 2)
  const visibleGradients = gradients.slice(0, Math.max(1, gradientCount - 2));
  const vLen = visibleGradients.length;

  for (let x = 0; x < gridSizeX; x++) {
    for (let y = 0; y < gridSizeY; y++) {
      let perl = grid[x][y].perl;

      // Bug #2 fix: remap so extremes (colour 1 & 5) appear as often
      // as middle colours instead of being squeezed out by noise clustering
      let mapped = _remapNoise(perl);

      let gPos = mapped * (vLen - 1);
      let idx  = Math.floor(gPos);
      let frac = gPos - idx;

      let c1 = visibleGradients[idx].levels;
      let c2 = visibleGradients[Math.min(idx + 1, vLen - 1)].levels;

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
   ZOOM / PAN — p5 callbacks
   
   mouseWheel: now a no-op for zoom because _installWheelLock()
   handles zoom via the native DOM listener with correct coords.
   We keep it here only to return false (suppress p5's default
   page-scroll behavior) when the cursor is on the canvas.
========================================================== */
function mouseWheel(ev) {
  // Native DOM listener in _installWheelLock handles everything.
  // Return without action — zoom is done there.
  // Returning undefined (not false) lets the DOM listener's
  // preventDefault/stopPropagation control scrolling correctly.
}

function mousePressed() {
  // Use raw DOM clientX/Y for panel check (same reason as wheel)
  const ev = window.event;
  if (ev) {
    const cx = ev.clientX, cy = ev.clientY;
    for (const id of ["fg-ui", "fg-help"]) {
      const el = document.getElementById(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) return;
    }
  }
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
