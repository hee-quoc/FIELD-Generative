/* ==========================================================
   FIELD GENERATIVE — PALETTE
   Palette Randomizer + Image Extraction
========================================================== */

/* ==========================================================
   DEFAULT PALETTE
   #ff1900 → #ffe229 → #d3ff75 → #8fd100 → #ffffff
   
   Why this works in noise visual:
   1. Continuous hue journey (7°→53°→79°→83°) — no hue "breaks",
      lerp is always smooth.
   2. Luma arc: 21% → 83% → 91% → 65% → 100% — two "valleys"
      at slot 1 and slot 4 create depth contrast.
   3. White at slot 5 = natural highlight: S-curve noise pushes
      ~15% of pixels to the extreme, producing scattered bright
      "light points" that feel alive.
   4. At least one fully saturated anchor (S=100) at each end so
      the palette never looks washed-out.
   
   gradients[5] and [6] are kept as structural fill-outs (dark
   variants) so ensureFullPalette() doesn't add random colors.
   They are NOT rendered — engine slices to gradientCount-2=5.
========================================================== */
function getDefaultPalette() {
  colorMode(RGB, 255);
  const p = [
    color(255, 25,   0),   // 1  #ff1900  — anchor red, luma 21%
    color(255, 226, 41),   // 2  #ffe229  — warm yellow, luma 83%
    color(211, 255, 117),  // 3  #d3ff75  — lime, luma 91%
    color(143, 209,  0),   // 4  #8fd100  — olive green, luma 65%
    color(255, 255, 255),  // 5  #ffffff  — white highlight
    color( 80,  10,  0),   // 6  structural dark (hidden)
    color( 50,  70,  0),   // 7  structural dark (hidden)
  ];
  return p;
}

/* ==========================================================
   PALETTE RANDOMIZER
========================================================== */
function randomizePaletteWithConstraints() {
  gradients = [];
  colorMode(HSB, 360, 100, 100);

  let bins    = uiValues.hueBins;
  let binSize = 360 / bins;
  let out     = [];

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

  // Sort by hue for continuous hue journey
  out.sort((a, b) => {
    colorMode(HSB, 360, 100, 100);
    const ha = hue(a), hb = hue(b);
    colorMode(RGB, 255);
    return ha - hb;
  });

  // Ensure a bright/white anchor at the end (slot 5 principle)
  colorMode(HSB, 360, 100, 100);
  out.push(color(0, 0, 100)); // white-ish anchor
  colorMode(RGB, 255);

  gradients = out;
  ensureFullPalette();
  colorMode(RGB, 255);
  updateBodyBackground();
}

function updateBodyBackground() {
  if (!window.gradients || gradients.length === 0) return;
  const c = gradients[0];
  document.body.style.background = `rgb(
    ${Math.floor(c.levels[0] * 0.25)},
    ${Math.floor(c.levels[1] * 0.25)},
    ${Math.floor(c.levels[2] * 0.25)}
  )`;
}

/* ==========================================================
   ENSURE FULL PALETTE
========================================================== */
function ensureFullPalette() {
  gradients = gradients.filter(c => c instanceof p5.Color);
  while (gradients.length < gradientCount) {
    // Use structural darks matching the default palette feel
    gradients.push(color(random(30, 80), random(60, 100), random(30, 60)));
  }
  gradients = gradients.slice(0, gradientCount);
}

/* ==========================================================
   IMAGE PALETTE EXTRACTION
   
   Applies the same principles as the default palette:
   1. Sort extracted colors by hue → continuous hue journey
   2. Ensure luma contrast between adjacent slots (> ~15%)
   3. Promote the brightest color to the last visible slot (5)
      → natural highlight / "white point" effect
   4. Keep at least one high-saturation anchor
   5. Never add random colors — always from image pixels
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

  let allPixels = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      let idx = 4 * (y * w + x);
      if (idx + 3 >= g.pixels.length) continue;
      if (g.pixels[idx + 3] < 10) continue;
      allPixels.push([g.pixels[idx], g.pixels[idx + 1], g.pixels[idx + 2]]);
    }
  }
  g.remove();

  if (allPixels.length === 0) return getDefaultPalette();

  // ── helpers ──────────────────────────────────────────────
  function rgbToHsb(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0, s = mx === 0 ? 0 : d / mx, v = mx;
    if (d !== 0) {
      if (mx === r)      h = ((g - b) / d) % 6;
      else if (mx === g) h = (b - r) / d + 2;
      else               h = (r - g) / d + 4;
      h = h * 60;
      if (h < 0) h += 360;
    }
    return { h, s: s * 100, b: v * 100 };
  }

  // Perceptual luma (0-100)
  function luma(r, g, b) {
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 * 100;
  }

  function pickColors(pixels, satMin, briTarget, briRange, needed, distThresh) {
    const out = [];
    const shuffled = pixels.slice().sort(() => Math.random() - 0.5);
    for (const [r, gb, b] of shuffled) {
      const hsb = rgbToHsb(r, gb, b);
      if (hsb.s < satMin) continue;
      if (hsb.b < briTarget - briRange || hsb.b > briTarget + briRange) continue;
      let unique = true;
      for (const ex of out) {
        if (colorDistanceRGB_raw(r, gb, b, ex[0], ex[1], ex[2]) < distThresh) {
          unique = false; break;
        }
      }
      if (unique) out.push([r, gb, b]);
      if (out.length >= needed) break;
    }
    return out;
  }

  const visibleCount = gradientCount - 2; // 5 visible slots
  const satMin    = uiValues.minSaturation;
  const briTarget = uiValues.brightness;

  // 3-pass extraction (same as before)
  let picked = pickColors(allPixels, satMin,              briTarget, 25, visibleCount, 28);
  if (picked.length < visibleCount) {
    const extra = pickColors(allPixels, Math.max(0, satMin - 30), briTarget, 35, visibleCount - picked.length, 20);
    for (const px of extra) {
      let ok = true;
      for (const ex of picked) if (colorDistanceRGB_raw(px[0], px[1], px[2], ex[0], ex[1], ex[2]) < 20) { ok = false; break; }
      if (ok) picked.push(px);
      if (picked.length >= visibleCount) break;
    }
  }
  if (picked.length < visibleCount) {
    const extra = pickColors(allPixels, 0, 50, 50, visibleCount - picked.length, 15);
    for (const px of extra) {
      let ok = true;
      for (const ex of picked) if (colorDistanceRGB_raw(px[0], px[1], px[2], ex[0], ex[1], ex[2]) < 15) { ok = false; break; }
      if (ok) picked.push(px);
      if (picked.length >= visibleCount) break;
    }
  }
  while (picked.length < visibleCount && allPixels.length > 0) {
    picked.push(allPixels[Math.floor(Math.random() * allPixels.length)]);
  }

  // ── POST-PROCESS: apply default-palette ordering principles ──

  // 1. Sort by hue → continuous hue journey (no color "breaks" in lerp)
  picked.sort((a, b) => rgbToHsb(a[0], a[1], a[2]).h - rgbToHsb(b[0], b[1], b[2]).h);

  // 2. Ensure luma contrast between adjacent slots
  //    If two adjacent colors are too close in luma (< 12%), swap with
  //    a farther color in the array to break the monotony.
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < picked.length - 1; i++) {
      const la = luma(...picked[i]);
      const lb = luma(...picked[i + 1]);
      if (Math.abs(la - lb) < 12) {
        // Find the farthest-luma color remaining in the rest of the array
        let bestJ = -1, bestDiff = 0;
        for (let j = i + 2; j < picked.length; j++) {
          const lj = luma(...picked[j]);
          const diff = Math.abs(la - lj);
          if (diff > bestDiff) { bestDiff = diff; bestJ = j; }
        }
        if (bestJ !== -1 && bestDiff > 12) {
          [picked[i + 1], picked[bestJ]] = [picked[bestJ], picked[i + 1]];
        }
      }
    }
  }

  // 3. Move the brightest/most-luminous color to slot 5 (last visible)
  //    → mimics #ffffff at the end: creates natural highlight points
  let brightestIdx = 0, brightestLuma = 0;
  for (let i = 0; i < picked.length; i++) {
    const l = luma(...picked[i]);
    if (l > brightestLuma) { brightestLuma = l; brightestIdx = i; }
  }
  // Only promote if it's not already at the end AND it's significantly brighter
  if (brightestIdx !== picked.length - 1 && brightestLuma > 70) {
    const bright = picked.splice(brightestIdx, 1)[0];
    picked.push(bright);
  }

  // 4. Ensure at least one high-saturation anchor (S > 65)
  //    If none found, replace the slot with median luma with the most saturated pixel
  const hasSatAnchor = picked.some(([r, gb, b]) => rgbToHsb(r, gb, b).s > 65);
  if (!hasSatAnchor) {
    const mostSat = allPixels.slice().sort((a, b) =>
      rgbToHsb(b[0], b[1], b[2]).s - rgbToHsb(a[0], a[1], a[2]).s
    )[0];
    if (mostSat) {
      // Replace slot 0 (usually darkest) with the most saturated pixel
      picked[0] = mostSat;
    }
  }

  // 5. Fill hidden slots (6 & 7) with dark structural variants — not random
  const darkSlots = picked.slice(0, 2).map(([r, gb, b]) => [
    Math.floor(r * 0.3),
    Math.floor(gb * 0.3),
    Math.floor(b * 0.3)
  ]);
  const all7 = [...picked, ...darkSlots].slice(0, gradientCount);

  colorMode(RGB, 255);
  return all7.map(([r, gb, b]) => color(r, gb, b));
}

/* ==========================================================
   COLOR DISTANCE helpers
========================================================== */
function colorDistanceRGB(c1, c2) {
  return colorDistanceRGB_raw(c1.levels[0], c1.levels[1], c1.levels[2],
                               c2.levels[0], c2.levels[1], c2.levels[2]);
}

function colorDistanceRGB_raw(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
}

function toHex2(v) { const h = v.toString(16); return h.length === 1 ? "0" + h : h; }

function p5ColorToHex(c) {
  return "#" + toHex2(c.levels[0]) + toHex2(c.levels[1]) + toHex2(c.levels[2]);
}
