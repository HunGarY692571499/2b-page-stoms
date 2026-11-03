// 2B Entertainment · Kopie von STΩMs assets/videobg.js (HF Space 2Btainment/stoms), parametrisiert: Quellen/Poster/Grading per Config.
// Original: STΩMs · interaktiver Video-Hintergrund: 720p-Loop (h264/webm, stumm), im Shader auf die Abyss/Aurora-Palette gegradet,
// Parallax (Maus), Scroll-Zoom, Ripple (Zeiger/Klick), musikreaktiv (window.__stomsAudio). Poster bei Data-Saver,
// reduzierter Bewegung oder ohne WebGL. Liegt HINTER der Keta-Matrix.
const VS = `attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
const FS = `precision mediump float;varying vec2 v;uniform sampler2D tex;uniform vec2 res,vres,par;uniform float t,zoom,lvl,bass,on,spd,hi,gr;
uniform vec4 rp[4];
vec3 grade(vec3 c){float l=dot(c,vec3(.299,.587,.114));
 vec3 abyss=vec3(.020,.031,.051),deep=vec3(.043,.078,.094),mint=vec3(.494,.941,.816),cyan=vec3(.435,.827,.961),vio=vec3(.702,.608,1.);
 vec3 g=mix(abyss,deep,smoothstep(.0,.25,l));g=mix(g,mix(cyan,vio,smoothstep(.3,.9,c.b-c.g+.5)),smoothstep(.22,.75,l)*.55);
 g=mix(g,mint,smoothstep(.62,1.,l)*.45);return g;}
void main(){vec2 uv=v;float ar=res.x/res.y,va=vres.x/vres.y;vec2 s=ar>va?vec2(1.,va/ar):vec2(ar/va,1.);
 vec2 cc=uv-.5;float sw=spd*.07;cc=mat2(cos(sw),-sin(sw),sin(sw),cos(sw))*cc;
 vec2 q=cc*s/(zoom)+.5+par*.045;
 for(int i=0;i<4;i++){vec2 d=(uv-rp[i].xy)*vec2(ar,1.);float r=length(d),age=rp[i].z;if(age>0.&&age<3.){
  float w=sin(r*46.-age*8.)*exp(-r*4.)*exp(-age*1.25)*rp[i].w;q+=normalize(d+1e-5)*w*.02;}}
 q+=vec2(sin(q.y*9.+t*.6),cos(q.x*7.-t*.5))*.0025*(1.+bass*5.+abs(spd)*8.);
 vec2 ca=(uv-.5)*(.004*on+.0015*abs(spd)*4.);
 vec3 c=vec3(texture2D(tex,clamp(vec2(q.x+ca.x,1.-q.y-ca.y),.001,.999)).r,texture2D(tex,clamp(vec2(q.x,1.-q.y),.001,.999)).g,
   texture2D(tex,clamp(vec2(q.x-ca.x,1.-q.y+ca.y),.001,.999)).b);
 vec3 g=mix(c*.92,grade(c),gr)*(.78+lvl*.75+bass*.45+on*.35);
 g+=vec3(.494,.941,.816)*on*.06*smoothstep(.9,.0,length(uv-.5))+vec3(.702,.608,1.)*hi*.05;
 float vig=smoothstep(1.15,.25,length((uv-.5)*vec2(ar,1.)*.9));gl_FragColor=vec4(g*vig,1.);}`;

export function startVideoBg(cfg) {
  // cfg: { sources: {"720":[[url,type],…], "480":[[url,type],…]}, poster, posterSm, grade (0..1; 1 = Abyss/Aurora-Grading wie STΩMs) }
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const save = navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ""));
  const env = window.__stomsEnv || (window.__stomsEnv = {});
  const poster = why => { document.documentElement.classList.add("st-poster"); env.video = "poster:" + why; console.info("2B fx: video poster (" + why + ")"); };
  if (document.querySelector(".st-video")) return;
  if (RM || save) return poster(RM ? "reduced-motion" : "save-data");
  const cv = document.createElement("canvas"); cv.className = "st-video"; cv.setAttribute("aria-hidden", "true");
  let gl = null; try { gl = cv.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" }); } catch {}
  if (!gl) return poster("no-webgl");
  // Software-Rasterizer (SwiftShader/llvmpipe): Video-Upload pro Frame kostet dort ganze CPU-Kerne → Standbild
  const force = /[?&]__video=1/.test(location.search);
  try { const d = gl.getExtension("WEBGL_debug_renderer_info"); const rn = String(gl.getParameter(d ? d.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    env.gpu = rn; if (!force && /swiftshader|llvmpipe|softpipe|software|basic render/i.test(rn)) { gl.getExtension("WEBGL_lose_context")?.loseContext(); return poster("software-gl"); } } catch {}
  const small = innerWidth <= 760 || (navigator.hardwareConcurrency || 8) <= 4;
  const res = small ? "480" : "720"; env.videoRes = res;
  const vid = document.createElement("video");
  Object.assign(vid, { muted: true, loop: true, playsInline: true, autoplay: true, preload: "auto", crossOrigin: "anonymous" });
  vid.setAttribute("muted", ""); vid.setAttribute("playsinline", ""); vid.poster = small ? (cfg.posterSm || cfg.poster) : cfg.poster;
  for (const [src, type] of (cfg.sources[res] || cfg.sources["720"])) {
    const s = document.createElement("source"); s.src = src; s.type = type; vid.appendChild(s);
  }
  const sh = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return o; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return poster("shader");
  gl.useProgram(pr);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const U = n => gl.getUniformLocation(pr, n);
  const u = { gr: U("gr"), res: U("res"), vres: U("vres"), par: U("par"), t: U("t"), zoom: U("zoom"), lvl: U("lvl"), bass: U("bass"), rp: U("rp"), on: U("on"), spd: U("spd"), hi: U("hi") };
  let lastSc = 0, spd = 0;
  let scale = innerWidth < 768 ? 0.5 : 0.6, ready = false, mx = 0, my = 0, px = 0, py = 0, slow = 0, last = performance.now(), lastV = 0;
  const rip = [0, 1, 2, 3].map(() => ({ x: .5, y: .5, t0: -10, a: 0 })); let ri = 0, lastRip = 0;
  const addRip = (e, a) => { const now = performance.now() / 1000; if (a < 1 && now - lastRip < 0.25) return; lastRip = now;
    rip[ri++ % 4] = { x: e.clientX / innerWidth, y: 1 - e.clientY / innerHeight, t0: now, a }; };
  const resize = () => { cv.width = Math.max(2, innerWidth * scale | 0); cv.height = Math.max(2, innerHeight * scale | 0); gl.viewport(0, 0, cv.width, cv.height); };
  resize(); addEventListener("resize", resize);
  addEventListener("pointermove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; addRip(e, .45); }, { passive: true });
  addEventListener("pointerdown", e => addRip(e, 1), { passive: true });
  addEventListener("touchmove", e => { const tc = e.touches[0]; if (tc) { mx = tc.clientX / innerWidth - .5; my = tc.clientY / innerHeight - .5; addRip(tc, .6); } }, { passive: true });
  vid.addEventListener("playing", () => { if (ready) return; ready = true; cv.classList.add("is-on");
    env.video = "video:" + (vid.currentSrc || "").split("/").pop().split("?")[0]; console.info("2B fx: video " + env.video); });
  const fail = () => { if (!ready) poster("media-error"); };
  vid.addEventListener("error", fail); const srcs = vid.querySelectorAll("source"); srcs[srcs.length - 1].addEventListener("error", fail);
  gl.canvas.addEventListener("webglcontextlost", e => { e.preventDefault(); ready = false; cv.classList.remove("is-on"); poster("context-lost"); });
  (window.__stomsBg ? window.__stomsBg() : document.body).prepend(cv);
  // Autoplay: stumm + playsinline + play() mit catch; blockiert → beim ersten Kontakt erneut. Poster liegt darunter (nie schwarz).
  const play = () => { if (!document.hidden) vid.play().catch(e => { env.video = "blocked:" + e.name; }); };
  play();
  document.addEventListener("visibilitychange", () => (document.hidden ? vid.pause() : play()));
  for (const ev of ["pointerdown", "keydown", "touchstart", "wheel"]) addEventListener(ev, () => { if (vid.paused) play(); }, { passive: true });
  const tick = now => {
    requestAnimationFrame(tick);
    const dt = now - last; last = now;
    if (document.hidden || !ready || vid.readyState < 2) return;
    slow = slow * 0.95 + (dt > 26 ? 1 : 0) * 0.05;               // adaptiv: bei Rucklern Auflösung senken
    if (slow > 0.5 && scale > 0.34) { scale -= 0.12; resize(); slow = 0; }
    if (now - lastV > 30) {                                        // Video-Textur höchstens ~33×/s hochladen
      lastV = now; gl.bindTexture(gl.TEXTURE_2D, tex);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, vid); } catch (e) { return; }
    }
    const au = window.__stomsAudio || { level: 0, bass: 0 }, sc = window.__stomsScroll || 0;
    px += (mx - px) * 0.07; py += (my - py) * 0.07;
    spd += ((sc - lastSc) * 40 - spd) * 0.12; lastSc = sc; spd *= 0.96;          // Scroll-Tempo → Wirbel + Farbsaum
    const tt = now / 1000;
    gl.uniform1f(u.gr, cfg.grade == null ? 1 : cfg.grade); gl.uniform2f(u.res, cv.width, cv.height); gl.uniform2f(u.vres, vid.videoWidth || 1072, vid.videoHeight || 720);
    gl.uniform2f(u.par, px, -py); gl.uniform1f(u.t, tt); gl.uniform1f(u.zoom, 1.07 + Math.abs(spd) * 0.09 + sc * 0.28 + (au.bass || 0) * 0.08 + (au.on || 0) * 0.03);
    gl.uniform1f(u.on, Math.min(1, au.on || 0)); gl.uniform1f(u.hi, Math.min(1, au.hi || 0)); gl.uniform1f(u.spd, Math.max(-1, Math.min(1, spd)));
    gl.uniform1f(u.lvl, Math.min(1, au.level || 0)); gl.uniform1f(u.bass, Math.min(1, au.bass || 0));
    const arr = new Float32Array(16);
    rip.forEach((r, i) => { arr.set([r.x, r.y, tt - r.t0, r.a + (au.bass || 0) * 0.9 + (au.on || 0) * 0.5], i * 4); });
    gl.uniform4fv(u.rp, arr);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  requestAnimationFrame(tick);
}
