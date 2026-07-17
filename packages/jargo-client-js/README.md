# @gojargo/jargo-client-js

The **headless, framework-agnostic** browser client for
[jargo](https://github.com/gojargo/jargo) voice servers. It speaks jargo's
WebRTC signaling (`POST /offer`, non-trickle SDP) and the RTVI protocol over a
`"rtvi"` data channel — no Daily/Pipecat SDK dependency, and no UI.

Part of the [`jargo-web`](https://github.com/gojargo/jargo-web) monorepo. UI
lives in [`@gojargo/jargo-ui`](../jargo-ui); framework bindings in
[`@gojargo/jargo-client-react`](../jargo-client-react).

## Install

```bash
npm install @gojargo/jargo-client-js
```

## Usage

```ts
import { JargoClient } from "@gojargo/jargo-client-js";

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

## API

`new JargoClient(options)`; `connect()`, `disconnect()`, `setMicEnabled()`,
`toggleMic()`, `sendMessage(type, data?)`; `state`, `micEnabled`,
`remoteStream`; `on(event, handler)`.

**Events** — `transportStateChanged`, `connected`, `disconnected`, `botReady`,
`userTranscript`, `botTranscript`, `botLlmText`, `botTtsText`,
`user/botStartedSpeaking`, `user/botStoppedSpeaking`, `error`, `serverMessage`,
`remoteTrack`.

## License

BSD-2-Clause. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
