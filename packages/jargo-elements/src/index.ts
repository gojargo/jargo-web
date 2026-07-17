// @gojargo/jargo-elements — native web components for jargo. The visual
// <jargo-orb> is built on @gojargo/jargo-ui; the client-driven components
// (<jargo-connect-button>, <jargo-mic-button>, <jargo-status>,
// <jargo-transcript>) read a client set via setJargoClient(). Style them all
// by importing "@gojargo/jargo-ui/theme.css" once.
//
//   import "@gojargo/jargo-elements/define";
//   import "@gojargo/jargo-ui/theme.css";
//   setJargoClient(new JargoClient({ baseUrl }));
//   // <jargo-orb colors="aurora"></jargo-orb>
//   // <jargo-connect-button></jargo-connect-button>

import {
  Orb,
  OrbPalettes,
  type OrbOptions,
  type OrbPaletteName,
} from "@gojargo/jargo-ui";
import {
  JargoConnectButtonElement,
  JargoMicButtonElement,
  JargoStatusElement,
  JargoTranscriptElement,
} from "./components";

export { setJargoClient, getJargoClient } from "./client-registry";
export { JargoClientElement } from "./JargoClientElement";
export {
  JargoConnectButtonElement,
  JargoMicButtonElement,
  JargoStatusElement,
  JargoTranscriptElement,
} from "./components";

// OrbOptions keys that take a number, mapped from their kebab-case attributes.
type NumKey =
  | "rings"
  | "radius"
  | "innerScale"
  | "lineWidth"
  | "speed"
  | "idleAmplitude"
  | "reactivity"
  | "glow"
  | "maxDpr";

/**
 * `<jargo-orb>` — the Orb as a custom element. Size it with CSS (defaults to
 * 220×220). Attributes mirror the Orb options (kebab-case): `rings`, `radius`,
 * `inner-scale`, `line-width`, `speed`, `idle-amplitude`, `reactivity`, `glow`,
 * `core`, `blend`, `background`, plus `colors` (a palette name like `aurora`,
 * or a comma/space-separated list of CSS colors), `level` (0..1), and `paused`.
 *
 * Drive it from live audio with the {@link attachStream} method.
 */
export class JargoOrbElement extends HTMLElement {
  static readonly observedAttributes = [
    "rings",
    "radius",
    "inner-scale",
    "line-width",
    "speed",
    "idle-amplitude",
    "reactivity",
    "glow",
    "core",
    "blend",
    "background",
    "colors",
    "level",
    "paused",
  ];

  private orb: Orb | null = null;
  private readonly canvas: HTMLCanvasElement;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent =
      ":host{display:block;width:220px;height:220px}canvas{display:block;width:100%;height:100%}";
    this.canvas = document.createElement("canvas");
    root.append(style, this.canvas);
  }

  connectedCallback(): void {
    if (this.orb) return;
    this.orb = new Orb(this.canvas, this.readOptions());
    const level = this.getAttribute("level");
    if (level !== null) this.orb.setLevel(parseFloat(level));
    if (!this.hasAttribute("paused")) this.orb.start();
  }

  disconnectedCallback(): void {
    this.orb?.destroy();
    this.orb = null;
  }

  attributeChangedCallback(
    name: string,
    _old: string | null,
    value: string | null,
  ): void {
    const orb = this.orb;
    if (!orb) return;
    if (name === "level") {
      if (value !== null) orb.setLevel(parseFloat(value));
      return;
    }
    if (name === "paused") {
      if (value !== null) orb.stop();
      else orb.start();
      return;
    }
    orb.setOptions(this.readOptions());
  }

  /** Drive the orb from a MediaStream (e.g. a bot's remote audio); null detaches. */
  attachStream(stream: MediaStream | null): void {
    this.orb?.attachStream(stream);
  }

  /** Manually set the drive level (0..1). */
  setLevel(level: number): void {
    this.orb?.setLevel(level);
  }

  private readOptions(): OrbOptions {
    const o: OrbOptions = {};
    const num = (attr: string, key: NumKey) => {
      const v = this.getAttribute(attr);
      if (v !== null && v !== "") o[key] = parseFloat(v);
    };
    num("rings", "rings");
    num("radius", "radius");
    num("inner-scale", "innerScale");
    num("line-width", "lineWidth");
    num("speed", "speed");
    num("idle-amplitude", "idleAmplitude");
    num("reactivity", "reactivity");
    num("glow", "glow");

    const core = this.getAttribute("core");
    if (core !== null) o.core = core !== "false";
    const blend = this.getAttribute("blend");
    if (blend === "lighter" || blend === "source-over") o.blend = blend;
    const bg = this.getAttribute("background");
    if (bg !== null) o.background = bg;

    const colors = this.getAttribute("colors");
    if (colors) {
      o.colors =
        (OrbPalettes as Record<string, string[]>)[colors] ??
        colors.split(/[,\s]+/).filter(Boolean);
    }
    return o;
  }
}

function define(tag: string, ctor: CustomElementConstructor): void {
  if (typeof customElements !== "undefined" && !customElements.get(tag)) {
    customElements.define(tag, ctor);
  }
}

/** Register {@link JargoOrbElement} as `<jargo-orb>` (or a custom tag). */
export function defineJargoOrb(tag = "jargo-orb"): void {
  define(tag, JargoOrbElement);
}

/**
 * Register all jargo web components: `<jargo-orb>`, `<jargo-connect-button>`,
 * `<jargo-mic-button>`, `<jargo-status>`, `<jargo-transcript>`.
 */
export function defineJargoElements(): void {
  defineJargoOrb();
  define("jargo-connect-button", JargoConnectButtonElement);
  define("jargo-mic-button", JargoMicButtonElement);
  define("jargo-status", JargoStatusElement);
  define("jargo-transcript", JargoTranscriptElement);
}

export { OrbPalettes };
export type { OrbOptions, OrbPaletteName };
