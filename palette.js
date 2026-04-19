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
  updateBodyBackground();
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

  // Nếu thiếu màu → thêm màu random hợp lệ (chỉ dùng khi không có ảnh)
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
   FIX #2:
   - Convert RGB samples to HSB BEFORE applying saturation/brightness filters
   - Apply uiValues.minSaturation and uiValues.brightness to all sampled colors
   - Never add random colors when source is an image; instead re-sample
     with relaxed constraints to always fill from image pixels only
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

  // -------------------------
  // COLLECT ALL IMAGE PIXELS
  // -------------------------
  let allPixels = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      let idx = 4 * (y * w + x);
      if (idx + 3 >= g.pixels.length) continue;
      let a = g.pixels[idx + 3];
      if (a < 10) continue;
      allPixels.push([g.pixels[idx], g.pixels[idx + 1], g.pixels[idx + 2]]);
    }
  }

  g.remove();

  // Fallback palette if image has no usable pixels
  if (allPixels.length === 0) {
    colorMode(HSB, 360, 100, 100);
    const fallback = [
      color(30, 80, 90), color(200, 70, 90), color(100, 60, 80),
      color(0, 0, 30),   color(250, 60, 80), color(120, 50, 70),
      color(300, 40, 60)
    ];
    colorMode(RGB, 255);
    return fallback;
  }

  // -------------------------
  // HELPER: RGB → HSB values
  // -------------------------
  function rgbToHsb(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0, s = max === 0 ? 0 : delta / max, v = max;
    if (delta !== 0) {
      if (max === r)      h = ((g - b) / delta) % 6;
      else if (max === g) h = (b - r) / delta + 2;
      else                h = (r - g) / delta + 4;
      h = h * 60;
      if (h < 0) h += 360;
    }
    return { h, s: s * 100, b: v * 100 };
  }

  // -------------------------
  // FILTER BY uiValues — run in HSB space
  // Two passes: strict first, then relaxed (brightness only) so we
  // always fill from real image pixels, never random colors.
  // -------------------------
  function pickColors(pixels, satMin, briTarget, briRange, needed, distThresh) {
    const out = [];
    // shuffle for variety
    const shuffled = pixels.slice().sort(() => Math.random() - 0.5);

    for (const [r, gb, b] of shuffled) {
      const hsb = rgbToHsb(r, gb, b);

      if (hsb.s < satMin) continue;
      if (hsb.b < briTarget - briRange || hsb.b > briTarget + briRange) continue;

      // diversity check
      let unique = true;
      for (const ex of out) {
        if (colorDistanceRGB_raw(r, gb, b, ex[0], ex[1], ex[2]) < distThresh) {
          unique = false;
          break;
        }
      }
      if (unique) out.push([r, gb, b]);
      if (out.length >= needed) break;
    }
    return out;
  }

  const targetCount = gradientCount;
  const briTarget  = uiValues.brightness;
  const satMin     = uiValues.minSaturation;

  // Pass 1 — full constraints
  let picked = pickColors(allPixels, satMin, briTarget, 25, targetCount, 28);

  // Pass 2 — relax saturation if not enough
  if (picked.length < targetCount) {
    const extra = pickColors(
      allPixels,
      Math.max(0, satMin - 30),  // relax sat
      briTarget, 35,              // slightly wider brightness window
      targetCount - picked.length,
      20                          // looser diversity
    );
    // merge, dedup
    for (const px of extra) {
      let ok = true;
      for (const ex of picked) {
        if (colorDistanceRGB_raw(px[0], px[1], px[2], ex[0], ex[1], ex[2]) < 20) {
          ok = false; break;
        }
      }
      if (ok) picked.push(px);
      if (picked.length >= targetCount) break;
    }
  }

  // Pass 3 — any pixel from image (no sat/bri filter) to avoid random fill
  if (picked.length < targetCount) {
    const extra = pickColors(allPixels, 0, 50, 50, targetCount - picked.length, 15);
    for (const px of extra) {
      let ok = true;
      for (const ex of picked) {
        if (colorDistanceRGB_raw(px[0], px[1], px[2], ex[0], ex[1], ex[2]) < 15) {
          ok = false; break;
        }
      }
      if (ok) picked.push(px);
      if (picked.length >= targetCount) break;
    }
  }

  // Last resort: repeat existing colors (still from image, not random)
  while (picked.length < targetCount && allPixels.length > 0) {
    picked.push(allPixels[Math.floor(Math.random() * allPixels.length)]);
  }

  // Convert to p5.Color in RGB mode
  colorMode(RGB, 255);
  const out = picked.slice(0, targetCount).map(([r, gb, b]) => color(r, gb, b));
  return out;
}

/* ==========================================================
   COLOR DISTANCE (instances)
========================================================== */
function colorDistanceRGB(c1, c2) {
  return colorDistanceRGB_raw(
    c1.levels[0], c1.levels[1], c1.levels[2],
    c2.levels[0], c2.levels[1], c2.levels[2]
  );
}

/* ==========================================================
   COLOR DISTANCE (raw r,g,b values — used internally)
========================================================== */
function colorDistanceRGB_raw(r1, g1, b1, r2, g2, b2) {
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
