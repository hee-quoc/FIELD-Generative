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
========================================================== */
function drawField() {
  fieldBuffer.clear();
  fieldBuffer.background(0);
  fieldBuffer.noStroke();

  fieldBuffer.push();
  fieldBuffer.translate(width / 2, height / 2);
fieldBuffer.translate(offsetX, offsetY);
fieldBuffer.scale(scaleFactor);
fieldBuffer.translate(-width / 2, -height / 2);

  let cellW = width / gridSizeX;
  let cellH = height / gridSizeY;

  for (let x = 0; x < gridSizeX; x++) {
    for (let y = 0; y < gridSizeY; y++) {

      let perl = grid[x][y].perl;
		
		
      let gPos = perl * (gradients.length - 1);
      let idx = floor(gPos);
      let frac = gPos - idx;

      let c1 = gradients[idx];
      let c2 = gradients[min(idx + 1, gradients.length - 1)];

      fieldBuffer.fill(lerpColor(c1, c2, frac));

      let px = cellW * (x + 0.5);
      let py = cellH * (y + 0.5);
      let w = max(cellW + 1.4, baseElementSize * scaleFactor);
      let h = max(cellH + 1.4, baseElementSize * scaleFactor);

      fieldBuffer.rect(px, py, w, h);

      // update noise (giữ nguyên logic cũ)
      if ((x + y + frameCount) % noiseStride === 0) {
        grid[x][y].perl =
          noise(x * noiseScale + t, y * noiseScale + t) * 0.6 +
          noise(x * noiseScale - t, y * noiseScale - t) * 0.4;
      }
    }
  }

  fieldBuffer.pop();

  // draw + blur
  clear();
  image(fieldBuffer, 0, 0);
  filter(BLUR, blurAmount);
}


/* ==========================================================
   DRAW GRID PIXEL
========================================================== */
function drawGridPixel(x, y, cellW, cellH) {
  let px = cellW * (x + 0.5);
  let py = cellH * (y + 0.5);

  let w = max(cellW + 1.4, baseElementSize * scaleFactor);
  let h = max(cellH + 1.4, baseElementSize * scaleFactor);

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
   ZOOM / PAN
========================================================== */
function mouseWheel(ev) {
  let newScale = scaleFactor - ev.delta * 0.0004;
  newScale = constrain(newScale, minScale, maxScale);

  let worldX = (mouseX - offsetX) / scaleFactor;
  let worldY = (mouseY - offsetY) / scaleFactor;

  offsetX = mouseX - worldX * newScale;
  offsetY = mouseY - worldY * newScale;

  scaleFactor = newScale;
  return false;
}

function mousePressed() {
  if (mouseX < 260) return;
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
    offsetX = 0;
    offsetY = 0;
    scaleFactor = 1.0;
  }
}
