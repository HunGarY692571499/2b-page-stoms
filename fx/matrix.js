// STΩMs · Aurora-Keta-Matrix (WebGL, ein Kontext): Glyphen-Regen von unten nach oben in echten Tiefenebenen.
// Perspektive (z → Größe/Tempo/Nebel/Unschärfe per Mip-Bias), Kamera-Drift + Parallax, Domain-Warp, Wirbel, Mäander,
// sporadische Richtungs-/Tempo-Drift, je Spalte eigener Rhythmus/Glitch/helle Köpfe, Zeiger-Kraftfeld, Scroll → Tiefe,
// Bass/Onsets → Puls (weich, ≤3 Blitze/s). Ruhigere Zone hinter den Karten. Fallback: alte 2D-Matrix.
const Q = new URL(import.meta.url).search, loopReady = import("./loop.js" + Q);
const VS = `attribute vec2 aC;attribute vec4 aA,aB;
uniform vec2 uRes,uCam;uniform vec3 uPtr,uSw;uniform float uT,uF,uSc,uBase,uDr,uDpr;
varying vec2 vUv,vL;varying float vA,vZ,vH,vHd;
float h1(float n){return fract(sin(n*127.1)*43758.5453);}
void main(){
 float z=fract(aA.y+uSc*.35),fade=smoothstep(0.,.07,z)*smoothstep(1.,.85,z);
 float pz=1./(.55+z*1.9),sd=aA.z,i=aB.x,L=aB.y;
 float f1=.11+.18*sd,f2=.043+.05*h1(sd*7.);
 float pos=aA.w*(uF+.33/f1*(1.-cos(f1*uF+sd*40.))+.27/f2*(1.-cos(f2*uF+sd*91.)));
 float sp=uBase*pz*1.06,gs=uBase*pz*aB.w,span=uRes.y+(L+3.)*sp;
 float y=uRes.y+sp-mod(pos*pz+sd*span*7.,span)+i*sp;
 float x=aA.x*uRes.x*1.16-.08*uRes.x+uCam.x*pz*46.;y+=uCam.y*pz*30.;
 x+=(y-uRes.y*.5)*uDr*(.6+.8*h1(sd*11.));
 x+=sin(y*.0065+uT*.42+sd*6.28)*(5.+17.*h1(sd*3.))*pz+sin(y*.019-uT*.9+aA.x*14.)*3.5*pz;
 vec2 p=vec2(x,y),q=p/uRes.y;
 p+=vec2(sin(q.y*3.1+uT*.21+sin(q.x*2.3-uT*.17)*1.7),cos(q.x*2.7-uT*.19+sin(q.y*1.9+uT*.13)*1.5))*uRes.y*.02;
 vec2 c=uSw.xy*uRes,d=p-c;float r=length(d)/uRes.y,a=uSw.z*exp(-r*r*3.2);p=c+mat2(cos(a),sin(a),-sin(a),cos(a))*d;
 vec2 e=p-uPtr.xy;float re=length(e)+1.,k=uPtr.z*exp(-re*re/(26000.*pz))*(1.25-z);
 p+=(e/re*60.+vec2(-e.y,e.x)/re*42.)*k;
 float gg=step(.985,sin(uT*.31+sd*50.)),rate=(.22+1.4*h1(sd*5.))*(1.+gg*14.);
 float gi=floor(h1(aB.z*13.1+floor(uT*rate+aB.z*7.))*26.);
 vL=aC*.5+.5;vUv=(vec2(mod(gi,8.),floor(gi/8.))+vL)/vec2(8.,4.);
 float hb=smoothstep(.9,1.,sin(uT*(.17+.25*sd)+sd*77.));
 vHd=(1.-step(.5,i))*(.5+.5*hb);
 vA=pow(1.-i/L,1.15)*fade*mix(1.6,.6,z)*(1.+vHd*.6);vZ=z;vH=sd*.93+uT*.017+i/L*.2+z*.12;
 bool cull=p.y<-gs*2.||p.y>uRes.y+gs*2.||fade<.001;p+=aC*gs*.8;
 gl_Position=cull?vec4(2.,2.,0.,1.):vec4(p.x/uRes.x*2.-1.,1.-p.y/uRes.y*2.,0.,1.);}`;
const FS = `precision mediump float;uniform sampler2D uTex;uniform float uPu;uniform vec4 uCard;
varying vec2 vUv,vL;varying float vA,vZ,vH,vHd;
vec3 aur(float h){h=fract(h)*5.;
 vec3 a=vec3(.32,1.,.78),b=vec3(.22,.84,1.),c=vec3(.45,.52,1.),d=vec3(.74,.46,1.),e=vec3(1.,.48,.82);
 return h<1.?mix(a,b,h):h<2.?mix(b,c,h-1.):h<3.?mix(c,d,h-2.):h<4.?mix(d,e,h-3.):mix(e,a,h-4.);}
void main(){vec4 t=texture2D(uTex,vUv,vZ*vZ*3.4);
 vec3 col=mix(aur(vH),aur(vH+.24),vL.y);
 vec3 rgb=col*(t.r*(1.15+vHd*1.2)+t.g*1.1);rgb=mix(rgb,vec3(t.r),vHd*.5*t.r);
 rgb=mix(rgb,vec3(.05,.17,.21)*(t.r+t.g),vZ*.5);
 float m=smoothstep(uCard.x-uCard.z,uCard.x+uCard.z,gl_FragCoord.x)*(1.-smoothstep(uCard.y-uCard.z,uCard.y+uCard.z,gl_FragCoord.x));
 rgb*=vA*(1.+uPu*.55)*mix(1.,uCard.w,m);
 gl_FragColor=vec4(rgb,max(rgb.r,max(rgb.g,rgb.b)));}`;

function seeded(n) { let s = n * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }
function drawGlyph(g, k, x, y, u) {
  g.save(); g.translate(x, y); g.lineWidth = Math.max(1, u * 0.085); g.lineCap = "round"; g.lineJoin = "round";
  if (k >= 22) {
    g.font = `700 ${Math.round(u * 0.8)}px ui-monospace,monospace`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(["₿", "Ξ", "◎", "Ð"][k - 22], 0, 0);
  } else {
    const r = seeded(k + 7), pts = [];
    for (let i = 0; i < 12; i++) pts.push([((i % 3) - 1) * u * 0.32, (Math.floor(i / 3) - 1.5) * u * 0.27]);
    g.beginPath(); const n = 3 + Math.floor(r() * 3); let a = Math.floor(r() * 12); g.moveTo(...pts[a]);
    for (let i = 0; i < n; i++) { const b = Math.floor(r() * 12); if (r() < 0.3) g.moveTo(...pts[b]); else g.lineTo(...pts[b]); a = b; }
    g.stroke();
    if (r() < 0.45) { g.beginPath(); g.arc(pts[a][0], pts[a][1], u * 0.07, 0, 7); g.fill(); }
    if (r() < 0.25) { g.beginPath(); g.arc(0, 0, u * 0.36, r() * 3, r() * 3 + 2.2); g.stroke(); }
  }
  g.restore();
}
// Atlas 1024×512 (8×4 Zellen à 128 px, Zweierpotenz → Mipmaps): R = scharfe Glyphe, G = Glow (Schatten-Trick, browserübergreifend)
function buildAtlas() {
  const C = 128, W = 1024, H = 512, mk = () => { const c = document.createElement("canvas"); c.width = W; c.height = H; return c; };
  const a = mk(), b = mk(), ga = a.getContext("2d"), gb = b.getContext("2d");
  for (const g of [ga, gb]) { g.fillStyle = g.strokeStyle = "#fff"; }
  gb.shadowColor = "#fff"; gb.shadowBlur = 14; gb.shadowOffsetX = 4000;
  for (let k = 0; k < 26; k++) {
    const x = (k % 8) * C + C / 2, y = Math.floor(k / 8) * C + C / 2;
    drawGlyph(ga, k, x, y, 70); drawGlyph(gb, k, x - 4000, y, 70);
  }
  const A = ga.getImageData(0, 0, W, H).data, B = gb.getImageData(0, 0, W, H).data, out = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) { out[i * 4] = A[i * 4 + 3]; out[i * 4 + 1] = Math.min(255, B[i * 4 + 3] * 1.6); out[i * 4 + 3] = 255; }
  return { out, W, H };
}

export function startMatrix() {
  if (document.querySelector(".st-matrix")) return;
  const cv = document.createElement("canvas"); cv.className = "st-matrix"; cv.setAttribute("aria-hidden", "true");
  let gl = null;
  try { gl = cv.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: "low-power" }); } catch {}
  const env = window.__stomsEnv || (window.__stomsEnv = {});
  const fallback = why => { cv.remove(); env.matrix = "2d:" + why; import("./matrix2d.js" + Q).then(m => m.startMatrix2d()); };
  if (!gl) return fallback("no-webgl");
  (window.__stomsBg ? window.__stomsBg() : document.body).prepend(cv);
  const RMq = matchMedia("(prefers-reduced-motion: reduce)"), compactQ = matchMedia("(max-width: 767px)");
  const low = (navigator.hardwareConcurrency || 8) <= 4;
  let pr, u, buf, ibuf, tex, nIdx = 0, W = 1, H = 1, dpr = 1, dprCap = 1.5, stopLoop = null;
  let flow = 0, tt = 0, pulse = 0, rate = 1, ptr = { x: -9999, y: -9999, s: 0, tx: -9999, ty: -9999 }, cam = [0, 0], card = [0, 0];
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const init = () => {
    pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error("link");
    gl.useProgram(pr);
    u = {}; for (const n of ["uRes", "uCam", "uPtr", "uSw", "uT", "uF", "uSc", "uBase", "uDr", "uPu", "uCard", "uTex"]) u[n] = gl.getUniformLocation(pr, n);
    const at = buildAtlas(); tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, at.W, at.H, 0, gl.RGBA, gl.UNSIGNED_BYTE, at.out); gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(u.uTex, 0); buf = gl.createBuffer(); ibuf = gl.createBuffer();
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.clearColor(0, 0, 0, 0);
  };
  // Geometrie: Spalten mit eigener Tiefe/Saat/Tempo, je Glyphe eigener Größenfaktor (stark variiert, gelegentlich Riesen-Köpfe)
  const geometry = () => {
    const c = compactQ.matches, cols = Math.max(24, Math.round(W / (c ? 9 : 11))), V = [], I = [];
    let n = 0;
    for (let k = 0; k < cols; k++) {
      const x = (k + 0.2 + Math.random() * 0.6) / cols, z = Math.sqrt(Math.random()), sd = Math.random();
      const spd = 34 + Math.random() * 74, L = 7 + Math.floor(Math.random() * (c ? 12 : 17)), cs = 0.75 + Math.random() * 0.5;
      for (let i = 0; i < L; i++) {
        const big = Math.random() < 0.05 ? 1.8 + Math.random() * 0.9 : 1;
        const sz = cs * (0.55 + Math.random() * 0.85) * big * (i === 0 ? 1.25 : 1), gs = Math.random();
        for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) V.push(cx, cy, x, z, sd, spd, i, L, gs, sz);
        I.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4;
        if (n > 65000) break;
      }
      if (n > 65000) break;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(V), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(I), gl.STATIC_DRAW);
    const st = 40;
    for (const [nm, sz, off] of [["aC", 2, 0], ["aA", 4, 8], ["aB", 4, 24]]) {
      const l = gl.getAttribLocation(pr, nm); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, sz, gl.FLOAT, false, st, off);
    }
    nIdx = I.length; env.matrix = "webgl:" + cols + "cols/" + n / 4 + "glyphs";
  };
  const measureCard = () => {
    const r = document.querySelector(".gradio-container")?.getBoundingClientRect();
    card = r && r.width < W * 0.98 ? [(r.left + 16) * dpr, (r.right - 16) * dpr] : [W * 0.08 * dpr, W * 0.92 * dpr];
  };
  const resize = () => {
    W = Math.max(1, innerWidth); H = Math.max(1, innerHeight);
    dpr = Math.min(devicePixelRatio || 1, compactQ.matches ? 2 : low ? 1.25 : dprCap);
    cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr); gl.viewport(0, 0, cv.width, cv.height);
    geometry(); measureCard();
  };
  const draw = () => {
    const c = compactQ.matches;
    gl.uniform2f(u.uRes, W, H); gl.uniform1f(u.uT, tt); gl.uniform1f(u.uF, flow);
    gl.uniform2f(u.uCam, cam[0], cam[1]); gl.uniform3f(u.uPtr, ptr.x, ptr.y, ptr.s);
    gl.uniform3f(u.uSw, 0.5 + 0.3 * Math.sin(tt * 0.043), 0.5 + 0.25 * Math.cos(tt * 0.037), 0.55 * Math.sin(tt * 0.06));
    gl.uniform1f(u.uSc, window.__stomsScroll || 0); gl.uniform1f(u.uBase, c ? 19 : 25);
    gl.uniform1f(u.uDr, 0.12 * Math.sin(tt * 0.031) + 0.07 * Math.sin(tt * 0.083 + 1.7));
    gl.uniform1f(u.uPu, pulse); gl.uniform4f(u.uCard, card[0], card[1], 70 * dpr, c ? 0.55 : 0.4);
    gl.clear(gl.COLOR_BUFFER_BIT); gl.drawElements(gl.TRIANGLES, nIdx, gl.UNSIGNED_SHORT, 0);
  };
  let slow = 0, cardT = 0;
  const step = (now, dt) => {
    const au = window.__stomsAudio || {}, lv = Math.min(au.level || 0, 1), ba = Math.min(au.bass || 0, 1), on = Math.min(au.on || 0, 1);
    const sp = Math.min(Math.abs(window.__stomsSpd || 0), 1);
    const tgt = Math.min(1, ba * 0.7 + on * 0.8);                       // Puls: schneller Anstieg, ≥300 ms Abklingen → keine Stroboskop-Blitze
    pulse += (tgt - pulse) * Math.min(1, dt * (tgt > pulse ? 10 : 3));
    rate += (1 + lv * 1.3 + ba * 0.8 + pulse * 1.1 + sp * 2.2 - rate) * Math.min(1, dt * 4);
    tt += dt; flow += dt * rate;
    ptr.x += (ptr.tx - ptr.x) * Math.min(1, dt * 7); ptr.y += (ptr.ty - ptr.y) * Math.min(1, dt * 7); ptr.s = Math.max(0, ptr.s - dt * 0.35);
    const px = ptr.tx > -999 ? ptr.tx / W - 0.5 : 0, py = ptr.ty > -999 ? ptr.ty / H - 0.5 : 0;
    cam[0] += (Math.sin(tt * 0.07) * 0.6 + px * 0.8 - cam[0]) * Math.min(1, dt * 2); cam[1] += (Math.cos(tt * 0.05) * 0.5 + py * 0.6 - cam[1]) * Math.min(1, dt * 2);
    if ((cardT += dt) > 0.5) { cardT = 0; measureCard(); }
    slow = slow * 0.97 + (dt > 0.026 ? 0.03 : 0);                        // adaptiv: bei Rucklern Auflösung senken
    if (slow > 0.5 && dprCap > 0.8) { dprCap -= 0.25; slow = 0; resize(); }
    draw();
  };
  const onPtr = (x, y) => { ptr.tx = x; ptr.ty = y; if (ptr.x < -999) { ptr.x = x; ptr.y = y; } ptr.s = Math.min(1, ptr.s + 0.25); };
  addEventListener("pointermove", e => onPtr(e.clientX, e.clientY), { passive: true });
  addEventListener("touchmove", e => { const t = e.touches[0]; if (t) onPtr(t.clientX, t.clientY); }, { passive: true });
  const sync = () => {
    if (RMq.matches) { stopLoop?.(); stopLoop = null; tt = 40; flow = 40; draw(); }
    else if (!stopLoop) { stopLoop = () => {}; loopReady.then(m => { stopLoop = m.addLoop(step, { fps: 60, budget: 3 }); }); }
  };
  let rz = 0; addEventListener("resize", () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { resize(); if (RMq.matches) draw(); }); }, { passive: true });
  RMq.addEventListener?.("change", sync);
  cv.addEventListener("webglcontextlost", e => { e.preventDefault(); stopLoop?.(); stopLoop = null; });
  cv.addEventListener("webglcontextrestored", () => { try { init(); resize(); sync(); } catch { fallback("restore"); } });
  try { init(); resize(); sync(); } catch (e) { stopLoop?.(); console.warn("STΩMs Matrix", e); fallback("init"); }
}
