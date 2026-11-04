import * as THREE from "three";

/* ------------------------------------------------------------------ *
 * The Pneumatic Desk
 *
 * Tickets travel through a glass-and-brass pneumatic tube network, the
 * kind old offices used to move paperwork. The camera rides the line and
 * every stop is a machine for one stage of the real pipeline:
 *   intake hopper -> sentiment scanner -> routing manifold (5 bins)
 *   -> runbook archive -> draft press -> fork: draft tray | human desk
 * Studio environment lighting, transmissive glass, brass, anodised
 * aluminium. No particles, no glow orbs.
 * ------------------------------------------------------------------ */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sstep = (t: number) => t * t * (3 - 2 * t);
const ease = (a: number, b: number, x: number) => sstep(clamp((x - a) / (b - a)));

const BRASS = "#b08d57";
const STEEL = "#2a2f3a";
const EMBER = new THREE.Color("#ff6b0a");

/* ---------------------------- textures ---------------------------- */

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function plaqueTexture(title: string, sub: string, accent: string) {
  return canvasTex(512, 192, (g) => {
    g.fillStyle = "#14171f";
    g.fillRect(0, 0, 512, 192);
    g.strokeStyle = BRASS;
    g.lineWidth = 6;
    g.strokeRect(10, 10, 492, 172);
    g.fillStyle = accent;
    g.fillRect(28, 30, 10, 132);
    g.fillStyle = "#f4f1ea";
    g.font = "600 52px 'JetBrains Mono', ui-monospace, monospace";
    g.fillText(title, 56, 92);
    g.fillStyle = "rgba(244,241,234,.6)";
    g.font = "400 30px 'JetBrains Mono', ui-monospace, monospace";
    g.fillText(sub, 56, 142);
  });
}

function dialTexture() {
  return canvasTex(512, 512, (g) => {
    g.fillStyle = "#0f1218";
    g.fillRect(0, 0, 512, 512);
    const cx = 256, cy = 270, r = 190;
    const zones: Array<[string, string, number, number]> = [
      ["POSITIVE", "#5ea77f", 0, 0.25],
      ["NEUTRAL", "#8b93a7", 0.25, 0.5],
      ["FRUSTRATED", "#d9a04a", 0.5, 0.75],
      ["CRITICAL", "#d9584c", 0.75, 1],
    ];
    const ang = (v: number) => ((210 - 240 * v) * Math.PI) / 180;
    zones.forEach(([, col, a, b]) => {
      g.beginPath();
      g.arc(cx, cy, r, -ang(a), -ang(b), false);
      g.strokeStyle = col;
      g.lineWidth = 34;
      g.stroke();
    });
    for (let i = 0; i <= 24; i++) {
      const a = ang(i / 24);
      const l = i % 6 === 0 ? 30 : 15;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * (r - 28), cy - Math.sin(a) * (r - 28));
      g.lineTo(cx + Math.cos(a) * (r - 28 - l), cy - Math.sin(a) * (r - 28 - l));
      g.strokeStyle = "rgba(244,241,234,.55)";
      g.lineWidth = 3;
      g.stroke();
    }
    g.fillStyle = "rgba(244,241,234,.8)";
    g.font = "600 24px 'JetBrains Mono', ui-monospace, monospace";
    g.textAlign = "center";
    g.fillText("SENTIMENT", cx, 410);
    g.font = "400 18px 'JetBrains Mono', ui-monospace, monospace";
    g.fillStyle = "rgba(244,241,234,.45)";
    g.fillText("INGESTION AGENT", cx, 440);
  });
}

function sheetTexture() {
  return canvasTex(640, 840, (g) => {
    g.fillStyle = "#f1ece0";
    g.fillRect(0, 0, 640, 840);
    g.fillStyle = "#1b1812";
    g.font = "600 30px 'JetBrains Mono', ui-monospace, monospace";
    g.fillText("DRAFT REPLY · TKT-1096", 44, 70);
    g.fillRect(44, 88, 552, 3);
    g.font = "500 38px Inter, system-ui, sans-serif";
    g.fillText("Hi Elena,", 44, 160);
    g.font = "400 33px Inter, system-ui, sans-serif";
    const lines = [
      "That error means the callback URL",
      "is not on your provider's allow list.[1]",
      "Add the exact URL, including the",
      "trailing path, in the app's redirect",
      "settings, then retry sign-in.[2]",
    ];
    lines.forEach((l, i) => g.fillText(l, 44, 230 + i * 52));
    g.fillStyle = "rgba(27,24,18,.35)";
    for (let i = 0; i < 4; i++) g.fillRect(44, 520 + i * 26, 500 - (i % 2) * 120, 7);
    g.fillStyle = "#c2410c";
    g.font = "600 28px 'JetBrains Mono', ui-monospace, monospace";
    g.fillText("[1] OAuth redirect URIs · 0.91", 44, 700);
    g.fillText("[2] Registering callbacks · 0.88", 44, 744);
  });
}

function screenTexture(title: string, big: string, sub: string, color: string) {
  return canvasTex(640, 400, (g) => {
    g.fillStyle = "#0a0d13";
    g.fillRect(0, 0, 640, 400);
    g.strokeStyle = color;
    g.lineWidth = 4;
    g.strokeRect(14, 14, 612, 372);
    g.fillStyle = "rgba(244,241,234,.55)";
    g.font = "500 28px 'JetBrains Mono', ui-monospace, monospace";
    g.fillText(title, 44, 74);
    g.fillStyle = color;
    g.font = "300 120px Inter, system-ui, sans-serif";
    g.fillText(big, 40, 230);
    g.fillStyle = "rgba(244,241,234,.8)";
    g.font = "400 32px Inter, system-ui, sans-serif";
    g.fillText(sub, 44, 312);
  });
}

function floorTexture() {
  const t = canvasTex(512, 512, (g) => {
    g.fillStyle = "#12151c";
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = "rgba(255,255,255,.07)";
    g.lineWidth = 3;
    g.strokeRect(0, 0, 512, 512);
    g.strokeStyle = "rgba(255,255,255,.035)";
    g.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 512); g.stroke();
      g.beginPath(); g.moveTo(0, i * 128); g.lineTo(512, i * 128); g.stroke();
    }
    for (const [x, y] of [[24, 24], [488, 24], [24, 488], [488, 488]]) {
      g.fillStyle = "rgba(255,255,255,.12)";
      g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(70, 70);
  return t;
}

function tag(text: string, color = "#f4f1ea", w = 3.2) {
  const t = canvasTex(720, 120, (g) => {
    g.textAlign = "center";
    g.fillStyle = color;
    g.font = "600 40px 'JetBrains Mono', ui-monospace, monospace";
    g.fillText(text, 360, 74);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
  s.scale.set(w, w / 6, 1);
  return s;
}

function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const env = new THREE.Scene();
  env.background = new THREE.Color("#0b0c11");
  const box = (w: number, h: number, color: string, k: number, pos: [number, number, number]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  box(10, 3, "#ffe3c0", 5, [-6, 4, 3]);
  box(9, 9, "#ffffff", 1.8, [0, 8, 0]);
  box(8, 1.4, "#ff7a2a", 2.6, [7, 1.2, -3]);
  box(10, 1.6, "#9ec8ff", 2.6, [-3, -3, 5]);
  box(14, 2, "#ffffff", 1.4, [0, 2, -8]);
  box(14, 2, "#ffeacc", 1.6, [0, 2, 9]);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(env, 0.035).texture;
  pm.dispose();
  return tex;
}

/* ----------------------------- the line ----------------------------- */

const MAIN_PTS = [
  [0, 5.2, 4], [0, 2.4, 3], [0, 1.2, -3], [0, 1.2, -30],
  [2, 1.2, -37], [5, 1.2, -44], [5, 1.2, -52], [5, 1.2, -74],
  [2.5, 1.2, -84], [0, 1.2, -92], [0, 1.2, -150], [0, 1.2, -182],
].map(([x, y, z]) => V(x, y, z));

const Z = { intake: 4, scan: -18, div: -52, archive: -104, press: -134, fork: -156, tray: -178 };

type Key = { p: number; z: number; cam: [number, number, number]; tgt: [number, number, number] };
const KEYS: Key[] = [
  { p: 0.0, z: 3.4, cam: [-8.5, 5.0, 22], tgt: [-2.7, 4.3, 2] },
  { p: 0.1, z: 3.4, cam: [-8.5, 5.0, 22], tgt: [-2.7, 4.3, 2] },
  { p: 0.2, z: -13, cam: [-6.4, 2.6, 1], tgt: [-1.0, 1.6, -18] },
  { p: 0.34, z: -22, cam: [-6.4, 2.6, 1], tgt: [-1.0, 1.6, -18] },
  { p: 0.42, z: -45, cam: [2.1, 6.4, -33], tgt: [-1.0, 0.5, -58] },
  { p: 0.56, z: -63, cam: [2.1, 6.4, -33], tgt: [-1.0, 0.5, -58] },
  { p: 0.62, z: -92, cam: [-2.0, 2.3, -81], tgt: [-1.5, 2.3, -104] },
  { p: 0.76, z: -111, cam: [-2.0, 2.3, -81], tgt: [-1.5, 2.3, -104] },
  { p: 0.8, z: -129, cam: [-6.4, 3.2, -119], tgt: [0.8, 1.8, -135] },
  { p: 0.84, z: -137, cam: [-6.4, 3.2, -119], tgt: [0.8, 1.8, -135] },
  { p: 0.89, z: -153, cam: [-9.0, 6.0, -138], tgt: [0.0, 0.6, -164] },
  { p: 1.0, z: -174, cam: [-9.0, 6.0, -138], tgt: [0.0, 0.6, -164] },
];

export type JourneyOptions = { canvas: HTMLCanvasElement; reduceMotion: boolean; lowEnd: boolean };

export class TicketJourney {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(34, 1, 0.1, 400);
  private clock = new THREE.Clock();
  private raf = 0;
  private disposed = false;
  private active = true;
  private first = false;
  private target = 0;
  private p = 0;
  private ptr = new THREE.Vector2();
  private ptrS = new THREE.Vector2();
  private narrow = false;
  private opts: JourneyOptions;
  onFirstFrame?: () => void;

  private main = new THREE.CatmullRomCurve3(MAIN_PTS, false, "centripetal");
  private zTab: number[] = [];
  private lenTotal = 0;
  private uDiv = 0;
  private uFork = 0;
  private red!: THREE.CatmullRomCurve3;
  private branches: THREE.CatmullRomCurve3[] = [];

  private headlamp = new THREE.PointLight("#fff1dc", 18, 38, 1.6);
  private emberLight = new THREE.PointLight("#ff6b0a", 5, 7, 1.8);
  private hero!: THREE.Group;
  private escal!: THREE.Group;
  private ambient: Array<{ g: THREE.Group; cat: number; off: number }> = [];
  private needle!: THREE.Group;
  private needleV = 0.38;
  private beam!: THREE.Mesh;
  private flap!: THREE.Mesh;
  private sheet!: THREE.Mesh;
  private slips!: THREE.InstancedMesh;
  private slipSeed: number[] = [];
  private books: Array<{ m: THREE.Mesh; base: THREE.Vector3; dir: number }> = [];
  private bookLines!: THREE.LineSegments;
  private bookTags: THREE.Sprite[] = [];
  private beacon!: THREE.Mesh;
  private updaters: Array<(t: number, dt: number) => void> = [];

  constructor(opts: JourneyOptions) {
    this.opts = opts;
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas: opts.canvas, antialias: true, alpha: true, powerPreference: "high-performance" }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.lowEnd ? 1.25 : 2));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.3;
    r.setClearColor(0x000000, 0);
    this.scene.environment = studioEnvironment(r);
    this.scene.environmentIntensity = 0.95;
    this.scene.fog = new THREE.FogExp2("#07080d", 0.0115);
    this.scene.add(new THREE.HemisphereLight("#9fb2d6", "#1a1410", 0.55));
    const key = new THREE.DirectionalLight("#ffe9cf", 0.9);
    key.position.set(-8, 14, 10);
    this.scene.add(key, this.headlamp, this.emberLight);

    this.measure();
    this.buildFloor();
    this.buildTubes();
    this.buildIntake();
    this.buildScanner();
    this.buildDiverter();
    this.buildArchive();
    this.buildPress();
    this.buildFork();
    this.buildCapsules();

    window.addEventListener("pointermove", this.onPointer, { passive: true });
    this.resize();
    this.loop();
  }

  /* ----------------------------- helpers ----------------------------- */
  private measure() {
    const S = 4000;
    this.lenTotal = this.main.getLength();
    for (let i = 0; i <= S; i++) this.zTab.push(this.main.getPointAt(i / S).z);
    this.uDiv = this.uForZ(Z.div);
    this.uFork = this.uForZ(Z.fork);
  }

  /** arc-length parameter for a world z (the line is monotone in z) */
  private uForZ(z: number) {
    let lo = 0, hi = this.zTab.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.zTab[mid] > z) lo = mid; else hi = mid;
    }
    return lo / (this.zTab.length - 1);
  }

  private glass() {
    return this.opts.lowEnd
      ? new THREE.MeshPhysicalMaterial({ color: "#cfe6ee", transparent: true, opacity: 0.2, roughness: 0.05, clearcoat: 1, side: THREE.DoubleSide })
      : new THREE.MeshPhysicalMaterial({ color: "#ffffff", transmission: 1, thickness: 0.3, roughness: 0.04, ior: 1.5, attenuationColor: new THREE.Color("#9fd4cf"), attenuationDistance: 6, specularIntensity: 1 });
  }
  private brass() { return new THREE.MeshStandardMaterial({ color: BRASS, metalness: 1, roughness: 0.32 }); }
  private steel(c = STEEL) { return new THREE.MeshStandardMaterial({ color: c, metalness: 0.85, roughness: 0.38 }); }

  private plaque(title: string, sub: string, accent: string, w = 2.2) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.375), new THREE.MeshStandardMaterial({ map: plaqueTexture(title, sub, accent), metalness: 0.2, roughness: 0.5 }));
    return m;
  }

  /* ------------------------------ floor ------------------------------ */
  private buildFloor() {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshStandardMaterial({ map: floorTexture(), metalness: 0.65, roughness: 0.42, color: "#9aa0b0" }));
    f.rotation.x = -Math.PI / 2;
    f.position.set(0, -0.6, -80);
    this.scene.add(f);
  }

  /* ------------------------- tubes and fittings ----------------------- */
  private tube(curve: THREE.Curve<THREE.Vector3>, seg = 600) {
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, 0.32, 28, false), this.glass());
    this.scene.add(m);
    return m;
  }

  private buildTubes() {
    this.tube(this.main, 900);
    // brass couplings + stands along the whole run
    const N = 34;
    const coup = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.4, 0.4, 0.5, 28), this.brass(), N);
    const post = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.09, 1, 12), this.steel("#3a404e"), N);
    const foot = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.34, 0.4, 0.1, 20), this.steel("#20242d"), N);
    const o = new THREE.Object3D();
    const q = new THREE.Quaternion();
    for (let i = 0; i < N; i++) {
      const u = (i + 0.5) / N;
      const P = this.main.getPointAt(u);
      const T = this.main.getTangentAt(u);
      q.setFromUnitVectors(V(0, 1, 0), T);
      o.position.copy(P); o.quaternion.copy(q); o.scale.set(1, 1, 1); o.updateMatrix();
      coup.setMatrixAt(i, o.matrix);
      const h = P.y + 0.6;
      o.position.set(P.x, -0.6 + h / 2 - 0.3, P.z); o.quaternion.identity(); o.scale.set(1, h - 0.7, 1); o.updateMatrix();
      post.setMatrixAt(i, o.matrix);
      o.position.set(P.x, -0.55, P.z); o.scale.set(1, 1, 1); o.updateMatrix();
      foot.setMatrixAt(i, o.matrix);
    }
    this.scene.add(coup, post, foot);
  }

  /* ------------------------------ intake ------------------------------ */
  private buildIntake() {
    const g = new THREE.Group();
    g.position.set(0, 5.4, 4);
    const prof = [[0.5, 0], [0.52, 0.5], [1.0, 1.0], [2.2, 2.6], [2.4, 3.0]].map(([x, y]) => new THREE.Vector2(x, y));
    const funnel = new THREE.Mesh(new THREE.LatheGeometry(prof, 56), new THREE.MeshStandardMaterial({ color: "#a9b1c2", metalness: 0.92, roughness: 0.26, side: THREE.DoubleSide }));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.09, 12, 80), this.brass());
    rim.rotation.x = Math.PI / 2; rim.position.y = 3.0;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.4, 32), this.brass());
    collar.position.y = 0.1;
    g.add(funnel, rim, collar);
    // two rear braces hold the hopper, kept out of the camera's way
    [-1.9, 1.9].forEach((x) => {
      const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 7.4, 12), this.steel("#4a5262"));
      brace.position.set(x, -2.0, -2.6);
      g.add(brace);
    });
    const cross = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.14, 0.14), this.steel("#4a5262"));
    cross.position.set(0, 1.4, -2.6);
    g.add(cross);
    const pl = this.plaque("INTAKE", "tickets in", "#ff6b0a", 1.8);
    pl.position.set(0, 1.6, 2.5);
    g.add(pl);
    this.scene.add(g);

    // falling paper slips
    const n = this.opts.lowEnd ? 40 : 90;
    this.slips = new THREE.InstancedMesh(new THREE.BoxGeometry(0.56, 0.012, 0.4), new THREE.MeshStandardMaterial({ color: "#f1ece0", roughness: 0.9 }), n);
    for (let i = 0; i < n; i++) this.slipSeed.push(Math.random(), Math.random(), Math.random());
    g.add(this.slips);
    const o = new THREE.Object3D();
    this.updaters.push((t) => {
      for (let i = 0; i < n; i++) {
        const a = this.slipSeed[i * 3], b = this.slipSeed[i * 3 + 1], c = this.slipSeed[i * 3 + 2];
        const ph = (t * (0.18 + c * 0.1) + a) % 1;
        const y = 4.6 - ph * 4.2;
        const rad = lerp(2.0, 0.25, ph) * (0.3 + b * 0.7);
        const th = a * 40 + t * (0.4 + c);
        o.position.set(Math.cos(th) * rad, y, Math.sin(th) * rad);
        o.rotation.set(Math.sin(t + a * 9) * 0.7, th, Math.cos(t * 0.8 + b * 9) * 0.7);
        o.scale.setScalar(ph > 0.92 ? (1 - ph) / 0.08 : 1);
        o.updateMatrix();
        this.slips.setMatrixAt(i, o.matrix);
      }
      this.slips.instanceMatrix.needsUpdate = true;
    });
  }

  /* ------------------------------ scanner ------------------------------ */
  private buildScanner() {
    const g = new THREE.Group();
    g.position.set(0, 1.2, Z.scan);
    [-0.7, 0.7].forEach((dz) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 16, 80), this.brass());
      ring.position.z = dz;
      g.add(ring);
    });
    const outer = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.16, 16, 80), this.steel("#323846"));
    g.add(outer);
    // gate posts and cross bar
    [-1.35, 1.35].forEach((x) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.8, 0.5), this.steel("#323846"));
      p.position.set(x, -0.3, 0);
      g.add(p);
    });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.3, 0.6), this.steel("#323846"));
    bar.position.y = 1.75;
    g.add(bar);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.16), new THREE.MeshBasicMaterial({ color: EMBER.clone().multiplyScalar(3), toneMapped: false }));
    lamp.position.set(0, 1.58, 0);
    g.add(lamp);
    this.beam = new THREE.Mesh(new THREE.CircleGeometry(0.98, 48), new THREE.MeshBasicMaterial({ color: EMBER.clone().multiplyScalar(2.2), transparent: true, opacity: 0.32, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    g.add(this.beam);

    // dial on a pedestal, facing the camera
    const dial = new THREE.Group();
    dial.position.set(3.1, 1.45, 0);
    dial.rotation.y = -0.5;
    const dialFace = dialTexture();
    dialFace.center.set(0.5, 0.5);
    dialFace.rotation = Math.PI / 2;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.28, 56), [this.brass(), new THREE.MeshStandardMaterial({ map: dialFace, roughness: 0.35, metalness: 0.1 }), this.brass()]);
    body.rotation.x = Math.PI / 2;
    const glassCap = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 0.98, 0.02, 56), new THREE.MeshPhysicalMaterial({ color: "#ffffff", transparent: true, opacity: 0.12, roughness: 0.02, clearcoat: 1 }));
    glassCap.rotation.x = Math.PI / 2; glassCap.position.z = 0.17;
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 2.0, 16), this.steel("#3a404e"));
    stand.position.y = -1.9;
    this.needle = new THREE.Group();
    const nm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.78, 0.03), new THREE.MeshStandardMaterial({ color: "#ff6b0a", emissive: "#ff6b0a", emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.4 }));
    nm.geometry.translate(0, 0.39, 0);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 20), this.brass());
    hub.rotation.x = Math.PI / 2;
    this.needle.add(nm, hub);
    this.needle.position.set(0, -0.07, 0.17);
    dial.add(body, glassCap, stand, this.needle);
    g.add(dial);
    const pl = this.plaque("SENTIMENT", "ingestion agent", "#d9a04a", 2.0);
    pl.position.set(0, 2.45, 0.2);
    g.add(pl);
    this.scene.add(g);

    this.updaters.push((t) => {
      const ph = (t * 0.55) % 1;
      this.beam.position.z = lerp(-0.62, 0.62, ph);
      (this.beam.material as THREE.MeshBasicMaterial).opacity = 0.34 * Math.sin(ph * Math.PI);
      const a = ((210 - 240 * this.needleV) * Math.PI) / 180;
      this.needle.rotation.z = a - Math.PI / 2 + Math.sin(t * 9) * 0.01;
    });
  }

  /* ------------------------------ diverter ------------------------------ */
  private buildDiverter() {
    const D = this.main.getPointAt(this.uDiv);
    const T = this.main.getTangentAt(this.uDiv).setY(0).normalize();
    const R = V(1, 0, 0);
    const g = new THREE.Group();
    // valve body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.7, 36), this.brass());
    body.position.copy(D); body.quaternion.setFromUnitVectors(V(0, 1, 0), T);
    const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.28, 40), this.steel("#323846"));
    dome.position.copy(D).add(V(0, 0.55, 0));
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.04, 8, 32), this.brass());
    wheel.rotation.x = Math.PI / 2; wheel.position.copy(D).add(V(0, 0.95, 0));
    g.add(body, dome, wheel);

    const lat = [-7, -3.5, 3.5, 7];
    const names: Array<[string, string, string]> = [["BILLING", "7", "#d9a35b"], ["ACCOUNT / ACCESS", "6", "#6fb58f"], ["FEATURE REQUEST", "5", "#9a8bd0"], ["GENERAL", "3", "#b98a78"]];
    lat.forEach((l, i) => {
      const pts = [D.clone(), D.clone().addScaledVector(T, 3), D.clone().addScaledVector(T, 6).addScaledVector(R, l * 0.3).add(V(0, -0.1, 0)), D.clone().addScaledVector(T, 10).addScaledVector(R, l * 0.78).add(V(0, -0.3, 0)), D.clone().addScaledVector(T, 14).addScaledVector(R, l).add(V(0, -0.2, 0))];
      const c = new THREE.CatmullRomCurve3(pts, false, "centripetal");
      this.branches.push(c);
      this.tube(c, 160);
      const E = pts[4];
      const bin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.3, 2.1), this.steel("#262b36"));
      bin.position.set(E.x, -0.55 + 0.65 - 0.05, E.z - 0.9);
      const lip = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.12, 2.3), this.brass());
      lip.position.set(E.x, 0.75, E.z - 0.9);
      const hole = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.02, 1.6), new THREE.MeshBasicMaterial({ color: "#050608" }));
      hole.position.set(E.x, 0.82, E.z - 0.9);
      const pq = this.plaque(names[i][0], `${names[i][1]} tickets`, names[i][2], 2.0);
      pq.position.set(E.x, 0.2, E.z + 0.2);
      g.add(bin, lip, hole, pq);
    });
    // bug-report line continues straight: its own sign
    const sign = this.plaque("BUG REPORT", "9 tickets", "#5aa9d6", 2.0);
    sign.position.set(D.x + 1.7, 2.3, D.z - 7);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 10), this.steel("#3a404e"));
    stand.position.set(D.x + 1.7, 0.7, D.z - 7.05);
    g.add(sign, stand);
    this.scene.add(g);
  }

  /* ------------------------------ archive ------------------------------ */
  private buildArchive() {
    const g = new THREE.Group();
    const z0 = -92, z1 = -114, len = z1 - z0;
    const palette = ["#6b4f3a", "#3d4a5c", "#5c3b3b", "#47563f", "#8a7a5a", "#2f3a46", "#7b5b2e", "#54445f"].map((c) => new THREE.Color(c));
    const shelfY = [-0.1, 1.45, 3.0, 4.55];
    const bookGeo = new THREE.BoxGeometry(1, 1, 1);
    const maxBooks = 1200;
    const inst = new THREE.InstancedMesh(bookGeo, new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.05 }), maxBooks);
    const o = new THREE.Object3D();
    let n = 0;
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (const side of [-1, 1]) {
      const x = side * 3.6;
      // uprights and shelf boards
      for (let zz = z0; zz >= z1 - 0.01; zz -= 4) {
        const up = new THREE.Mesh(new THREE.BoxGeometry(0.14, 6.4, 1.2), this.steel("#323846"));
        up.position.set(x, 2.5, zz);
        g.add(up);
      }
      shelfY.forEach((y) => {
        const board = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, Math.abs(len) + 0.5), new THREE.MeshStandardMaterial({ color: "#4a3f33", roughness: 0.6, metalness: 0.2 }));
        board.position.set(x, y - 0.05, (z0 + z1) / 2);
        g.add(board);
      });
      shelfY.forEach((y, si) => {
        let zz = z0 - 0.2;
        while (zz > z1 + 0.2 && n < maxBooks - 3) {
          const w = 0.14 + rnd() * 0.16;
          const h = 0.95 + rnd() * 0.32;
          o.position.set(x, y + h / 2, zz - w / 2);
          o.scale.set(0.9, h, w);
          o.rotation.set(0, 0, 0);
          o.updateMatrix();
          inst.setMatrixAt(n, o.matrix);
          inst.setColorAt(n, palette[Math.floor(rnd() * palette.length)].clone().multiplyScalar(0.7 + rnd() * 0.5));
          n++;
          zz -= w + 0.012;
        }
        void si;
      });
    }
    inst.count = n;
    g.add(inst);
    // three highlighted runbook chunks on the near-left shelf, pulled toward the line when the capsule passes
    const hs: Array<[number, number, string, string]> = [[-96.5, 1.45, "kb-0142 · 0.91", "#ff8a3a"], [-100.0, 1.45, "kb-0142 · 0.88", "#ff8a3a"], [-104.2, 3.0, "kb-0087 · 0.84", "#ff8a3a"]];
    hs.forEach(([zz, y, label], i) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.15, 0.26), new THREE.MeshStandardMaterial({ color: "#d6c9a8", emissive: "#ff5a00", emissiveIntensity: 0.0, roughness: 0.6 }));
      const base = V(3.6, y + 0.58, zz);
      m.position.copy(base);
      g.add(m);
      this.books.push({ m, base, dir: -1 });
      const s = tag(label, "#ffb27a", 2.6);
      s.position.set(2.0, y + 1.9, zz);
      (s.material as THREE.SpriteMaterial).opacity = 0;
      g.add(s);
      this.bookTags.push(s);
      void i;
    });
    // lamps over the aisle
    for (let zz = z0 - 2; zz > z1; zz -= 6) {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(5, 0.08, 0.28), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffe2b8").multiplyScalar(2.4), toneMapped: false }));
      lamp.position.set(0, 6.0, zz);
      g.add(lamp);
    }
    const pl = this.plaque("RUNBOOK ARCHIVE", "pgvector · cosine", "#ff6b0a", 2.8);
    pl.position.set(-3.6, 5.5, z0 + 1.2);
    pl.rotation.y = Math.PI / 2;
    g.add(pl);
    // evidence lines
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3 * 2 * 3), 3));
    this.bookLines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: "#ff8a3a", transparent: true, opacity: 0, toneMapped: false }));
    this.bookLines.frustumCulled = false;
    g.add(this.bookLines);
    this.scene.add(g);
  }

  /* ------------------------------ press ------------------------------ */
  private buildPress() {
    const g = new THREE.Group();
    g.position.set(3.4, -0.6, Z.press);
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.0, 2.6), this.steel("#262b36"));
    body.position.y = 1.0;
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.16, 2.75), this.brass());
    top.position.y = 2.05;
    const slot = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 0.22), new THREE.MeshBasicMaterial({ color: "#020203" }));
    slot.position.set(0, 2.14, 0);
    g.add(body, top, slot);
    for (let i = 0; i < 3; i++) {
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(i === 0 ? "#6fe0a0" : "#ff6b0a").multiplyScalar(3), toneMapped: false }));
      led.position.set(-1.2 + i * 0.18, 1.7, 1.31);
      g.add(led);
    }
    // feed pipe from the main tube
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.2, 16), this.brass());
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(-2.1, 1.8, 0);
    g.add(pipe);
    this.sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.95), new THREE.MeshStandardMaterial({ map: sheetTexture(), roughness: 0.9, side: THREE.DoubleSide }));
    this.sheet.position.set(0, 2.2, 0.05);
    this.sheet.rotation.x = -0.12;
    g.add(this.sheet);
    const pl = this.plaque("DRAFT PRESS", "response agent", "#ff6b0a", 2.1);
    pl.position.set(0, 0.85, 1.32);
    g.add(pl);
    this.scene.add(g);
  }

  /* ------------------------------ fork ------------------------------ */
  private buildFork() {
    const F = this.main.getPointAt(this.uFork);
    const T = this.main.getTangentAt(this.uFork).setY(0).normalize();
    const R = V(1, 0, 0);
    const g = new THREE.Group();
    const pts = [F.clone(), F.clone().addScaledVector(T, 4), F.clone().addScaledVector(T, 8).addScaledVector(R, 2.4).add(V(0, -0.2, 0)), F.clone().addScaledVector(T, 13).addScaledVector(R, 6.6).add(V(0, -0.5, 0)), F.clone().addScaledVector(T, 17).addScaledVector(R, 9.6).add(V(0, -0.7, 0))];
    this.red = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    this.tube(this.red, 200);
    // junction body + flap
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.7, 36), this.brass());
    body.position.copy(F); body.quaternion.setFromUnitVectors(V(0, 1, 0), T);
    this.flap = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 1.2), this.brass());
    this.flap.position.copy(F).add(V(0, 0.9, 0));
    const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 10), this.steel("#4a5262"));
    lever.position.copy(F).add(V(0, 0.62, 0));
    g.add(body, this.flap, lever);

    // green end: draft tray with a screen
    const tray = new THREE.Group();
    tray.position.set(0, -0.6, Z.tray - 1.2);
    const desk = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.5, 2.4), this.steel("#262b36"));
    desk.position.y = 0.75;
    const dtop = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 2.6), this.brass());
    dtop.position.y = 1.5;
    const scr = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.9, 0.12), this.steel("#14171f"));
    scr.position.set(0, 2.55, -0.5); scr.rotation.x = -0.12;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.75), new THREE.MeshBasicMaterial({ map: screenTexture("DRAFT TRAY", "91%", "ready for review · cited", "#6fb58f"), toneMapped: false }));
    face.position.set(0, 2.55, -0.43); face.rotation.x = -0.12;
    tray.add(desk, dtop, scr, face);
    const pl = this.plaque("DRAFT TRAY", "confidence ≥ 70%", "#6fb58f", 2.2);
    pl.position.set(0, 0.8, 1.22);
    tray.add(pl);
    g.add(tray);

    // red end: human lead desk with a beacon
    const E = pts[4];
    const red = new THREE.Group();
    red.position.set(E.x + 0.2, -0.6, E.z - 1.2);
    const rd = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.5, 2.4), this.steel("#2a1c1c"));
    rd.position.y = 0.75;
    const rt = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.12, 2.6), this.brass());
    rt.position.y = 1.5;
    const rs = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.8, 0.12), this.steel("#14171f"));
    rs.position.set(0, 2.5, -0.5); rs.rotation.x = -0.12;
    const rf = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.65), new THREE.MeshBasicMaterial({ map: screenTexture("TIER-2 LEAD", "66%", "escalated · draft attached", "#e5675a"), toneMapped: false }));
    rf.position.set(0, 2.5, -0.43); rf.rotation.x = -0.12;
    this.beacon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ff3b2a").multiplyScalar(3), toneMapped: false }));
    this.beacon.position.set(1.4, 1.8, 0.4);
    red.add(rd, rt, rs, rf, this.beacon);
    const rp = this.plaque("HUMAN LEAD", "escalated", "#e5675a", 2.2);
    rp.position.set(0, 0.8, 1.22);
    red.add(rp);
    const rl = new THREE.PointLight("#ff3b2a", 5, 9, 1.8);
    rl.position.set(1.4, 2.4, 0.6);
    red.add(rl);
    g.add(red);
    this.scene.add(g);

    this.updaters.push((t) => {
      const k = 0.65 + Math.sin(t * 3) * 0.35;
      (this.beacon.material as THREE.MeshBasicMaterial).color.set("#ff3b2a").multiplyScalar(2 + k * 2);
      rl.intensity = 3 + k * 4;
    });
  }

  /* ------------------------------ capsules ------------------------------ */
  private capsule(band: string, glow: boolean, scale = 1) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.95, 24), new THREE.MeshPhysicalMaterial({ color: "#d7dce6", metalness: 0.95, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1 }));
    body.rotation.x = Math.PI / 2;
    const cap = (z: number) => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.13, 24), new THREE.MeshStandardMaterial({ color: "#14161c", roughness: 0.6, metalness: 0.2 }));
      c.rotation.x = Math.PI / 2;
      c.position.z = z;
      return c;
    };
    const bandM = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 24), new THREE.MeshStandardMaterial({ color: band, emissive: band, emissiveIntensity: glow ? 1.4 : 0.35, roughness: 0.4 }));
    bandM.rotation.x = Math.PI / 2;
    bandM.position.z = 0.12;
    g.add(body, cap(0.5), cap(-0.5), bandM);
    g.scale.setScalar(scale);
    this.scene.add(g);
    return g;
  }

  private buildCapsules() {
    this.hero = this.capsule("#ff6b0a", true, 1.25);
    this.escal = this.capsule("#e5675a", true, 1.25);
    const cats = ["#5aa9d6", "#d9a35b", "#6fb58f", "#9a8bd0", "#b98a78"];
    const n = this.opts.lowEnd ? 8 : 14;
    for (let i = 0; i < n; i++) this.ambient.push({ g: this.capsule(cats[i % 5], false), cat: i % 5, off: (i / n) * this.lenTotal });
  }

  private placeOn(obj: THREE.Object3D, curve: THREE.Curve<THREE.Vector3>, u: number) {
    const uu = clamp(u);
    const p = curve.getPointAt(uu);
    const t = curve.getTangentAt(uu);
    obj.position.copy(p);
    obj.lookAt(p.x + t.x, p.y + t.y, p.z + t.z);
  }

  /* ------------------------------ public ------------------------------ */
  setActive(on: boolean) {
    this.active = on;
    if (on) this.clock.getDelta();
  }
  setProgress(p: number) {
    this.target = clamp(p);
  }
  resize = () => {
    const w = this.opts.canvas.clientWidth || window.innerWidth;
    const h = this.opts.canvas.clientHeight || window.innerHeight;
    this.narrow = w < 820;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = this.narrow ? 50 : 34;
    this.camera.updateProjectionMatrix();
  };
  private onPointer = (e: PointerEvent) => {
    this.ptr.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  };
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("pointermove", this.onPointer);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => {
        (x as THREE.MeshBasicMaterial).map?.dispose?.();
        x.dispose();
      });
    });
    this.renderer.dispose();
  }

  /* ------------------------------- loop ------------------------------- */
  private keyAt(p: number) {
    let i = 0;
    while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
    const a = KEYS[i], b = KEYS[i + 1];
    const f = sstep(clamp((p - a.p) / (b.p - a.p)));
    return {
      z: lerp(a.z, b.z, f),
      cam: V(lerp(a.cam[0], b.cam[0], f), lerp(a.cam[1], b.cam[1], f), lerp(a.cam[2], b.cam[2], f)),
      tgt: V(lerp(a.tgt[0], b.tgt[0], f), lerp(a.tgt[1], b.tgt[1], f), lerp(a.tgt[2], b.tgt[2], f)),
    };
  }

  private tmp = V(0, 0, 0);

  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    if (!this.active || document.hidden) return;
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    const rm = this.opts.reduceMotion || (typeof location !== "undefined" && location.search.includes("sdInstant"));
    this.p += (this.target - this.p) * (rm ? 1 : 1 - Math.exp(-dt * 4));
    this.ptrS.lerp(this.ptr, rm ? 0 : 1 - Math.exp(-dt * 3));

    const k = this.keyAt(this.p);
    const mob = this.narrow ? 1.5 : 1;
    this.camera.position.set(k.cam.x - this.ptrS.x * 0.5, k.cam.y - this.ptrS.y * 0.3, k.cam.z * (this.narrow ? 1 : 1) + (this.narrow ? 6 : 0));
    this.tmp.copy(k.tgt);
    if (this.narrow) this.tmp.x += 2.2;
    this.camera.lookAt(this.tmp);
    void mob;

    // hero capsule rides the line with scroll; the escalated one runs ahead of it
    const uh = this.uForZ(k.z);
    this.placeOn(this.hero, this.main, uh);
    const dh = uh * this.lenTotal;
    const de = dh + 6;
    const dFork = this.uFork * this.lenTotal;
    if (de <= dFork) this.placeOn(this.escal, this.main, de / this.lenTotal);
    else this.placeOn(this.escal, this.red, (de - dFork) / this.red.getLength());

    // lights follow the action
    this.headlamp.position.copy(this.camera.position).add(V(1.5, 1.5, -2));
    this.emberLight.position.copy(this.hero.position).add(V(0, 0.5, 0));

    // sentiment needle reads whichever capsule is at the scanner
    const dScan = this.uForZ(Z.scan) * this.lenTotal;
    const near = Math.abs(de - dScan) < Math.abs(dh - dScan) ? 0.63 : 0.38;
    const bothAway = Math.min(Math.abs(de - dScan), Math.abs(dh - dScan)) > 7;
    this.needleV += ((bothAway ? 0.38 : near) - this.needleV) * (1 - Math.exp(-dt * 3));

    // fork flap leans toward the branch being used
    const flapT = de > dFork - 2 && dh < dFork - 1 ? 0.55 : -0.35;
    this.flap.rotation.y += (flapT - this.flap.rotation.y) * (1 - Math.exp(-dt * 4));

    // ambient traffic
    const dDiv = this.uDiv * this.lenTotal;
    const speed = 3.2;
    this.ambient.forEach((a) => {
      const d = (a.off + t * speed) % this.lenTotal;
      const onMain = d <= dDiv || a.cat === 0;
      if (onMain) {
        if (Math.abs(d - dh) < 1.4 || Math.abs(d - de) < 1.4) { a.g.visible = false; return; }
        a.g.visible = true;
        this.placeOn(a.g, this.main, d / this.lenTotal);
        a.g.scale.setScalar(d < 6 ? clamp(d / 6) : 1);
      } else {
        const br = this.branches[a.cat - 1];
        const bl = br.getLength();
        const f = (d - dDiv) / bl;
        a.g.visible = f < 1;
        if (f < 1) {
          this.placeOn(a.g, br, f);
          a.g.scale.setScalar(f > 0.94 ? (1 - f) / 0.06 : 1);
        }
      }
    });

    // archive: the three cited runbook chunks slide out as the hero capsule passes
    const hz = this.hero.position.z;
    this.books.forEach((b, i) => {
      const pull = ease(-92 - i * 3, -99 - i * 3.5, hz);
      const hold = 1 - ease(-112, -119, hz);
      const f = pull * hold;
      b.m.position.set(b.base.x + b.dir * 1.2 * f, b.base.y, b.base.z);
      (b.m.material as THREE.MeshStandardMaterial).emissiveIntensity = f * 0.9;
      (this.bookTags[i].material as THREE.SpriteMaterial).opacity = f;
    });
    const pa = this.bookLines.geometry.getAttribute("position") as THREE.BufferAttribute;
    let lineF = 0;
    this.books.forEach((b, i) => {
      const f = clamp((b.base.x - b.m.position.x) / 1.2);
      lineF = Math.max(lineF, f);
      pa.setXYZ(i * 2, this.hero.position.x, this.hero.position.y, this.hero.position.z);
      pa.setXYZ(i * 2 + 1, b.m.position.x - 0.1, b.m.position.y, b.m.position.z);
    });
    pa.needsUpdate = true;
    (this.bookLines.material as THREE.LineBasicMaterial).opacity = lineF * 0.85;

    // press: the printed sheet slides out of the slot as the capsule docks
    const out = ease(-126, -136, hz);
    this.sheet.position.y = lerp(1.95, 3.35, out);
    this.sheet.position.z = 0.05;

    this.updaters.forEach((fn) => fn(t, dt));
    this.renderer.render(this.scene, this.camera);
    if (!this.first) {
      this.first = true;
      this.onFirstFrame?.();
    }
  };
}
