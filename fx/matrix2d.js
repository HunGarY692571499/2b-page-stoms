// STΩMs · Aurora-Keta-Matrix: Glyphen-Regen von unten nach oben, Noise-Warp, Spirale, Tiefenebenen.
// Nachbau der "hypno-matrix-background" von 2b-entertainment.com (Krypto-Glyphen-Regen), hier in Aurora-Farben und verspulter.
const PALETTE = ["#7ef0d0", "#4fdcb8", "#6fd3f5", "#7fc4ff", "#8f9bff", "#b39bff", "#c9a8ff", "#ff9fd2"];
const GLYPHS = 22;

function seeded(n) { let s = n * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }
function drawGlyph(g, k, x, y, u) {
  g.save(); g.translate(x, y); g.lineWidth = Math.max(1, u * 0.09); g.lineCap = "round"; g.lineJoin = "round";
  if (k >= GLYPHS - 4) {           // ein paar Ketten-/Coin-Zeichen als Gruß an das Original
    g.font = `700 ${Math.round(u * 0.78)}px ui-monospace,monospace`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(["₿", "Ξ", "◎", "Ð"][k - (GLYPHS - 4)], 0, 0);
  } else {                          // prozedurale Runen: Striche auf einem 3×4-Raster
    const r = seeded(k + 7), pts = [];
    for (let i = 0; i < 12; i++) pts.push([((i % 3) - 1) * u * 0.32, (Math.floor(i / 3) - 1.5) * u * 0.27]);
    g.beginPath(); const strokes = 3 + Math.floor(r() * 3);
    let a = Math.floor(r() * 12); g.moveTo(...pts[a]);
    for (let i = 0; i < strokes; i++) { const b = Math.floor(r() * 12); if (r() < 0.3) g.moveTo(...pts[b]); else g.lineTo(...pts[b]); a = b; }
    g.stroke();
    if (r() < 0.45) { g.beginPath(); g.arc(pts[a][0], pts[a][1], u * 0.07, 0, 7); g.fill(); }
    if (r() < 0.25) { g.beginPath(); g.arc(0, 0, u * 0.36, r() * 3, r() * 3 + 2.2); g.stroke(); }
  }
  g.restore();
}

export function startMatrix2d() {
  if (document.querySelector(".st-matrix")) return;
  const cv = document.createElement("canvas"); cv.className = "st-matrix"; cv.setAttribute("aria-hidden", "true");
  (window.__stomsBg ? window.__stomsBg() : document.body).prepend(cv);
  const ctx = cv.getContext("2d", { alpha: true }); if (!ctx) return;
  const RMq = matchMedia("(prefers-reduced-motion: reduce)"), compactQ = matchMedia("(max-width: 767px)");
  const low = (navigator.hardwareConcurrency || 8) <= 4;
  let W = 0, H = 0, dpr = 1, atlas = new Map(), drops = [], raf = 0, last = 0, run = false, frameMs = 1000 / 30;

  const cfg = () => { const c = compactQ.matches; return { size: c ? 18 : 24, lane: c ? 30 : 38, layers: c || low ? 2 : 3, tMin: c ? 7 : 9, tMax: c ? 13 : 18, dpr: c || low ? 1 : 1.25 }; };
  const buildAtlas = size => {
    const cell = Math.ceil(size * 1.5), sc = Math.ceil(cell * dpr);
    return PALETTE.map(col => {
      const a = document.createElement("canvas"); a.width = sc * GLYPHS; a.height = sc;
      const g = a.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = col; g.strokeStyle = col;
      g.shadowColor = col; g.shadowBlur = size * 0.35;
      for (let k = 0; k < GLYPHS; k++) drawGlyph(g, k, k * cell + cell / 2, cell / 2, size);
      return { a, cell, sc };
    });
  };
  class Drop {
    constructor(layer, size, x, c) {
      this.layer = layer; this.size = size * (0.8 + Math.random() * 0.4); this.at = atlas.get(size); this.x = x;
      this.len = c.tMin + Math.floor(Math.random() * (c.tMax - c.tMin + 1 - layer * 2));
      this.speed = (38 + Math.random() * 50) * (1 - layer * 0.22); this.ph = Math.random() * 6.28; this.amp = 6 + Math.random() * 16;
      this.col = Math.floor(Math.random() * PALETTE.length);
      this.gl = Uint8Array.from({ length: this.len }, () => Math.floor(Math.random() * GLYPHS)); this.reset(true);
    }
    reset(init) { const th = this.len * this.size; this.y = init ? Math.random() * (H + th) : H + this.size; }
    update(dt, t, boost) {
      this.y -= this.speed * (0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.0006 + this.ph))) * boost * dt;   // nach OBEN
      if (this.y < -this.len * this.size * 1.1) this.reset(false);
      if (Math.random() < 0.012) this.gl[Math.floor(Math.random() * this.len)] = Math.floor(Math.random() * GLYPHS);
    }
    draw(t, bright) {
      const at = this.at, lay = (0.85 - this.layer * 0.25) * bright, step = Math.floor((t + this.ph * 500) / 1700);
      for (let i = 0; i < this.len; i++) {
        const y = this.y + i * this.size * (1.04 + 0.06 * Math.sin(t * 0.0008 + this.ph));   // Schweif zeigt nach unten
        if (y < -this.size || y > H + this.size) continue;
        const r = i / Math.max(1, this.len - 1);
        // Noise-Warp + Spirale + globale Welle (verspult)
        const warp = Math.sin(y * 0.0065 + t * 0.00042 + this.ph) * this.amp * (0.4 + this.layer * 0.5)
          + Math.sin(y * 0.019 - t * 0.0009 + this.x * 0.01) * 4
          + Math.sin((y / H) * 6.283 + t * 0.00025) * (10 + this.layer * 8);
        const spiral = Math.cos(t * 0.0011 + this.ph + r * 9.5) * (2 + this.layer * 2.5) * (0.3 + r);
        const x = this.x + warp + spiral;
        const c = at[(this.col + step + Math.floor(r * 4)) % PALETTE.length];
        const sc = (1 + Math.sin(t * 0.0013 + this.ph + r * 3) * 0.07) * (1 - r * 0.05) * this.size / at[0].cell * 1.0;
        const ds = c.cell * sc;
        ctx.globalAlpha = Math.pow(1 - r, 1.5) * lay * (i === 0 ? 1.25 : 1);
        ctx.drawImage(c.a, this.gl[i] * c.sc, 0, c.sc, c.sc, x - ds / 2, y - ds / 2, ds, ds);
      }
    }
  }
  const resize = () => {
    const c = cfg(); frameMs = 1000 / (compactQ.matches || low ? 20 : 30);
    W = Math.max(1, innerWidth); H = Math.max(1, innerHeight); dpr = Math.min(devicePixelRatio || 1, c.dpr);
    cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sizes = Array.from({ length: c.layers }, (_, l) => Math.max(10, Math.round(c.size * Math.pow(0.74, l))));
    atlas = new Map(sizes.map(s => [s, buildAtlas(s)]));
    drops = [];
    for (let l = c.layers - 1; l >= 0; l--) {
      const n = Math.max(5, Math.ceil(W / (c.lane * (1 + l * 0.5))));
      for (let i = 0; i < n; i++) drops.push(new Drop(l, sizes[l], (i + 0.15 + Math.random() * 0.7) * W / n, c));
    }
    ctx.clearRect(0, 0, W, H); paint(0, 0, false);
  };
  const paint = (t, dt, upd) => {
    const au = window.__stomsAudio || { level: 0, bass: 0 };
    const on = Math.min(au.on || 0, 1), sp = Math.min(Math.abs(window.__stomsSpd || 0), 1);
    const boost = 1 + Math.min(au.level, 1) * 1.8 + Math.min(au.bass, 1) * 1.1 + on * 1.6 + sp * 2.2, bright = 1 + Math.min(au.level, 1) * 0.9 + on * 0.7;
    ctx.globalCompositeOperation = "destination-out"; ctx.globalAlpha = 1;
    ctx.fillStyle = upd ? "rgba(0,0,0,.42)" : "rgba(0,0,0,1)"; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    for (const d of drops) { if (upd) d.update(dt, t, boost); d.draw(t, bright); }
    ctx.globalCompositeOperation = "source-over";
    if (upd && t % 9000 < 200) {                // kurze Glitch-Scheiben wie im Original
      const k = 1 - (t % 9000) / 200; ctx.globalAlpha = 0.16 * k;
      for (let i = 0; i < 3; i++) { const y = H * (0.2 + ((i * 0.29 + t * 0.0001) % 0.6)), h = 2 + i * 3;
        ctx.drawImage(cv, 0, Math.floor(y * dpr), cv.width, Math.ceil(h * dpr), (i % 2 ? -1 : 1) * (5 + i * 4) * k, y, W, h); }
    }
    ctx.globalAlpha = 1;
  };
  const frame = t => {
    if (!run) return; raf = requestAnimationFrame(frame);
    const el = t - last; if (el < frameMs) return;
    last = t - (el % frameMs); paint(t, Math.min(el / 1000, 0.08), true);
  };
  const stop = () => { run = false; cancelAnimationFrame(raf); };
  const start = () => { if (run || document.hidden || RMq.matches) return; run = true; last = performance.now(); raf = requestAnimationFrame(frame); };
  const sync = () => { if (RMq.matches) { stop(); ctx.clearRect(0, 0, W, H); paint(4000, 0, false); } else start(); };
  let rz = 0; addEventListener("resize", () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { resize(); if (RMq.matches) sync(); }); }, { passive: true });
  RMq.addEventListener?.("change", sync); compactQ.addEventListener?.("change", resize);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : sync()));
  try { resize(); sync(); } catch (e) { stop(); cv.remove(); console.warn("STΩMs Matrix", e); }
}
