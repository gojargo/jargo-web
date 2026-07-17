// @gojargo/jargo-client-vue — Vue 3 bindings for the jargo web toolkit, built on
// @gojargo/jargo-client-js (client) and @gojargo/jargo-ui (Orb).

export {
  JargoClientKey,
  provideJargoClient,
  useJargoClient,
  injectJargoClient,
} from "./context";
export {
  useJargoEvent,
  useJargoTransportState,
  useJargoConnection,
  useJargoMicToggle,
} from "./composables";
export { Orb } from "./Orb";

// Re-export the bases for convenience.
export { JargoClient } from "@gojargo/jargo-client-js";
export type {
  JargoClientOptions,
  JargoClientEvents,
  TransportState,
  UserTranscript,
  TextPayload,
  JargoErrorPayload,
} from "@gojargo/jargo-client-js";
export { Orb as OrbEngine, OrbPalettes } from "@gojargo/jargo-ui";
export type { OrbOptions, OrbBlend, OrbPaletteName } from "@gojargo/jargo-ui";
