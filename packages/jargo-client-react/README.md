# @gojargo/jargo-client-react

**React bindings** for
[`@gojargo/jargo-client-js`](https://github.com/gojargo/jargo-client-js) — the
browser client (classic WebRTC) for [jargo](https://github.com/gojargo/jargo)
voice servers. It speaks jargo's WebRTC signaling (`POST /offer`, non-trickle
SDP) and the RTVI protocol over a `"rtvi"` data channel — no Daily/Pipecat SDK
dependency.

The React package is a thin layer on top of the base JS library; installing it
pulls in `@gojargo/jargo-client-js` automatically.

- **`@gojargo/jargo-client-react`** — re-exports the base library (`JargoClient`,
  types, and the `Orb` engine).
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
import { Orb } from "@gojargo/jargo-client-react/react";

// Reacts to the bot when inside a <JargoClientProvider>:
<Orb size={220} colors={["#22d3ee", "#6366f1", "#a855f7"]} />

// Standalone, manually driven:
<Orb size={160} level={0.7} reactToBot={false} />
```

`<Orb />` forwards all engine options (`rings`, `radius`, `colors`, `speed`,
`reactivity`, `glow`, `core`, `blend`, …) plus `size`/`width`/`height`,
`level`, `reactToBot`, and `paused`.

## API

**Core** — `new JargoClient(options)`; `connect()`, `disconnect()`,
`setMicEnabled()`, `toggleMic()`, `sendMessage(type, data?)`; `state`,
`micEnabled`, `remoteStream`; `on(event, handler)` for the events below.

**Events** — `transportStateChanged`, `connected`, `disconnected`, `botReady`,
`userTranscript` (`{ text, final }`), `botTranscript`, `botLlmText`,
`botTtsText`, `user/botStartedSpeaking`, `user/botStoppedSpeaking`, `error`,
`serverMessage` (raw, incl. non-RTVI like jargo's `set_volume`), `remoteTrack`.

**React** — `JargoClientProvider`, `JargoClientAudio`, `VoiceVisualizer`,
`Orb`, `useJargoClient`, `useJargoConnection`, `useJargoTransportState`,
`useJargoMicToggle`, `useJargoEvent`.

## Example

A runnable Next.js voicebot lives in [`examples/nextjs-voicebot`](./examples/nextjs-voicebot).

## License

BSD-2-Clause. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
