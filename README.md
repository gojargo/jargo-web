# jargo-web

The web toolkit for [jargo](https://github.com/gojargo/jargo) voice servers: a
headless client, a framework-agnostic UI (the **Orb**), and framework bindings —
all in one npm-workspaces monorepo, layered like pipecat's client-js /
client-react so the core can be reused anywhere.

## Packages

| Package | What it is |
|---|---|
| **[`@gojargo/jargo-client-js`](./packages/jargo-client-js)** | Headless WebRTC/RTVI client + shared logic (e.g. `TranscriptTracker`). No UI, no framework. |
| **[`@gojargo/jargo-ui`](./packages/jargo-ui)** | Framework-agnostic UI: the **Orb**, plus the design system (`--jargo-*` tokens + `theme.css`). |
| **[`@gojargo/jargo-client-react`](./packages/jargo-client-react)** | React provider, hooks, `<Orb />`, and voice-UI components (`ConnectButton`, `Transcript`, …). |
| **[`@gojargo/jargo-client-vue`](./packages/jargo-client-vue)** | Vue 3 composables and an `<Orb>` component. |
| **[`@gojargo/jargo-elements`](./packages/jargo-elements)** | Web components — `<jargo-orb>`, `<jargo-connect-button>`, `<jargo-transcript>`, … |

Dependency flow: `jargo-client-js` (client + shared logic) and `jargo-ui`
(visuals + design system) are the two bases; `jargo-client-react`,
`jargo-client-vue`, and `jargo-elements` all build on them. Each framework
provides *native* components, but they share one core: the logic lives in
`jargo-client-js`, and the look (`--jargo-*` tokens + `theme.css`) lives in
`jargo-ui`.

**Other frameworks (Angular, Svelte, Solid, plain HTML):** use the web
components from `@gojargo/jargo-elements` (`<jargo-orb>`,
`<jargo-connect-button>`, `<jargo-transcript>`, …) and the plain `JargoClient` /
`Orb` classes directly — no framework-specific package needed.

- **[`examples/nextjs-voicebot`](./examples/nextjs-voicebot)** — a Next.js
  voicebot using the React bindings and the Orb.

## Quick start

```bash
npm install     # install + link the workspace
npm run build   # build every package (in dependency order)
npm run example # run the Next.js example on http://localhost:3000
```

Configure the example by copying
`examples/nextjs-voicebot/.env.local.example` to `.env.local` and setting
`NEXT_PUBLIC_JARGO_URL` (and the TURN vars when the server runs in Kubernetes).

See each package's README for details. License: BSD-2-Clause.
