import { useState, useRef, useEffect, useCallback, ReactNode, CSSProperties, MouseEvent } from "react";

/* ─── Design Tokens ─── */
const C = {
  bg: "#0e0e0e",
  card: "#161616",
  cardHover: "#1c1c1c",
  border: "#262626",
  borderAccent: "#3d7fff",
  accent: "#3d7fff",
  accentSoft: "#3d7fff22",
  accentGlow: "#3d7fff44",
  text: "#e8e8e8",
  textMuted: "#666",
  textDim: "#444",
  tag: "#1e1e1e",
  wire: "#3d7fff",
} as const;

/* ─── Types ─── */
interface Vec2 {
  x: number;
  y: number;
}

interface Project {
  label: string;
  company: string;
  role: string;
  desc: string;
  tags: string[];
  year: string;
  gradient: string;
}

interface ContactItem {
  icon: string;
  label: string;
  sub: string;
}

/* ─── Drag hook ─── */
function useDrag(init: Vec2): [Vec2, (e: MouseEvent<HTMLDivElement>) => void] {
  const [pos, setPos] = useState<Vec2>(init);
  const dragging = useRef<boolean>(false);
  const startMouse = useRef<Vec2>({ x: 0, y: 0 });
  const startPos = useRef<Vec2>(init);

  const onMouseDown = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("button,a,input,textarea,select")) return;
      dragging.current = true;
      startMouse.current = { x: e.clientX, y: e.clientY };
      startPos.current = { ...pos };
      e.preventDefault();
    },
    [pos]
  );

  useEffect(() => {
    const move = (e: globalThis.MouseEvent) => {
      if (!dragging.current) return;
      setPos({
        x: startPos.current.x + (e.clientX - startMouse.current.x),
        y: startPos.current.y + (e.clientY - startMouse.current.y),
      });
    };
    const up = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  return [pos, onMouseDown];
}

/* ─── Port (connector dot) ─── */
interface PortProps {
  side?: "left" | "right";
  top?: string;
  color?: string;
}

function Port({ side = "right", top = "50%", color = C.accent }: PortProps) {
  const sideStyle: CSSProperties = side === "right" ? { right: -5 } : { left: -5 };
  return (
    <div
      style={{
        position: "absolute",
        width: 9,
        height: 9,
        borderRadius: "50%",
        background: color,
        border: "2px solid #0e0e0e",
        boxShadow: `0 0 6px ${color}88`,
        top,
        transform: "translateY(-50%)",
        ...sideStyle,
        zIndex: 30,
      }}
    />
  );
}

/* ─── SVG Wire ─── */
interface WireProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function Wire({ x1, y1, x2, y2 }: WireProps) {
  const cx = (x1 + x2) / 2;
  return (
    <path
      d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
      stroke={C.wire}
      strokeWidth={1.5}
      fill="none"
      strokeOpacity={0.55}
    />
  );
}

/* ─── Tag ─── */
interface TagProps {
  children: ReactNode;
  accent?: boolean;
}

function Tag({ children, accent = false }: TagProps) {
  return (
    <span
      style={{
        background: accent ? C.accentSoft : C.tag,
        border: `1px solid ${accent ? C.accent : C.border}`,
        borderRadius: 3,
        padding: "2px 7px",
        fontSize: 10,
        fontWeight: 500,
        color: accent ? C.accent : C.textMuted,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {children}
    </span>
  );
}

/* ─── Node shell ─── */
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
    <div
      onMouseDown={drag}
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width,
        background: C.card,
        border: `1px solid ${accent ? C.borderAccent : C.border}`,
        borderRadius: 10,
        boxShadow: accent
          ? `0 0 0 1px ${C.accentGlow}, 0 12px 40px #00000088`
          : "0 4px 24px #00000066",
        cursor: "grab",
        userSelect: "none",
        zIndex,
        fontFamily: "'DM Sans', sans-serif",
        transition: "box-shadow 0.2s",
        animation: "nodeIn 0.5s cubic-bezier(.16,1,.3,1) both",
      }}
    >
      {/* Node header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 14px",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <span style={{ fontSize: 11, color: accent ? C.accent : C.textMuted }}>{icon}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: C.textMuted,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {label}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#2e2e2e" }} />
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#e05252" }} />
        </div>
      </div>
      {children}
    </div>
  );
}

/* ─── Stat pill ─── */
interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div
      style={{
        background: "#1a1a1a",
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        padding: "8px 12px",
        flex: 1,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, color: C.accent, fontFamily: "'DM Mono', monospace" }}>
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          color: C.textMuted,
          marginTop: 2,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCRIBBLE CANVAS — looping wave paths + dots
   inspired by the blue phone screen sketch
═══════════════════════════════════════════════ */
function ScribbleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Three lissajous-style looping paths
    const paths = [
      { ax: 0.38, ay: 0.28, fx: 1.0, fy: 2.0, px: 0,        py: Math.PI * 0.5, speed: 0.35, dotColor: "#e8d44d", dotR: 5 },
      { ax: 0.34, ay: 0.30, fx: 1.0, fy: 2.0, px: Math.PI * 0.55, py: Math.PI * 0.5, speed: 0.28, dotColor: "#a855f7", dotR: 7 },
      { ax: 0.36, ay: 0.26, fx: 1.0, fy: 2.0, px: Math.PI * 1.1,  py: Math.PI * 0.5, speed: 0.40, dotColor: "#e8d44d", dotR: 4 },
    ];

    // Vertical offsets so the three loops are staggered down the canvas
    const offsets = [
      { cx: W * 0.46, cy: H * 0.22 },
      { cx: W * 0.52, cy: H * 0.55 },
      { cx: W * 0.50, cy: H * 0.80 },
    ];

    // Pre-sample each path into points for smooth drawing
    const STEPS = 300;
    const getPoint = (idx: number, t: number) => {
      const p = paths[idx];
      const o = offsets[idx];
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
      // black background
      ctx.fillStyle = "#080808";
      ctx.fillRect(0, 0, W, H);

      // subtle vignette
      const vgn = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75);
      vgn.addColorStop(0, "rgba(0,0,0,0)");
      vgn.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = vgn;
      ctx.fillRect(0, 0, W, H);

      paths.forEach((p, idx) => {
        const tOffset = elapsed * p.speed;

        // draw the full loop as a path
        ctx.beginPath();
        for (let s = 0; s <= STEPS; s++) {
          const t = (s / STEPS) * Math.PI * 2;
          const pt = getPoint(idx, t);
          s === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.strokeStyle = "rgba(220,220,220,0.65)";
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // travelling dot position along the loop
        const tDot = ((tOffset % 1) * Math.PI * 2);
        const dot = getPoint(idx, tDot);

        // outer glow
        const grd = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, p.dotR * 3);
        grd.addColorStop(0, p.dotColor + "99");
        grd.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, p.dotR * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // solid dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, p.dotR, 0, Math.PI * 2);
        ctx.fillStyle = p.dotColor;
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={325}
      height={200}
      style={{ display: "block", width: "100%", height: 200 }}
    />
  );
}

/* ═══════════════════════════════════════════════
   2D VISUALIZATION NODE — animated halftone canvas
═══════════════════════════════════════════════ */

interface HalftonePanel {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  shape: "face" | "moon" | "plant" | "eye" | "figure";
  opacity: number;
}

function VizCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const DOT = 4; // dot grid spacing

    // seed panels — inspired by the book spread layout
    const panels: HalftonePanel[] = [
      { x: 18,  y: 14,  w: 72,  h: 72,  vx: 0.12,  vy: 0.06,  shape: "face",   opacity: 0.9 },
      { x: 58,  y: 44,  w: 90,  h: 90,  vx: -0.08, vy: 0.10,  shape: "face",   opacity: 0.85 },
      { x: 110, y: 80,  w: 78,  h: 78,  vx: 0.07,  vy: -0.09, shape: "face",   opacity: 0.8 },
      { x: 22,  y: 108, w: 60,  h: 52,  vx: 0.10,  vy: 0.07,  shape: "figure", opacity: 0.7 },
      { x: 68,  y: 130, w: 86,  h: 86,  vx: -0.06, vy: -0.08, shape: "plant",  opacity: 0.75 },
      { x: 20,  y: 160, w: 68,  h: 68,  vx: 0.09,  vy: -0.06, shape: "face",   opacity: 0.8 },
      { x: 190, y: 20,  w: 110, h: 110, vx: -0.05, vy: 0.07,  shape: "moon",   opacity: 0.95 },
      { x: 320, y: 18,  w: 62,  h: 58,  vx: 0.08,  vy: 0.09,  shape: "eye",    opacity: 0.8 },
      { x: 288, y: 120, w: 90,  h: 82,  vx: -0.09, vy: -0.06, shape: "plant",  opacity: 0.85 },
    ];

    // ── brightness functions for each shape type ──
    function brightness(shape: HalftonePanel["shape"], nx: number, ny: number, t: number): number {
      const cx = 0.5, cy = 0.5;
      const dx = nx - cx, dy = ny - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      switch (shape) {
        case "moon": {
          const inCircle = dist < 0.48 ? 1 : 0;
          if (!inCircle) return 0;
          const crater = (x: number, y: number, r: number) =>
            Math.sqrt((nx - x) ** 2 + (ny - y) ** 2) < r ? 0.3 : 0;
          const surface = 0.7 + 0.3 * Math.sin(nx * 18 + t * 0.3) * Math.cos(ny * 14);
          return Math.min(1, surface - crater(0.35, 0.3, 0.06) - crater(0.6, 0.55, 0.05) - crater(0.45, 0.65, 0.04));
        }
        case "face": {
          // oval head
          const headDist = Math.sqrt((dx / 0.38) ** 2 + (dy / 0.48) ** 2);
          if (headDist > 1) return 0;
          const shade = 0.5 + 0.45 * (1 - headDist);
          // eye sockets darken
          const leftEye = Math.sqrt((nx - 0.35) ** 2 + (ny - 0.38) ** 2) < 0.08;
          const rightEye = Math.sqrt((nx - 0.65) ** 2 + (ny - 0.38) ** 2) < 0.08;
          if (leftEye || rightEye) return shade * 0.25;
          // nose shadow
          if (Math.abs(nx - 0.5) < 0.06 && ny > 0.5 && ny < 0.65) return shade * 0.4;
          return shade;
        }
        case "eye": {
          const eyeW = 0.85, eyeH = 0.45;
          const inEye = Math.sqrt((dx / eyeW) ** 2 + (dy / eyeH) ** 2) < 0.5;
          if (!inEye) return 0;
          const pupil = dist < 0.18;
          return pupil ? 0.1 : 0.75 + 0.2 * Math.sin(t * 0.5);
        }
        case "plant": {
          // stem + leaves
          const stemDist = Math.abs(nx - 0.5) < 0.05 ? 0.9 : 0;
          const leaf1 = Math.sqrt((nx - 0.3) ** 2 + (ny - 0.35) ** 2) < 0.22;
          const leaf2 = Math.sqrt((nx - 0.7) ** 2 + (ny - 0.5) ** 2) < 0.2;
          const leaf3 = Math.sqrt((nx - 0.4) ** 2 + (ny - 0.65) ** 2) < 0.18;
          const inLeaf = (leaf1 || leaf2 || leaf3) ? 0.6 + 0.3 * Math.sin(nx * 10 + ny * 8) : 0;
          return Math.max(stemDist, inLeaf);
        }
        case "figure": {
          // abstract human silhouette
          const headR = Math.sqrt((nx - 0.5) ** 2 + (ny - 0.2) ** 2) < 0.15;
          const body = Math.abs(nx - 0.5) < 0.18 && ny > 0.3 && ny < 0.75;
          const arms = Math.abs(ny - 0.45) < 0.08 && nx > 0.2 && nx < 0.8;
          return (headR || body || arms) ? 0.55 + 0.35 * Math.sin(ny * 12) : 0;
        }
        default: return 0;
      }
    }

    function drawPanel(panel: HalftonePanel, t: number) {
      if (!ctx) return;
      const { x, y, w, h, shape, opacity } = panel;

      for (let px = 0; px < w; px += DOT) {
        for (let py = 0; py < h; py += DOT) {
          const nx = px / w;
          const ny = py / h;
          const b = brightness(shape, nx, ny, t);
          if (b <= 0.01) continue;

          const r = (DOT * 0.5) * b;
          const gray = Math.floor(180 * b + 40);
          ctx.beginPath();
          ctx.arc(x + px + DOT / 2, y + py + DOT / 2, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${gray},${gray},${gray},${opacity})`;
          ctx.fill();
        }
      }
    }

    function tick(ts: number) {
      const t = ts * 0.001;
      const dt = t - timeRef.current;
      timeRef.current = t;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      // drift panels
      panels.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        // soft bounce at canvas edges
        if (p.x < -p.w * 0.3 || p.x > W - p.w * 0.7) p.vx *= -1;
        if (p.y < -p.h * 0.3 || p.y > H - p.h * 0.7) p.vy *= -1;

        drawPanel(p, t);
      });

      // subtle scanline overlay
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      for (let sy = 0; sy < H; sy += 3) {
        ctx.fillRect(0, sy, W, 1);
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={420}
      height={230}
      style={{ display: "block", width: "100%", height: 230, borderRadius: "0 0 8px 8px" }}
    />
  );
}

interface VizNodeProps {
  pos: Vec2;
  drag: (e: MouseEvent<HTMLDivElement>) => void;
}

function VizNode({ pos, drag }: VizNodeProps) {
  return (
    <div
      onMouseDown={drag}
      style={{
        position: "absolute", left: pos.x, top: pos.y, width: 420,
        background: "#000",
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        boxShadow: "0 4px 32px #00000088",
        cursor: "grab", userSelect: "none", zIndex: 10,
        fontFamily: "'DM Sans', sans-serif",
        animation: "nodeIn 0.5s cubic-bezier(.16,1,.3,1) both",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 14px",
        borderBottom: `1px solid #1a1a1a`,
        background: "#080808",
      }}>
        <span style={{ fontSize: 11, color: C.textMuted }}>◈</span>
        <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
          2D Visualization
        </span>
        <span style={{ marginLeft: 8, fontSize: 9, color: "#333", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          halftone · live
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#1e1e1e" }} />
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#e05252" }} />
        </div>
      </div>

      {/* Animated canvas */}
      <VizCanvas />

      {/* Footer label */}
      <div style={{
        padding: "7px 14px",
        borderTop: `1px solid #1a1a1a`,
        background: "#060606",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          <Tag>Generative</Tag>
          <Tag>Halftone</Tag>
          <Tag>Canvas API</Tag>
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
interface ProjectNodeProps extends Project {
  pos: Vec2;
  index: number;
}

function ProjectNode({ pos: initPos, label, company, role, desc, tags, year, gradient, index }: ProjectNodeProps) {
  const [pos, drag] = useDrag(initPos);
  const [expanded, setExpanded] = useState<boolean>(false);
  const delay = `${index * 0.08}s`;

  return (
    <div
      onMouseDown={drag}
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: 252,
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        boxShadow: "0 4px 24px #00000066",
        cursor: "grab",
        userSelect: "none",
        zIndex: 10,
        fontFamily: "'DM Sans', sans-serif",
        animation: `nodeIn 0.5s ${delay} cubic-bezier(.16,1,.3,1) both`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 14px",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <span style={{ fontSize: 11, color: C.textMuted }}>◈</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: C.textMuted,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {company}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#2e2e2e" }} />
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#e05252" }} />
        </div>
      </div>

      {/* Image area */}
      <div
        style={{
          height: 130,
          background: gradient,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "12px 14px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(${C.border}22 1px, transparent 1px), linear-gradient(90deg, ${C.border}22 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />
        <span
          style={{
            fontSize: 10,
            color: "#ffffff44",
            position: "absolute",
            top: 10,
            right: 12,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {year}
        </span>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em", zIndex: 1 }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color: "#ffffff66", marginTop: 2, zIndex: 1 }}>{role}</div>
      </div>

      {/* Tags */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: "8px 12px",
          flexWrap: "wrap",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        {tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>

      {/* Description */}
      <div style={{ padding: "10px 14px 4px" }}>
        <p
          style={{
            fontSize: 11.5,
            color: C.textMuted,
            margin: 0,
            lineHeight: 1.65,
            ...(expanded
              ? {}
              : {
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical" as const,
                  overflow: "hidden",
                }),
          }}
        >
          {desc}
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "6px 14px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() => setExpanded((prev) => !prev)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: C.accent,
            fontSize: 10,
            fontFamily: "'DM Mono', monospace",
            padding: 0,
            letterSpacing: "0.04em",
          }}
        >
          {expanded ? "↑ less" : "↓ more"}
        </button>
        <span style={{ fontSize: 10, color: C.textDim, fontFamily: "'DM Mono', monospace" }}>
          case study →
        </span>
      </div>

      <Port side="left" top="50%" />
      <Port side="right" top="50%" />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PASTA CANVAS — illustrated pasta types orbiting
═══════════════════════════════════════════════ */
function PastaCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    // ── draw helpers ──────────────────────────────

    function drawSpaghetti(x: number, y: number, r: number, rot: number, t: number) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      // plate
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = "#f5f5f0";
      ctx.fill();
      ctx.strokeStyle = "#ddd";
      ctx.lineWidth = 1;
      ctx.stroke();
      // swirling noodles
      ctx.save();
      ctx.clip();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + t * 0.4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let s = 0; s < 40; s++) {
          const st = s / 40;
          const ang = a + st * Math.PI * 3;
          const rad = st * r * 0.9;
          ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
        }
        ctx.strokeStyle = `rgba(230,210,170,${0.6 + 0.3 * Math.sin(i)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      // pepper dots
      for (let i = 0; i < 12; i++) {
        const da = (i / 12) * Math.PI * 2;
        const dr = r * 0.5 * Math.random() * 0.9 + 0.05;
        ctx.beginPath();
        ctx.arc(Math.cos(da) * dr * r, Math.sin(da) * dr * r, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = "#333";
        ctx.fill();
      }
      ctx.restore();
      ctx.restore();
    }

    function drawLasagna(x: number, y: number, r: number, rot: number) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      // plate
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = "#f5f5f0";
      ctx.fill();
      ctx.strokeStyle = "#ddd";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.save();
      ctx.clip();
      const bw = r * 1.1, bh = r * 0.75;
      // tomato sauce base
      ctx.fillStyle = "#c0392b";
      ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
      // pasta layers
      const layerColors = ["#e8c97d", "#b5451b", "#e8c97d", "#f0f0e8"];
      layerColors.forEach((col, i) => {
        const lh = bh / 5;
        ctx.fillStyle = col;
        ctx.fillRect(-bw / 2, -bh / 2 + i * lh * 1.1, bw, lh * 0.7);
      });
      // cheese top — bubbly white
      ctx.fillStyle = "rgba(255,255,240,0.85)";
      ctx.fillRect(-bw / 2, -bh / 2 + bh * 0.6, bw, bh * 0.4);
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        const bx = -bw * 0.4 + i * bw * 0.12;
        ctx.arc(bx, bh * 0.12, r * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(240,230,180,0.6)";
        ctx.fill();
      }
      // parsley
      ctx.fillStyle = "#2d7a3a";
      ctx.beginPath();
      ctx.arc(0, -bh * 0.1, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.restore();
    }

    function drawRigatoni(x: number, y: number, r: number, rot: number) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = "#f5f5f0";
      ctx.fill();
      ctx.strokeStyle = "#ddd";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.save();
      ctx.clip();
      // scattered rigatoni tubes
      const positions = [
        [-r*0.35, -r*0.3], [0, -r*0.1], [r*0.3, -r*0.35],
        [-r*0.1, r*0.25], [r*0.25, r*0.2], [-r*0.3, r*0.1],
        [r*0.1, -r*0.5], [-r*0.5, -r*0.1],
      ];
      positions.forEach(([px, py], i) => {
        const ang = (i / positions.length) * Math.PI * 0.8;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(ang);
        // tube body
        ctx.beginPath();
        ctx.rect(-r * 0.07, -r * 0.18, r * 0.14, r * 0.36);
        ctx.fillStyle = "#e8c97d";
        ctx.fill();
        ctx.strokeStyle = "#c8a050";
        ctx.lineWidth = 0.8;
        ctx.stroke();
        // hollow end
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.18, r * 0.07, r * 0.035, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#9a7030";
        ctx.fill();
        // ridges
        for (let j = 0; j < 4; j++) {
          ctx.beginPath();
          ctx.moveTo(-r * 0.07, -r * 0.18 + j * r * 0.1);
          ctx.lineTo(r * 0.07, -r * 0.18 + j * r * 0.1);
          ctx.strokeStyle = "rgba(180,140,60,0.5)";
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
        ctx.restore();
      });
      // sauce
      ctx.fillStyle = "rgba(180,60,30,0.25)";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.restore();
    }

    function drawPesto(x: number, y: number, r: number, rot: number, t: number) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = "#f5f5f0";
      ctx.fill();
      ctx.strokeStyle = "#ddd";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.save();
      ctx.clip();
      // pesto base
      ctx.fillStyle = "rgba(80,140,60,0.35)";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
      ctx.fill();
      // fusilli spirals
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const fx = Math.cos(a) * r * 0.45;
        const fy = Math.sin(a) * r * 0.45;
        ctx.save();
        ctx.translate(fx, fy);
        ctx.beginPath();
        for (let s = 0; s <= 30; s++) {
          const st = s / 30;
          const spiral = st * Math.PI * 4 + t * 0.3;
          const sr = st * r * 0.28;
          const sx = Math.cos(spiral) * sr;
          const sy = Math.sin(spiral) * sr * 0.4;
          s === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = "#d4b860";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      ctx.restore();
    }

    // ── orbit config ──────────────────────────────
    interface OrbitItem {
      angle: number;
      orbitR: number;
      speed: number;
      plateR: number;
      type: "spaghetti" | "lasagna" | "rigatoni" | "pesto";
      label: string;
    }

    const items: OrbitItem[] = [
      { angle: 0,              orbitR: 105, speed: 0.18, plateR: 44, type: "spaghetti", label: "Cacio e Pepe" },
      { angle: Math.PI * 0.6,  orbitR: 88,  speed: -0.13, plateR: 40, type: "lasagna",   label: "Lasagna" },
      { angle: Math.PI * 1.2,  orbitR: 112, speed: 0.10, plateR: 38, type: "rigatoni",  label: "Rigatoni" },
      { angle: Math.PI * 1.75, orbitR: 80,  speed: -0.15, plateR: 36, type: "pesto",     label: "Pesto Fusilli" },
    ];

    // central plate
    function drawCenter(t: number) {
      // glow
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 52);
      grd.addColorStop(0, "rgba(230,200,150,0.25)");
      grd.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx, cy, 52, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
      // fork icon — simple
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 1.5;
      // fork handle
      ctx.beginPath();
      ctx.moveTo(-4, 10); ctx.lineTo(-4, -14);
      ctx.moveTo(0, 10);  ctx.lineTo(0, -14);
      ctx.moveTo(4, 10);  ctx.lineTo(4, -14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-4, -8); ctx.quadraticCurveTo(0, -18, 4, -8);
      ctx.strokeStyle = "#aaa";
      ctx.stroke();
      // knife
      ctx.beginPath();
      ctx.moveTo(12, 14); ctx.lineTo(12, -14);
      ctx.lineTo(15, -10);
      ctx.strokeStyle = "#888";
      ctx.stroke();
      ctx.restore();

      // label
      ctx.fillStyle = "#555";
      ctx.font = `500 9px 'DM Mono', monospace`;
      ctx.textAlign = "center";
      ctx.fillText("PASTA LOVER", cx, cy + 28);
    }

    // orbit trails
    function drawOrbitTrail(orbitR: number) {
      ctx.beginPath();
      ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(180,160,120,0.1)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function tick(ts: number) {
      const t = ts * 0.001;
      ctx.clearRect(0, 0, W, H);

      // warm off-white bg
      ctx.fillStyle = "#faf8f4";
      ctx.fillRect(0, 0, W, H);

      // subtle grain texture
      for (let i = 0; i < 400; i++) {
        ctx.fillStyle = `rgba(180,160,120,${Math.random() * 0.04})`;
        ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
      }

      // orbit trails
      items.forEach(item => drawOrbitTrail(item.orbitR));

      // update angles & draw
      items.forEach(item => {
        item.angle += item.speed * 0.008;
        const ix = cx + Math.cos(item.angle) * item.orbitR;
        const iy = cy + Math.sin(item.angle) * item.orbitR;

        if (item.type === "spaghetti") drawSpaghetti(ix, iy, item.plateR, item.angle * 0.3, t);
        else if (item.type === "lasagna") drawLasagna(ix, iy, item.plateR, item.angle * 0.2);
        else if (item.type === "rigatoni") drawRigatoni(ix, iy, item.plateR, item.angle * 0.15);
        else if (item.type === "pesto") drawPesto(ix, iy, item.plateR, item.angle * 0.25, t);

        // label
        ctx.fillStyle = "#888";
        ctx.font = `400 8px 'DM Mono', monospace`;
        ctx.textAlign = "center";
        ctx.fillText(item.label, ix, iy + item.plateR + 10);
      });

      drawCenter(t);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={290}
      height={290}
      style={{ display: "block", width: "100%", height: 290 }}
    />
  );
}

interface PastaNodeProps {
  pos: Vec2;
  drag: (e: MouseEvent<HTMLDivElement>) => void;
}

function PastaNode({ pos, drag }: PastaNodeProps) {
  return (
    <div
      onMouseDown={drag}
      style={{
        position: "absolute", left: pos.x, top: pos.y, width: 290,
        background: "#faf8f4",
        border: `1px solid #e8e0d0`,
        borderRadius: 10,
        boxShadow: "0 4px 24px #00000033",
        cursor: "grab", userSelect: "none", zIndex: 10,
        fontFamily: "'DM Sans', sans-serif",
        overflow: "hidden",
        animation: "nodeIn 0.5s 0.3s cubic-bezier(.16,1,.3,1) both",
        zIndex: 1,
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 14px",
        borderBottom: `1px solid #e8e0d0`,
        background: "#f5f0e8",
      }}>
        <span style={{ fontSize: 11, color: "#b08040" }}>🍝</span>
        <span style={{ fontSize: 11, fontWeight: 500, color: "#9a7040", letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
          Pasta Lover
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#e8d8c0" }} />
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#e05252" }} />
        </div>
      </div>

      {/* Animated canvas */}
      <PastaCanvas />

      {/* Footer */}
      <div style={{
        padding: "7px 14px",
        borderTop: `1px solid #e8e0d0`,
        background: "#f5f0e8",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["Italian", "Homemade", "Al dente"].map(t => (
            <span key={t} style={{
              background: "#ede5d5", border: "1px solid #ddd0b8",
              borderRadius: 3, padding: "2px 6px",
              fontSize: 9, color: "#9a7040",
              fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.04em",
            }}>{t}</span>
          ))}
        </div>
        <span style={{ fontSize: 9, color: "#c0a070", fontFamily: "'DM Mono', monospace" }}>● orbiting</span>
      </div>

      <Port side="left" top="50%" color="#c8a060" />
      <Port side="right" top="50%" color="#c8a060" />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════ */
export default function App() {
  const [profilePos, profileDrag] = useDrag({ x: 50, y: 100 });
  const [aboutPos, aboutDrag] = useDrag({ x: 50, y: 420 });
  const [philosophyPos, philosophyDrag] = useDrag({ x: 390, y: 70 });
  const [aiPos, aiDrag] = useDrag({ x: 390, y: 450 });
  const [expPos, expDrag] = useDrag({ x: 760, y: 180 });
  const [writingPos, writingDrag] = useDrag({ x: 760, y: 540 });
  const [contactPos, contactDrag] = useDrag({ x: 1100, y: 260 });
  const [pastaPos, pastaDrag] = useDrag({ x: 1320, y: 40 });

  const projects: Project[] = [
    {
      label: "JavaAI IDE",
      company: "JavaAI",
      role: "Product Designer · MVP → V1",
      desc: "Built and shipped the MVP and V1 of an AI code editor (IDE) for developer interaction with AI-generated code operations. Designed the full interaction model for human–AI collaboration inside a live coding environment.",
      tags: ["AI/ML", "Dev Tools", "0→1", "IDE"],
      year: "2024",
      gradient: "linear-gradient(140deg, #0d1520 0%, #0a1e35 50%, #071628 100%)",
    },
    {
      label: "Data Pipeline Platform",
      company: "eBay",
      role: "Product Designer · Redesign",
      desc: "Redesigned the B2B data pipeline platform to improve tool discoverability. Tackled information architecture and navigation patterns for power users managing complex data workflows at scale.",
      tags: ["B2B", "Data", "IA", "Redesign"],
      year: "2023",
      gradient: "linear-gradient(140deg, #1a1200 0%, #2b1e00 50%, #1a1400 100%)",
    },
    {
      label: "Creator Discovery",
      company: "TikTok",
      role: "Product Designer · Two-sided Marketplace",
      desc: "Redesigned the creator discovery flow for TikTok's two-sided creator marketplace — balancing discoverability needs of both creators seeking brand deals and brands seeking authentic voices.",
      tags: ["Marketplace", "Social", "Discovery", "UX"],
      year: "2023",
      gradient: "linear-gradient(140deg, #0f0016 0%, #1a0028 50%, #0a0014 100%)",
    },
    {
      label: "Enterprise Design System",
      company: "Colgate-Palmolive",
      role: "Design Strategist · Systems",
      desc: "Adopted and scaled enterprise design system for AI workflows across product teams. Ensured design consistency while accommodating the unique interaction patterns that emerge in AI-assisted enterprise tools.",
      tags: ["Design System", "Enterprise", "AI", "Scale"],
      year: "2022",
      gradient: "linear-gradient(140deg, #001a10 0%, #002a18 50%, #001510 100%)",
    },
  ];

  const contacts: ContactItem[] = [
    { icon: "✉", label: "miaolanzhang1101@gmail.com", sub: "email" },
    { icon: "◈", label: "miaolanzhang.notion.site/portfolio", sub: "portfolio" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Mono:wght@400;500&family=Lora:ital,wght@0,400;0,500;1,400;1,500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; overflow: hidden; }
        ::-webkit-scrollbar { display: none; }
        @keyframes nodeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      {/* Canvas */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: C.bg,
          backgroundImage: `radial-gradient(${C.border} 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
          overflow: "hidden",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "fixed",
            top: "20%",
            left: "40%",
            width: 600,
            height: 400,
            background: `radial-gradient(ellipse, ${C.accent}08 0%, transparent 70%)`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* ── Wire layer ── */}
        <svg
          style={{
            position: "fixed",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 5,
          }}
        >
          <Wire x1={profilePos.x + 305} y1={profilePos.y + 80}  x2={philosophyPos.x - 4}  y2={philosophyPos.y + 90} />
          <Wire x1={profilePos.x + 305} y1={profilePos.y + 140} x2={aboutPos.x + 152}      y2={aboutPos.y - 4} />
          <Wire x1={philosophyPos.x + 152} y1={philosophyPos.y + 240} x2={aiPos.x + 152}   y2={aiPos.y - 4} />
          <Wire x1={philosophyPos.x + 325} y1={philosophyPos.y + 90}  x2={expPos.x - 4}    y2={expPos.y + 80} />
          <Wire x1={aiPos.x + 325}    y1={aiPos.y + 80}     x2={writingPos.x - 4}  y2={writingPos.y + 60} />
          <Wire x1={expPos.x + 305}   y1={expPos.y + 80}    x2={contactPos.x - 4}  y2={contactPos.y + 80} />
          <Wire x1={writingPos.x + 305} y1={writingPos.y + 60} x2={contactPos.x - 4} y2={contactPos.y + 140} />
        </svg>

        {/* ══ NODE: Pasta Lover — top right, behind everything ══ */}
        <PastaNode pos={pastaPos} drag={pastaDrag} />

        {/* ══ NODE: Profile ══ */}
        <Node pos={profilePos} drag={profileDrag} label="Identity" icon="◉" accent width={305} zIndex={20}>
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: C.text, letterSpacing: "-0.03em", fontFamily: "'Lora', serif" }}>
                Miao Lan Zhang
              </div>
              <div style={{ fontSize: 11, color: C.accent, fontWeight: 500, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
                Product Designer · Builder · Strategist
              </div>
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

        {/* ══ NODE: About ══ */}
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

        {/* ══ NODE: Philosophy ══ */}
        <Node pos={philosophyPos} drag={philosophyDrag} label="Philosophy" icon="◎" width={325} zIndex={15}>
          <div style={{ padding: "14px 16px" }}>
            <div
              style={{
                fontSize: 13, fontFamily: "'Lora', serif", fontStyle: "italic",
                color: C.text, lineHeight: 1.7,
                paddingLeft: 12, borderLeft: `2px solid ${C.accent}`,
              }}
            >
              "I've always been more interested in the <em>why</em> behind things than the what."
            </div>
          </div>
          <Port side="left" top="40%" />
          <Port side="right" top="40%" />
        </Node>

        {/* ══ NODE: AI × Design ══ */}
        <Node pos={aiPos} drag={aiDrag} label="AI × Design" icon="⬡" width={325} accent>
          <div style={{ overflow: "hidden", borderRadius: "0 0 9px 9px" }}>
            <ScribbleCanvas />
          </div>
          <div style={{
            padding: "8px 14px 10px",
            borderTop: `1px solid ${C.accent}33`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 10, color: C.accent, fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Agentic Systems · Epistemic Design
            </span>
            <span style={{ fontSize: 9, color: C.accentSoft.slice(0, 7) + "99", fontFamily: "'DM Mono', monospace" }}>● live</span>
          </div>
          <Port side="left" top="50%" />
          <Port side="right" top="50%" />
        </Node>

        {/* ══ NODE: 2D Visualization ══ */}
        <VizNode pos={expPos} drag={expDrag} />

        {/* ══ NODE: Writing ══ */}
        <Node pos={writingPos} drag={writingDrag} label="Writing" icon="✎" width={305}>
          <div style={{ padding: "14px 16px" }}>
            <div
              style={{
                fontSize: 13, fontFamily: "'Lora', serif", fontStyle: "italic",
                color: C.textMuted, lineHeight: 1.8, marginBottom: 12,
              }}
            >
              "Outside of design, I write literary fiction — stories that explore the same things I
              care about in products: how people make sense of uncertainty, how trust forms in the
              dark."
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Tag>Literary Fiction</Tag>
              <Tag>Narrative</Tag>
              <Tag>Epistemic Trust</Tag>
            </div>
          </div>
          <Port side="left" top="50%" />
          <Port side="right" top="50%" />
        </Node>

        {/* ══ NODE: Contact ══ */}
        <Node pos={contactPos} drag={contactDrag} label="Contact" icon="↗" width={255}>
          <div style={{ padding: "12px 14px 14px" }}>
            {contacts.map((l, i) => (
              <div
                key={l.sub}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "7px 0",
                  borderBottom: i < contacts.length - 1 ? `1px solid ${C.border}` : "none",
                }}
              >
                <span style={{ color: C.accent, fontSize: 13, width: 16, flexShrink: 0 }}>{l.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: C.text }}>{l.label}</div>
                  <div
                    style={{
                      fontSize: 9, color: C.textDim, fontFamily: "'DM Mono', monospace",
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}
                  >
                    {l.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Port side="left" top="35%" />
          <Port side="left" top="65%" />
        </Node>

        {/* ══ PROJECT NODES ══ */}
        {projects.map((p, i) => (
          <ProjectNode
            key={p.label}
            pos={{ x: 50 + i * 278, y: 780 }}
            index={i}
            {...p}
          />
        ))}

        {/* Canvas label */}
        <div
          style={{
            position: "fixed", bottom: 20, left: 20,
            fontFamily: "'DM Mono', monospace",
            fontSize: 9, color: C.textDim, letterSpacing: "0.12em",
            zIndex: 1, userSelect: "none", textTransform: "uppercase",
          }}
        >
          Miao Lan Zhang · Portfolio Canvas · Drag to explore
        </div>

        {/* Zoom controls */}
        <div style={{ position: "fixed", bottom: 20, right: 20, display: "flex", gap: 6, zIndex: 100 }}>
          {(["−", "⊕", "+"] as const).map((b) => (
            <button
              key={b}
              style={{
                width: 30, height: 30, background: C.card,
                border: `1px solid ${C.border}`, borderRadius: 6,
                color: C.textMuted, fontSize: 13, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Node count */}
        <div
          style={{
            position: "fixed", top: 20, right: 20,
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 6, padding: "6px 12px",
            fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.textMuted,
            zIndex: 100,
          }}
        >
          11 nodes · 7 connections
        </div>
      </div>
    </>
  );
}