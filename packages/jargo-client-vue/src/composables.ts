import { computed, onBeforeUnmount, onMounted, ref, type Ref } from "vue";
import type { JargoClientEvents, TransportState } from "@gojargo/jargo-client-js";
import { useJargoClient } from "./context";

/**
 * Subscribe to a typed client event for the component's lifetime.
 */
export function useJargoEvent<K extends keyof JargoClientEvents>(
  event: K,
  handler: (payload: JargoClientEvents[K]) => void,
): void {
  const client = useJargoClient();
  let off: (() => void) | undefined;
  onMounted(() => {
    off = client.on(event, handler);
  });
  onBeforeUnmount(() => off?.());
}

/** The current transport state as a reactive ref. */
export function useJargoTransportState(): Ref<TransportState> {
  const client = useJargoClient();
  const state = ref<TransportState>(client.state);
  let off: (() => void) | undefined;
  onMounted(() => {
    state.value = client.state;
    off = client.on("transportStateChanged", (s) => (state.value = s));
  });
  onBeforeUnmount(() => off?.());
  return state;
}

/** Connect / disconnect helpers with reactive state and flags. */
export function useJargoConnection() {
  const client = useJargoClient();
  const state = useJargoTransportState();
  const error = ref<Error | null>(null);

  const connect = async () => {
    error.value = null;
    try {
      await client.connect();
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
    }
  };
  const disconnect = () => client.disconnect();

  return {
    state,
    error,
    connect,
    disconnect,
    isConnected: computed(
      () => state.value === "connected" || state.value === "ready",
    ),
    isReady: computed(() => state.value === "ready"),
    isConnecting: computed(() => state.value === "connecting"),
  };
}

/** Microphone enable/disable state, synced with the client. */
export function useJargoMicToggle() {
  const client = useJargoClient();
  const enabled = ref<boolean>(client.micEnabled);
  let off: (() => void) | undefined;
  onMounted(() => {
    // The mic track is (re)created on connect, so resync on state changes.
    off = client.on("transportStateChanged", () => {
      enabled.value = client.micEnabled;
    });
  });
  onBeforeUnmount(() => off?.());

  const toggle = () => {
    enabled.value = client.toggleMic();
  };
  const setEnabled = (v: boolean) => {
    client.setMicEnabled(v);
    enabled.value = v;
  };
  return { enabled, toggle, setEnabled };
}
