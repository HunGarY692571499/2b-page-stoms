// STΩMs · gemeinsame rAF-Schleife: ein requestAnimationFrame für alle Animationen, je Abonnent eigenes fps-Limit,
// Budget (ms/Frame) – überzieht ein Abonnent dauerhaft, wird er gedrosselt; pausiert bei verstecktem Tab.
const subs = new Set(); let raf = 0;
function tick(t) {
  raf = 0; if (document.hidden) return;
  for (const s of subs) {
    if (t - s.last < s.ms) continue;
    const dt = Math.min((t - (s.last || t - s.ms)) / 1000, 0.1); s.last = t;
    const t0 = performance.now();
    try { s.fn(t, dt); } catch (e) { console.warn("STΩMs loop", e); subs.delete(s); continue; }
    s.cost = s.cost * 0.95 + (performance.now() - t0) * 0.05;
    s.ms = s.cost > s.budget ? Math.min(s.ms * 1.02, 1000 / 20) : Math.max(s.ms * 0.995, s.min);   // weich drosseln/erholen
  }
  if (subs.size) raf = requestAnimationFrame(tick);
}
const kick = () => { if (!raf && !document.hidden && subs.size) raf = requestAnimationFrame(tick); };
document.addEventListener("visibilitychange", kick);
export function addLoop(fn, { fps = 60, budget = 4 } = {}) {
  const min = 1000 / fps - 1.5, s = { fn, ms: min, min, last: 0, cost: 0, budget };
  subs.add(s); kick(); return () => subs.delete(s);
}
window.__stomsLoop = addLoop;
