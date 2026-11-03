import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/* ------------------------------------------------------------------ */
/*  SupportDesk AI — cinematic scene                                    */
/*  One persistent WebGL scene. The camera rides a spline through seven */
/*  "stations", one per landing-page section, each a real 3D model of   */
/*  a concept from the product (ticket ingestion, the LangGraph agent   */
/*  chain, pgvector space, Tavily grounding, provider failover,         */
/*  telemetry,
 escalation).                                             */
/* ------------------------------------------------------------------ */

const ORANGE = new THREE.Color("#ff6b0a");
const AMBER = new THREE.Color("#ffb066");
const CYAN = new THREE.Color("#5ad1ff");
const MINT = new THREE.Color("#5be3a8");
const RED = new THREE.Color("#ff4d3d");
const INK = "#05060a";

type Station = { pos: THREE.Vector3; cam: THREE.Vector3; side: number; ty?: number };

// world position of each station, camera offset, and which side of the screen the model sits on
const STATIONS: Station[] = [
  { pos: v(0, 0, 0), cam: v(0, 0.4, 11.5), side: 0, ty: -1.5 }, // 0 hero (object sits high, headline under it)
  { pos: v(26, 1, -20), cam: v(-1, 4.5, 10), side: 0.55 }, // 1 pipeline
  { pos: v(2, -2, -52), cam: v(-5, 3, 14), side: 0.5 }, // 2 vector space
  { pos: v(-26, 2, -78), cam: v(5, 1.5, 12), side: -0.5 }, // 3 grounding globe
  { pos: v(0, 0, -108), cam: v(0, 3.4, 13), side: 0.5 }, // 4 failover
  { pos: v(28, -1, -134), cam: v(-2, 5.5, 12), side: 0 }, // 5 telemetry
  { pos: v(0, 0, -168), cam: v(0, 0.6, 15), side: 0 }, // 6 escalation / portal
];

function v(x: number, y: number, z: number) {
  return new THREE.Vector3(x, y, z);
}
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/* ----------------------------- texture helpers ---------------------------- */

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ticketTexture(title: string, who: string, tag: string, tagColor: string, conf: number) {
  const c = document.createElement("canvas");
  c.width = 720;
  c.height = 440;
  const g = c.getContext("2d")!;
  roundRect(g, 6, 6, 708, 428, 36);
  const bg = g.createLinearGradient(0, 0, 720, 440);
  bg.addColorStop(0, "rgba(22,24,32,0.96)");
  bg.addColorStop(1, "rgba(10,11,16,0.96)");
  g.fillStyle = bg;
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = "rgba(255,255,255,0.14)";
  g.stroke();
  g.fillStyle = tagColor;
  roundRect(g, 40, 44, g.measureText(tag).width + 150, 46, 23);
  g.globalAlpha = 0.16;
  g.fill();
  g.globalAlpha = 1;
  g.font = "600 24px 'JetBrains Mono', monospace";
  g.fillStyle = tagColor;
  g.fillText(tag.toUpperCase(), 62, 76);
  g.fillStyle = "#f4f1ea";
  g.font = "500 38px Inter, sans-serif";
  const words = title.split(" ");
  let line = "";
  let y = 160;
  for (const w of words) {
    const t = line + w + " ";
    if (g.measureText(t).width > 620 && line) {
      g.fillText(line, 40, y);
      line = w + " ";
      y += 50;
    } else line = t;
  }
  g.fillText(line, 40, y);
  g.fillStyle = "rgba(244,241,234,0.5)";
  g.font = "400 26px Inter, sans-serif";
  g.fillText(who, 40, 372);
  // confidence bar
  g.fillStyle = "rgba(255,255,255,0.1)";
  roundRect(g, 400, 354, 280, 14, 7);
  g.fill();
  g.fillStyle = conf >= 0.7 ? "#5be3a8" : "#ff6b0a";
  roundRect(g, 400, 354, 280 * conf, 14, 7);
  g.fill();
  g.fillStyle = "rgba(244,241,234,0.7)";
  g.font = "500 22px 'JetBrains Mono', monospace";
  g.fillText(`${Math.round(conf * 100)}%`, 612, 340);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function labelSprite(text: string, sub = "", color = "#f4f1ea", scale = 1) {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 200;
  const g = c.getContext("2d")!;
  g.textAlign = "center";
  g.fillStyle = color;
  g.font = "600 54px 'JetBrains Mono', monospace";
  g.fillText(text, 320, sub ? 84 : 116);
  if (sub) {
    g.fillStyle = "rgba(244,241,234,0.55)";
    g.font = "400 34px Inter, sans-serif";
    g.fillText(sub, 320, 146);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
  const s = new THREE.Sprite(mat);
  s.scale.set(3.2 * scale, 1 * scale, 1);
  return s;
}

/* ------------------------------- the scene -------------------------------- */

export type SceneOptions = { canvas: HTMLCanvasElement; lowEnd: boolean; reduceMotion: boolean };

export class SupportDeskScene {
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
  private clock = new THREE.Clock();
  private raf = 0;
  private disposed = false;
  private camCurve!: THREE.CatmullRomCurve3;
  private tgtCurve!: THREE.CatmullRomCurve3;
  private stationGroups: THREE.Group[] = [];
  private updaters: Array<(t: number, dt: number, sub: number, act: number) => void> = [];

  // inputs
  private fTarget = 0; // raw station position 0..6
  private f = 0;
  private fly = 0;
  private flyS = 0;
  private mouse = new THREE.Vector2();
  private mouseS = new THREE.Vector2();
  private isMobile = false;

  private opts: SceneOptions;

  constructor(opts: SceneOptions) {
    this.opts = opts;
    const { canvas, lowEnd } = opts;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowEnd, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowEnd ? 1.25 : 1.75));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setClearColor(INK, 1);

    this.scene.fog = new THREE.FogExp2(INK, 0.0105);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.55;
    pmrem.dispose();

    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(6, 10, 8);
    this.scene.add(key, new THREE.AmbientLight(0x6070a0, 0.25));

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), lowEnd ? 0.35 : 0.7, 0.8, 0.82);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.buildRail();
    this.buildDust();
    this.buildHero();
    this.buildPipeline();
    this.buildVector();
    this.buildGlobe();
    this.buildFailover();
    this.buildTelemetry();
    this.buildPortal();

    window.addEventListener("pointermove", this.onPointer, { passive: true });
    this.resize();
    this.loop();
  }

  /* ----------------------------- public inputs ---------------------------- */
  setProgress(f: number, fly: number) {
    this.fTarget = f;
    this.fly = fly;
  }

  resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.isMobile = w < 860;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloom.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.fov = this.isMobile ? 52 : 38;
    this.camera.updateProjectionMatrix();
    this.buildRail();
  };

  private onPointer = (e: PointerEvent) => {
    this.mouse.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("pointermove", this.onPointer);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose?.();
    });
    this.composer.dispose();
    this.renderer.dispose();
  }

  /* --------------------------------- rail --------------------------------- */
  private buildRail() {
    const cams: THREE.Vector3[] = [];
    const tgts: THREE.Vector3[] = [];
    STATIONS.forEach((s) => {
      const side = this.isMobile ? 0 : s.side;
      const dir = s.pos.clone().sub(s.pos.clone().add(s.cam)).normalize();
      const right = new THREE.Vector3().crossVectors(dir, v(0, 1, 0)).normalize();
      const shift = right.multiplyScalar(-side * 6.5); // model appears on `side` of screen
      cams.push(s.pos.clone().add(s.cam).add(shift));
      tgts.push(s.pos.clone().add(shift).add(v(0, this.isMobile ? (s.ty ?? 0) - 1 : s.ty ?? 0, 0)));
    });
    this.camCurve = new THREE.CatmullRomCurve3(cams, false, "catmullrom", 0.5);
    this.tgtCurve = new THREE.CatmullRomCurve3(tgts, false, "catmullrom", 0.5);
  }

  /* ---------------------------- ambient dust ------------------------------ */
  private buildDust() {
    const n = this.opts.lowEnd ? 1200 : 3200;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 120;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = 20 - Math.random() * 220;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: 0xaab4d0, size: 0.06, transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true });
    const p = new THREE.Points(g, m);
    this.scene.add(p);
    this.updaters.push((t) => {
      p.position.y = Math.sin(t * 0.1) * 0.4;
    });
  }

  private station(i: number) {
    const gr = new THREE.Group();
    gr.position.copy(STATIONS[i].pos);
    this.scene.add(gr);
    this.stationGroups[i] = gr;
    return gr;
  }

  /* ------------------------ 0 · HERO: ticket core ------------------------- */
  private buildHero() {
    const g = this.station(0);
    const low = this.opts.lowEnd;

    const glass = low
      ? new THREE.MeshPhysicalMaterial({ color: 0x9fb2ff, metalness: 0.1, roughness: 0.08, transparent: true, opacity: 0.35, clearcoat: 1 })
      : new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, thickness: 1.6, roughness: 0.04, ior: 1.5, iridescence: 0.6, iridescenceIOR: 1.3, attenuationColor: new THREE.Color("#ffb88a"), attenuationDistance: 2.6 });
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 24), glass);
    g.add(core);

    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.62, 3),
      new THREE.MeshBasicMaterial({ color: ORANGE.clone().multiplyScalar(2.6), wireframe: true, toneMapped: false }),
    );
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 32), new THREE.MeshBasicMaterial({ color: ORANGE.clone().multiplyScalar(5), toneMapped: false }));
    g.add(inner, glow);

    const rings: THREE.Mesh[] = [];
    [2.3, 2.75, 3.2].forEach((r, i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.012, 8, 220),
        new THREE.MeshBasicMaterial({ color: (i === 1 ? ORANGE : AMBER).clone().multiplyScalar(i === 1 ? 2.4 : 1.2), toneMapped: false, transparent: true, opacity: 0.8 }),
      );
      ring.rotation.set(Math.PI / 2 + i * 0.42, i * 0.5, i * 0.7);
      g.add(ring);
      rings.push(ring);
    });

    const specs: Array<[string, string, string, string, number]> = [
      ["OAuth redirect_uri_mismatch on callback", "alice@example.com", "technical", "#5ad1ff", 0.91],
      ["Charged twice for annual Enterprise licence", "elena@fintech.co", "billing", "#ffb066", 0.84],
      ["401 after rotating client credentials", "marcus@cloudscale.net", "account", "#5be3a8", 0.88],
      ["Webhook HMAC signature always fails", "bob@devops.io", "technical", "#5ad1ff", 0.66],
      ["Can we export audit logs to S3?", "priya@northwind.dev", "feature", "#c9b6ff", 0.79],
      ["Dashboard blank after SSO login", "tom@orbit.app", "account", "#5be3a8", 0.93],
      ["Upgrade proration looks wrong", "sofia@lumen.io", "billing", "#ffb066", 0.72],
    ];
    const cards: Array<{ m: THREE.Mesh; a: number; r: number; y: number; s: number }> = [];
    specs.forEach((sp, i) => {
      const mat = new THREE.MeshBasicMaterial({ map: ticketTexture(sp[0], sp[1], sp[2], sp[3], sp[4]), transparent: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: false });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.28), mat);
      g.add(m);
      cards.push({ m, a: (i / specs.length) * Math.PI * 2, r: 4.6 + (i % 3) * 0.7, y: ((i % 4) - 1.5) * 0.9, s: 0.12 + (i % 3) * 0.03 });
    });

    // streaming sparks falling into the core
    const N = 260;
    const sp = new Float32Array(N * 3);
    const seed = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      seed[i * 4] = Math.random() * Math.PI * 2;
      seed[i * 4 + 1] = 2.5 + Math.random() * 5;
      seed[i * 4 + 2] = (Math.random() - 0.5) * 3;
      seed[i * 4 + 3] = 0.2 + Math.random() * 0.5;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    const sparks = new THREE.Points(pg, new THREE.PointsMaterial({ color: ORANGE.clone().multiplyScalar(2), size: 0.05, transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false }));
    g.add(sparks);

    this.updaters.push((t, _dt, sub) => {
      core.rotation.y = t * 0.12;
      core.rotation.x = Math.sin(t * 0.2) * 0.2;
      inner.rotation.y = -t * 0.5;
      inner.rotation.x = t * 0.3;
      const pulse = 1 + Math.sin(t * 2.2) * 0.06;
      glow.scale.setScalar(pulse);
      rings.forEach((r, i) => {
        r.rotation.z += 0.0016 * (i + 1);
        r.rotation.x += 0.0007 * (i % 2 ? -1 : 1);
      });
      cards.forEach((c) => {
        const a = c.a + t * c.s;
        // cards drift inward as the viewer scrolls away, then are absorbed
        const r = c.r * (1 - 0.5 * smooth(0.0, 1, sub));
        c.m.position.set(Math.cos(a) * r, c.y + Math.sin(t * 0.7 + c.a) * 0.15, Math.sin(a) * r);
        c.m.lookAt(0, c.y * 0.6, 0);
        c.m.rotateY(Math.PI);
        c.m.scale.setScalar(1 - 0.35 * smooth(0.45, 1, sub));
      });
      const pa = pg.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < N; i++) {
        const ph = (t * seed[i * 4 + 3] + i * 0.37) % 1;
        const r = seed[i * 4 + 1] * (1 - ph);
        const a = seed[i * 4] + ph * 5;
        pa.setXYZ(i, Math.cos(a) * r, seed[i * 4 + 2] * (1 - ph), Math.sin(a) * r);
      }
      pa.needsUpdate = true;
    });
  }

  /* ----------------- 1 · PIPELINE: six LangGraph agents ------------------- */
  private buildPipeline() {
    const g = this.station(1);
    const names: Array<[string, string]> = [
      ["INGEST", "sentiment"],
      ["INTENT", "route"],
      ["KNOWLEDGE", "pgvector"],
      ["SEARCH", "tavily"],
      ["RESPONSE", "synthesis"],
      ["GUARDRAILS", "cost + escalate"],
    ];
    const pts = names.map((_, i) => {
      const a = (i / (names.length - 1)) * Math.PI * 1.15 - Math.PI * 0.62;
      return v(Math.sin(a) * 7.2, Math.cos(i * 1.1) * 0.9 + (i - 2.5) * 0.15, -Math.cos(a) * 3.5 + 2);
    });
    const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 240, 0.025, 8, false),
      new THREE.MeshBasicMaterial({ color: CYAN.clone().multiplyScalar(1.6), transparent: true, opacity: 0.55, toneMapped: false }),
    );
    g.add(tube);

    const nodeMat = (low: boolean) =>
      low
        ? new THREE.MeshPhysicalMaterial({ color: 0x8fa3d9, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.45, clearcoat: 1 })
        : new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, thickness: 0.9, roughness: 0.08, ior: 1.45, attenuationColor: new THREE.Color("#7fb8ff"), attenuationDistance: 1.4 });

    const nodes = names.map(([n, s], i) => {
      const grp = new THREE.Group();
      grp.position.copy(pts[i]);
      const box = new THREE.Mesh(new RoundedBoxGeometry(1.35, 1.35, 1.35, 6, 0.22), nodeMat(this.opts.lowEnd));
      const coreM = new THREE.MeshBasicMaterial({ color: CYAN.clone().multiplyScalar(2), toneMapped: false });
      const dot = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), coreM);
      const lab = labelSprite(n, s, "#f4f1ea", 0.78);
      lab.position.set(0, 1.35, 0);
      grp.add(box, dot, lab);
      g.add(grp);
      return { grp, box, dot, coreM };
    });

    const COUNT = 36;
    const flow = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 12, 12), new THREE.MeshBasicMaterial({ color: ORANGE.clone().multiplyScalar(3), toneMapped: false }), COUNT);
    g.add(flow);
    const tmp = new THREE.Object3D();
    const tmpV = new THREE.Vector3();

    this.updaters.push((t, _dt, sub) => {
      const active = clamp((sub - 0.18) / 0.64) * (names.length - 1);
      nodes.forEach((n, i) => {
        const d = Math.abs(active - i);
        const on = clamp(1 - d / 1.1);
        n.grp.position.y = pts[i].y + Math.sin(t * 0.8 + i) * 0.12;
        n.box.rotation.y = t * 0.2 + i;
        n.box.rotation.x = Math.sin(t * 0.3 + i) * 0.2;
        n.dot.rotation.y = t * 1.2;
        n.dot.scale.setScalar(0.8 + on * 1.6);
        n.coreM.color.copy(on > 0.5 ? ORANGE : CYAN).multiplyScalar(1.6 + on * 3);
        n.grp.scale.setScalar(1 + on * 0.16);
      });
      for (let i = 0; i < COUNT; i++) {
        const u = (t * 0.06 + i / COUNT) % 1;
        curve.getPoint(u, tmpV);
        tmp.position.copy(tmpV);
        tmp.scale.setScalar(0.7 + 0.5 * Math.sin(u * 40 + t * 3));
        tmp.updateMatrix();
        flow.setMatrixAt(i, tmp.matrix);
      }
      flow.instanceMatrix.needsUpdate = true;
      g.rotation.y = Math.sin(t * 0.15) * 0.05;
    });
  }

  /* ---------------- 2 · VECTOR SPACE: 1,536-d embeddings ------------------ */
  private buildVector() {
    const g = this.station(2);
    const clusters = [
      { c: v(-4.6, 1.6, 1.2), col: CYAN, name: "technical" },
      { c: v(3.8, 2.4, -1.4), col: AMBER, name: "billing" },
      { c: v(-1.6, -2.8, -2.8), col: MINT, name: "account" },
      { c: v(5.2, -1.6, 2.6), col: new THREE.Color("#c9b6ff"), name: "features" },
      { c: v(0.4, 0.4, 3.8), col: new THREE.Color("#ff8aa6"), name: "runbooks" },
    ];
    const N = this.opts.lowEnd ? 2600 : 6500;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const size = new Float32Array(N);
    const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 1.1;
    for (let i = 0; i < N; i++) {
      const k = clusters[i % clusters.length];
      const sx = 1 + (i % 7) * 0.05;
      pos[i * 3] = k.c.x + gauss() * 1.7 * sx;
      pos[i * 3 + 1] = k.c.y + gauss() * 1.3;
      pos[i * 3 + 2] = k.c.z + gauss() * 1.7;
      col[i * 3] = k.col.r;
      col[i * 3 + 1] = k.col.g;
      col[i * 3 + 2] = k.col.b;
      size[i] = 0.6 + Math.random() * 1.1;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    const uni = { uQ: { value: v(0, 0, 0) }, uR: { value: 0 }, uTime: { value: 0 }, uPx: { value: window.devicePixelRatio } };
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: uni,
      vertexShader: /* glsl */ `
        attribute float aSize; attribute vec3 color; varying vec3 vC; varying float vHit;
        uniform vec3 uQ; uniform float uR; uniform float uTime; uniform float uPx;
        void main(){
          vec3 p = position;
          p += vec3(sin(uTime*0.4+p.y*1.7), cos(uTime*0.35+p.x*1.3), sin(uTime*0.3+p.z*1.9))*0.05;
          float d = distance(p, uQ);
          float hit = (1.0 - smoothstep(uR*0.6, uR, d)) * step(0.001, uR);
          vHit = hit;
          vC = mix(color*0.9, vec3(3.0,1.2,0.25), hit);
          vec4 mv = modelViewMatrix * vec4(p,1.0);
          gl_PointSize = aSize * uPx * (1.0 + hit*2.4) * (26.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vC; varying float vHit;
        void main(){
          float d = length(gl_PointCoord-0.5);
          float a = smoothstep(0.5,0.0,d);
          gl_FragColor = vec4(vC, a*(0.42+vHit*0.7));
        }`,
    });
    const pts = new THREE.Points(geo, mat);
    g.add(pts);

    // query probe
    const probe = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), new THREE.MeshBasicMaterial({ color: ORANGE.clone().multiplyScalar(5), toneMapped: false }));
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.01, 8, 80), new THREE.MeshBasicMaterial({ color: ORANGE.clone().multiplyScalar(2), toneMapped: false }));
    probe.add(halo);
    g.add(probe);
    const lab = labelSprite("QUERY", "1536-d · cosine", "#ffb066", 0.8);
    probe.add(lab);
    lab.position.set(0, 0.95, 0);

    // top-5 neighbour lines toward the technical cluster centre
    const target = clusters[0].c.clone();
    const nn = Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2;
      return target.clone().add(v(Math.cos(a) * 0.9, Math.sin(a * 1.3) * 0.7, Math.sin(a) * 0.9));
    });
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(5 * 2 * 3), 3));
    const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: ORANGE.clone().multiplyScalar(2), transparent: true, opacity: 0.9, toneMapped: false }));
    g.add(lines);

    // cluster labels
    clusters.forEach((k) => {
      const s = labelSprite(k.name.toUpperCase(), "", "#" + k.col.getHexString(), 0.55);
      s.position.copy(k.c).add(v(0, 2.2, 0));
      (s.material as THREE.SpriteMaterial).opacity = 0.7;
      g.add(s);
    });

    this.updaters.push((t, _dt, sub) => {
      uni.uTime.value = t;
      const s = smooth(0.2, 0.7, sub);
      probe.position.lerpVectors(v(9, 5, 7), target, s);
      halo.rotation.x = t;
      halo.scale.setScalar(1 + Math.sin(t * 3) * 0.08);
      uni.uQ.value.copy(probe.position);
      uni.uR.value = s * 1.9;
      const pa = lineGeo.attributes.position as THREE.BufferAttribute;
      nn.forEach((p, i) => {
        pa.setXYZ(i * 2, probe.position.x, probe.position.y, probe.position.z);
        const k = smooth(0.55 + i * 0.04, 0.8 + i * 0.04, sub);
        pa.setXYZ(i * 2 + 1, probe.position.x + (p.x - probe.position.x) * k, probe.position.y + (p.y - probe.position.y) * k, probe.position.z + (p.z - probe.position.z) * k);
      });
      pa.needsUpdate = true;
      lines.visible = s > 0.8;
      g.rotation.y = t * 0.04 + sub * 0.6;
    });
  }

  /* ------------------- 3 · GLOBE: Tavily web grounding -------------------- */
  private buildGlobe() {
    const g = this.station(3);
    const R = 3.6;
    const N = this.opts.lowEnd ? 5000 : 11000;
    const pos = new Float32Array(N * 3);
    const gold = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = gold * i;
      pos[i * 3] = Math.cos(th) * r * R;
      pos[i * 3 + 1] = y * R;
      pos[i * 3 + 2] = Math.sin(th) * r * R;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPx: { value: window.devicePixelRatio } },
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uPx; varying float vL; varying float vF;
        float h(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
        float n(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
          return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                     mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
        void main(){
          vec3 d = normalize(position);
          float land = n(d*2.3)*0.65 + n(d*5.0)*0.35;
          vL = smoothstep(0.5, 0.58, land);
          vec4 mv = modelViewMatrix*vec4(position,1.0);
          vec3 nrm = normalize(normalMatrix*d);
          vF = pow(1.0-abs(dot(nrm, normalize(-mv.xyz))), 1.5);
          gl_PointSize = (0.8 + vL*1.5) * uPx * (22.0 / -mv.z);
          gl_Position = projectionMatrix*mv;
        }`,
      fragmentShader: /* glsl */ `
        varying float vL; varying float vF;
        void main(){
          float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5,0.1,d);
          vec3 c = mix(vec3(0.16,0.28,0.5), vec3(0.45,0.85,1.2), vL);
          c += vec3(0.4,0.15,0.0)*vF;
          gl_FragColor = vec4(c, a*(0.16+vL*0.8));
        }`,
    });
    const globe = new THREE.Points(geo, mat);
    g.add(globe);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 48, 48), new THREE.MeshBasicMaterial({ color: 0x07101c, transparent: true, opacity: 0.92 })));

    const toXYZ = (lat: number, lon: number, r = R) => {
      const la = (lat * Math.PI) / 180;
      const lo = (lon * Math.PI) / 180;
      return v(r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo));
    };
    const origin = toXYZ(17.97, 79.6); // the desk's home region
    const cites: Array<[number, number, string, string]> = [
      [37.4, -122.1, "[1] RFC 6749", "datatracker.ietf.org"],
      [51.5, -0.1, "[2] OAuth docs", "docs.scalekit.com"],
      [35.7, 139.7, "[3] Webhooks guide", "docs.stripe.com"],
      [-33.9, 151.2, "[4] Auth FAQ", "support.auth0.com"],
      [52.5, 13.4, "[5] Runbook", "internal · kb-0142"],
    ];
    const arcs: Array<{ mat: THREE.ShaderMaterial; sprite: THREE.Sprite; tip: THREE.Mesh }> = [];
    cites.forEach(([la, lo, t, s], i) => {
      const end = toXYZ(la, lo);
      const mid = origin.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(R * 1.7);
      const curve = new THREE.QuadraticBezierCurve3(origin, mid, end);
      const am = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uP: { value: 0 }, uCol: { value: ORANGE.clone().multiplyScalar(2.4) } },
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
        fragmentShader: `varying vec2 vUv; uniform float uP; uniform vec3 uCol; void main(){ float a = step(vUv.x, uP) * (0.35+0.65*smoothstep(uP-0.25,uP,vUv.x)); gl_FragColor=vec4(uCol,a);} `,
      });
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.018, 6, false), am));
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), new THREE.MeshBasicMaterial({ color: ORANGE.clone().multiplyScalar(4), toneMapped: false }));
      tip.position.copy(end);
      g.add(tip);
      const sp = labelSprite(t, s, "#f4f1ea", 0.6);
      sp.position.copy(end.clone().normalize().multiplyScalar(R + 1.05));
      g.add(sp);
      arcs.push({ mat: am, sprite: sp, tip });
      void i;
    });
    const home = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), new THREE.MeshBasicMaterial({ color: CYAN.clone().multiplyScalar(4), toneMapped: false }));
    home.position.copy(origin);
    g.add(home);

    this.updaters.push((t, _dt, sub) => {
      (mat.uniforms.uTime as { value: number }).value = t;
      globe.rotation.y = -0.9 + t * 0.03 + sub * 0.9;
      g.children.forEach((c) => {
        if (c !== globe && c.type !== "Sprite") c.rotation.y = globe.rotation.y;
      });
      arcs.forEach((a, i) => {
        const p = smooth(0.18 + i * 0.1, 0.5 + i * 0.1, sub);
        a.mat.uniforms.uP.value = p;
        a.tip.visible = p > 0.98;
        a.sprite.material.opacity = smooth(0.3 + i * 0.1, 0.55 + i * 0.1, sub);
      });
      // sprites orbit with the globe
      arcs.forEach((a, i) => {
        const end = toXYZ(cites[i][0], cites[i][1]).applyAxisAngle(v(0, 1, 0), globe.rotation.y);
        a.sprite.position.copy(end.normalize().multiplyScalar(R + 1.05));
      });
    });
  }

  /* ---------------- 4 · FAILOVER: Gemini → OpenAI → Groq ---------------- */
  private buildFailover() {
    const g = this.station(4);
    const defs = [
      { n: "GEMINI", s: "2.5 flash · primary", c: CYAN, x: -4.4 },
      { n: "OPENAI", s: "gpt-4o-mini · secondary", c: MINT, x: 0 },
      { n: "GROQ", s: "llama-3.3-70b · fallback", c: AMBER, x: 4.4 },
    ];
    const mono = defs.map((d, i) => {
      const grp = new THREE.Group();
      grp.position.set(d.x, 0, i === 1 ? 0.6 : 0);
      const body = new THREE.Mesh(
        new RoundedBoxGeometry(2.2, 4.4, 1.2, 6, 0.16),
        new THREE.MeshPhysicalMaterial({ color: 0x0b0e16, metalness: 0.85, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15 }),
      );
      body.position.y = 2.2;
      const edgeMat = new THREE.MeshBasicMaterial({ color: d.c.clone().multiplyScalar(2), toneMapped: false });
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.8, 0.04), edgeMat);
      strip.position.set(0, 2.2, 0.62);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.14, 48), new THREE.MeshStandardMaterial({ color: 0x10131c, metalness: 0.9, roughness: 0.3 }));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.018, 8, 100), edgeMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.1;
      const beamMat = new THREE.MeshBasicMaterial({ color: d.c.clone().multiplyScalar(1.5), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.5, 6, 40, 1, true), beamMat);
      beam.position.y = 3.1;
      const lab = labelSprite(d.n, d.s, "#" + d.c.getHexString(), 0.85);
      lab.position.set(0, 5.4, 0);
      grp.add(body, strip, base, ring, beam, lab);
      g.add(grp);
      return { grp, edgeMat, beamMat, base: d.c, body };
    });
    // request packet
    const packet = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), new THREE.MeshBasicMaterial({ color: ORANGE.clone().multiplyScalar(4), toneMapped: false }));
    g.add(packet);
    const x = mono.map((m) => m.grp.position);

    this.updaters.push((t, _dt, sub) => {
      // 0–.33 gemini serves, .33–.45 gemini fails, .45–.7 openai serves, .7+ groq on standby/serves
      const phase = sub < 0.34 ? 0 : sub < 0.7 ? 1 : 2;
      const failing = sub > 0.3 && sub < 0.42;
      mono.forEach((m, i) => {
        const on = i === phase ? 1 : 0;
        m.beamMat.opacity += (on * 0.17 - m.beamMat.opacity) * 0.08;
        const dead = i === 0 && sub > 0.34;
        const flick = failing && i === 0 ? (Math.sin(t * 40) > 0 ? 1 : 0.15) : 1;
        m.edgeMat.color.copy(dead ? RED : m.base).multiplyScalar((dead ? 1.2 : 2) * flick);
        m.grp.position.y = (on ? 0.25 : 0) + Math.sin(t + i) * 0.06;
        m.body.rotation.y = Math.sin(t * 0.4 + i) * 0.05;
      });
      const tx = x[phase];
      packet.position.set(tx.x, 6.4 + Math.sin(t * 2) * 0.1, tx.z);
      packet.rotation.y = t * 2;
      g.rotation.y = Math.sin(t * 0.2) * 0.05;
    });
  }

  /* ---------------- 5 · TELEMETRY: latency ring + confidence ----------------- */
  private buildTelemetry() {
    const g = this.station(5);
    const N = 72;
    const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 1, 0.16), new THREE.MeshStandardMaterial({ color: 0x1b2433, metalness: 0.6, roughness: 0.3, emissive: CYAN, emissiveIntensity: 0.9 }), N);
    g.add(bars);
    const base = Array.from({ length: N }, (_, i) => 0.35 + Math.abs(Math.sin(i * 0.37) * 0.8 + Math.sin(i * 1.7) * 0.35 + Math.cos(i * 0.11) * 0.4));
    const tmp = new THREE.Object3D();
    const R = 4.4;
    const color = new THREE.Color();

    // confidence gauge: 82% arc + 70% threshold tick
    const arc = (frac: number, r: number, w: number, col: THREE.Color) =>
      new THREE.Mesh(new THREE.TorusGeometry(r, w, 12, 180, Math.PI * 2 * frac), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(2.2), toneMapped: false }));
    const track = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.03, 8, 180), new THREE.MeshBasicMaterial({ color: 0x2a3142 }));
    const gauge = arc(0.82, 2.2, 0.075, MINT);
    gauge.rotation.z = Math.PI / 2;
    track.rotation.x = 0;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 0.06), new THREE.MeshBasicMaterial({ color: ORANGE.clone().multiplyScalar(3), toneMapped: false }));
    const ta = Math.PI / 2 - Math.PI * 2 * 0.7;
    tick.position.set(Math.cos(ta) * 2.2, Math.sin(ta) * 2.2, 0);
    tick.rotation.z = ta;
    const cost = labelSprite("$0.0014", "cost of this ticket", "#5be3a8", 1.15);
    cost.position.set(0, 0.15, 0);
    const conf = labelSprite("82%", "blended confidence", "#f4f1ea", 0.8);
    conf.position.set(0, -0.85, 0);
    const disc = new THREE.Group();
    disc.add(track, gauge, tick, cost, conf);
    g.add(disc);
    disc.rotation.x = -0.35;

    this.updaters.push((t, _dt, sub) => {
      const grow = smooth(0.1, 0.6, sub);
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        const h = (base[i] + Math.sin(t * 1.4 + i * 0.5) * 0.12) * 1.6 * grow + 0.02;
        tmp.position.set(Math.cos(a) * R, h / 2 - 0.6, Math.sin(a) * R);
        tmp.scale.set(1, h, 1);
        tmp.lookAt(0, h / 2 - 0.6, 0);
        tmp.updateMatrix();
        bars.setMatrixAt(i, tmp.matrix);
        bars.setColorAt(i, color.setHSL(0.55 - Math.min(h, 2.4) * 0.09, 0.8, 0.55));
      }
      bars.instanceMatrix.needsUpdate = true;
      if (bars.instanceColor) bars.instanceColor.needsUpdate = true;
      g.rotation.y = t * 0.06 + sub * 0.8;
      disc.rotation.y = -g.rotation.y * 0.5 + Math.sin(t * 0.3) * 0.1;
      gauge.scale.setScalar(0.98 + grow * 0.02);
    });
  }

  /* --------------- 6 · PORTAL: escalation corridor ----------------------- */
  private buildPortal() {
    const g = this.station(6);
    const rings: Array<{ m: THREE.Mesh; z: number }> = [];
    for (let i = 0; i < 26; i++) {
      const r = 3.4 + i * 0.12;
      const col = i % 5 === 0 ? ORANGE : new THREE.Color("#3a4766");
      const m = new THREE.Mesh(new THREE.TorusGeometry(r, i % 5 === 0 ? 0.03 : 0.014, 8, 160), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(i % 5 === 0 ? 2.4 : 1), toneMapped: false, transparent: true, opacity: 0.85 }));
      m.position.z = -i * 2.2;
      g.add(m);
      rings.push({ m, z: -i * 2.2 });
    }
    const sun = new THREE.Mesh(new THREE.CircleGeometry(2.1, 64), new THREE.MeshBasicMaterial({ color: ORANGE.clone().multiplyScalar(3.2), toneMapped: false }));
    sun.position.z = -60;
    g.add(sun);
    const human = labelSprite("TIER-2 HUMAN LEAD", "escalated with a drafted reply", "#ffb066", 1.1);
    human.position.set(0, 0, -20);
    g.add(human);

    this.updaters.push((t, _dt, sub) => {
      rings.forEach((r, i) => {
        r.m.rotation.z = t * 0.05 * (i % 2 ? 1 : -1) + i * 0.1;
        r.m.scale.setScalar(1 + Math.sin(t * 1.2 - i * 0.3) * 0.015);
      });
      sun.scale.setScalar(1 + Math.sin(t * 1.5) * 0.04 + sub * 0.2);
    });
  }

  /* -------------------------------- loop ---------------------------------- */
  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    const rm = this.opts.reduceMotion;

    const k = rm ? 1 : 1 - Math.exp(-dt * 4.2);
    this.f += (this.fTarget - this.f) * k;
    this.flyS += (this.fly - this.flyS) * (rm ? 1 : 1 - Math.exp(-dt * 3));
    this.mouseS.lerp(this.mouse, rm ? 0 : 1 - Math.exp(-dt * 3));

    // dwell: camera rests on each station while its text is on screen
    const i = Math.floor(this.f);
    const fr = this.f - i;
    const eased = i + smooth(0.28, 0.72, fr);
    const u = clamp(eased / (STATIONS.length - 1));

    const cp = this.camCurve.getPoint(u);
    const tp = this.tgtCurve.getPoint(u);
    // final fly-through into the portal
    const portal = STATIONS[6].pos;
    cp.lerp(v(portal.x, portal.y + 0.2, portal.z - 38), smooth(0, 1, this.flyS));
    tp.lerp(v(portal.x, portal.y, portal.z - 70), smooth(0, 1, this.flyS));

    cp.x += this.mouseS.x * 0.6;
    cp.y += this.mouseS.y * 0.35;
    this.camera.position.copy(cp);
    this.camera.lookAt(tp);
    this.camera.rotation.z += this.mouseS.x * -0.012;

    // which stations are near enough to draw/update
    this.stationGroups.forEach((gr, idx) => {
      const d = Math.abs(this.f - idx);
      gr.visible = d < 1.6 || (idx === 6 && this.f > 4.4);
    });
    this.updaters.forEach((fn, idx) => {
      // updaters[0] is dust; the rest map to stations 0..6
      if (idx === 0) return fn(t, dt, 0, 1);
      const st = idx - 1;
      if (!this.stationGroups[st]?.visible) return;
      const sub = clamp(this.f - st + 0.5);
      fn(t, dt, sub, clamp(1 - Math.abs(this.f - st)));
    });

    this.bloom.strength = (this.opts.lowEnd ? 0.35 : 0.7) + this.flyS * 0.5;
    this.composer.render();
  };
}
