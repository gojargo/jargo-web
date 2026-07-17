# @gojargo/jargo-client-react

**React bindings** for the jargo web toolkit — the headless
[`@gojargo/jargo-client-js`](../jargo-client-js) client and the
[`@gojargo/jargo-ui`](../jargo-ui) Orb — for
[jargo](https://github.com/gojargo/jargo) voice servers. The client speaks
jargo's WebRTC signaling (`POST /offer`, non-trickle SDP) and the RTVI protocol
over a `"rtvi"` data channel — no Daily/Pipecat SDK dependency.

The React package is a thin layer on top of those bases; installing it pulls
them in automatically. Part of the
[`jargo-web`](https://github.com/gojargo/jargo-web) monorepo.

- **`@gojargo/jargo-client-react`** — re-exports the bases (`JargoClient`, types,
  the `Orb` engine, and `OrbPalettes`).
- **`@gojargo/jargo-client-react/react`** — provider, hooks, audio, visualizer,
  and the React `<Orb />`.

## Install

```bash
npm install @gojargo/jargo-client-react
```

## Core usage

```ts
import { JargoClient } from "@gojargo/jargo-client-react";

const client = new JargoClient({
  baseUrl: "https://jargo.example.com",
  deviceId: "kitchen",
  // For a server behind NAT (e.g. Kubernetes), pass the same TURN it relays through:
  iceServers: [{ urls: "turn:1.2.3.4:3478?transport=udp", username: "jargo", credential: "secret" }],
});

client.on("userTranscript", ({ text, final }) => final && console.log("you:", text));
client.on("botLlmText", ({ text }) => console.log("bot:", text));

await client.connect();   // captures mic, runs the handshake
// ...
await client.disconnect();
```

## React usage

```tsx
"use client";
import {
  JargoClient,
  JargoClientProvider,
  JargoClientAudio,
  VoiceVisualizer,
  useJargoConnection,
  useJargoEvent,
  useJargoMicToggle,
} from "@gojargo/jargo-client-react/react";

const client = new JargoClient({ baseUrl: process.env.NEXT_PUBLIC_JARGO_URL! });

function Controls() {
  const { state, connect, disconnect, isConnected } = useJargoConnection();
  const mic = useJargoMicToggle();
  useJargoEvent("botLlmText", ({ text }) => console.log(text));
  return (
    <>
      <button onClick={isConnected ? disconnect : connect}>{state}</button>
      <button onClick={mic.toggle}>{mic.enabled ? "Mute" : "Unmute"}</button>
      <VoiceVisualizer />
    </>
  );
}

export default function App() {
  return (
    <JargoClientProvider client={client}>
      <Controls />
      <JargoClientAudio />
    </JargoClientProvider>
  );
}
```

## Orb

`<Orb />` is an animated orb of moving lines (from the base library's `Orb`
engine). Inside a `<JargoClientProvider>` it reacts to the bot's voice
automatically; standalone, drive it with a `level` (0..1) or let it idle.

```tsx
import { Orb, OrbPalettes } from "@gojargo/jargo-client-react/react";

// Reacts to the bot when inside a <JargoClientProvider>:
<Orb size={220} colors={OrbPalettes.aurora} />

// Standalone, manually driven:
<Orb size={160} level={0.7} reactToBot={false} />
```

`<Orb />` forwards all engine options (`rings`, `radius`, `colors`, `speed`,
`reactivity`, `glow`, `core`, `blend`, …) plus `size`/`width`/`height`,
`level`, `reactToBot`, and `paused`. Built-in palettes are exported as
`OrbPalettes` (`spectrum`, `aurora`, `ember`, `mono`).

## Voice-UI components

Ready-made, themeable components for building a voice UI. Import the stylesheet
once, then compose them inside a `<JargoClientProvider>`:

```tsx
import "@gojargo/jargo-client-react/styles.css";
import {
  ConnectButton,
  MicButton,
  ConnectionStatus,
  Transcript,
} from "@gojargo/jargo-client-react/react";

<ConnectionStatus />
<Transcript emptyLabel="Say hello to start…" />
<ConnectButton />   {/* Start / End conversation, follows the connection state */}
<MicButton />       {/* mute / unmute */}
```

- **`ConnectButton`** — connect when idle, disconnect when live; shows a spinner while connecting. Props: `labels`.
- **`MicButton`** — mic mute/unmute toggle. Props: `labels`, `alwaysEnabled`.
- **`ConnectionStatus`** — a state badge. Props: `labels`.
- **`Transcript`** — auto-scrolling, `aria-live` message list. Built from events via `useJargoTranscript` (or pass `messages` to control it). Props: `emptyLabel`, `autoScroll`, `roleLabels`, `messages`.
- **`Message`** — a single user/agent bubble.
- **`useJargoTranscript()`** — `{ messages, clear }`; accumulates interim user transcripts + streamed `botLlmText` + `botTtsText` into a `TranscriptMessage[]`.

**Theming.** Every component is styled through `--jargo-*` CSS variables
(`--jargo-accent`, `--jargo-danger`, `--jargo-radius`, `--jargo-surface`,
`--jargo-border`, `--jargo-text`, `--jargo-muted`, `--jargo-bubble`). Defaults
adapt to the OS light/dark scheme; set any token on an ancestor to restyle. All
components also accept `className`.

## API

**Core** — `new JargoClient(options)`; `connect()`, `disconnect()`,
`setMicEnabled()`, `toggleMic()`, `sendMessage(type, data?)`; `state`,
`micEnabled`, `remoteStream`; `on(event, handler)` for the events below.

**Events** — `transportStateChanged`, `connected`, `disconnected`, `botReady`,
`userTranscript` (`{ text, final }`), `botTranscript`, `botLlmText`,
`botTtsText`, `user/botStartedSpeaking`, `user/botStoppedSpeaking`, `error`,
`serverMessage` (raw, incl. non-RTVI like jargo's `set_volume`), `remoteTrack`.

**React** — `JargoClientProvider`, `JargoClientAudio`, `VoiceVisualizer`,
`Orb`; components `ConnectButton`, `MicButton`, `ConnectionStatus`,
`Transcript`, `Message`; hooks `useJargoClient`, `useJargoConnection`,
`useJargoTransportState`, `useJargoMicToggle`, `useJargoEvent`,
`useJargoTranscript`.

## Example

A runnable Next.js voicebot lives in [`examples/nextjs-voicebot`](./examples/nextjs-voicebot).

## License

BSD-2-Clause. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
