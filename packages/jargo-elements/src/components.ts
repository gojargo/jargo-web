import type { JargoClient, TransportState } from "@gojargo/jargo-client-js";
import { TranscriptTracker, type TranscriptMessage } from "@gojargo/jargo-client-js";
import { JargoClientElement, escapeHtml, micIcon } from "./JargoClientElement";

const isConnected = (s: TransportState) => s === "connected" || s === "ready";

/** `<jargo-connect-button>` — start/end the conversation, following the state. */
export class JargoConnectButtonElement extends JargoClientElement {
  static readonly observedAttributes = [
    "label-idle",
    "label-connecting",
    "label-connected",
  ];
  private state: TransportState = "disconnected";

  protected bind(client: JargoClient): void {
    this.state = client.state;
    this.track(
      client.on("transportStateChanged", (s) => {
        this.state = s;
        this.render();
      }),
    );
  }

  protected render(): void {
    const conn = isConnected(this.state);
    const connecting = this.state === "connecting";
    const label = conn
      ? (this.getAttribute("label-connected") ?? "End conversation")
      : connecting
        ? (this.getAttribute("label-connecting") ?? "Connecting…")
        : (this.getAttribute("label-idle") ?? "Start conversation");
    this.innerHTML = `<button class="jargo-btn ${
      conn ? "jargo-btn--danger" : "jargo-btn--primary"
    }" ${connecting ? "disabled aria-busy='true'" : ""}>${
      connecting ? '<span class="jargo-spinner"></span>' : ""
    }${escapeHtml(label)}</button>`;
    const btn = this.querySelector("button");
    if (btn) {
      btn.onclick = () => {
        const c = this.jargo;
        if (!c) return;
        if (isConnected(c.state)) c.disconnect();
        else void c.connect().catch(() => {});
      };
    }
  }
}

/** `<jargo-mic-button>` — mute/unmute the microphone. */
export class JargoMicButtonElement extends JargoClientElement {
  static readonly observedAttributes = ["label-mute", "label-unmute"];
  private state: TransportState = "disconnected";
  private enabled = true;

  protected bind(client: JargoClient): void {
    this.state = client.state;
    this.enabled = client.micEnabled;
    this.track(
      client.on("transportStateChanged", (s) => {
        this.state = s;
        this.enabled = client.micEnabled;
        this.render();
      }),
    );
  }

  protected render(): void {
    const conn = isConnected(this.state);
    const label = this.enabled
      ? (this.getAttribute("label-mute") ?? "Mute")
      : (this.getAttribute("label-unmute") ?? "Unmute");
    this.innerHTML = `<button class="jargo-btn jargo-btn--ghost" ${
      conn ? "" : "disabled"
    } aria-pressed="${!this.enabled}" data-muted="${!this.enabled}">${micIcon(
      !this.enabled,
    )}${escapeHtml(label)}</button>`;
    const btn = this.querySelector("button");
    if (btn) {
      btn.onclick = () => {
        const c = this.jargo;
        if (!c) return;
        this.enabled = c.toggleMic();
        this.render();
      };
    }
  }
}

const STATUS_LABELS: Record<TransportState, string> = {
  disconnected: "Offline",
  connecting: "Connecting…",
  connected: "Connected",
  ready: "Live",
  error: "Error",
};

/** `<jargo-status>` — a badge reflecting the connection state. */
export class JargoStatusElement extends JargoClientElement {
  static readonly observedAttributes = [
    "label-disconnected",
    "label-connecting",
    "label-connected",
    "label-ready",
    "label-error",
  ];
  private state: TransportState = "disconnected";

  protected bind(client: JargoClient): void {
    this.state = client.state;
    this.track(
      client.on("transportStateChanged", (s) => {
        this.state = s;
        this.render();
      }),
    );
  }

  protected render(): void {
    const label =
      this.getAttribute(`label-${this.state}`) ?? STATUS_LABELS[this.state];
    this.innerHTML = `<span class="jargo-status jargo-status--${this.state}" role="status"><span class="jargo-status__dot"></span>${escapeHtml(
      label,
    )}</span>`;
  }
}

/**
 * `<jargo-transcript>` — an auto-scrolling message list built from the shared
 * {@link TranscriptTracker}. Size it with CSS (defaults to `display:block`).
 */
export class JargoTranscriptElement extends JargoClientElement {
  static readonly observedAttributes = ["empty-label"];
  private tracker: TranscriptTracker | null = null;
  private messages: TranscriptMessage[] = [];

  constructor() {
    super();
    this.style.display = "block";
  }

  protected bind(client: JargoClient): void {
    const tracker = new TranscriptTracker(client);
    this.tracker = tracker;
    this.messages = tracker.getMessages();
    this.track(
      tracker.onChange((m) => {
        this.messages = m;
        this.render();
      }),
    );
    this.track(() => {
      tracker.destroy();
      this.tracker = null;
    });
  }

  protected render(): void {
    const empty = this.getAttribute("empty-label") ?? "No messages yet.";
    const body = this.messages.length
      ? this.messages
          .map(
            (m) =>
              `<div class="jargo-msg jargo-msg--${m.role}" data-streaming="${!m.final}"><span class="jargo-msg__role">${
                m.role === "user" ? "You" : "Assistant"
              }</span><span class="jargo-msg__text">${escapeHtml(m.text)}</span></div>`,
          )
          .join("")
      : `<p class="jargo-transcript__empty">${escapeHtml(empty)}</p>`;
    this.innerHTML = `<div class="jargo-transcript" role="log" aria-live="polite" aria-relevant="additions text" style="height:100%">${body}</div>`;
    const list = this.querySelector<HTMLElement>(".jargo-transcript");
    if (list) list.scrollTop = list.scrollHeight;
  }
}
