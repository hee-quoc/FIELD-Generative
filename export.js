/* ==========================================================
   FIELD GENERATIVE — EXPORT
   FIXES:
   1. PNG timing — "Pause visual" button freezes frame so user
      can pick the perfect moment before capturing.
   2. Export preview modal — after PNG or video export, a
      lightbox shows the result inline. User reviews first,
      then decides to Download or close and try again.
      Visual auto-pauses while modal is open.
========================================================== */

/* ==========================================================
   ADD EXPORT BUTTONS
========================================================== */
function addExportButtons() {
  const panel = document.getElementById("fg-ui");
  if (!panel) return;

  /* ===== EXPORT SECTION TITLE ===== */
  const exportTitle = document.createElement("div");
  exportTitle.textContent = "Export";
  Object.assign(exportTitle.style, {
    marginTop: "18px",
    marginBottom: "6px",
    fontSize: "13px",
    opacity: "0.7",
  });
  panel.appendChild(exportTitle);

  /* =================================================================
     VIEW TOGGLE BUTTON
     Two fixed presets — no dependency on where the user has panned:

       VIEW A  "Overview"  — zoomed-out wide view
                             scaleFactor = 1.0, offset centred
                             change OVERVIEW_SCALE below to taste

       VIEW B  "Detail"    — the original startup close-up
                             scaleFactor = INITIAL_CAMERA.scaleFactor (3.0)
                             defined in main.js INITIAL_CAMERA

     Button label always shows where the NEXT click will take you.
  ================================================================= */
  const OVERVIEW_SCALE = 1.0; // wide view — change this number to taste

  let _activeView = "detail"; // tracks which preset is currently shown

  const viewToggleBtn = makeBtn(panel, "⊞  Overview");
  viewToggleBtn.id = "fg-view-toggle-btn";

  viewToggleBtn.onclick = () => {
    if (_activeView === "detail") {
      offsetX     = 0;
      offsetY     = 0;
      scaleFactor = OVERVIEW_SCALE;
      _activeView = "overview";
      viewToggleBtn.textContent = "⊡  Detail View";
    } else {
      offsetX     = INITIAL_CAMERA.offsetX;
      offsetY     = INITIAL_CAMERA.offsetY;
      scaleFactor = INITIAL_CAMERA.scaleFactor;
      _activeView = "detail";
      viewToggleBtn.textContent = "⊞  Overview";
    }
  };

  /* =================================================================
     FULL SYSTEM RESET BUTTON
     Returns everything to exact first-load state:
       Camera  → INITIAL_CAMERA
       Palette → default (#ff1900 → #ffffff)
       Noise   → t = 5, speed = 4
       View toggle → back to "detail"
  ================================================================= */
  const sysResetBtn = makeBtn(panel, "↺  Reset System");
  sysResetBtn.id = "fg-sys-reset-btn";
  Object.assign(sysResetBtn.style, {
    marginTop: "12px",
    borderColor: "rgba(180,0,0,0.35)",
    color: "#900",
  });

  sysResetBtn.onclick = () => {
    // 1. Camera
    offsetX     = INITIAL_CAMERA.offsetX;
    offsetY     = INITIAL_CAMERA.offsetY;
    scaleFactor = INITIAL_CAMERA.scaleFactor;

    // 2. Palette → default (#ff1900 → #ffffff)
    if (typeof getDefaultPalette === "function")      gradients = getDefaultPalette();
    if (typeof ensureFullPalette === "function")      ensureFullPalette();
    if (typeof updatePalettePreviewUI === "function") updatePalettePreviewUI();
    if (typeof updateBodyBackground === "function")   updateBodyBackground();

    // 3. Clear uploaded image + thumbnail
    img = null;
    const fileInput = document.querySelector("#fg-ui input[type=file]");
    if (fileInput) fileInput.value = "";
    const thumb = window.__FG_THUMB;
    if (thumb) { thumb.src = ""; thumb.style.display = "none"; }

    // 4. Sync view-toggle state
    _activeView = "detail";
    viewToggleBtn.textContent = "⊞  Overview";

    // 5. Flash to confirm
    sysResetBtn.textContent = "✓  Done";
    setTimeout(() => { sysResetBtn.textContent = "↺  Reset System"; }, 1200);
  };

  /* ===== PNG CAPTURE MODE ===== */
  const pngModeBtn = makeBtn(panel, "Prepare PNG Capture");
  pngModeBtn.id = "fg-png-mode-btn";
  pngModeBtn.onclick = togglePNGCaptureMode;

  /* Pause / Resume button — shown only while in PNG capture mode */
  const pauseBtn = makeBtn(panel, "⏸  Pause Visual");
  pauseBtn.id = "fg-pause-btn";
  pauseBtn.style.display = "none";
  pauseBtn.onclick = toggleVisualPause;

  const captureBtn = makeBtn(panel, "Capture PNG Now");
  captureBtn.id = "fg-capture-png-btn";
  captureBtn.style.display = "none";
  captureBtn.onclick = capturePNGNow;

  /* ===== PNG READY STATUS BADGE ===== */
  const pngStatus = document.createElement("div");
  pngStatus.id = "fg-png-status";
  Object.assign(pngStatus.style, {
    display: "none",
    alignItems: "center",
    gap: "7px",
    padding: "7px 10px",
    marginTop: "8px",
    borderRadius: "6px",
    background: "rgba(40,120,220,0.12)",
    border: "1px solid rgba(40,120,220,0.35)",
    fontSize: "12px",
    fontWeight: "600",
    color: "#1d4ed8",
    letterSpacing: "0.3px",
  });

  const pngDot = document.createElement("span");
  pngDot.id = "fg-png-dot";
  Object.assign(pngDot.style, {
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#2563eb",
    flexShrink: "0",
  });

  if (!document.getElementById("fg-png-dot-style")) {
    const ks = document.createElement("style");
    ks.id = "fg-png-dot-style";
    ks.innerHTML = `
      @keyframes fg-png-pulse {
        0%,100% { opacity:1; transform:scale(1); }
        50%      { opacity:0.35; transform:scale(0.75); }
      }
      #fg-png-dot { animation: fg-png-pulse 1s ease-in-out infinite; }
    `;
    document.head.appendChild(ks);
  }

  const pngLabel = document.createElement("span");
  pngLabel.id = "fg-png-label";
  pngLabel.textContent = "PNG READY — Pause then press C or click Capture";

  pngStatus.appendChild(pngDot);
  pngStatus.appendChild(pngLabel);
  panel.appendChild(pngStatus);

  window.__FG_PNG_STATUS   = pngStatus;
  window.__FG_PNG_LABEL    = pngLabel;
  window.__FG_PNG_MODE_BTN = pngModeBtn;
  window.__FG_PAUSE_BTN    = pauseBtn;
  window.__FG_CAPTURE_PNG_BTN = captureBtn;

  /* ===== CANVAS CORNER OVERLAY (PNG READY) ===== */
  const pngCorner = document.createElement("div");
  pngCorner.id = "fg-png-corner";
  Object.assign(pngCorner.style, {
    display: "none",
    position: "fixed",
    top: "14px",
    right: "310px",
    alignItems: "center",
    gap: "6px",
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    padding: "5px 12px",
    borderRadius: "20px",
    zIndex: "99997",
    fontSize: "12px",
    fontWeight: "700",
    color: "#fff",
    letterSpacing: "0.4px",
    pointerEvents: "none",
  });

  const pngCornerDot = document.createElement("span");
  Object.assign(pngCornerDot.style, {
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#3b82f6",
    animation: "fg-png-pulse 1s ease-in-out infinite",
  });

  const pngCornerLabel = document.createElement("span");
  pngCornerLabel.id = "fg-png-corner-label";
  pngCornerLabel.textContent = "PNG READY — press C to capture";

  pngCorner.appendChild(pngCornerDot);
  pngCorner.appendChild(pngCornerLabel);
  document.body.appendChild(pngCorner);

  window.__FG_PNG_CORNER       = pngCorner;
  window.__FG_PNG_CORNER_LABEL = pngCornerLabel;

  /* ===== VIDEO SECTION TITLE ===== */
  const videoTitle = document.createElement("div");
  videoTitle.textContent = "Video";
  Object.assign(videoTitle.style, {
    marginTop: "18px",
    marginBottom: "6px",
    fontSize: "13px",
    opacity: "0.7",
  });
  panel.appendChild(videoTitle);

  /* ===== RECORDING STATUS BADGE ===== */
  const recStatus = document.createElement("div");
  recStatus.id = "fg-rec-status";
  Object.assign(recStatus.style, {
    display: "none",
    alignItems: "center",
    gap: "7px",
    padding: "7px 10px",
    marginTop: "8px",
    borderRadius: "6px",
    background: "rgba(220,40,40,0.12)",
    border: "1px solid rgba(220,40,40,0.45)",
    fontSize: "12px",
    fontWeight: "600",
    color: "#c00",
    letterSpacing: "0.4px",
  });

  const dot = document.createElement("span");
  dot.id = "fg-rec-dot";
  Object.assign(dot.style, {
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#e00",
    flexShrink: "0",
  });

  if (!document.getElementById("fg-rec-dot-style")) {
    const ks = document.createElement("style");
    ks.id = "fg-rec-dot-style";
    ks.innerHTML = `
      @keyframes fg-pulse {
        0%,100% { opacity:1; transform:scale(1); }
        50%      { opacity:0.3; transform:scale(0.7); }
      }
      #fg-rec-dot { animation: fg-pulse 1.1s ease-in-out infinite; }
    `;
    document.head.appendChild(ks);
  }

  const recLabel = document.createElement("span");
  recLabel.textContent = "REC  00:00";
  recLabel.id = "fg-rec-label";

  recStatus.appendChild(dot);
  recStatus.appendChild(recLabel);
  panel.appendChild(recStatus);
  window.__FG_REC_STATUS = recStatus;
  window.__FG_REC_LABEL  = recLabel;

  /* ===== CANVAS CORNER OVERLAY — REC ===== */
  const cornerOverlay = document.createElement("div");
  cornerOverlay.id = "fg-rec-corner";
  Object.assign(cornerOverlay.style, {
    display: "none",
    position: "fixed",
    top: "14px",
    right: "310px",
    alignItems: "center",
    gap: "6px",
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    padding: "5px 12px",
    borderRadius: "20px",
    zIndex: "99997",
    fontSize: "12px",
    fontWeight: "700",
    color: "#fff",
    letterSpacing: "0.5px",
    pointerEvents: "none",
  });

  const cornerDot = document.createElement("span");
  Object.assign(cornerDot.style, {
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#f33",
    animation: "fg-pulse 1.1s ease-in-out infinite",
  });

  const cornerLabel = document.createElement("span");
  cornerLabel.id = "fg-rec-corner-label";
  cornerLabel.textContent = "REC  00:00";

  cornerOverlay.appendChild(cornerDot);
  cornerOverlay.appendChild(cornerLabel);
  document.body.appendChild(cornerOverlay);

  window.__FG_REC_CORNER       = cornerOverlay;
  window.__FG_REC_CORNER_LABEL = cornerLabel;

  const startBtn = makeBtn(panel, "⏺  Start Recording");
  const stopBtn  = makeBtn(panel, "⏹  Stop & Save");

  startBtn.id = "fg-start-rec-btn";
  stopBtn.id  = "fg-stop-rec-btn";

  startBtn.onclick = startRecording;
  stopBtn.onclick  = stopRecording;

  /* ===== GLOBAL KEY: C = capture PNG any time ===== */
  if (!window.__FG_PNG_KEYBOUND) {
    window.addEventListener("keydown", function(ev) {
      const tag = (ev.target && ev.target.tagName) ? ev.target.tagName.toLowerCase() : "";
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        (ev.target && ev.target.isContentEditable);

      if (isTyping) return;

      /* C — instant capture regardless of capture mode state */
      if (ev.key === "c" || ev.key === "C") {
        ev.preventDefault();
        capturePNGNow();
        return;
      }

      /* Space — capture only while in PNG capture mode (legacy) */
      if ((ev.code === "Space" || ev.key === " ") && pngCaptureMode) {
        ev.preventDefault();
        capturePNGNow();
      }
    });

    window.__FG_PNG_KEYBOUND = true;
  }
}

/* ==========================================================
   BUTTON FACTORY
========================================================== */
function makeBtn(panel, label) {
  const b = document.createElement("button");
  b.textContent = label;
  Object.assign(b.style, {
    width: "100%",
    padding: "9px 0",
    marginTop: "8px",
    borderRadius: "6px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(0,0,0)",
    color: "#000",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
  });

  b.onmouseenter = () => (b.style.background = "rgba(255,255,255,0.15)");
  b.onmouseleave = () => (b.style.background = "rgba(255,255,255,0.08)");

  panel.appendChild(b);
  return b;
}

/* ==========================================================
   EXPORT PNG (internal — used by preview modal's Download btn)
========================================================== */
function _downloadCurrentCanvas(filename) {
  const canvas = document.querySelector("canvas");
  if (!canvas) return;
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "field_visual.png";
    a.click();
    URL.revokeObjectURL(url);
  });
}

/* kept for backward compat */
function exportPalettePNG() {
  _downloadCurrentCanvas("field_visual.png");
}

/* ==========================================================
   VISUAL PAUSE / RESUME
   FIX: user can freeze the animation to pick the perfect frame
========================================================== */
let _visualPaused = false;

function toggleVisualPause() {
  const btn = window.__FG_PAUSE_BTN;
  if (_visualPaused) {
    _visualPaused = false;
    loop();           // p5 resume
    if (btn) btn.textContent = "⏸  Pause Visual";
    const cl = window.__FG_PNG_CORNER_LABEL;
    if (cl) cl.textContent = "PNG READY — press C to capture";
  } else {
    _visualPaused = true;
    noLoop();         // p5 freeze
    if (btn) btn.textContent = "▶  Resume Visual";
    const cl = window.__FG_PNG_CORNER_LABEL;
    if (cl) cl.textContent = "PAUSED — press C to capture";
  }
}

/* ==========================================================
   PNG CAPTURE MODE
========================================================== */
let pngCaptureMode = false;

function _showPNGUI(visible) {
  const badge      = window.__FG_PNG_STATUS;
  const corner     = window.__FG_PNG_CORNER;
  const modeBtn    = window.__FG_PNG_MODE_BTN;
  const pauseBtn   = window.__FG_PAUSE_BTN;
  const captureBtn = window.__FG_CAPTURE_PNG_BTN;

  if (badge)      badge.style.display      = visible ? "flex"  : "none";
  if (corner)     corner.style.display     = visible ? "flex"  : "none";
  if (captureBtn) captureBtn.style.display = visible ? "block" : "none";
  if (pauseBtn)   pauseBtn.style.display   = visible ? "block" : "none";

  if (modeBtn) {
    modeBtn.textContent = visible ? "Cancel PNG Capture" : "Prepare PNG Capture";
  }

  /* If cancelling capture mode, make sure visual is running again */
  if (!visible && _visualPaused) {
    _visualPaused = false;
    loop();
    if (pauseBtn) pauseBtn.textContent = "⏸  Pause Visual";
  }
}

function togglePNGCaptureMode() {
  pngCaptureMode = !pngCaptureMode;
  _showPNGUI(pngCaptureMode);
}

/* ==========================================================
   CAPTURE PNG NOW
   FIX: captures current canvas → shows preview modal first.
        User reviews the image, then clicks Download or closes.
========================================================== */
function capturePNGNow() {
  const canvas = document.querySelector("canvas");
  if (!canvas) return;

  /* Freeze the visual while user reviews the preview */
  if (!_visualPaused) {
    _visualPaused = true;
    noLoop();
  }

  canvas.toBlob(blob => {
    if (!blob) return;
    const blobUrl = URL.createObjectURL(blob);
    _showExportPreviewModal({
      type: "image",
      src: blobUrl,
      filename: "field_visual.png",
      onClose: () => {
        URL.revokeObjectURL(blobUrl);
        /* Resume animation when user closes preview */
        if (_visualPaused) {
          _visualPaused = false;
          loop();
          const pb = window.__FG_PAUSE_BTN;
          if (pb) pb.textContent = "⏸  Pause Visual";
        }
        /* Exit capture mode */
        pngCaptureMode = false;
        _showPNGUI(false);
      }
    });
  });
}

/* ==========================================================
   RECORDING TIMER
========================================================== */
let _recTimerInterval = null;
let _recStartTime     = 0;

function _startRecTimer() {
  _recStartTime = Date.now();
  _recTimerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - _recStartTime) / 1000);
    const mm  = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const ss  = String(elapsed % 60).padStart(2, "0");
    const txt = `REC  ${mm}:${ss}`;
    if (window.__FG_REC_LABEL)        window.__FG_REC_LABEL.textContent        = txt;
    if (window.__FG_REC_CORNER_LABEL) window.__FG_REC_CORNER_LABEL.textContent = txt;
  }, 1000);
}

function _stopRecTimer() {
  if (_recTimerInterval) {
    clearInterval(_recTimerInterval);
    _recTimerInterval = null;
  }
}

function _showRecUI(visible) {
  const badge  = window.__FG_REC_STATUS;
  const corner = window.__FG_REC_CORNER;
  if (badge)  badge.style.display  = visible ? "flex" : "none";
  if (corner) corner.style.display = visible ? "flex" : "none";
}

/* ==========================================================
   VIDEO RECORD (MediaRecorder)
========================================================== */
let mediaRecorder;
let recordedChunks = [];
let isRecording    = false;

function startRecording() {
  if (isRecording) return;
  isRecording = true;

  recordedChunks = [];
  const canvas = document.querySelector("canvas");
  if (!canvas) return;

  const stream = canvas.captureStream(30);
  mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    const blob   = new Blob(recordedChunks, { type: "video/webm" });
    const blobUrl = URL.createObjectURL(blob);

    _stopRecTimer();
    _showRecUI(false);

    const lbl = "REC  00:00";
    if (window.__FG_REC_LABEL)        window.__FG_REC_LABEL.textContent        = lbl;
    if (window.__FG_REC_CORNER_LABEL) window.__FG_REC_CORNER_LABEL.textContent = lbl;

    /* FIX: show preview modal instead of auto-downloading */
    _showExportPreviewModal({
      type: "video",
      src: blobUrl,
      filename: "field_visual.webm",
      onClose: () => URL.revokeObjectURL(blobUrl)
    });
  };

  mediaRecorder.start();
  _showRecUI(true);
  _startRecTimer();
}

function stopRecording() {
  if (!isRecording || !mediaRecorder) return;
  isRecording = false;
  mediaRecorder.stop();
}

/* ==========================================================
   EXPORT PREVIEW MODAL
   FIX: shows PNG or video inline; user chooses Download or
        closes and tries again. Visual stays frozen (PNG) or
        just shows result (video) until user closes.
========================================================== */
function _showExportPreviewModal({ type, src, filename, onClose }) {
  /* Inject modal styles once */
  if (!document.getElementById("fg-modal-style")) {
    const st = document.createElement("style");
    st.id = "fg-modal-style";
    st.innerHTML = `
      #fg-export-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.72);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        padding: 20px;
        box-sizing: border-box;
      }
      #fg-export-modal {
        background: #fff;
        border-radius: 12px;
        padding: 20px;
        max-width: 640px;
        width: 100%;
        box-shadow: 0 8px 40px rgba(0,0,0,0.45);
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      #fg-export-modal .fg-modal-title {
        font-size: 14px;
        font-weight: 600;
        color: #111;
        letter-spacing: 0.3px;
      }
      #fg-export-modal img,
      #fg-export-modal video {
        width: 100%;
        border-radius: 8px;
        border: 1px solid rgba(0,0,0,0.12);
        display: block;
        max-height: 60vh;
        object-fit: contain;
        background: #000;
      }
      #fg-export-modal .fg-modal-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }
      #fg-export-modal .fg-modal-btn {
        padding: 9px 22px;
        border-radius: 7px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid rgba(0,0,0,0.18);
        transition: opacity 0.15s;
      }
      #fg-export-modal .fg-modal-btn:hover { opacity: 0.78; }
      #fg-export-modal .fg-modal-btn-download {
        background: #111;
        color: #fff;
        border-color: #111;
      }
      #fg-export-modal .fg-modal-btn-close {
        background: #fff;
        color: #111;
      }
      #fg-export-modal .fg-modal-hint {
        font-size: 11px;
        color: #888;
        margin: 0;
      }
    `;
    document.head.appendChild(st);
  }

  /* Remove any existing modal */
  const existing = document.getElementById("fg-export-overlay");
  if (existing) existing.remove();

  /* Build overlay */
  const overlay = document.createElement("div");
  overlay.id = "fg-export-overlay";

  const modal = document.createElement("div");
  modal.id = "fg-export-modal";

  /* Title */
  const title = document.createElement("div");
  title.className = "fg-modal-title";
  title.textContent = type === "image" ? "PNG Preview — looks good?" : "Video Preview — looks good?";
  modal.appendChild(title);

  /* Media element */
  let media;
  if (type === "image") {
    media = document.createElement("img");
    media.src = src;
    media.alt = "Exported frame";
  } else {
    media = document.createElement("video");
    media.src = src;
    media.controls = true;
    media.autoplay = true;
    media.loop = true;
    media.muted = true;
  }
  modal.appendChild(media);

  /* Hint */
  const hint = document.createElement("p");
  hint.className = "fg-modal-hint";
  hint.textContent = type === "image"
    ? "Visual is paused. Close this preview to resume, or download the image."
    : "Your recording is ready. Download it or close to discard.";
  modal.appendChild(hint);

  /* Action buttons */
  const actions = document.createElement("div");
  actions.className = "fg-modal-actions";

  const closeBtn = document.createElement("button");
  closeBtn.className = "fg-modal-btn fg-modal-btn-close";
  closeBtn.textContent = "Close & try again";

  const downloadBtn = document.createElement("button");
  downloadBtn.className = "fg-modal-btn fg-modal-btn-download";
  downloadBtn.textContent = "⬇  Download";

  downloadBtn.onclick = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = filename;
    a.click();
  };

  function closeModal() {
    overlay.remove();
    if (typeof onClose === "function") onClose();
  }

  closeBtn.onclick = closeModal;

  /* Close on backdrop click */
  overlay.addEventListener("click", e => {
    if (e.target === overlay) closeModal();
  });

  actions.appendChild(closeBtn);
  actions.appendChild(downloadBtn);
  modal.appendChild(actions);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}
