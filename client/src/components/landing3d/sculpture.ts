import * as THREE from "three";

/* ------------------------------------------------------------------ *
 * The Ticket Sculpture
 *
 * 30 physical ticket plates, each with a real ticket printed on its top
 * face. One object, four moves, in the order the product really works:
 *   0  inbox      a stack of unread tickets
 *   1  ingest     laid out flat so every one can be read
 *   2  classify   sorted into five intent piles
 *   3  ground     one ticket lifts; its answer cites runbook plates
 *   4  decide     the confident draft stays, a 66% ticket is escalated
 * Studio lighting (soft boxes baked into an environment map), metal and
 * clear-coat materials, a contact shadow. No particles, no glow orbs.
 * ------------------------------------------------------------------ */

const N = 30;
const PLATE = { w: 2.3, h: 0.05, d: 1.5 };
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

export const CATEGORIES = [
  { id: "bug", label: "Bug report", color: "#5aa9d6", count: 9 },
  { id: "billing", label: "Billing", color: "#d9a35b", count: 7 },
  { id: "account", label: "Account / access", color: "#6fb58f", count: 6 },
  { id: "feature", label: "Feature request", color: "#9a8bd0", count: 5 },
  { id: "general", label: "General", color: "#b98a78", count: 3 },
] as const;

const SUBJECTS: Record<string, string[]> = {
  bug: [
    "OAuth redirect_uri_mismatch on callback",
    "Webhook HMAC signature always fails",
    "500 from /v1/sync after deploy",
    "CORS blocked on staging domain",
    "Rate limit 429 during bulk import",
    "SDK throws TypeError on init",
    "Search endpoint timing out",
    "Cannot verify JWT signature",
    "Container fails its health check",
  ],
  billing: [
    "Charged twice for annual licence",
    "Upgrade proration looks wrong",
    "Need an invoice with our VAT ID",
    "Refund for unused seats",
    "Card declined but plan is active",
    "Credit note never arrived",
    "Currency changed at renewal",
  ],
  account: [
    "401 after rotating credentials",
    "SSO login loops back to sign-in",
    "Add a teammate as admin",
    "Cannot reset our MFA device",
    "Transfer workspace ownership",
    "Email change not confirmed",
  ],
  feature: ["Export audit logs to S3", "Dark mode for the console", "Bulk assign tickets", "Slack alerts for escalations", "Custom SLA timers"],
  general: ["Where is our data stored?", "Which models do you use?", "Is there an EU region?"],
};
const PEOPLE = [
  ["Alice Johnson", "alice@acme-labs.io"], ["Marcus Lee", "marcus@cloudscale.net"], ["Priya Nair", "priya@northwind.dev"],
  ["Tom Becker", "tom@orbit.app"], ["Elena Rossi", "elena@fintech.co"], ["Sofia Alvarez", "sofia@lumen.io"],
  ["Bob Smith", "bob@devops.io"], ["Dana Kim", "dana@helio.com"], ["Omar Haddad", "omar@parcelly.co"],
];
const SENTIMENT = [
  ["neutral", "#9aa0b4"], ["frustrated", "#e5a24a"], ["positive", "#6fb58f"], ["critical", "#e5675a"],
] as const;

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Ticket = { id: string; subject: string; cat: number; who: string[]; sent: number; conf: number };

function makeTickets(): Ticket[] {
  const r = rng(42);
  const out: Ticket[] = [];
  CATEGORIES.forEach((c, ci) => {
    const subs = SUBJECTS[c.id];
    for (let k = 0; k < c.count; k++) {
      out.push({
        id: `TKT-${1040 + out.length * 7}`,
        subject: subs[k % subs.length],
        cat: ci,
        who: PEOPLE[Math.floor(r() * PEOPLE.length)],
        sent: r() > 0.7 ? 1 : r() > 0.8 ? 3 : r() > 0.7 ? 2 : 0,
        conf: 0.72 + r() * 0.24,
      });
    }
  });
  // deterministic shuffle so categories are mixed in the tower
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function ticketTexture(t: Ticket, accent?: string) {
  const W = 768, H = 500;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  const col = accent || CATEGORIES[t.cat].color;
  g.fillStyle = "#171a23";
  g.fillRect(0, 0, W, H);
  // subtle paper grain
  const gr = g.createLinearGradient(0, 0, W, H);
  gr.addColorStop(0, "rgba(255,255,255,.05)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  g.fillStyle = col;
  g.fillRect(0, 0, 14, H);
  g.font = "600 24px 'JetBrains Mono', ui-monospace, monospace";
  g.fillStyle = "rgba(244,241,234,.55)";
  g.fillText(t.id, 52, 62);
  // category chip
  const label = CATEGORIES[t.cat].label.toUpperCase();
  g.font = "600 21px 'JetBrains Mono', ui-monospace, monospace";
  const cw = g.measureText(label).width + 36;
  g.fillStyle = col + "33";
  g.beginPath(); g.roundRect(W - cw - 40, 36, cw, 40, 20); g.fill();
  g.fillStyle = col;
  g.fillText(label, W - cw - 22, 64);
  // subject
  g.fillStyle = "#f4f1ea";
  g.font = "500 44px Inter, system-ui, sans-serif";
  const words = t.subject.split(" ");
  let line = "", y = 168;
  for (const w of words) {
    const test = line + w + " ";
    if (g.measureText(test).width > W - 110 && line) { g.fillText(line, 52, y); line = w + " "; y += 56; } else line = test;
  }
  g.fillText(line, 52, y);
  // customer
  g.fillStyle = "rgba(244,241,234,.78)";
  g.font = "400 27px Inter, system-ui, sans-serif";
  g.fillText(t.who[0], 52, 372);
  g.fillStyle = "rgba(244,241,234,.42)";
  g.font = "400 23px Inter, system-ui, sans-serif";
  g.fillText(t.who[1], 52, 408);
  // sentiment
  const [sl, sc] = SENTIMENT[t.sent];
  g.fillStyle = sc;
  g.beginPath(); g.arc(W - 250, 392, 8, 0, Math.PI * 2); g.fill();
  g.font = "500 22px Inter, system-ui, sans-serif";
  g.fillStyle = "rgba(244,241,234,.7)";
  g.fillText(sl, W - 232, 400);
  // confidence rail
  g.fillStyle = "rgba(255,255,255,.1)";
  g.beginPath(); g.roundRect(W - 250, 430, 200, 8, 4); g.fill();
  g.fillStyle = t.conf >= 0.7 ? "#6fb58f" : "#ff6b0a";
  g.beginPath(); g.roundRect(W - 250, 430, 200 * t.conf, 8, 4); g.fill();
  g.fillStyle = "rgba(244,241,234,.5)";
  g.font = "500 18px 'JetBrains Mono', ui-monospace, monospace";
  g.fillText(`${Math.round(t.conf * 100)}%`, W - 250, 466);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function runbookTexture(title: string, sim: string, chunk: string) {
  const W = 768, H = 500;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#e9e2d2";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#1a1712";
  g.font = "600 28px 'JetBrains Mono', ui-monospace, monospace";
  g.fillText("RUNBOOK · " + chunk, 44, 66);
  g.font = "600 58px Inter, system-ui, sans-serif";
  const words = title.split(" ");
  let line = "", y = 140;
  for (const w of words) {
    const test = line + w + " ";
    if (g.measureText(test).width > W - 90 && line) { g.fillText(line, 44, y); line = w + " "; y += 66; } else line = test;
  }
  g.fillText(line, 44, y);
  g.fillStyle = "rgba(26,23,18,.35)";
  for (let i = 0; i < 5; i++) g.fillRect(44, 270 + i * 26, 520 - (i % 3) * 90, 6);
  g.fillStyle = "#c2410c";
  g.font = "600 40px 'JetBrains Mono', ui-monospace, monospace";
  g.fillText("cos " + sim, W - 250, 470);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function labelSprite(text: string, color = "#f4f1ea", w = 3.4) {
  const c = document.createElement("canvas");
  c.width = 720; c.height = 120;
  const g = c.getContext("2d")!;
  g.textAlign = "center";
  g.fillStyle = color;
  g.font = "600 40px 'JetBrains Mono', ui-monospace, monospace";
  g.fillText(text, 360, 72);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  s.scale.set(w, w / 6, 1);
  return s;
}

/** Soft boxes baked into an environment map, which is what makes the metal read as a product shot. */
function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const env = new THREE.Scene();
  env.background = new THREE.Color("#0a0b10");
  const box = (w: number, h: number, color: string, intensity: number, pos: [number, number, number], look: [number, number, number] = [0, 0, 0]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(...pos);
    m.lookAt(...look);
    env.add(m);
  };
  box(10, 3, "#ffe9cc", 5, [-6, 4, 3]);
  box(9, 9, "#ffffff", 1.6, [0, 8, 0]);
  box(8, 1.4, "#ff7a2a", 7, [7, 1.2, -3]);
  box(10, 1.6, "#9ec8ff", 2.4, [-3, -3, 5]);
  box(14, 2, "#ffffff", 1.2, [0, 2, -8]);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(env, 0.035).texture;
  pm.dispose();
  return tex;
}

function contactShadow() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(128, 128, 8, 128, 128, 126);
  r.addColorStop(0, "rgba(0,0,0,.65)");
  r.addColorStop(0.55, "rgba(0,0,0,.28)");
  r.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

type Layout = { pos: THREE.Vector3; rotY: number; tilt?: number };

export type SculptureOptions = { canvas: HTMLCanvasElement; reduceMotion: boolean; lowEnd: boolean };

export class TicketSculpture {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  private group = new THREE.Group();
  private plates: THREE.Mesh[] = [];
  private sideMats: THREE.MeshPhysicalMaterial[] = [];
  private tickets = makeTickets();
  private layouts: Layout[][] = [[], [], [], [], []];
  private catOf: number[] = [];
  private ember = 0;
  private escal = 0;
  private kb: THREE.Mesh[] = [];
  private kbBase: THREE.Vector3[] = [];
  private links!: THREE.LineSegments;
  private linkGeo = new THREE.BufferGeometry();
  private tray!: THREE.Mesh;
  private labels: Record<string, THREE.Sprite> = {};
  private shadow = contactShadow();
  private raf = 0;
  private disposed = false;
  private clock = new THREE.Clock();
  private catColors = CATEGORIES.map((c) => new THREE.Color(c.color));
  private baseSide = new THREE.Color("#20242f");
  private target = 0;
  private p = 0;
  private ptr = new THREE.Vector2();
  private ptrS = new THREE.Vector2();
  private narrow = false;
  private ready = false;
  private first = false;
  private active = true;
  onFirstFrame?: () => void;
  private opts: SculptureOptions;

  constructor(opts: SculptureOptions) {
    this.opts = opts;
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas: opts.canvas, antialias: true, alpha: true, powerPreference: "high-performance" }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.lowEnd ? 1.25 : 2));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.setClearColor(0x000000, 0);
    this.scene.environment = studioEnvironment(r);
    this.scene.environmentIntensity = 0.9;
    this.scene.fog = new THREE.Fog("#07080d", 12, 26);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.12));
    const key = new THREE.DirectionalLight("#fff1dc", 0.5);
    key.position.set(4, 6, 5);
    this.scene.add(key);
    this.scene.add(this.group);
    this.build();
    window.addEventListener("pointermove", this.onPointer, { passive: true });
    this.resize();
    this.loop();
  }

  private build() {
    const geo = new THREE.BoxGeometry(PLATE.w, PLATE.h, PLATE.d);
    const edges = new THREE.EdgesGeometry(geo);
    const base = new THREE.Color("#20242f");

    this.tickets.forEach((t, i) => {
      this.catOf[i] = t.cat;
    });
    // special tickets
    this.ember = this.tickets.findIndex((t) => t.cat === 0);
    this.tickets[this.ember] = { ...this.tickets[this.ember], subject: "OAuth redirect_uri_mismatch on callback", conf: 0.91, sent: 0 };
    this.escal = this.tickets.findIndex((t, i) => t.cat === 0 && i !== this.ember);
    this.tickets[this.escal] = { ...this.tickets[this.escal], subject: "Webhook HMAC signature always fails", conf: 0.66, sent: 1 };

    this.tickets.forEach((t, i) => {
      const side = new THREE.MeshPhysicalMaterial({ color: base.clone(), metalness: 0.8, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12 });
      const top = new THREE.MeshPhysicalMaterial({
        map: ticketTexture(t, i === this.ember ? "#ff6b0a" : i === this.escal ? "#e5675a" : undefined),
        metalness: 0.05, roughness: 0.42, clearcoat: 0.9, clearcoatRoughness: 0.2,
      });
      this.sideMats.push(side);
      const m = new THREE.Mesh(geo, [side, side, top, side, side, side]);
      const ln = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: "#f4f1ea", transparent: true, opacity: i === this.ember ? 0.7 : 0.16 }));
      m.add(ln);
      this.group.add(m);
      this.plates.push(m);
    });

    // layouts ---------------------------------------------------------
    const piles: number[][] = CATEGORIES.map(() => []);
    this.tickets.forEach((t, i) => piles[t.cat].push(i));
    const levelOf: number[] = [];
    piles.forEach((list) => list.forEach((idx, lv) => (levelOf[idx] = lv)));
    const pilePos: Array<[number, number]> = [[-2.7, -1.2], [0, -1.2], [2.7, -1.2], [-1.35, 1.2], [1.35, 1.2]];
    for (let i = 0; i < N; i++) {
      const mid = i - (N - 1) / 2;
      // 0 tower
      this.layouts[0].push({ pos: new THREE.Vector3(0, mid * 0.095, 0), rotY: i * 0.2 });
      // 1 flat board, 5 x 6
      const col = i % 5, row = Math.floor(i / 5);
      this.layouts[1].push({ pos: new THREE.Vector3((col - 2) * 2.45, 0, (row - 2.5) * 1.62), rotY: 0 });
      // 2 piles, two rows
      const c = this.tickets[i].cat;
      this.layouts[2].push({ pos: new THREE.Vector3(pilePos[c][0], -0.4 + levelOf[i] * 0.085, pilePos[c][1]), rotY: (levelOf[i] % 2 ? 0.018 : -0.018) + (c - 2) * -0.02 });
      const p3 = this.layouts[2][i];
      // 3 ground: the ember ticket lifts and turns to face the viewer
      if (i === this.ember) this.layouts[3].push({ pos: new THREE.Vector3(0.9, 2.3, 2.7), rotY: 0, tilt: 1.22 });
      else this.layouts[3].push({ pos: p3.pos.clone(), rotY: p3.rotY });
      // 4 decide: the confident draft stays, the 66% ticket moves onto the escalation tray
      if (i === this.ember) this.layouts[4].push({ pos: new THREE.Vector3(-0.9, 2.3, 2.7), rotY: 0, tilt: 1.22 });
      else if (i === this.escal) this.layouts[4].push({ pos: new THREE.Vector3(1.9, 1.2, 2.1), rotY: -0.08, tilt: 1.0 });
      else this.layouts[4].push({ pos: p3.pos.clone(), rotY: p3.rotY });
    }

    // runbook plates (cream), rise behind the ember ticket
    const kbDefs: Array<[string, string, string, [number, number, number]]> = [
      ["OAuth redirect URIs", "0.91", "kb-0142 · chunk 3", [-1.5, 2.9, -0.9]],
      ["Registering callback URLs", "0.88", "kb-0142 · chunk 4", [1.5, 3.6, -1.5]],
      ["Provider setup checklist", "0.84", "kb-0087 · chunk 1", [4.0, 2.9, -0.9]],
    ];
    kbDefs.forEach(([title, sim, chunk, pos]) => {
      const kgeo = new THREE.BoxGeometry(1.7, 0.035, 1.1);
      const side = new THREE.MeshPhysicalMaterial({ color: "#c8bfa8", metalness: 0.4, roughness: 0.4, clearcoat: 1 });
      const top = new THREE.MeshPhysicalMaterial({ map: runbookTexture(title, sim, chunk), roughness: 0.5, clearcoat: 0.6 });
      const m = new THREE.Mesh(kgeo, [side, side, top, side, side, side]);
      m.visible = false;
      this.group.add(m);
      this.kb.push(m);
      this.kbBase.push(new THREE.Vector3(...pos));
    });
    this.linkGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3 * 2 * 3), 3));
    this.links = new THREE.LineSegments(this.linkGeo, new THREE.LineBasicMaterial({ color: "#ff8a3a", transparent: true, opacity: 0 }));
    this.links.frustumCulled = false;
    this.group.add(this.links);

    // escalation tray
    this.tray = new THREE.Mesh(
      new THREE.BoxGeometry(2.7, 0.03, 1.8),
      new THREE.MeshPhysicalMaterial({ color: "#3a1612", metalness: 0.6, roughness: 0.35, clearcoat: 1, transparent: true, opacity: 0 }),
    );
    this.tray.position.set(1.9, 1.13, 2.1);
    this.tray.rotation.set(1.0, -0.08, 0);
    this.group.add(this.tray);

    // labels
    CATEGORIES.forEach((c, i) => {
      const s = labelSprite(`${c.label.toUpperCase()}  ${c.count}`, c.color, 2.6);
      if (pilePos[i][1] < 0) s.position.set(pilePos[i][0], 1.2, pilePos[i][1] - 0.3);
      else s.position.set(pilePos[i][0], 0.1, pilePos[i][1] + 1.35);
      s.material.opacity = 0;
      this.group.add(s);
      this.labels["cat" + i] = s;
    });
    const mk = (key: string, text: string, color: string, pos: [number, number, number]) => {
      const s = labelSprite(text, color, 3);
      s.position.set(...pos);
      s.material.opacity = 0;
      this.group.add(s);
      this.labels[key] = s;
    };
    mk("esc", "ESCALATED · 66%", "#ff8a7e", [1.9, 2.75, 2.1]);
    mk("kb", "TOP-3 PGVECTOR CHUNKS", "#e9e2d2", [1.5, 4.65, -1.5]);

    this.shadow.scale.set(14, 9, 1);
    this.shadow.position.y = -1.05;
    this.group.add(this.shadow);
    // ring floor markings
    [3, 5, 7].forEach((r, n) => {
      const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.008, 160), new THREE.MeshBasicMaterial({ color: "#f4f1ea", transparent: true, opacity: 0.12 - n * 0.03, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -1.04;
      this.group.add(ring);
    });
    this.ready = true;
  }

  /** Skip rendering entirely while the canvas is off screen. */
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
    this.camera.fov = this.narrow ? 46 : 32;
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

  /** scroll progress 0..1 -> blend 0..4 across the five states, with a rest between moves */
  private stage(p: number) {
    const seg = (a: number, b: number) => smooth(clamp((p - a) / (b - a)));
    return seg(0.14, 0.24) + seg(0.36, 0.46) + seg(0.58, 0.68) + seg(0.8, 0.9);
  }

  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    if (!this.ready || !this.active || document.hidden) return;
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    const rm = this.opts.reduceMotion;
    this.p += (this.target - this.p) * (rm ? 1 : 1 - Math.exp(-dt * 5));
    this.ptrS.lerp(this.ptr, rm ? 0 : 1 - Math.exp(-dt * 3));

    const s = Math.min(4, this.stage(this.p));
    const k = Math.min(3, Math.floor(s));
    const f = s >= 4 ? 1 : s - k;

    // camera
    const piece = (arr: number[]) => {
      const kk = Math.min(arr.length - 2, Math.floor(s));
      return lerp(arr[kk], arr[kk + 1], s - kk);
    };
    const camY = piece([0.5, 9.6, 6.6, 5.2, 5.2]);
    const camZ = piece([9.6, 12.2, 10.8, 11.8, 12.0]) * (this.narrow ? 1.22 : 1);
    const lookY = piece([0, 0, 0.2, 1.3, 1.3]);
    this.camera.position.set(0, camY, camZ);
    this.camera.lookAt(0, lookY, 0);

    // group: sits to the right of the copy on desktop
    const gx = this.narrow ? 0 : piece([2.1, 2.0, 2.0, 2.0, 2.0]);
    this.group.position.set(gx, this.narrow ? 1.0 : 0, 0);
    this.group.scale.setScalar(this.narrow ? piece([0.7, 0.5, 0.45, 0.45, 0.45]) : piece([1, 0.74, 0.8, 0.8, 0.8]));
    this.group.rotation.y = piece([0.6, 0, 0, 0, 0]) + this.ptrS.x * 0.18 + (rm ? 0 : Math.sin(t * 0.25) * 0.07 * (1 - clamp(s)));
    this.group.rotation.x = this.ptrS.y * 0.04;

    const intro = rm ? 10 : t;
    const catColor = this.catColors;
    const baseSide = this.baseSide;
    const sortT = smooth(clamp(s - 1)) * (s > 2 ? 1 : 1);

    for (let i = 0; i < N; i++) {
      const m = this.plates[i];
      const a = this.layouts[k][i];
      const b = this.layouts[Math.min(4, k + 1)][i];
      const spread = (i * 0.618) % 1;
      const ti = smooth(clamp((f - spread * 0.4) / 0.6));
      m.position.set(lerp(a.pos.x, b.pos.x, ti), lerp(a.pos.y, b.pos.y, ti), lerp(a.pos.z, b.pos.z, ti));
      m.rotation.y = lerp(a.rotY, b.rotY, ti);
      m.rotation.x = lerp(a.tilt ?? 0, b.tilt ?? 0, ti);
      // arc the ember and the escalated plate on their trips
      if (i === this.ember && k >= 2) m.position.y += Math.sin(ti * Math.PI) * 0.5;
      if (i === this.escal && k === 3) m.position.y += Math.sin(ti * Math.PI) * 0.6;
      // intro: the stack settles from above
      const e = smooth(clamp((intro - 0.2 - i * 0.025) / 1.2));
      m.position.y += (1 - e) * 4.5;
      m.rotation.y += (1 - e) * 1.2;
      this.sideMats[i].color.copy(baseSide).lerp(catColor[this.catOf[i]], sortT * 0.85);
    }

    // runbook plates + evidence lines
    const ground = s <= 2 ? 0 : smooth(clamp(s - 2));
    const ep = this.plates[this.ember].position;
    const pa = this.linkGeo.getAttribute("position") as THREE.BufferAttribute;
    this.kb.forEach((m, n) => {
      const rise = smooth(clamp((ground - n * 0.12) / 0.7));
      m.visible = rise > 0.01;
      m.position.set(this.kbBase[n].x, this.kbBase[n].y - (1 - rise) * 2.2 + Math.sin(t * 0.8 + n) * 0.03 * rise, this.kbBase[n].z);
      m.rotation.y = (n - 1) * -0.12;
      m.rotation.x = 1.18 * rise;
      pa.setXYZ(n * 2, ep.x, ep.y + 0.04, ep.z);
      pa.setXYZ(n * 2 + 1, m.position.x, m.position.y - 0.45, m.position.z + 0.2);
      void n;
    });
    pa.needsUpdate = true;
    (this.links.material as THREE.LineBasicMaterial).opacity = ground * 0.85;
    this.links.visible = ground > 0.02;

    // tray + labels
    const decide = s <= 3 ? 0 : smooth(clamp(s - 3));
    (this.tray.material as THREE.MeshPhysicalMaterial).opacity = decide * 0.95;
    this.tray.visible = decide > 0.01;
    const pile = smooth(clamp((s - 1.55) / 0.45)) * (1 - smooth(clamp((s - 2.05) / 0.3)));
    CATEGORIES.forEach((_, i) => (this.labels["cat" + i].material.opacity = pile));
    this.labels.kb.material.opacity = smooth(clamp(ground - 0.5) * 2) * (1 - decide);
    this.labels.esc.material.opacity = smooth(clamp(s - 3.4) * 1.2);
    this.labels.esc.position.y = 2.75 + Math.sin(t * 1.2) * 0.03;

    this.renderer.render(this.scene, this.camera);
    if (!this.first) {
      this.first = true;
      this.onFirstFrame?.();
    }
  };
}
