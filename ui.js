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
  function addSlider(label, key, min, max, step = 1) {
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

    const css = `
      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: rgba(255,255,255,0.95);
        box-shadow: 0 0 8px rgba(255,255,255,0.6);
        border: 1px solid rgba(0,0,0);
      }
      input[type=range]::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: rgba(255,255,255,0.95);
        box-shadow: 0 0 8px rgba(255,255,255,0.6);
        border: 1px solid rgba(0,0,0);
      }
    `;
    if (!window.__FG_SLIDER_STYLE) {
      const st = document.createElement("style");
      st.innerHTML = css;
      document.head.appendChild(st);
      window.__FG_SLIDER_STYLE = true;
    }

    sl.oninput = () => {
      uiValues[key] = Number(sl.value);
      lb.textContent = `${label}: ${sl.value}`;
    };

    wrap.appendChild(sl);
    panel.appendChild(wrap);
  }
function createHelpPanel() {
  const panel = document.createElement("div");
  panel.id = "fg-help";

  Object.assign(panel.style, {
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

  panel.innerHTML = `
    <div style="font-size:15px;font-weight:600;letter-spacing:0.4px;margin-bottom:12px;">
      HOW TO USE
    </div>

    <div style="font-size:12px;line-height:1.55;opacity:0.75;">
      <strong>PALETTE CONTROLS</strong><br><br>

      • <b>Saturation</b><br>
      Controls the color intensity.<br>
      Higher values produce stronger colors.<br><br>

      • <b>Brightness</b><br>
      Controls overall lightness of the palette.<br>
      Higher values create brighter visuals.<br><br>

      • <b>Hue Bins</b><br>
      Defines how many distinct hue groups are used.<br>
      Higher values increase color variation.<br><br>

      • <b>Sample Step</b><br>
      Controls how densely colors are sampled from an image.<br>
      Lower values capture more detail.<br><br>

<strong>VIEW & EXPORT</strong><br><br>

• <b>Realtime View</b><br>
Preview and adjust visuals in real time.<br><br>

• <b>Export Image</b><br>
Save the current frame as an image.<br><br>

• <b>Render Video (PNG)</b><br>
Generate a high-quality image sequence for video export.<br>
Render quality depends on your machine performance.<br><br>

<strong>RENDER NOTE</strong><br><br>
For best results, use Render Video on a powerful machine.<br>
Stronger hardware allows smoother motion and higher visual fidelity.
</div>
  `;

  document.body.appendChild(panel);
}


  /* ================= SLIDERS ================= */
  addSectionTitle("Palette Controls");
  addSlider("Saturation", "minSaturation", 0, 100);
  addSlider("Brightness", "brightness", 0, 100);
  addSlider("Hue Bins", "hueBins", 3, 12, 1);
  addSlider("Sample Step", "sampleStep", 1, 10, 1);

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

  /* ================= APPLY LOGIC (GỘP 1 LẦN) ================= */
  applyBtn.onclick = async () => {
    if (img) {
      const pal = await extractPaletteFromImage(img, uiValues.sampleStep);
      gradients = pal.slice(0, gradientCount);
    } else {
      randomizePaletteWithConstraints();
    }
    ensureFullPalette();
    updatePalettePreviewUI();
	  updateBodyBackground();
  };

  /* ================= SHUFFLE ================= */
  shuffleBtn.onclick = () => {
    for (let i = gradients.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gradients[i], gradients[j]] = [gradients[j], gradients[i]];
    }
    updatePalettePreviewUI();
	  updateBodyBackground();
  };
}

/* ==========================================================
   PALETTE PREVIEW UI
========================================================== */
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

    picker.onfocus = () => {
      sw.style.outline = "2px solid #000";
    };

    picker.onblur = () => {
      sw.style.outline = "none";
    };

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

