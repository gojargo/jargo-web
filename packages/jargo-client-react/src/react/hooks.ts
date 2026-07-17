"use client";

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import type {
  JargoClient,
  JargoClientEvents,
  TransportState,
} from "@gojargo/jargo-client-js";
import { JargoClientContext } from "./context";

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

/** A single line in a {@link useJargoTranscript} conversation. */
export interface TranscriptMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  /** False while a line is still being appended to (streaming / interim). */
  final: boolean;
}

/**
 * Accumulates the conversation from client events into a message list: interim
 * user transcripts update in place then finalize; streamed `botLlmText` tokens
 * coalesce into the current agent line; fixed `botTtsText` becomes its own line;
 * and `botStoppedSpeaking` closes the current agent turn. Returns the messages
 * and a `clear()`.
 */
export function useJargoTranscript(): {
  messages: TranscriptMessage[];
  clear: () => void;
} {
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const idRef = useRef(0);
  const nextId = useCallback(() => `m${idRef.current++}`, []);

  useJargoEvent("userTranscript", ({ text, final }) => {
    const trimmed = text.trim();
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      // Update the trailing interim user line in place, if any.
      if (last && last.role === "user" && !last.final) {
        return [...prev.slice(0, -1), { ...last, text, final }];
      }
      if (!trimmed) return prev;
      return [...prev, { id: nextId(), role: "user", text, final }];
    });
  });

  useJargoEvent("botLlmText", ({ text }) => {
    if (!text) return;
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === "agent" && !last.final) {
        return [...prev.slice(0, -1), { ...last, text: last.text + text }];
      }
      return [...prev, { id: nextId(), role: "agent", text, final: false }];
    });
  });

  // Fixed bot speech (e.g. a wake-word ack) — its own final line.
  useJargoEvent("botTtsText", ({ text }) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "agent", text: trimmed, final: true },
    ]);
  });

  // End of a bot turn: close the current streaming agent line.
  useJargoEvent("botStoppedSpeaking", () => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === "agent" && !last.final) {
        return [...prev.slice(0, -1), { ...last, final: true }];
      }
      return prev;
    });
  });

  const clear = useCallback(() => setMessages([]), []);
  return { messages, clear };
}
