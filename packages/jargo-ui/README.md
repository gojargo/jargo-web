# @gojargo/jargo-ui

**Framework-agnostic UI** for jargo voice clients. Today it ships the **Orb** —
an audio-reactive element drawn as concentric moving lines on a `<canvas>`. It
has no dependency on the client, so it works from plain JS, a web component,
React, Vue, or anywhere else.

Part of the [`jargo-web`](https://github.com/gojargo/jargo-web) monorepo.

## Install

```bash
npm install @gojargo/jargo-ui
```

## Orb

```ts
import { Orb, OrbPalettes } from "@gojargo/jargo-ui";

const orb = new Orb(document.querySelector("#orb"), {
  colors: OrbPalettes.aurora, // or your own: ["#22d3ee", "#6366f1", …]
  rings: 5,
}).start();

// React to a stream (e.g. a bot's remote audio):
orb.attachStream(client.remoteStream);

// ...or drive it by hand (0..1):
orb.setLevel(0.8);

orb.destroy();
```

`new Orb(target, options)` accepts a `<canvas>` (drawn into directly) or any
element (a canvas is created to fill it). Key options: `rings`, `radius`,
`innerScale`, `colors`, `lineWidth`, `speed`, `idleAmplitude`, `reactivity`,
`glow`, `core`, `blend`, `background`. Methods: `start()`, `stop()`,
`setLevel()`, `attachStream()`, `attachAnalyser()`, `setOptions()`, `resize()`,
`destroy()`.

Built-in palettes are exported as `OrbPalettes` — `spectrum` (the default),
`aurora`, `ember`, and `mono`.

## Framework wrappers

- **React** — [`@gojargo/jargo-client-react`](../jargo-client-react) exposes `<Orb />`.
- **Web components** — [`@gojargo/jargo-elements`](../jargo-elements) exposes `<jargo-orb>`.

## License

BSD-2-Clause. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
