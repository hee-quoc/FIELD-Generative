/* ==========================================================
   FIELD GENERATIVE — EXPORT TOOLS + PRESETS
========================================================== */

/* ==========================================================
   ADD EXPORT BUTTONS
========================================================== */
function addExportButtons() {
  const panel = document.getElementById("fg-ui");
  if (!panel) return;

  const title = document.createElement("div");
  title.textContent = "Export & Presets";
  Object.assign(title.style, {
    marginTop: "18px",
    marginBottom: "6px",
    fontSize: "13px",
    opacity: "0.7",
  });
  panel.appendChild(title);

  function makeBtn(label) {
    const b = document.createElement("button");
    b.textContent = label;
    Object.assign(b.style, {
      width: "100%",
      padding: "9px 0",
      marginTop: "8px",
      borderRadius: "6px",
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.2)",
      color: "#fff",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: "500"
    });
    b.onmouseenter = () => b.style.background = "rgba(255,255,255,0.15)";
    b.onmouseleave = () => b.style.background = "rgba(255,255,255,0.08)";
    panel.appendChild(b);
    return b;
  }

  /* ================= EXPORT JSON ================= */
  makeBtn("Export JSON").onclick = () => {
    const data = gradients.map(c => p5ColorToHex(c));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });
    downloadBlob(blob, "palette.json");
  };

  /* ================= COPY HEX ================= */
  makeBtn("Copy All HEX").onclick = () => {
    navigator.clipboard.writeText(
      gradients.map(c => p5ColorToHex(c)).join("\n")
    );
  };

  /* ================= EXPORT PNG ================= */
  makeBtn("Export PNG Palette Card").onclick = exportPalettePNG;

  /* ================= RECORD VIDEO ================= */
  makeBtn("Record Video").onclick = () => startFastRecording();
  makeBtn("Stop & Save Video").onclick = () => stopFastRecording();
}

/* ==========================================================
   EXPORT PNG — FULL VISUAL + OVERLAY
========================================================== */
async function exportPalettePNG() {
  let w = width;
  let h = height;

  let gfx = createGraphics(w, h);
  gfx.pixelDensity(1);

  gfx.push();
  gfx.translate(offsetX, offsetY);
  gfx.scale(scaleFactor);

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

      gfx.noStroke();
      gfx.fill(lerpColor(c1, c2, frac));

      let px = cellW * (x + 0.5);
      let py = cellH * (y + 0.5);
      let w1 = max(cellW + 1.4, baseElementSize * scaleFactor);
      let h1 = max(cellH + 1.4, baseElementSize * scaleFactor);

      gfx.rect(px, py, w1, h1);
    }
  }

  gfx.pop();

  const overlayPath = "overlay.png";
  await new Promise(resolve => {
    loadImage(overlayPath, overlay => {
      if (overlay) {
        let logoW = overlay.width * 0.35;
        let logoH = overlay.height * 0.35;
        let margin = 20;
        gfx.image(
          overlay,
          w - logoW - margin,
          h - logoH - margin,
          logoW,
          logoH
        );
      }
      resolve();
    });
  });

  save(gfx, "field_visual.png");
}

/* ==========================================================
   CCAPTURE RECORDING
========================================================== */
let capturer = null;
let recording = false;
let recordedFrames = 0;
let maxFrames = 360;

function startRecording() {
  if (!ccaptureLoaded) return;

  capturer = new CCapture({
    framerate: 60,
    format: "webm",
    verbose: true,
  });

  recording = true;
  recordedFrames = 0;
  capturer.start();
}

function recordFrameIfNeeded() {
  if (recording && capturer) {
    capturer.capture(canvas);
    recordedFrames++;
    if (recordedFrames >= maxFrames) {
      recording = false;
      capturer.stop();
      capturer.save();
    }
  }
}

/* ==========================================================
   FAST VIDEO RECORDING (MediaRecorder)
========================================================== */
let recorder = null;
let recordedChunks = [];
let isRecording = false;

function startFastRecording() {
  let stream = document.querySelector("canvas").captureStream(60);
  recordedChunks = [];
  recorder = new MediaRecorder(stream, { mimeType: "video/webm" });

  recorder.ondataavailable = e => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  recorder.onstop = saveFastVideo;
  recorder.start();
  isRecording = true;
}

function stopFastRecording() {
  if (!isRecording) return;
  recorder.stop();
  isRecording = false;
}

function saveFastVideo() {
  const blob = new Blob(recordedChunks, { type: "video/webm" });
  downloadBlob(blob, "field_visual.webm");
}

/* ==========================================================
   UTILITIES
========================================================== */
function downloadBlob(blob, filename) {
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
