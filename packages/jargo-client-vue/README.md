# @gojargo/jargo-client-vue

**Vue 3 bindings** for the jargo web toolkit — the headless
[`@gojargo/jargo-client-js`](../jargo-client-js) client and the
[`@gojargo/jargo-ui`](../jargo-ui) Orb — for
[jargo](https://github.com/gojargo/jargo) voice servers.

Part of the [`jargo-web`](https://github.com/gojargo/jargo-web) monorepo.

## Install

```bash
npm install @gojargo/jargo-client-vue vue
```

## Usage

Provide a client near the root, then use the composables and `<Orb>` anywhere
below:

```vue
<!-- App.vue -->
<script setup lang="ts">
import { JargoClient, provideJargoClient } from "@gojargo/jargo-client-vue";

const client = new JargoClient({ baseUrl: import.meta.env.VITE_JARGO_URL });
provideJargoClient(client);
</script>

<template>
  <VoiceBot />
</template>
```

```vue
<!-- VoiceBot.vue -->
<script setup lang="ts">
import {
  Orb,
  useJargoConnection,
  useJargoMicToggle,
  useJargoEvent,
  OrbPalettes,
} from "@gojargo/jargo-client-vue";

const { state, connect, disconnect, isConnected } = useJargoConnection();
const mic = useJargoMicToggle();
useJargoEvent("botLlmText", ({ text }) => console.log(text));
</script>

<template>
  <!-- reacts to the bot automatically -->
  <Orb :size="220" :options="{ colors: OrbPalettes.aurora }" />
  <button @click="isConnected ? disconnect() : connect()">{{ state }}</button>
  <button @click="mic.toggle()">{{ mic.enabled.value ? "Mute" : "Unmute" }}</button>
</template>
```

## API

- **`provideJargoClient(client)`** / **`useJargoClient()`** — provide/inject the client.
- **`useJargoConnection()`** — `{ state, error, connect, disconnect, isConnected, isReady, isConnecting }` (reactive).
- **`useJargoTransportState()`** — `Ref<TransportState>`.
- **`useJargoMicToggle()`** — `{ enabled, toggle, setEnabled }`.
- **`useJargoEvent(event, handler)`** — subscribe for the component's lifetime.
- **`<Orb>`** — props: `options` (engine options), `size`/`width`/`height`, `level`, `reactToBot`, `paused`.

## License

BSD-2-Clause. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
