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

  makeBtn(panel, "Export PNG").onclick = exportPalettePNG;

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

  // pulsing dot
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
  // inject keyframe once
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

  /* ===== CANVAS CORNER OVERLAY (top-right) ===== */
  const cornerOverlay = document.createElement("div");
  cornerOverlay.id = "fg-rec-corner";
  Object.assign(cornerOverlay.style, {
    display: "none",
    position: "fixed",
    top: "14px",
    right: "310px",     // clear of the help panel (300px wide)
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
  const stopBtn  = makeBtn(panel, "⏹  Stop & Save");

  startBtn.id = "fg-start-rec-btn";
  stopBtn.id  = "fg-stop-rec-btn";

  startBtn.onclick = startRecording;
  stopBtn.onclick  = stopRecording;
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
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "field_visual.png";
    a.click();
    URL.revokeObjectURL(url);
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
    const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const ss = String(elapsed % 60).padStart(2, "0");
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
  if (badge)  badge.style.display  = visible ? "flex"  : "none";
  if (corner) corner.style.display = visible ? "flex"  : "none";
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
  const stream = canvas.captureStream(30);

  mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "field_visual.webm";
    a.click();
    URL.revokeObjectURL(url);

    _stopRecTimer();
    _showRecUI(false);

    // reset label
    const lbl = "REC  00:00";
    if (window.__FG_REC_LABEL)        window.__FG_REC_LABEL.textContent        = lbl;
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
