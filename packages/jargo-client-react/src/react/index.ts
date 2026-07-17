"use client";

export { JargoClientProvider } from "./JargoClientProvider";
export type { JargoClientProviderProps } from "./JargoClientProvider";
export { JargoClientAudio } from "./JargoClientAudio";
export type { JargoClientAudioProps } from "./JargoClientAudio";
export { VoiceVisualizer } from "./VoiceVisualizer";
export type { VoiceVisualizerProps } from "./VoiceVisualizer";
export { Orb } from "./Orb";
export type { OrbProps } from "./Orb";
export {
  useJargoClient,
  useJargoEvent,
  useJargoTransportState,
  useJargoConnection,
  useJargoMicToggle,
} from "./hooks";

// Re-export the base libraries (client + UI) so apps can import everything from
// "@gojargo/jargo-client-react/react" if they prefer a single entry.
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
