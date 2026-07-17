// Curated color palettes for the Orb. Each is a list of CSS colors the Orb
// interpolates across its rings (inner → outer). Pass one as `colors`:
//
//   new Orb(el, { colors: OrbPalettes.aurora });
//
// or in React:  <Orb colors={OrbPalettes.ember} />
export const OrbPalettes = {
  /** Cyan → indigo → violet. The Orb's default. */
  spectrum: ["#22d3ee", "#6366f1", "#a855f7"],
  /** Green → cyan → periwinkle. */
  aurora: ["#34d399", "#22d3ee", "#818cf8"],
  /** Amber → rose → red. */
  ember: ["#fbbf24", "#fb7185", "#f43f5e"],
  /** Icy blue → lavender white. */
  mono: ["#93c5fd", "#e0e7ff"],
} satisfies Record<string, string[]>;

/** Names of the built-in {@link OrbPalettes}. */
export type OrbPaletteName = keyof typeof OrbPalettes;
