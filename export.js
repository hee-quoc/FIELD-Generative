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

  makeBtn(panel, "Start Recording").onclick = startRecording;
  makeBtn(panel, "Stop & Save").onclick = stopRecording;
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
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
  });

  b.onmouseenter = () =>
    (b.style.background = "rgba(255,255,255,0.15)");
  b.onmouseleave = () =>
    (b.style.background = "rgba(255,255,255,0.08)");

  panel.appendChild(b);
  return b;
}

/* ==========================================================
   EXPORT PNG
========================================================== */
/* ==========================================================
   EXPORT PNG — SNAPSHOT CURRENT CANVAS
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

  // ĐỒNG BỘ FPS
  const stream = canvas.captureStream(30);

  mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm"
  });

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
  };

  mediaRecorder.start();
}


function stopRecording() {
  if (!isRecording || !mediaRecorder) return;
  isRecording = false;
  mediaRecorder.stop();
}
