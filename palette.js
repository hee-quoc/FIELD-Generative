/* ==========================================================
   FIELD GENERATIVE — PALETTE
   Palette Randomizer + Image Extraction
========================================================== */

/* ==========================================================
   PALETTE RANDOMIZER (constraints applied on request)
========================================================== */
function randomizePaletteWithConstraints() {
  gradients = [];
  colorMode(HSB, 360, 100, 100);
	
  let bins = uiValues.hueBins;
  let binSize = 360 / bins;
  let out = [];

  for (let i = 0; i < bins; i++) {
    let attempts = 0;

    while (attempts < 40) {
      attempts++;
      let h = random(i * binSize, (i + 1) * binSize);
      let s = random(40, 100);
      let b = random(uiValues.brightness - 20, uiValues.brightness + 20);
      b = constrain(b, 0, 100);

      if (s < uiValues.minSaturation) continue;

      out.push(color(h, s, b));
      break;
    }
  }

  gradients = out;
  ensureFullPalette();
  colorMode(RGB, 255);
updateBodyBackground(); // ← THÊM DÒNG NÀY

}
function updateBodyBackground() {
  if (!window.gradients || gradients.length === 0) return;

  const c = gradients[0];

  const dark = `rgb(
    ${Math.floor(c.levels[0] * 0.25)},
    ${Math.floor(c.levels[1] * 0.25)},
    ${Math.floor(c.levels[2] * 0.25)}
  )`;

  document.body.style.background = dark;
}

/* ==========================================================
   ENSURE FULL PALETTE
   ⚠️ CHỈ GIỮ 1 BẢN (bản an toàn nhất)
========================================================== */
function ensureFullPalette() {
  // Xóa mọi giá trị null hoặc undefined
  gradients = gradients.filter(c => c instanceof p5.Color);

  // Nếu thiếu màu → thêm màu random hợp lệ
  while (gradients.length < gradientCount) {
    gradients.push(
      color(
        random(360),
        random(60, 100),
        random(40, 100)
      )
    );
  }

  // Cắt đúng số lượng màu
  gradients = gradients.slice(0, gradientCount);
}

/* ==========================================================
   IMAGE PALETTE EXTRACTION
========================================================== */
async function extractPaletteFromImage(img, step) {
  let maxSide = 160;
  let w = img.width;
  let h = img.height;

  let sc = 1;
  if (max(w, h) > maxSide) sc = maxSide / max(w, h);
  w = floor(w * sc);
  h = floor(h * sc);

  const g = createGraphics(w, h);
  g.pixelDensity(1);
  g.image(img, 0, 0, w, h);
  g.loadPixels();

  let samples = [];

  // -------------------------
  // SAMPLE PIXELS SAFELY
  // -------------------------
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      let idx = 4 * (y * w + x);

      // tránh crash nếu pixel array lỗi
      if (idx + 3 >= g.pixels.length) continue;

      let r = g.pixels[idx];
      let g1 = g.pixels[idx + 1];
      let b = g.pixels[idx + 2];
      let a = g.pixels[idx + 3];

      if (a < 10) continue; // bỏ pixel trong suốt

      samples.push(color(r, g1, b));
    }
  }

  // Nếu không có sample -> fallback palette
  if (samples.length === 0) {
    return [
      color(30, 80, 90),
      color(200, 70, 90),
      color(100, 60, 80),
      color(0, 0, 30),
      color(250, 60, 80),
      color(120, 50, 70),
      color(300, 40, 60)
    ];
  }

  shuffle(samples);

  let out = [];
  let hueBins = uiValues.hueBins;

  // -------------------------
  // PICK UNIQUE COLORS
  // -------------------------
  for (let c of samples) {
    if (!(c instanceof p5.Color)) continue;

    let ok = true;
    for (let p of out) {
      if (colorDistanceRGB(c, p) < 28) {
        ok = false;
        break;
      }
    }

    if (ok) out.push(c);
    if (out.length >= hueBins) break;
  }

  // -------------------------
  // FILL TO 7 COLORS (SAFE)
  // -------------------------
  out = out.filter(c => c instanceof p5.Color);

  while (out.length < gradientCount) {
    out.push(
      color(
        random(360),
        random(40, 100),
        random(uiValues.brightness - 20, uiValues.brightness + 20)
      )
    );
  }

  out = out.slice(0, gradientCount);
  return out;
}

/* ==========================================================
   COLOR DISTANCE
   ⚠️ CHỈ GIỮ 1 BẢN (levels[] – an toàn nhất)
========================================================== */
function colorDistanceRGB(c1, c2) {
  let r1 = c1.levels[0];
  let g1 = c1.levels[1];
  let b1 = c1.levels[2];
  let r2 = c2.levels[0];
  let g2 = c2.levels[1];
  let b2 = c2.levels[2];

  return Math.sqrt(
    (r1 - r2) * (r1 - r2) +
    (g1 - g2) * (g1 - g2) +
    (b1 - b2) * (b1 - b2)
  );
}
function toHex2(v) {
  let h = v.toString(16);
  return h.length === 1 ? "0" + h : h;
}

function p5ColorToHex(c) {
  return (
    "#" +
    toHex2(c.levels[0]) +
    toHex2(c.levels[1]) +
    toHex2(c.levels[2])
  );
}