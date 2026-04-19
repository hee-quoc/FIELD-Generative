/* ==========================================================
   FIELD GENERATIVE — EXPORT
========================================================== */

/* ==========================================================
   ADD EXPORT BUTTONS
========================================================== */
function addExportButtons() {
  const panel = document.getElementById("fg-ui");
  if (!panel) return;

  /* ===== EXPORT ===== */
  const exportTitle = document.createElement("div");
  exportTitle.textContent = "Export";
  Object.assign(exportTitle.style, {
    marginTop: "18px",
    marginBottom: "6px",
    fontSize: "13px",
    opacity: "0.7",
  });
  panel.appendChild(exportTitle);

  /* ===== RESET VIEW BUTTON ===== */
  const resetBtn = makeBtn(panel, "Reset View");
  resetBtn.onclick = () => {
    offsetX = 0;
    offsetY = 0;
    scaleFactor = 1.0;
  };

  /* ===== PNG CAPTURE MODE ===== */
  const pngModeBtn = makeBtn(panel, "Prepare PNG Capture");
  pngModeBtn.id = "fg-png-mode-btn";
  pngModeBtn.onclick = togglePNGCaptureMode;

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
  pngLabel.textContent = "PNG READY — click Capture or press Space";

  pngStatus.appendChild(pngDot);
  pngStatus.appendChild(pngLabel);
  panel.appendChild(pngStatus);

  window.__FG_PNG_STATUS = pngStatus;
  window.__FG_PNG_LABEL = pngLabel;
  window.__FG_PNG_MODE_BTN = pngModeBtn;
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
  pngCornerLabel.textContent = "PNG READY";

  pngCorner.appendChild(pngCornerDot);
  pngCorner.appendChild(pngCornerLabel);
  document.body.appendChild(pngCorner);

  window.__FG_PNG_CORNER = pngCorner;
  window.__FG_PNG_CORNER_LABEL = pngCornerLabel;

  /* ===== VIDEO ===== */
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
  window.__FG_REC_LABEL = recLabel;

  /* ===== CANVAS CORNER OVERLAY (top-right) ===== */
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

  window.__FG_REC_CORNER = cornerOverlay;
  window.__FG_REC_CORNER_LABEL = cornerLabel;

  const startBtn = makeBtn(panel, "⏺  Start Recording");
  const stopBtn = makeBtn(panel, "⏹  Stop & Save");

  startBtn.id = "fg-start-rec-btn";
  stopBtn.id = "fg-stop-rec-btn";

  startBtn.onclick = startRecording;
  stopBtn.onclick = stopRecording;

  /* ===== GLOBAL KEY FOR PNG CAPTURE ===== */
  if (!window.__FG_PNG_KEYBOUND) {
    window.addEventListener("keydown", function(ev) {
      const tag = (ev.target && ev.target.tagName) ? ev.target.tagName.toLowerCase() : "";
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        (ev.target && ev.target.isContentEditable);

      if (isTyping) return;

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
   EXPORT PNG
========================================================== */
function exportPalettePNG() {
  const canvas = document.querySelector("canvas");
  if (!canvas) return;

  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "field_visual.png";
    a.click();
    URL.revokeObjectURL(url);
  });
}

/* ==========================================================
   PNG CAPTURE MODE
========================================================== */
let pngCaptureMode = false;

function _showPNGUI(visible) {
  const badge = window.__FG_PNG_STATUS;
  const corner = window.__FG_PNG_CORNER;
  const modeBtn = window.__FG_PNG_MODE_BTN;
  const captureBtn = window.__FG_CAPTURE_PNG_BTN;

  if (badge) badge.style.display = visible ? "flex" : "none";
  if (corner) corner.style.display = visible ? "flex" : "none";
  if (captureBtn) captureBtn.style.display = visible ? "block" : "none";

  if (modeBtn) {
    modeBtn.textContent = visible ? "Cancel PNG Capture" : "Prepare PNG Capture";
  }
}

function togglePNGCaptureMode() {
  pngCaptureMode = !pngCaptureMode;
  _showPNGUI(pngCaptureMode);
}

function capturePNGNow() {
  exportPalettePNG();
  pngCaptureMode = false;
  _showPNGUI(false);
}

/* ==========================================================
   RECORDING TIMER
========================================================== */
let _recTimerInterval = null;
let _recStartTime = 0;

function _startRecTimer() {
  _recStartTime = Date.now();
  _recTimerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - _recStartTime) / 1000);
    const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const ss = String(elapsed % 60).padStart(2, "0");
    const txt = `REC  ${mm}:${ss}`;
    if (window.__FG_REC_LABEL) window.__FG_REC_LABEL.textContent = txt;
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
  const badge = window.__FG_REC_STATUS;
  const corner = window.__FG_REC_CORNER;
  if (badge) badge.style.display = visible ? "flex" : "none";
  if (corner) corner.style.display = visible ? "flex" : "none";
}

/* ==========================================================
   VIDEO RECORD (MediaRecorder)
========================================================== */
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;

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
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "field_visual.webm";
    a.click();
    URL.revokeObjectURL(url);

    _stopRecTimer();
    _showRecUI(false);

    const lbl = "REC  00:00";
    if (window.__FG_REC_LABEL) window.__FG_REC_LABEL.textContent = lbl;
    if (window.__FG_REC_CORNER_LABEL) window.__FG_REC_CORNER_LABEL.textContent = lbl;
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
