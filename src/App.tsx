import {
  useState, useRef, useEffect, useCallback,
  ReactNode, CSSProperties, MouseEvent,
} from "react";

/* ─── Design Tokens ─── */
const C = {
  bg:           "#0e0e0e",
  card:         "#161616",
  border:       "#262626",
  borderAccent: "#3d7fff",
  accent:       "#3d7fff",
  accentSoft:   "#3d7fff22",
  accentGlow:   "#3d7fff44",
  text:         "#e8e8e8",
  textMuted:    "#666",
  textDim:      "#444",
  tag:          "#1e1e1e",
  wire:         "#3d7fff",
} as const;

/* ─── Shared Types ─── */
interface Vec2        { x: number; y: number; }
interface Project     { label: string; company: string; role: string; desc: string; tags: string[]; year: string; gradient: string; }
interface ContactItem { icon: string; label: string; sub: string; }

/* ═══════════════════════════════════════════════
   DRAG HOOK
═══════════════════════════════════════════════ */
function useDrag(init: Vec2): [Vec2, (e: MouseEvent<HTMLDivElement>) => void] {
  const [pos, setPos]  = useState<Vec2>(init);
  const dragging       = useRef<boolean>(false);
  const startMouse     = useRef<Vec2>({ x: 0, y: 0 });
  const startPos       = useRef<Vec2>(init);

  const onMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button,a,input,textarea,select")) return;
    dragging.current   = true;
    startMouse.current = { x: e.clientX, y: e.clientY };
    startPos.current   = { ...pos };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    const move = (e: globalThis.MouseEvent) => {
      if (!dragging.current) return;
      setPos({
        x: startPos.current.x + (e.clientX - startMouse.current.x),
        y: startPos.current.y + (e.clientY - startMouse.current.y),
      });
    };
    const up = () => { dragging.current = false; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup",   up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup",   up);
    };
  }, []);

  return [pos, onMouseDown];
}

/* ═══════════════════════════════════════════════
   PORT — connector dot
═══════════════════════════════════════════════ */
interface PortProps { side?: "left" | "right"; top?: string; color?: string; }

function Port({ side = "right", top = "50%", color = C.accent }: PortProps) {
  const sideStyle: CSSProperties = side === "right" ? { right: -5 } : { left: -5 };
  return (
    <div style={{
      position: "absolute", width: 9, height: 9,
      borderRadius: "50%", background: color,
      border: "2px solid #0e0e0e",
      boxShadow: `0 0 6px ${color}88`,
      top, transform: "translateY(-50%)",
      ...sideStyle, zIndex: 30,
    }} />
  );
}

/* ═══════════════════════════════════════════════
   WIRE — SVG bezier connector
═══════════════════════════════════════════════ */
interface WireProps { x1: number; y1: number; x2: number; y2: number; }

function Wire({ x1, y1, x2, y2 }: WireProps) {
  const mx = (x1 + x2) / 2;
  return (
    <path
      d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
      stroke={C.wire} strokeWidth={1.5} fill="none" strokeOpacity={0.55}
    />
  );
}

/* ═══════════════════════════════════════════════
   TAG chip
═══════════════════════════════════════════════ */
interface TagProps { children: ReactNode; accent?: boolean; }

function Tag({ children, accent = false }: TagProps) {
  return (
    <span style={{
      background:    accent ? C.accentSoft : C.tag,
      border:        `1px solid ${accent ? C.accent : C.border}`,
      borderRadius:  3, padding: "2px 7px",
      fontSize:      10, fontWeight: 500,
      color:         accent ? C.accent : C.textMuted,
      letterSpacing: "0.05em", textTransform: "uppercase",
      fontFamily:    "'DM Mono', monospace",
    }}>{children}</span>
  );
}

/* ═══════════════════════════════════════════════
   NODE shell
═══════════════════════════════════════════════ */
interface NodeProps {
  pos: Vec2;
  drag: (e: MouseEvent<HTMLDivElement>) => void;
  width?: number;
  label: string;
  icon: string;
  accent?: boolean;
  zIndex?: number;
  children: ReactNode;
}

function Node({ pos, drag, width = 300, label, icon, accent = false, zIndex = 10, children }: NodeProps) {
  return (
    <div onMouseDown={drag} style={{
      position: "absolute", left: pos.x, top: pos.y, width,
      background:   C.card,
      border:       `1px solid ${accent ? C.borderAccent : C.border}`,
      borderRadius: 10,
      boxShadow:    accent
        ? `0 0 0 1px ${C.accentGlow}, 0 12px 40px #00000088`
        : "0 4px 24px #00000066",
      cursor: "grab", userSelect: "none", zIndex,
      fontFamily: "'DM Sans', sans-serif",
      transition:   "box-shadow 0.2s",
      animation:    "nodeIn 0.5s cubic-bezier(.16,1,.3,1) both",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 14px", borderBottom: `1px solid ${C.border}`,
      }}>
        <span style={{ fontSize: 11, color: accent ? C.accent : C.textMuted }}>{icon}</span>
        <span style={{
          fontSize: 11, fontWeight: 500, color: C.textMuted,
          letterSpacing: "0.04em", textTransform: "uppercase",
          fontFamily: "'DM Mono', monospace",
        }}>{label}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#2e2e2e" }} />
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#e05252" }} />
        </div>
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCRIBBLE CANVAS — lissajous loops + travelling dots
═══════════════════════════════════════════════ */
function ScribbleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const STEPS = 300;

    const paths = [
      { ax: 0.38, ay: 0.28, fx: 1.0, fy: 2.0, px: 0,              py: Math.PI * 0.5, speed: 0.35, dotColor: "#e8d44d", dotR: 5 },
      { ax: 0.34, ay: 0.30, fx: 1.0, fy: 2.0, px: Math.PI * 0.55, py: Math.PI * 0.5, speed: 0.28, dotColor: "#a855f7", dotR: 7 },
      { ax: 0.36, ay: 0.26, fx: 1.0, fy: 2.0, px: Math.PI * 1.1,  py: Math.PI * 0.5, speed: 0.40, dotColor: "#e8d44d", dotR: 4 },
    ];
    const offsets = [
      { cx: W * 0.46, cy: H * 0.22 },
      { cx: W * 0.52, cy: H * 0.55 },
      { cx: W * 0.50, cy: H * 0.80 },
    ];

    const getPoint = (idx: number, t: number) => {
      const p = paths[idx], o = offsets[idx];
      return {
        x: o.cx + W * p.ax * Math.sin(p.fx * t + p.px),
        y: o.cy + H * p.ay * Math.sin(p.fy * t + p.py),
      };
    };

    let startTime: number | null = null;

    function draw(ts: number) {
      if (!startTime) startTime = ts;
      const elapsed = (ts - startTime) * 0.001;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#080808";
      ctx.fillRect(0, 0, W, H);

      const vgn = ctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, H*0.75);
      vgn.addColorStop(0, "rgba(0,0,0,0)");
      vgn.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = vgn;
      ctx.fillRect(0, 0, W, H);

      paths.forEach((p, idx) => {
        const tOffset = elapsed * p.speed;
        ctx.beginPath();
        for (let s = 0; s <= STEPS; s++) {
          const t  = (s / STEPS) * Math.PI * 2;
          const pt = getPoint(idx, t);
          s === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.strokeStyle = "rgba(220,220,220,0.65)";
        ctx.lineWidth   = 1.6;
        ctx.stroke();

        const tDot = (tOffset % 1) * Math.PI * 2;
        const dot  = getPoint(idx, tDot);
        const grd  = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, p.dotR * 3);
        grd.addColorStop(0, p.dotColor + "99");
        grd.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(dot.x, dot.y, p.dotR * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();
        ctx.beginPath(); ctx.arc(dot.x, dot.y, p.dotR, 0, Math.PI * 2);
        ctx.fillStyle = p.dotColor; ctx.fill();
      });

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas ref={canvasRef} width={325} height={200}
      style={{ display: "block", width: "100%", height: 200 }} />
  );
}

/* ═══════════════════════════════════════════════
   VIZ CANVAS — animated halftone panels
═══════════════════════════════════════════════ */
interface HalftonePanel {
  x: number; y: number; w: number; h: number;
  vx: number; vy: number;
  shape: "face" | "moon" | "plant" | "eye" | "figure";
  opacity: number;
}

function VizCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const timeRef   = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const DOT = 4;

    const panels: HalftonePanel[] = [
      { x: 18,  y: 14,  w: 72,  h: 72,  vx:  0.12, vy:  0.06, shape: "face",   opacity: 0.9  },
      { x: 58,  y: 44,  w: 90,  h: 90,  vx: -0.08, vy:  0.10, shape: "face",   opacity: 0.85 },
      { x: 110, y: 80,  w: 78,  h: 78,  vx:  0.07, vy: -0.09, shape: "face",   opacity: 0.8  },
      { x: 22,  y: 108, w: 60,  h: 52,  vx:  0.10, vy:  0.07, shape: "figure", opacity: 0.7  },
      { x: 68,  y: 130, w: 86,  h: 86,  vx: -0.06, vy: -0.08, shape: "plant",  opacity: 0.75 },
      { x: 20,  y: 160, w: 68,  h: 68,  vx:  0.09, vy: -0.06, shape: "face",   opacity: 0.8  },
      { x: 190, y: 20,  w: 110, h: 110, vx: -0.05, vy:  0.07, shape: "moon",   opacity: 0.95 },
      { x: 320, y: 18,  w: 62,  h: 58,  vx:  0.08, vy:  0.09, shape: "eye",    opacity: 0.8  },
      { x: 288, y: 120, w: 90,  h: 82,  vx: -0.09, vy: -0.06, shape: "plant",  opacity: 0.85 },
    ];

    function brightness(shape: HalftonePanel["shape"], nx: number, ny: number, t: number): number {
      const dx = nx - 0.5, dy = ny - 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      switch (shape) {
        case "moon": {
          if (dist >= 0.48) return 0;
          const crater = (x: number, y: number, r: number) =>
            Math.sqrt((nx - x) ** 2 + (ny - y) ** 2) < r ? 0.3 : 0;
          return Math.min(1,
            0.7 + 0.3 * Math.sin(nx * 18 + t * 0.3) * Math.cos(ny * 14)
            - crater(0.35, 0.3, 0.06) - crater(0.6, 0.55, 0.05) - crater(0.45, 0.65, 0.04)
          );
        }
        case "face": {
          const hd = Math.sqrt((dx / 0.38) ** 2 + (dy / 0.48) ** 2);
          if (hd > 1) return 0;
          const shade = 0.5 + 0.45 * (1 - hd);
          if (Math.sqrt((nx-0.35)**2+(ny-0.38)**2) < 0.08) return shade * 0.25;
          if (Math.sqrt((nx-0.65)**2+(ny-0.38)**2) < 0.08) return shade * 0.25;
          if (Math.abs(nx-0.5) < 0.06 && ny > 0.5 && ny < 0.65) return shade * 0.4;
          return shade;
        }
        case "eye": {
          if (Math.sqrt((dx/0.85)**2 + (dy/0.45)**2) >= 0.5) return 0;
          return dist < 0.18 ? 0.1 : 0.75 + 0.2 * Math.sin(t * 0.5);
        }
        case "plant": {
          const stem = Math.abs(nx - 0.5) < 0.05 ? 0.9 : 0;
          const leaf = (
            Math.sqrt((nx-0.3)**2+(ny-0.35)**2) < 0.22 ||
            Math.sqrt((nx-0.7)**2+(ny-0.5)**2)  < 0.20 ||
            Math.sqrt((nx-0.4)**2+(ny-0.65)**2) < 0.18
          ) ? 0.6 + 0.3 * Math.sin(nx * 10 + ny * 8) : 0;
          return Math.max(stem, leaf);
        }
        case "figure": {
          const head = Math.sqrt((nx-0.5)**2 + (ny-0.2)**2) < 0.15;
          const body = Math.abs(nx-0.5) < 0.18 && ny > 0.3 && ny < 0.75;
          const arms = Math.abs(ny-0.45) < 0.08 && nx > 0.2 && nx < 0.8;
          return (head || body || arms) ? 0.55 + 0.35 * Math.sin(ny * 12) : 0;
        }
        default: return 0;
      }
    }

    function drawPanel(panel: HalftonePanel, t: number) {
      const { x, y, w, h, shape, opacity } = panel;
      for (let px = 0; px < w; px += DOT) {
        for (let py = 0; py < h; py += DOT) {
          const b = brightness(shape, px / w, py / h, t);
          if (b <= 0.01) continue;
          const r    = DOT * 0.5 * b;
          const gray = Math.floor(180 * b + 40);
          ctx.beginPath();
          ctx.arc(x + px + DOT/2, y + py + DOT/2, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${gray},${gray},${gray},${opacity})`;
          ctx.fill();
        }
      }
    }

    function tick(ts: number) {
      const t = ts * 0.001;
      timeRef.current = t;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      panels.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -p.w * 0.3 || p.x > W - p.w * 0.7) p.vx *= -1;
        if (p.y < -p.h * 0.3 || p.y > H - p.h * 0.7) p.vy *= -1;
        drawPanel(p, t);
      });
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      for (let sy = 0; sy < H; sy += 3) ctx.fillRect(0, sy, W, 1);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas ref={canvasRef} width={420} height={230}
      style={{ display: "block", width: "100%", height: 230, borderRadius: "0 0 8px 8px" }} />
  );
}

interface VizNodeProps { pos: Vec2; drag: (e: MouseEvent<HTMLDivElement>) => void; }

function VizNode({ pos, drag }: VizNodeProps) {
  return (
    <div onMouseDown={drag} style={{
      position: "absolute", left: pos.x, top: pos.y, width: 420,
      background: "#000", border: `1px solid ${C.border}`, borderRadius: 10,
      boxShadow: "0 4px 32px #00000088",
      cursor: "grab", userSelect: "none", zIndex: 10,
      fontFamily: "'DM Sans', sans-serif", overflow: "hidden",
      animation: "nodeIn 0.5s cubic-bezier(.16,1,.3,1) both",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderBottom: "1px solid #1a1a1a", background: "#080808" }}>
        <span style={{ fontSize: 11, color: C.textMuted }}>◈</span>
        <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>2D Visualization</span>
        <span style={{ marginLeft: 8, fontSize: 9, color: "#333", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>halftone · live</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#1e1e1e" }} />
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#e05252" }} />
        </div>
      </div>
      <VizCanvas />
      <div style={{ padding: "7px 14px", borderTop: "1px solid #1a1a1a", background: "#060606", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <Tag>Generative</Tag><Tag>Halftone</Tag><Tag>Canvas API</Tag>
        </div>
        <span style={{ fontSize: 9, color: "#333", fontFamily: "'DM Mono', monospace" }}>● REC</span>
      </div>
      <Port side="left" top="45%" />
      <Port side="right" top="45%" />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PROJECT NODE
═══════════════════════════════════════════════ */
interface ProjectNodeProps extends Project { pos: Vec2; index: number; }

function ProjectNode({ pos: initPos, label, company, role, desc, tags, year, gradient, index }: ProjectNodeProps) {
  const [pos, drag]             = useDrag(initPos);
  const [expanded, setExpanded] = useState<boolean>(false);
  const delay = `${index * 0.08}s`;

  return (
    <div onMouseDown={drag} style={{
      position: "absolute", left: pos.x, top: pos.y, width: 252,
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
      boxShadow: "0 4px 24px #00000066",
      cursor: "grab", userSelect: "none", zIndex: 10,
      fontFamily: "'DM Sans', sans-serif",
      animation: `nodeIn 0.5s ${delay} cubic-bezier(.16,1,.3,1) both`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 11, color: C.textMuted }}>◈</span>
        <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>{company}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#2e2e2e" }} />
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#e05252" }} />
        </div>
      </div>

      <div style={{ height: 130, background: gradient, display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-end", padding: "12px 14px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${C.border}22 1px,transparent 1px),linear-gradient(90deg,${C.border}22 1px,transparent 1px)`, backgroundSize: "20px 20px" }} />
        <span style={{ fontSize: 10, color: "#ffffff44", position: "absolute", top: 10, right: 12, fontFamily: "'DM Mono', monospace" }}>{year}</span>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em", position: "relative" }}>{label}</div>
        <div style={{ fontSize: 10, color: "#ffffff66", marginTop: 2, position: "relative" }}>{role}</div>
      </div>

      <div style={{ display: "flex", gap: 4, padding: "8px 12px", flexWrap: "wrap", borderBottom: `1px solid ${C.border}` }}>
        {tags.map(t => <Tag key={t}>{t}</Tag>)}
      </div>

      <div style={{ padding: "10px 14px 4px" }}>
        <p style={{
          fontSize: 11.5, color: C.textMuted, margin: 0, lineHeight: 1.65,
          ...(expanded ? {} : { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }),
        }}>{desc}</p>
      </div>

      <div style={{ padding: "6px 14px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => setExpanded(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: C.accent, fontSize: 10, fontFamily: "'DM Mono', monospace", padding: 0, letterSpacing: "0.04em" }}>
          {expanded ? "↑ less" : "↓ more"}
        </button>
        <span style={{ fontSize: 10, color: C.textDim, fontFamily: "'DM Mono', monospace" }}>case study →</span>
      </div>

      <Port side="left" top="50%" />
      <Port side="right" top="50%" />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PASTA CARD — single plate, click to switch
═══════════════════════════════════════════════ */
type PastaType = "cacio" | "lasagna" | "rigatoni" | "pesto" | "arrabbiata";

interface PastaInfo { key: PastaType; name: string; sub: string; emoji: string; pastaAccent: string; }

const PASTAS: PastaInfo[] = [
  { key: "cacio",      name: "Cacio e Pepe",    sub: "Rome's finest · pecorino + pepper",  emoji: "🍝", pastaAccent: "#c8943a" },
  { key: "lasagna",    name: "Lasagna",          sub: "Slow-baked · bolognese + béchamel",  emoji: "🫕", pastaAccent: "#b8402a" },
  { key: "rigatoni",   name: "Rigatoni",         sub: "Tubular · ridged · saucy",           emoji: "🍜", pastaAccent: "#c07830" },
  { key: "pesto",      name: "Pesto Fusilli",    sub: "Genovese basil · pine nuts · EVOO",  emoji: "🌿", pastaAccent: "#3a8840" },
  { key: "arrabbiata", name: "Penne Arrabbiata", sub: "Angry pasta · chilli · garlic",      emoji: "🌶️", pastaAccent: "#c03020" },
];

const PASTA_BG: Record<PastaType, string> = {
  cacio:      "#fdf6e8",
  lasagna:    "#fdf0ec",
  rigatoni:   "#fdf8ee",
  pesto:      "#eef6ec",
  arrabbiata: "#fdf0ee",
};

interface SinglePastaCanvasProps { type: PastaType; flash: boolean; }

function SinglePastaCanvas({ type, flash }: SinglePastaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const typeRef   = useRef<PastaType>(type);
  const flashRef  = useRef<number>(0);

  useEffect(() => { typeRef.current = type; }, [type]);
  useEffect(() => { if (flash) flashRef.current = 1.0; }, [flash]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, PR = 120;

    function drawPlate(r: number) {
      const shadow = ctx.createRadialGradient(cx+6, cy+10, r*0.3, cx+6, cy+10, r*1.3);
      shadow.addColorStop(0, "rgba(0,0,0,0.18)");
      shadow.addColorStop(1, "transparent");
      ctx.beginPath(); ctx.arc(cx+6, cy+10, r*1.1, 0, Math.PI*2);
      ctx.fillStyle = shadow; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.fillStyle = "#f8f8f5"; ctx.fill();
      ctx.strokeStyle = "#e0ddd5"; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, r*0.88, 0, Math.PI*2);
      ctx.strokeStyle = "#ece9e0"; ctx.lineWidth = 1; ctx.stroke();
    }

    function cacio(t: number) {
      drawPlate(PR);
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, PR*0.86, 0, Math.PI*2); ctx.clip();
      const sauce = ctx.createRadialGradient(cx, cy, 0, cx, cy, PR*0.7);
      sauce.addColorStop(0, "#f0e4b8"); sauce.addColorStop(1, "#e8d490");
      ctx.fillStyle = sauce; ctx.fillRect(cx-PR, cy-PR, PR*2, PR*2);
      for (let i = 0; i < 10; i++) {
        const ba = (i/10)*Math.PI*2 + t*0.25;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        for (let s = 1; s <= 60; s++) {
          const st = s/60, ang = ba + st*Math.PI*2.8, rad = st*PR*0.78;
          ctx.lineTo(cx + Math.cos(ang)*rad, cy + Math.sin(ang)*rad);
        }
        ctx.strokeStyle = `rgba(215,185,100,${0.55+0.3*Math.sin(i*1.3)})`;
        ctx.lineWidth = 2.2; ctx.stroke();
      }
      for (let i = 0; i < 28; i++) {
        const a = i*137.5*Math.PI/180, r2 = (0.2+(i%5)*0.12)*PR*0.75;
        ctx.beginPath(); ctx.arc(cx+Math.cos(a)*r2, cy+Math.sin(a)*r2, 1.5, 0, Math.PI*2);
        ctx.fillStyle = "#2a2020"; ctx.fill();
      }
      ctx.restore();
    }

    function lasagna(t: number) {
      drawPlate(PR);
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, PR*0.86, 0, Math.PI*2); ctx.clip();
      const bw = PR*1.4, bh = PR*0.9, bx = cx-bw/2, by = cy-bh/2;
      ctx.fillStyle = "#b83020"; ctx.fillRect(bx, by, bw, bh);
      (["#d4a050","#882818","#d4a050","#f0ecd8","#e8c870"] as string[]).forEach((col, i) => {
        ctx.fillStyle = col; ctx.fillRect(bx, by+i*(bh/5), bw, (bh/5)*0.72);
      });
      ctx.fillStyle = "rgba(255,250,230,0.88)"; ctx.fillRect(bx, by+bh*0.68, bw, bh*0.32);
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.arc(bx+(i/12)*bw+Math.sin(t+i)*4, by+bh*0.75+Math.cos(t*0.7+i)*4, 4+Math.sin(t*0.5+i)*2, 0, Math.PI*2);
        ctx.fillStyle = `rgba(240,220,150,${0.4+0.3*Math.sin(i)})`; ctx.fill();
      }
      ctx.fillStyle = "#2a7030";
      for (let i = 0; i < 5; i++) {
        const la = (i/5)*Math.PI - Math.PI*0.5;
        ctx.beginPath(); ctx.ellipse(cx+Math.cos(la)*10, cy-bh*0.2+Math.sin(la)*8, 7, 4, la, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore(); void t;
    }

    function rigatoni(t: number) {
      drawPlate(PR);
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, PR*0.86, 0, Math.PI*2); ctx.clip();
      ctx.fillStyle = "rgba(180,55,25,0.2)"; ctx.fillRect(cx-PR, cy-PR, PR*2, PR*2);
      const tp: Array<[number,number]> = [[0,-0.45],[0.35,-0.3],[-0.35,-0.25],[0.5,0.05],[-0.45,0.1],[0.2,0.35],[-0.2,0.4],[0,0.12],[0.38,0.42],[-0.5,0.38]];
      tp.forEach(([px, py], i) => {
        ctx.save();
        ctx.translate(cx+px*PR*0.82, cy+py*PR*0.82);
        ctx.rotate((i*0.7 + t*0.1) % (Math.PI*2));
        ctx.fillStyle = "#d4a855"; ctx.fillRect(-6.5, -15, 13, 30);
        for (let r2 = 0; r2 < 5; r2++) { ctx.fillStyle = "rgba(160,110,30,0.4)"; ctx.fillRect(-6.5, -15+r2*6, 13, 2); }
        ctx.beginPath(); ctx.ellipse(0, -15, 6.5, 2.6, 0, 0, Math.PI*2); ctx.fillStyle = "#7a5015"; ctx.fill();
        ctx.beginPath(); ctx.ellipse(0,  15, 6.5, 2.6, 0, 0, Math.PI*2); ctx.fillStyle = "#9a6820"; ctx.fill();
        ctx.restore();
      });
      ctx.fillStyle = "rgba(180,55,25,0.35)";
      ctx.beginPath(); ctx.arc(cx, cy, PR*0.5, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }

    function pesto(t: number) {
      drawPlate(PR);
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, PR*0.86, 0, Math.PI*2); ctx.clip();
      const pg = ctx.createRadialGradient(cx, cy, 0, cx, cy, PR*0.8);
      pg.addColorStop(0, "rgba(60,120,50,0.5)"); pg.addColorStop(1, "rgba(40,90,30,0.2)");
      ctx.fillStyle = pg; ctx.fillRect(cx-PR, cy-PR, PR*2, PR*2);
      for (let i = 0; i < 9; i++) {
        const a = (i/9)*Math.PI*2;
        ctx.save(); ctx.translate(cx+Math.cos(a)*PR*0.45, cy+Math.sin(a)*PR*0.45);
        ctx.beginPath();
        for (let s = 0; s <= 40; s++) {
          const st = s/40, spiral = st*Math.PI*5 + t*0.4 + i, sr = st*18;
          s===0 ? ctx.moveTo(Math.cos(spiral)*sr, Math.sin(spiral)*sr*0.5)
                : ctx.lineTo(Math.cos(spiral)*sr, Math.sin(spiral)*sr*0.5);
        }
        ctx.strokeStyle = "#c8a830"; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.restore();
      }
      for (let i = 0; i < 5; i++) {
        const a = (i/5)*Math.PI*2 + t*0.05;
        ctx.save(); ctx.translate(cx+Math.cos(a)*PR*0.25, cy+Math.sin(a)*PR*0.25); ctx.rotate(a);
        ctx.beginPath(); ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI*2); ctx.fillStyle = "#2a8030"; ctx.fill();
        ctx.restore();
      }
      for (let i = 0; i < 15; i++) {
        const a = i*137.5*Math.PI/180, r2 = (0.1+(i%6)*0.08)*PR*0.75;
        ctx.beginPath(); ctx.ellipse(cx+Math.cos(a)*r2, cy+Math.sin(a)*r2, 4, 2.5, a, 0, Math.PI*2);
        ctx.fillStyle = "#d4b060"; ctx.fill();
      }
      ctx.restore();
    }

    function arrabbiata(t: number) {
      drawPlate(PR);
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, PR*0.86, 0, Math.PI*2); ctx.clip();
      const ag = ctx.createRadialGradient(cx, cy, 0, cx, cy, PR*0.85);
      ag.addColorStop(0, "rgba(200,40,20,0.6)"); ag.addColorStop(1, "rgba(150,20,10,0.3)");
      ctx.fillStyle = ag; ctx.fillRect(cx-PR, cy-PR, PR*2, PR*2);
      const pp: Array<[number,number,number]> = [[0,-0.4,0.3],[-0.35,-0.2,-0.4],[0.38,-0.15,0.6],[-0.1,0.15,0.1],[0.3,0.3,-0.5],[-0.4,0.35,0.8],[0.1,-0.1,1.0],[-0.2,-0.4,-0.2],[0.45,0.1,0.4]];
      pp.forEach(([px, py, ra]) => {
        ctx.save(); ctx.translate(cx+px*PR*0.82, cy+py*PR*0.82); ctx.rotate(ra + t*0.05);
        ctx.beginPath();
        ctx.moveTo(-5,-8); ctx.lineTo(5,-14); ctx.lineTo(5,14); ctx.lineTo(-5,8); ctx.closePath();
        ctx.fillStyle = "#e8c070"; ctx.fill(); ctx.strokeStyle = "#b89040"; ctx.lineWidth = 0.8; ctx.stroke();
        for (let r2 = 0; r2 < 4; r2++) { ctx.fillStyle = "rgba(150,100,20,0.35)"; ctx.fillRect(-5,-8+r2*5.5,10,1.5); }
        ctx.restore();
      });
      for (let i = 0; i < 20; i++) {
        const a = i*83.7*Math.PI/180, r2 = (0.15+(i%7)*0.09)*PR*0.78;
        ctx.save(); ctx.translate(cx+Math.cos(a)*r2, cy+Math.sin(a)*r2); ctx.rotate(a);
        ctx.fillStyle = `rgba(200,30,10,${0.5+0.4*Math.sin(i)})`; ctx.fillRect(-2,-4,4,8);
        ctx.restore();
      }
      for (let i = 0; i < 3; i++) {
        const sx = cx + (i-1)*30;
        ctx.beginPath(); ctx.moveTo(sx, cy-PR*0.7);
        for (let s = 0; s <= 20; s++) {
          const st = s/20;
          ctx.lineTo(sx + Math.sin(st*Math.PI*2+t+i)*6, cy-PR*0.7-st*25);
        }
        ctx.strokeStyle = `rgba(255,255,255,${0.15+0.1*Math.sin(t*2+i)})`; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.restore();
    }

    function drawAll(t: number) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = PASTA_BG[typeRef.current];
      ctx.fillRect(0, 0, W, H);
      if      (typeRef.current === "cacio")      cacio(t);
      else if (typeRef.current === "lasagna")    lasagna(t);
      else if (typeRef.current === "rigatoni")   rigatoni(t);
      else if (typeRef.current === "pesto")      pesto(t);
      else if (typeRef.current === "arrabbiata") arrabbiata(t);
      if (flashRef.current > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flashRef.current * 0.6})`;
        ctx.fillRect(0, 0, W, H);
        flashRef.current = Math.max(0, flashRef.current - 0.06);
      }
    }

    let start: number | null = null;
    function tick(ts: number) {
      if (!start) start = ts;
      drawAll((ts - start) * 0.001);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas ref={canvasRef} width={340} height={340}
      style={{ display: "block", width: "100%", height: 340 }} />
  );
}

interface PastaNodeProps { pos: Vec2; drag: (e: MouseEvent<HTMLDivElement>) => void; }

function PastaNode({ pos, drag }: PastaNodeProps) {
  const [idx, setIdx]     = useState<number>(0);
  const [flash, setFlash] = useState<boolean>(false);
  const current           = PASTAS[idx];
  const ac                = current.pastaAccent;

  const switchTo = (i: number) => {
    setFlash(true);
    setTimeout(() => setFlash(false), 50);
    setIdx(i);
  };

  return (
    <div onMouseDown={drag} style={{
      position: "absolute", left: pos.x, top: pos.y, width: 340,
      background: PASTA_BG[current.key],
      border: `1.5px solid ${ac}44`,
      borderRadius: 14,
      boxShadow: `0 8px 40px ${ac}22, 0 2px 8px #00000022`,
      cursor: "grab", userSelect: "none", zIndex: 50,
      fontFamily: "'DM Sans', sans-serif", overflow: "hidden",
      transition: "background 0.4s, border-color 0.4s, box-shadow 0.4s",
      animation: "nodeIn 0.5s cubic-bezier(.16,1,.3,1) both",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: `1px solid ${ac}22` }}>
        <span style={{ fontSize: 13 }}>{current.emoji}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: ac, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Pasta Lover</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: ac + "44" }} />
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#e05252" }} />
        </div>
      </div>

      <div style={{ position: "relative", cursor: "pointer" }} onClick={() => switchTo((idx+1)%PASTAS.length)}>
        <SinglePastaCanvas type={current.key} flash={flash} />
        <div style={{ position: "absolute", bottom: 10, right: 12, fontSize: 9, color: ac+"99", fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em", textTransform: "uppercase", pointerEvents: "none" }}>tap to change →</div>
      </div>

      <div style={{ padding: "10px 14px 12px", borderTop: `1px solid ${ac}22`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: ac, letterSpacing: "-0.01em", transition: "color 0.3s" }}>{current.name}</div>
          <div style={{ fontSize: 10, color: ac+"99", marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{current.sub}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={e => { e.stopPropagation(); switchTo((idx-1+PASTAS.length)%PASTAS.length); }}
              style={{ width: 26, height: 26, borderRadius: "50%", border: `1px solid ${ac}44`, background: "transparent", cursor: "pointer", color: ac, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace" }}>‹</button>
            <button onClick={e => { e.stopPropagation(); switchTo((idx+1)%PASTAS.length); }}
              style={{ width: 26, height: 26, borderRadius: "50%", border: `1px solid ${ac}44`, background: "transparent", cursor: "pointer", color: ac, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace" }}>›</button>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {PASTAS.map((_, i) => (
              <div key={i} onClick={e => { e.stopPropagation(); switchTo(i); }}
                style={{ width: i===idx ? 16 : 6, height: 6, borderRadius: 3, background: i===idx ? ac : ac+"33", cursor: "pointer", transition: "width 0.3s, background 0.3s" }} />
            ))}
          </div>
        </div>
      </div>

      <Port side="left" top="50%" color={ac} />
      <Port side="right" top="50%" color={ac} />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════ */
export default function App() {
  const [profilePos,    profileDrag]    = useDrag({ x: 50,   y: 100 });
  const [aboutPos,      aboutDrag]      = useDrag({ x: 50,   y: 420 });
  const [philosophyPos, philosophyDrag] = useDrag({ x: 390,  y: 70  });
  const [aiPos,         aiDrag]         = useDrag({ x: 390,  y: 450 });
  const [expPos,        expDrag]        = useDrag({ x: 760,  y: 180 });
  const [writingPos,    writingDrag]    = useDrag({ x: 760,  y: 540 });
  const [contactPos,    contactDrag]    = useDrag({ x: 1100, y: 260 });
  const [pastaPos,      pastaDrag]      = useDrag({ x: 560,  y: 240 });

  const projects: Project[] = [
    {
      label: "JavaAI IDE", company: "JavaAI", role: "Product Designer · MVP → V1",
      desc:  "Built and shipped the MVP and V1 of an AI code editor (IDE) for developer interaction with AI-generated code operations. Designed the full interaction model for human–AI collaboration inside a live coding environment.",
      tags: ["AI/ML","Dev Tools","0→1","IDE"], year: "2024",
      gradient: "linear-gradient(140deg,#0d1520,#0a1e35,#071628)",
    },
    {
      label: "Data Pipeline Platform", company: "eBay", role: "Product Designer · Redesign",
      desc:  "Redesigned the B2B data pipeline platform to improve tool discoverability. Tackled information architecture and navigation patterns for power users managing complex data workflows at scale.",
      tags: ["B2B","Data","IA","Redesign"], year: "2023",
      gradient: "linear-gradient(140deg,#1a1200,#2b1e00,#1a1400)",
    },
    {
      label: "Creator Discovery", company: "TikTok", role: "Product Designer · Two-sided Marketplace",
      desc:  "Redesigned the creator discovery flow for TikTok's two-sided creator marketplace — balancing discoverability needs of both creators seeking brand deals and brands seeking authentic voices.",
      tags: ["Marketplace","Social","Discovery","UX"], year: "2023",
      gradient: "linear-gradient(140deg,#0f0016,#1a0028,#0a0014)",
    },
    {
      label: "Enterprise Design System", company: "Colgate-Palmolive", role: "Design Strategist · Systems",
      desc:  "Adopted and scaled enterprise design system for AI workflows across product teams. Ensured design consistency while accommodating the unique interaction patterns that emerge in AI-assisted enterprise tools.",
      tags: ["Design System","Enterprise","AI","Scale"], year: "2022",
      gradient: "linear-gradient(140deg,#001a10,#002a18,#001510)",
    },
  ];

  const contacts: ContactItem[] = [
    { icon: "✉", label: "miaolanzhang1101@gmail.com",        sub: "email"     },
    { icon: "◈", label: "miaolanzhang.notion.site/portfolio", sub: "portfolio" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Mono:wght@400;500&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; overflow: hidden; }
        ::-webkit-scrollbar { display: none; }
        @keyframes nodeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div style={{
        position: "fixed", inset: 0,
        background: C.bg,
        backgroundImage: `radial-gradient(${C.border} 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
        overflow: "hidden",
      }}>
        {/* Ambient glow */}
        <div style={{ position: "fixed", top: "20%", left: "40%", width: 600, height: 400, background: `radial-gradient(ellipse,${C.accent}08 0%,transparent 70%)`, pointerEvents: "none", zIndex: 1 }} />

        {/* Wire layer */}
        <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 5 }}>
          <Wire x1={profilePos.x+305}    y1={profilePos.y+80}     x2={philosophyPos.x-4} y2={philosophyPos.y+90}  />
          <Wire x1={profilePos.x+305}    y1={profilePos.y+140}    x2={aboutPos.x+152}    y2={aboutPos.y-4}        />
          <Wire x1={philosophyPos.x+152} y1={philosophyPos.y+240} x2={aiPos.x+152}       y2={aiPos.y-4}           />
          <Wire x1={philosophyPos.x+325} y1={philosophyPos.y+90}  x2={expPos.x-4}        y2={expPos.y+80}         />
          <Wire x1={aiPos.x+325}         y1={aiPos.y+80}          x2={writingPos.x-4}    y2={writingPos.y+60}     />
          <Wire x1={expPos.x+305}        y1={expPos.y+80}         x2={contactPos.x-4}    y2={contactPos.y+80}     />
          <Wire x1={writingPos.x+305}    y1={writingPos.y+60}     x2={contactPos.x-4}    y2={contactPos.y+140}    />
        </svg>

        {/* Pasta card — front and centre, zIndex 50 */}
        <PastaNode pos={pastaPos} drag={pastaDrag} />

        {/* Identity */}
        <Node pos={profilePos} drag={profileDrag} label="Identity" icon="◉" accent width={305} zIndex={20}>
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: C.text, letterSpacing: "-0.03em", fontFamily: "'Lora', serif" }}>Miao Lan Zhang</div>
              <div style={{ fontSize: 11, color: C.accent, fontWeight: 500, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>Product Designer · Builder · Strategist</div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              <Tag accent>AI Design</Tag>
              <Tag>Systems Thinking</Tag>
              <Tag>Strategy</Tag>
              <Tag>Prototyping</Tag>
              <Tag>Research</Tag>
            </div>
          </div>
          <Port side="right" top="40%" />
          <Port side="right" top="72%" />
        </Node>

        {/* About */}
        <Node pos={aboutPos} drag={aboutDrag} label="About" icon="✦" width={305}>
          <div style={{ padding: "14px 16px 16px" }}>
            <p style={{ fontSize: 12, color: C.text, lineHeight: 1.8, marginBottom: 10 }}>
              Hello! 👋🏻 I'm a product designer,{" "}
              <span style={{ color: C.accent, fontStyle: "italic", fontFamily: "'Lora', serif" }}>builder</span>
              , and design strategist working on a variety of software projects.
            </p>
            <p style={{ fontSize: 11.5, color: C.textMuted, lineHeight: 1.75 }}>
              I don't have a clean label. I enjoy building. I enjoy experimenting. I enjoy thinking.
              What I carry is a stubborn belief that the{" "}
              <span style={{ color: C.text }}>emotional layer of a product carries weight</span>.
            </p>
          </div>
        </Node>

        {/* Philosophy */}
        <Node pos={philosophyPos} drag={philosophyDrag} label="Philosophy" icon="◎" width={325} zIndex={15}>
          <div style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 13, fontFamily: "'Lora', serif", fontStyle: "italic", color: C.text, lineHeight: 1.7, paddingLeft: 12, borderLeft: `2px solid ${C.accent}` }}>
              "I've always been more interested in the <em>why</em> behind things than the what."
            </div>
          </div>
          <Port side="left" top="40%" />
          <Port side="right" top="40%" />
        </Node>

        {/* AI × Design */}
        <Node pos={aiPos} drag={aiDrag} label="AI × Design" icon="⬡" width={325} accent>
          <div style={{ overflow: "hidden", borderRadius: "0 0 9px 9px" }}>
            <ScribbleCanvas />
          </div>
          <div style={{ padding: "8px 14px 10px", borderTop: `1px solid ${C.accent}33`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: C.accent, fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em", textTransform: "uppercase" }}>Agentic Systems · Epistemic Design</span>
            <span style={{ fontSize: 9, color: C.accent + "99", fontFamily: "'DM Mono', monospace" }}>● live</span>
          </div>
          <Port side="left" top="50%" />
          <Port side="right" top="50%" />
        </Node>

        {/* 2D Visualization */}
        <VizNode pos={expPos} drag={expDrag} />

        {/* Writing */}
        <Node pos={writingPos} drag={writingDrag} label="Writing" icon="✎" width={305}>
          <div style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 13, fontFamily: "'Lora', serif", fontStyle: "italic", color: C.textMuted, lineHeight: 1.8, marginBottom: 12 }}>
              "Outside of design, I write literary fiction — stories that explore the same things I care about in products: how people make sense of uncertainty, how trust forms in the dark."
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Tag>Literary Fiction</Tag><Tag>Narrative</Tag><Tag>Epistemic Trust</Tag>
            </div>
          </div>
          <Port side="left" top="50%" />
          <Port side="right" top="50%" />
        </Node>

        {/* Contact */}
        <Node pos={contactPos} drag={contactDrag} label="Contact" icon="↗" width={255}>
          <div style={{ padding: "12px 14px 14px" }}>
            {contacts.map((l, i) => (
              <div key={l.sub} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < contacts.length-1 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ color: C.accent, fontSize: 13, width: 16, flexShrink: 0 }}>{l.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: C.text }}>{l.label}</div>
                  <div style={{ fontSize: 9, color: C.textDim, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}>{l.sub}</div>
                </div>
              </div>
            ))}
          </div>
          <Port side="left" top="35%" />
          <Port side="left" top="65%" />
        </Node>

        {/* Project nodes */}
        {projects.map((p, i) => (
          <ProjectNode key={p.label} pos={{ x: 50+i*278, y: 780 }} index={i} {...p} />
        ))}

        {/* Canvas label */}
        <div style={{ position: "fixed", bottom: 20, left: 20, fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.textDim, letterSpacing: "0.12em", zIndex: 1, userSelect: "none", textTransform: "uppercase" }}>
          Miao Lan Zhang · Portfolio Canvas · Drag to explore
        </div>

        {/* Zoom controls */}
        <div style={{ position: "fixed", bottom: 20, right: 20, display: "flex", gap: 6, zIndex: 100 }}>
          {(["−","⊕","+"] as const).map(b => (
            <button key={b} style={{ width: 30, height: 30, background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMuted, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace" }}>{b}</button>
          ))}
        </div>

        {/* Node count */}
        <div style={{ position: "fixed", top: 20, right: 20, background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 12px", fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.textMuted, zIndex: 100 }}>
          11 nodes · 7 connections
        </div>
      </div>
    </>
  );
}