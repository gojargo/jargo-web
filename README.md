# jargo-web

The web toolkit for [jargo](https://github.com/gojargo/jargo) voice servers: a
headless client, a framework-agnostic UI (the **Orb**), and framework bindings —
all in one npm-workspaces monorepo, layered like pipecat's client-js /
client-react so the core can be reused anywhere.

## Packages

| Package | What it is |
|---|---|
| **[`@gojargo/jargo-client-js`](./packages/jargo-client-js)** | Headless WebRTC/RTVI client. No UI, no framework. |
| **[`@gojargo/jargo-ui`](./packages/jargo-ui)** | Framework-agnostic UI — the **Orb** (audio-reactive moving lines). |
| **[`@gojargo/jargo-client-react`](./packages/jargo-client-react)** | React provider, hooks, and `<Orb />`. |
| **[`@gojargo/jargo-elements`](./packages/jargo-elements)** | Web components — `<jargo-orb>`. |

Dependency flow: `jargo-ui` and `jargo-client-js` are the bases;
`jargo-client-react` builds on both; `jargo-elements` builds on `jargo-ui`.
(Vue and other bindings follow the same shape.)

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
