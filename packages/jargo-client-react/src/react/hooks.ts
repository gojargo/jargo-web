"use client";

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  TranscriptTracker,
  type JargoClient,
  type JargoClientEvents,
  type TranscriptMessage,
  type TransportState,
} from "@gojargo/jargo-client-js";
import { JargoClientContext } from "./context";

export type { TranscriptMessage };

/** The {@link JargoClient} from the nearest provider. Throws if absent. */
export function useJargoClient(): JargoClient {
  const client = useContext(JargoClientContext);
  if (!client) {
    throw new Error("useJargoClient must be used within <JargoClientProvider>");
  }
  return client;
}

/**
 * Subscribe to a typed client event for the lifetime of the component. The
 * handler may change between renders without re-subscribing.
 */
export function useJargoEvent<K extends keyof JargoClientEvents>(
  event: K,
  handler: (payload: JargoClientEvents[K]) => void,
): void {
  const client = useJargoClient();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    return client.on(event, (p) => ref.current(p));
  }, [client, event]);
}

/** The current transport state, re-rendering on every change. */
export function useJargoTransportState(): TransportState {
  const client = useJargoClient();
  const [state, setState] = useState<TransportState>(client.state);
  useEffect(() => {
    setState(client.state);
    return client.on("transportStateChanged", setState);
  }, [client]);
  return state;
}

/** Convenience wrapper around `connect()` / `disconnect()` with a busy flag. */
export function useJargoConnection() {
  const client = useJargoClient();
  const state = useJargoTransportState();
  const [error, setError] = useState<Error | null>(null);
  const connect = useCallback(async () => {
    setError(null);
    try {
      await client.connect();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [client]);
  const disconnect = useCallback(() => client.disconnect(), [client]);
  return {
    state,
    error,
    connect,
    disconnect,
    isConnected: state === "connected" || state === "ready",
    isReady: state === "ready",
    isConnecting: state === "connecting",
  };
}

/** Microphone enable/disable state, synced with the client. */
export function useJargoMicToggle() {
  const client = useJargoClient();
  const [enabled, setEnabled] = useState<boolean>(client.micEnabled);
  // The mic track is (re)created on connect, so resync on state changes.
  useJargoEvent("transportStateChanged", () => setEnabled(client.micEnabled));
  const toggle = useCallback(() => {
    setEnabled(client.toggleMic());
  }, [client]);
  const set = useCallback(
    (v: boolean) => {
      client.setMicEnabled(v);
      setEnabled(v);
    },
    [client],
  );
  return { enabled, toggle, setEnabled: set };
}

/**
 * Accumulates the conversation from client events into a message list, via the
 * framework-agnostic {@link TranscriptTracker}: interim user transcripts update
 * in place then finalize; streamed `botLlmText` tokens coalesce into the current
 * agent line; fixed `botTtsText` becomes its own line; and `botStoppedSpeaking`
 * closes the current agent turn. Returns the messages and a `clear()`.
 */
export function useJargoTranscript(): {
  messages: TranscriptMessage[];
  clear: () => void;
} {
  const client = useJargoClient();
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const trackerRef = useRef<TranscriptTracker | null>(null);

  useEffect(() => {
    const tracker = new TranscriptTracker(client);
    trackerRef.current = tracker;
    setMessages(tracker.getMessages());
    const off = tracker.onChange(setMessages);
    return () => {
      off();
      tracker.destroy();
      trackerRef.current = null;
    };
  }, [client]);

  const clear = useCallback(() => trackerRef.current?.clear(), []);
  return { messages, clear };
}
