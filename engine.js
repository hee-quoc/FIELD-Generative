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
========================================================== */
function _remapNoise(v) {
  const strength = 2.2;
  let x = v * 2.0 - 1.0;
  x = Math.sign(x) * Math.pow(Math.abs(x), 1.0 / strength);
  return x * 0.5 + 0.5;
}

/* ==========================================================
   WHEEL LOCK — DOM-level fix
========================================================== */
function _installWheelLock() {
  const canvas = document.querySelector("canvas");
  if (!canvas) return;

  canvas.addEventListener("wheel", function(ev) {
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
      ev.stopPropagation();
      return;
    }

    ev.preventDefault();

    let newScale = scaleFactor - ev.deltaY * 0.0004;
    newScale = Math.min(Math.max(newScale, minScale), maxScale);

    const cr = canvas.getBoundingClientRect();
    const relX = cx - cr.left;
    const relY = cy - cr.top;

    const worldX = (relX - offsetX) / scaleFactor;
    const worldY = (relY - offsetY) / scaleFactor;

    offsetX = relX - worldX * newScale;
    offsetY = relY - worldY * newScale;

    scaleFactor = newScale;
  }, { passive: false });

  /* ── Global keyboard handler (fires even when sliders have focus) ── */
  if (!window.__FG_ENGINE_KEYBOUND) {
    window.addEventListener("keydown", function(ev) {
      const tag = (ev.target && ev.target.tagName) ? ev.target.tagName.toLowerCase() : "";
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        (ev.target && ev.target.isContentEditable);

      /* Quick-capture shortcut: press C any time to capture PNG */
      if ((ev.key === "c" || ev.key === "C") && !isTyping) {
        if (typeof capturePNGNow === "function") {
          capturePNGNow();
        }
        return;
      }
    });
    window.__FG_ENGINE_KEYBOUND = true;
  }
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

  const visibleGradients = gradients.slice(0, Math.max(1, gradientCount - 2));
  const vLen = visibleGradients.length;

  for (let x = 0; x < gridSizeX; x++) {
    for (let y = 0; y < gridSizeY; y++) {
      let perl = grid[x][y].perl;

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
   FIX: removed "Reset: 0 / Button" — shortcut was unreliable
        when DOM inputs held focus. Use the Reset View button
        on the left panel instead.
========================================================== */
function drawHUD() {
  push();
  fill(255, 180);
  textAlign(RIGHT, BOTTOM);
  textSize(12);
  text(`Zoom: Scroll  |  Pan: Drag  |  Reset: Button (panel)  |  Capture PNG: C`, width - 14, height - 14);
  pop();
}

/* ==========================================================
   ZOOM / PAN — p5 callbacks
========================================================== */
function mouseWheel(ev) {
  // Native DOM listener in _installWheelLock handles everything.
}

function mousePressed() {
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
  // Intentionally empty — all keyboard logic moved to
  // window.addEventListener("keydown") inside _installWheelLock
  // so shortcuts fire even when DOM inputs hold focus.
}
