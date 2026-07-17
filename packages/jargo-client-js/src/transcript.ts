// TranscriptTracker turns a JargoClient's event stream into a conversation
// list. It's framework-agnostic pure logic — the React `useJargoTranscript`
// hook and the `<jargo-transcript>` web component are both thin views over it.

import type { JargoClient } from "./JargoClient";

/** A single line in the conversation. */
export interface TranscriptMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  /** False while a line is still being appended to (streaming / interim). */
  final: boolean;
}

type Listener = (messages: TranscriptMessage[]) => void;

export class TranscriptTracker {
  private messages: TranscriptMessage[] = [];
  private seq = 0;
  private offs: Array<() => void> = [];
  private listeners = new Set<Listener>();

  constructor(private readonly client: JargoClient) {
    this.attach();
  }

  /** The current messages (a new array is produced on every change). */
  getMessages(): TranscriptMessage[] {
    return this.messages;
  }

  /** Subscribe to changes. Returns an unsubscribe function. */
  onChange(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Empty the transcript. */
  clear(): void {
    this.set([]);
  }

  /** Unsubscribe from the client and drop all listeners. */
  destroy(): void {
    this.offs.forEach((off) => off());
    this.offs = [];
    this.listeners.clear();
  }

  private set(next: TranscriptMessage[]): void {
    this.messages = next;
    this.listeners.forEach((fn) => fn(next));
  }

  private id(): string {
    return `m${this.seq++}`;
  }

  private attach(): void {
    const c = this.client;

    this.offs.push(
      c.on("userTranscript", ({ text, final }) => {
        const trimmed = text.trim();
        const last = this.messages[this.messages.length - 1];
        // Update the trailing interim user line in place, if any.
        if (last && last.role === "user" && !last.final) {
          this.set([
            ...this.messages.slice(0, -1),
            { ...last, text, final },
          ]);
        } else if (trimmed) {
          this.set([
            ...this.messages,
            { id: this.id(), role: "user", text, final },
          ]);
        }
      }),
    );

    this.offs.push(
      c.on("botLlmText", ({ text }) => {
        if (!text) return;
        const last = this.messages[this.messages.length - 1];
        if (last && last.role === "agent" && !last.final) {
          this.set([
            ...this.messages.slice(0, -1),
            { ...last, text: last.text + text },
          ]);
        } else {
          this.set([
            ...this.messages,
            { id: this.id(), role: "agent", text, final: false },
          ]);
        }
      }),
    );

    // Fixed bot speech (e.g. a wake-word ack) — its own final line.
    this.offs.push(
      c.on("botTtsText", ({ text }) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        this.set([
          ...this.messages,
          { id: this.id(), role: "agent", text: trimmed, final: true },
        ]);
      }),
    );

    // End of a bot turn: close the current streaming agent line.
    this.offs.push(
      c.on("botStoppedSpeaking", () => {
        const last = this.messages[this.messages.length - 1];
        if (last && last.role === "agent" && !last.final) {
          this.set([
            ...this.messages.slice(0, -1),
            { ...last, final: true },
          ]);
        }
      }),
    );
  }
}
