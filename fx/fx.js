// 2B Entertainment · Vollbild-App-Seiten: startet Video-Hintergrund + Keta-Matrix aus dem HF Space 2Btainment/stoms
// (matrix.js/matrix2d.js/loop.js unverändert kopiert, videobg.js parametrisiert) und den Vollbild-Knopf.
// Konfiguration pro Seite über window.__fxConfig = { video: { sources, poster, posterSm, grade } } vor diesem Modul.
const Q = new URL(import.meta.url).search;
const cfg = window.__fxConfig || {};

window.__stomsBg = () => {            // gemeinsamer fixer Hintergrund-Container, erstes Kind von <body>
  let b = document.getElementById("st-bg");
  if (!b) { b = document.createElement("div"); b.id = "st-bg"; b.setAttribute("aria-hidden", "true"); document.body.prepend(b); }
  return b;
};
window.__stomsBg();

// Effekte bald nach dem Parsen starten – nicht auf window.load warten (das wartet aufs iframe).
const soon = fn => ("requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 700 }) : setTimeout(fn, 120));
soon(() => {
  if (cfg.video) import("./videobg.js" + Q).then(m => m.startVideoBg(cfg.video)).catch(e => console.warn("2B fx video", e));
  import("./matrix.js" + Q).then(m => m.startMatrix()).catch(e => console.warn("2B fx matrix", e));
});

// Vollbild (Fullscreen API) für die eingebettete App
const stage = document.querySelector("[data-fx-stage]");
const frame = stage && stage.querySelector("iframe");
const btn = document.querySelector("[data-fx-fullscreen]");
if (frame && stage) setTimeout(() => stage.classList.add("is-loaded"), 60000);   // Sicherheitsnetz für den Lade-Hinweis
if (btn && frame) {
  const req = frame.requestFullscreen || frame.webkitRequestFullscreen;
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  if (!req || !(document.fullscreenEnabled || document.webkitFullscreenEnabled)) btn.hidden = true;
  else {
    btn.hidden = false;
    btn.addEventListener("click", () => {
      if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else { const p = req.call(frame, { navigationUI: "hide" }); if (p && p.catch) p.catch(e => console.warn("2B fx fullscreen", e)); }
    });
    const sync = () => btn.setAttribute("aria-pressed", String(!!fsEl()));
    document.addEventListener("fullscreenchange", sync); document.addEventListener("webkitfullscreenchange", sync);
  }
}
