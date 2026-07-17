// Orb is a dependency-free, framework-agnostic UI element: an animated "orb"
// drawn as a set of concentric, flowing line-rings on a <canvas>. Each ring is
// a smooth closed curve whose radius is perturbed by a few traveling sine
// harmonics, so the lines constantly undulate and the whole orb slowly rotates.
//
// It renders on its own (a gentle idle "breathing"), and can be made
// audio-reactive: feed it a MediaStream (e.g. a bot's remote audio) with
// `attachStream()` and the lines swell with the sound, or drive it manually
// with `setLevel(0..1)`.
//
// It has no dependency on the jargo client, so it can be reused anywhere — a
// plain page, a web component, or the React wrapper in
// "@gojargo/jargo-client-react".

import { OrbPalettes } from "./palettes";

/** Blend mode for stacking the ring strokes. `lighter` gives an additive,
 * neon glow that reads well on dark backgrounds; `source-over` is flat. */
export type OrbBlend = "lighter" | "source-over";

export interface OrbOptions {
  /** Number of concentric line-rings. Default 5. */
  rings?: number;
  /** Outer radius as a fraction of half the smaller canvas side. Default 0.82. */
  radius?: number;
  /** Inner ring radius as a fraction of the outer radius. Default 0.55. */
  innerScale?: number;
  /**
   * Colors the rings are drawn with, interpolated from inner to outer. One
   * color is fine; two or more build a gradient. CSS colors (hex, rgb, hsl,
   * named) are all accepted.
   */
  colors?: string[];
  /** Canvas background. `"transparent"` (default) clears each frame. */
  background?: string;
  /** Stroke width in CSS pixels. Default 1.6. */
  lineWidth?: number;
  /** Animation speed multiplier. Default 1. */
  speed?: number;
  /** Idle wave amplitude (0..1) when there's no audio. Default 0.14. */
  idleAmplitude?: number;
  /** How strongly the audio level distorts the rings (0..1). Default 0.9. */
  reactivity?: number;
  /** Glow blur radius in px (0 disables the glow). Default 16. */
  glow?: number;
  /** Draw a soft pulsing core disc behind the rings. Default true. */
  core?: boolean;
  /** How the ring strokes blend together. Default "lighter". */
  blend?: OrbBlend;
  /** Cap on devicePixelRatio for the backing store. Default 2. */
  maxDpr?: number;
}

type RGBA = [number, number, number, number];

const DEFAULTS: Required<OrbOptions> = {
  rings: 5,
  radius: 0.82,
  innerScale: 0.55,
  colors: [...OrbPalettes.spectrum],
  background: "transparent",
  lineWidth: 1.6,
  speed: 1,
  idleAmplitude: 0.14,
  reactivity: 0.9,
  glow: 16,
  core: true,
  blend: "lighter",
  maxDpr: 2,
};

// Number of samples per ring. Dense enough that straight segments read as a
// smooth curve with round line joins.
const SEGMENTS = 160;

export class Orb {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private opts: Required<OrbOptions>;
  private palette: RGBA[] = [];

  private width = 0; // CSS px
  private height = 0; // CSS px
  private dpr = 1;

  private raf = 0;
  private running = false;
  private lastTs = 0;
  private time = 0;

  // Audio level: `target` is the freshly measured value, `level` eases toward
  // it so the orb reacts smoothly rather than jittering frame to frame.
  private level = 0;
  private targetLevel = 0;

  private resizeObserver: ResizeObserver | null = null;

  // Audio wiring (only present when a stream/analyser is attached).
  private audioCtx: AudioContext | null = null;
  private ownsAudioCtx = false;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  // Typed over ArrayBuffer (not the default ArrayBufferLike) so it satisfies
  // the DOM analyser methods under TypeScript's generic typed-array types.
  private audioData: Uint8Array<ArrayBuffer> | null = null;

  /**
   * @param target A `<canvas>` to draw into, or a container element a canvas
   *   is created inside and sized to fill.
   */
  constructor(target: HTMLCanvasElement | HTMLElement, options: OrbOptions = {}) {
    if (typeof document === "undefined") {
      throw new Error("Orb requires a browser environment (no document).");
    }
    if (target instanceof HTMLCanvasElement) {
      this.canvas = target;
    } else {
      this.canvas = document.createElement("canvas");
      this.canvas.style.display = "block";
      this.canvas.style.width = "100%";
      this.canvas.style.height = "100%";
      target.appendChild(this.canvas);
    }
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Orb: could not get a 2d canvas context.");
    this.ctx = ctx;

    this.opts = { ...DEFAULTS, ...options };
    this.buildPalette();
    this.resize();

    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.canvas);
    }
  }

  /** Start (or resume) the animation loop. */
  start(): this {
    if (this.running) return this;
    this.running = true;
    this.lastTs = now();
    const loop = () => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      this.frame();
    };
    this.raf = requestAnimationFrame(loop);
    return this;
  }

  /** Pause the animation loop (state is retained; `start()` resumes). */
  stop(): this {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    return this;
  }

  /** Manually set the drive level (0..1). Ignored while a stream is attached. */
  setLevel(level: number): this {
    if (!this.analyser) this.targetLevel = clamp01(level);
    return this;
  }

  /** Merge in new options at runtime (e.g. change colors or reactivity). */
  setOptions(options: Partial<OrbOptions>): this {
    this.opts = { ...this.opts, ...options };
    if (options.colors) this.buildPalette();
    return this;
  }

  /**
   * Drive the orb from a live audio stream (e.g. the bot's remote audio).
   * Pass `null` to detach. Playback is untouched — the analyser only taps the
   * signal, it does not route it to the speakers.
   */
  attachStream(stream: MediaStream | null): this {
    this.detachAudio();
    if (!stream) return this;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const audioCtx = new Ctx();
    this.audioCtx = audioCtx;
    this.ownsAudioCtx = true;
    if (audioCtx.state === "suspended") void audioCtx.resume();
    this.source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.75;
    this.source.connect(analyser);
    this.analyser = analyser;
    this.audioData = new Uint8Array(analyser.fftSize);
    return this;
  }

  /**
   * Drive the orb from an existing AnalyserNode (advanced). The orb reads it
   * but never disposes it; the caller keeps ownership of the audio graph.
   */
  attachAnalyser(analyser: AnalyserNode): this {
    this.detachAudio();
    this.analyser = analyser;
    this.audioData = new Uint8Array(analyser.fftSize);
    return this;
  }

  /** Recompute the backing-store size from the canvas's CSS box. */
  resize(): this {
    const dpr = Math.min(
      this.opts.maxDpr,
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
    );
    const rect = this.canvas.getBoundingClientRect();
    // Fall back to the attribute size if the element isn't laid out yet.
    const cssW = rect.width || this.canvas.width || 200;
    const cssH = rect.height || this.canvas.height || 200;
    this.width = cssW;
    this.height = cssH;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(cssW * dpr));
    this.canvas.height = Math.max(1, Math.round(cssH * dpr));
    return this;
  }

  /** Stop, release audio, disconnect observers, and remove a created canvas. */
  destroy(): void {
    this.stop();
    this.detachAudio();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  // --- internals -----------------------------------------------------------

  private detachAudio(): void {
    try {
      this.source?.disconnect();
    } catch {
      /* already gone */
    }
    this.source = null;
    this.analyser = null;
    this.audioData = null;
    if (this.ownsAudioCtx) void this.audioCtx?.close().catch(() => {});
    this.audioCtx = null;
    this.ownsAudioCtx = false;
  }

  private buildPalette(): void {
    const cols = this.opts.colors.length ? this.opts.colors : DEFAULTS.colors;
    this.palette = cols.map((c) => normalizeColor(this.ctx, c));
  }

  /** Measure the current audio level as RMS of the time-domain signal. */
  private measureAudio(): void {
    if (!this.analyser || !this.audioData) return;
    this.analyser.getByteTimeDomainData(this.audioData);
    let sum = 0;
    for (let i = 0; i < this.audioData.length; i++) {
      const v = (this.audioData[i] - 128) / 128; // -1..1
      sum += v * v;
    }
    const rms = Math.sqrt(sum / this.audioData.length);
    // Speech RMS is small; scale up and soft-clip into a lively 0..1 range.
    this.targetLevel = clamp01(rms * 3.2);
  }

  private frame(): void {
    const t = now();
    const dt = Math.min(0.05, (t - this.lastTs) / 1000); // seconds, clamped
    this.lastTs = t;
    this.time += dt * this.opts.speed;

    this.measureAudio();
    // Ease the level toward its target (attack faster than release).
    const k = this.targetLevel > this.level ? 0.35 : 0.08;
    this.level += (this.targetLevel - this.level) * k;

    this.draw();
  }

  private draw(): void {
    const { ctx } = this;
    const w = this.width;
    const h = this.height;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.opts.background === "transparent") {
      ctx.clearRect(0, 0, w, h);
    } else {
      ctx.fillStyle = this.opts.background;
      ctx.fillRect(0, 0, w, h);
    }

    const cx = w / 2;
    const cy = h / 2;
    const R = (Math.min(w, h) / 2) * this.opts.radius;
    const energy = clamp01(this.opts.idleAmplitude + this.opts.reactivity * this.level);
    const t = this.time;

    ctx.save();
    ctx.globalCompositeOperation = this.opts.blend;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    if (this.opts.core) this.drawCore(cx, cy, R, energy);

    const rings = Math.max(1, this.opts.rings);
    for (let ri = 0; ri < rings; ri++) {
      const f = rings === 1 ? 1 : ri / (rings - 1);
      const ringR = R * lerp(this.opts.innerScale, 1, f) * (1 + energy * 0.08);
      const color = paletteAt(this.palette, f);
      const dir = ri % 2 === 0 ? 1 : -1;
      const spin = t * 0.25 * dir * (1 + ri * 0.12);
      const ph = ri * 0.9;
      // Larger waves on the outer rings; scaled by the overall energy.
      const amp = ringR * energy * 0.3 * (0.7 + 0.3 * f);

      ctx.beginPath();
      for (let s = 0; s <= SEGMENTS; s++) {
        const a = (s / SEGMENTS) * Math.PI * 2;
        const d =
          0.6 * Math.sin(3 * a + t * 0.7 + ph) +
          0.3 * Math.sin(5 * a - t * 1.1 + ph * 1.7) +
          0.15 * Math.sin(8 * a + t * 1.7 + ph * 2.3);
        const r = ringR + amp * d;
        const x = cx + Math.cos(a + spin) * r;
        const y = cy + Math.sin(a + spin) * r;
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const alpha = 0.5 + 0.5 * f;
      ctx.strokeStyle = rgba(color, alpha);
      ctx.lineWidth = this.opts.lineWidth;
      if (this.opts.glow > 0) {
        ctx.shadowBlur = this.opts.glow;
        ctx.shadowColor = rgba(color, 0.9);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawCore(cx: number, cy: number, R: number, energy: number): void {
    const { ctx } = this;
    const coreR = R * (0.35 + energy * 0.25);
    const c = paletteAt(this.palette, 0.5);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
    g.addColorStop(0, rgba(c, 0.35 + energy * 0.35));
    g.addColorStop(0.6, rgba(c, 0.08));
    g.addColorStop(1, rgba(c, 0));
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// --- helpers ---------------------------------------------------------------

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Normalize any CSS color to an RGBA tuple, using the canvas to parse it. */
function normalizeColor(ctx: CanvasRenderingContext2D, css: string): RGBA {
  ctx.fillStyle = "#000";
  ctx.fillStyle = css;
  const v = ctx.fillStyle; // canvas returns "#rrggbb" or "rgba(r, g, b, a)"
  if (v.startsWith("#")) {
    const n = parseInt(v.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const m = v.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(",").map((s) => parseFloat(s.trim()));
    return [p[0] || 0, p[1] || 0, p[2] || 0, p[3] ?? 1];
  }
  return [255, 255, 255, 1];
}

/** Sample a palette (list of RGBA stops) at t in [0,1]. */
function paletteAt(palette: RGBA[], t: number): RGBA {
  if (palette.length === 0) return [255, 255, 255, 1];
  if (palette.length === 1) return palette[0];
  const x = clamp01(t) * (palette.length - 1);
  const i = Math.min(palette.length - 2, Math.floor(x));
  const f = x - i;
  const a = palette[i];
  const b = palette[i + 1];
  return [
    Math.round(lerp(a[0], b[0], f)),
    Math.round(lerp(a[1], b[1], f)),
    Math.round(lerp(a[2], b[2], f)),
    lerp(a[3], b[3], f),
  ];
}

function rgba(c: RGBA, alpha: number): string {
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${(c[3] * alpha).toFixed(3)})`;
}
