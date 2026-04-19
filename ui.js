/* ==========================================================
   FIELD GENERATIVE — UI DASHBOARD (FULL)
========================================================== */

/* ==========================================================
   FONT INJECTION
========================================================== */
function injectUIFont() {
  const style = document.createElement("style");
  style.innerHTML = `
    @font-face {
      font-family: "UIFont";
      src: url("FieldSans-Bold.ttf") format("truetype");
      font-weight: normal;
      font-style: normal;
    }
    #fg-ui, #fg-ui *, #fg-help, #fg-help * {
      font-family: "UIFont", sans-serif !important;
      letter-spacing: 0.2px;
    }
  `;
  document.head.appendChild(style);
}
injectUIFont();

/* ==========================================================
   CREATE UI
========================================================== */
function createUI() {
  const panel = document.createElement("div");
  panel.id = "fg-ui";
  Object.assign(panel.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "260px",
    height: "100vh",
    background: "rgba(255,255,255)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRight: "1px solid rgba(0,0,0)",
    padding: "14px",
    color: "#000",
    overflowY: "auto",
    boxSizing: "border-box",
    zIndex: "99999",
  });
  document.body.appendChild(panel);
  createHelpPanel();

  /* ================= HEADER ================= */
  const header = document.createElement("div");
  header.innerHTML = `
    <div style="font-size:18px;font-weight:600;margin-bottom:10px;letter-spacing:0.5px">
      FIELD GENERATIVE
    </div>`;
  panel.appendChild(header);

  /* ================= THUMBNAIL ================= */
  const thumb = document.createElement("img");
  Object.assign(thumb.style, {
    width: "100%",
    borderRadius: "8px",
    marginTop: "8px",
    display: "none",
    border: "1px solid rgba(0,0,0)"
  });
  panel.appendChild(thumb);
  window.__FG_THUMB = thumb;

  /* ================= FILE INPUT ================= */
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.width = "100%";
  fileInput.style.marginTop = "8px";
  panel.appendChild(fileInput);

  fileInput.addEventListener("change", ev => {
    const f = ev.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    loadImage(url, im => {
      img = im;
      thumb.src = url;
      thumb.style.display = "block";
    });
  });

  /* ================= PALETTE PREVIEW ================= */
  const paletteLabel = document.createElement("div");
  paletteLabel.textContent = "Current Palette";
  Object.assign(paletteLabel.style, {
    margin: "14px 0 6px",
    fontSize: "13px",
    opacity: "0.8"
  });
  panel.appendChild(paletteLabel);

  const paletteWrap = document.createElement("div");
  paletteWrap.id = "fg-palette";
  Object.assign(paletteWrap.style, {
    display: "flex",
    gap: "6px",
    justifyContent: "space-between",
    marginBottom: "10px"
  });
  panel.appendChild(paletteWrap);
  window.__FG_PALETTE_WRAP = paletteWrap;
  updatePalettePreviewUI();
  updateBodyBackground();

  /* ================= SECTION TITLE ================= */
  function addSectionTitle(txt) {
    const d = document.createElement("div");
    d.textContent = txt;
    Object.assign(d.style, {
      margin: "14px 0 6px",
      fontSize: "13px",
      opacity: "0.7"
    });
    panel.appendChild(d);
  }

  /* ================= SLIDER ================= */
  function addSlider(label, key, min, max, step = 1, onChangeExtra) {
    const wrap = document.createElement("div");
    wrap.style.marginBottom = "14px";

    const lb = document.createElement("div");
    lb.style.fontSize = "12px";
    lb.style.marginBottom = "4px";
    lb.style.opacity = "0.85";
    lb.textContent = `${label}: ${uiValues[key]}`;
    wrap.appendChild(lb);

    const sl = document.createElement("input");
    sl.type = "range";
    sl.min = min;
    sl.max = max;
    sl.step = step;
    sl.value = uiValues[key];

    Object.assign(sl.style, {
      width: "100%",
      cursor: "pointer",
      height: "6px",
      borderRadius: "6px",
      outline: "none",
      border: "1px solid rgba(0,0,0)",
      background: "rgba(255,255,255,0.10)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      appearance: "none",
    });

    if (!window.__FG_SLIDER_STYLE) {
      const st = document.createElement("style");
      st.innerHTML = `
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: rgba(255,255,255,0.95);
          box-shadow: 0 0 8px rgba(255,255,255,0.6);
          border: 1px solid rgba(0,0,0);
        }
        input[type=range]::-moz-range-thumb {
          width: 14px; height: 14px;
          border-radius: 50%;
          background: rgba(255,255,255,0.95);
          box-shadow: 0 0 8px rgba(255,255,255,0.6);
          border: 1px solid rgba(0,0,0);
        }
      `;
      document.head.appendChild(st);
      window.__FG_SLIDER_STYLE = true;
    }

    sl.oninput = () => {
      uiValues[key] = Number(sl.value);
      lb.textContent = `${label}: ${sl.value}`;
      if (onChangeExtra) onChangeExtra(Number(sl.value));
    };

    wrap.appendChild(sl);
    panel.appendChild(wrap);
    return sl; // return so callers can cross-link sliders
  }

  /* ================= HELP PANEL (inner fn) ================= */
  function createHelpPanel() {
    const hp = document.createElement("div");
    hp.id = "fg-help";

    Object.assign(hp.style, {
      position: "fixed",
      top: "0",
      right: "0",
      width: "300px",
      height: "100vh",
      padding: "16px",
      boxSizing: "border-box",
      background: "rgba(255,255,255)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderLeft: "1px solid rgba(0,0,0)",
      color: "#000",
      overflowY: "auto",
      zIndex: "99998",
    });

    hp.innerHTML = `
      <div style="font-size:15px;font-weight:600;letter-spacing:0.4px;margin-bottom:12px;">
        HOW TO USE
      </div>

      <div style="font-size:12px;line-height:1.55;opacity:0.75;">
        <strong>PALETTE CONTROLS</strong><br><br>

        • <b>Saturation</b><br>
        Controls color intensity.<br>
        Higher = stronger, more vivid colors.<br><br>

        • <b>Brightness</b><br>
        Controls overall lightness.<br>
        Higher = brighter visuals.<br><br>

        • <b>Hue Bins</b><br>
        Number of distinct color groups sampled.<br>
        Higher = more color variety.<br><br>

        • <b>Sample Step</b><br>
        Density of pixel sampling from your image.<br>
        Lower = finer color detail captured.<br><br>

        <strong>💡 HUE &amp; STEP GUIDE</strong><br><br>
        For the cleanest results, match these two sliders:<br><br>
        &nbsp;↑ <b>Hue high (8–12)</b> → use <b>Step high (6–10)</b><br>
        &nbsp;&nbsp;&nbsp;More colors, broader sampling — avoids noise.<br><br>
        &nbsp;↓ <b>Hue low (3–5)</b> → use <b>Step low (1–3)</b><br>
        &nbsp;&nbsp;&nbsp;Fewer colors, fine sampling — sharp, minimal.<br><br>
        Mismatching (high Hue + low Step) can produce<br>
        muddy or overly busy visuals.<br><br>

        <strong>APPLY vs SHUFFLE</strong><br><br>
        • <b>APPLY</b> — Re-extracts a fresh set of colors<br>
        from your image (or generates new random ones)<br>
        using the current slider values. Best blends come<br>
        from trying APPLY a few times.<br><br>
        • <b>SHUFFLE</b> — Keeps the current colors but<br>
        re-draws a new sample variation from the same<br>
        image with a different random seed — gives you<br>
        new picks without changing sliders.<br><br>

        <strong>VIEW &amp; EXPORT</strong><br><br>
        • <b>Export PNG</b> — Saves current frame.<br><br>
        • <b>Start / Stop Recording</b> — Records a live<br>
        WebM video. A <span style="color:#c00;font-weight:700">● REC</span> indicator appears<br>
        while recording is active.<br><br>

        <strong>RENDER NOTE</strong><br><br>
        Video quality scales with your machine.<br>
        For best results (≥ 80/100), use a modern GPU.<br>
        Recording at a steady 30 fps canvas stream<br>
        ensures smooth playback on most machines.
      </div>
    `;

    document.body.appendChild(hp);
  }

  /* ================= SLIDERS ================= */
  addSectionTitle("Palette Controls");
  addSlider("Saturation",   "minSaturation", 0, 100);
  addSlider("Brightness",   "brightness",    0, 100);

  // Bug #5 — Hue and Step hint: show a small inline tip whenever
  // the two values are mismatched, and auto-suggest the paired value.
  const hintEl = document.createElement("div");
  hintEl.id = "fg-hue-step-hint";
  Object.assign(hintEl.style, {
    fontSize: "11px",
    lineHeight: "1.45",
    padding: "7px 9px",
    marginBottom: "10px",
    borderRadius: "6px",
    background: "rgba(78,140,255,0.10)",
    border: "1px solid rgba(78,140,255,0.30)",
    color: "#2255bb",
    display: "none",
  });
  panel.appendChild(hintEl);

  function updateHueStepHint() {
    const hue  = uiValues.hueBins;
    const step = uiValues.sampleStep;

    // Ideal: both in same band (low ≤5 | mid 6–8 | high ≥9)
    const hueBand  = hue  <= 5 ? 0 : hue  <= 8 ? 1 : 2;
    const stepBand = step <= 3 ? 0 : step <= 6 ? 1 : 2;

    if (hueBand === stepBand) {
      hintEl.style.display = "none";
      return;
    }

    hintEl.style.display = "block";

    if (hueBand > stepBand) {
      // Hue high, step too low → muddy
      const suggested = hue >= 9 ? "6–10" : "4–7";
      hintEl.textContent =
        `💡 Hue ${hue} is high — try Step ${suggested} for cleaner blends.`;
    } else {
      // Step high, hue too low → undersampled
      const suggested = step >= 7 ? "7–12" : "5–8";
      hintEl.textContent =
        `💡 Step ${step} is high — try Hue Bins ${suggested} for richer color.`;
    }
  }

  addSlider("Hue Bins",    "hueBins",    3, 12, 1, updateHueStepHint);
  addSlider("Sample Step", "sampleStep", 1, 10, 1, updateHueStepHint);

  // Move hint below Sample Step (it was inserted before the sliders)
  panel.appendChild(hintEl);
  updateHueStepHint();

  /* ================= APPLY / SHUFFLE ================= */
  const btnRow = document.createElement("div");
  Object.assign(btnRow.style, {
    display: "flex",
    gap: "8px",
    marginTop: "18px"
  });
  panel.appendChild(btnRow);

  const applyBtn = document.createElement("button");
  applyBtn.textContent = "APPLY";
  Object.assign(applyBtn.style, {
    flex: "1",
    padding: "10px 0",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
    background: "linear-gradient(135deg, #4e8cff, #7db0ff)",
    color: "#fff",
  });
  btnRow.appendChild(applyBtn);

  const shuffleBtn = document.createElement("button");
  shuffleBtn.textContent = "SHUFFLE";
  Object.assign(shuffleBtn.style, {
    flex: "1",
    padding: "10px 0",
    borderRadius: "6px",
    border: "1px solid rgba(0,0,0)",
    cursor: "pointer",
    fontWeight: "600",
    background: "rgba(255,255,255,0.12)",
    color: "#000",
  });
  btnRow.appendChild(shuffleBtn);

  /* ================= APPLY LOGIC ================= */
  // Bug #4 — APPLY: always re-extracts with current slider values,
  // tries multiple blend candidates and picks the set with highest
  // average pairwise color distance (most visually distinct palette).
  applyBtn.onclick = async () => {
    applyBtn.disabled = true;
    applyBtn.textContent = "…";

    if (img) {
      // Run 3 extraction passes and keep the most varied palette
      const candidates = await Promise.all([
        extractPaletteFromImage(img, uiValues.sampleStep),
        extractPaletteFromImage(img, Math.max(1, uiValues.sampleStep - 1)),
        extractPaletteFromImage(img, Math.min(10, uiValues.sampleStep + 1)),
      ]);

      let best = candidates[0];
      let bestScore = _paletteDiversity(candidates[0]);
      for (let i = 1; i < candidates.length; i++) {
        const s = _paletteDiversity(candidates[i]);
        if (s > bestScore) { bestScore = s; best = candidates[i]; }
      }
      gradients = best.slice(0, gradientCount);
    } else {
      randomizePaletteWithConstraints();
    }

    ensureFullPalette();
    updatePalettePreviewUI();
    updateBodyBackground();

    applyBtn.disabled = false;
    applyBtn.textContent = "APPLY";
  };

  /* ================= SHUFFLE LOGIC ================= */
  // Bug #4 — SHUFFLE when image loaded: re-extracts a fresh sample
  // with a slightly randomised step so it genuinely picks new colors
  // rather than just reordering the existing ones.
  shuffleBtn.onclick = async () => {
    if (img) {
      shuffleBtn.disabled = true;
      shuffleBtn.textContent = "…";

      // Vary step randomly ±2 around current value for new picks
      const baseStep = uiValues.sampleStep;
      const jitter   = Math.floor(Math.random() * 5) - 2; // -2..+2
      const step     = Math.max(1, Math.min(10, baseStep + jitter));

      const pal = await extractPaletteFromImage(img, step);
      gradients = pal.slice(0, gradientCount);
      ensureFullPalette();

      shuffleBtn.disabled = false;
      shuffleBtn.textContent = "SHUFFLE";
    } else {
      // No image: shuffle existing order (original behaviour)
      for (let i = gradients.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gradients[i], gradients[j]] = [gradients[j], gradients[i]];
      }
    }

    updatePalettePreviewUI();
    updateBodyBackground();
  };
}

/* ==========================================================
   PALETTE DIVERSITY SCORE
   Average pairwise RGB distance — higher = more varied palette.
   Used by APPLY to pick the best of several extraction candidates.
========================================================== */
function _paletteDiversity(pal) {
  if (!pal || pal.length < 2) return 0;
  let total = 0, count = 0;
  for (let i = 0; i < pal.length; i++) {
    for (let j = i + 1; j < pal.length; j++) {
      total += colorDistanceRGB(pal[i], pal[j]);
      count++;
    }
  }
  return count > 0 ? total / count : 0;
}

/* ==========================================================
   PALETTE PREVIEW UI
========================================================== */
function updatePalettePreviewUI() {
  const wrap = window.__FG_PALETTE_WRAP;
  if (!wrap) return;

  wrap.innerHTML = "";

  const visibleCount = Math.max(0, gradientCount - 2);

  for (let i = 0; i < visibleCount; i++) {
    let c = gradients[i];

    const sw = document.createElement("div");
    Object.assign(sw.style, {
      width: "32px",
      height: "32px",
      borderRadius: "4px",
      border: "1px solid rgba(0,0,0)",
      background: p5ColorToHex(c),
      cursor: "pointer",
      position: "relative",
    });

    sw.title = "Click to edit color";

    const picker = document.createElement("input");
    picker.type = "color";
    picker.value = p5ColorToHex(c);
    Object.assign(picker.style, {
      position: "absolute",
      inset: "0",
      opacity: "0",
      cursor: "pointer",
    });

    picker.onfocus = () => { sw.style.outline = "2px solid #000"; };
    picker.onblur  = () => { sw.style.outline = "none"; };

    picker.oninput = e => {
      const hex = e.target.value;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      gradients[i] = color(r, g, b);
      sw.style.background = hex;
    };

    sw.appendChild(picker);
    wrap.appendChild(sw);
  }
}

/* ==========================================================
   createHelpPanel — also callable at top-level (legacy call
   in original main.js uses it outside createUI scope)
========================================================== */
function createHelpPanel() {
  if (document.getElementById("fg-help")) return; // already created
  const hp = document.createElement("div");
  hp.id = "fg-help";
  Object.assign(hp.style, {
    position: "fixed",
    top: "0",
    right: "0",
    width: "300px",
    height: "100vh",
    padding: "16px",
    boxSizing: "border-box",
    background: "rgba(255,255,255)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderLeft: "1px solid rgba(0,0,0)",
    color: "#000",
    overflowY: "auto",
    zIndex: "99998",
  });
  hp.innerHTML = `
    <div style="font-size:15px;font-weight:600;letter-spacing:0.4px;margin-bottom:12px;">HOW TO USE</div>
    <div style="font-size:12px;line-height:1.55;opacity:0.75;">
      See panel for details.
    </div>`;
  document.body.appendChild(hp);
}
