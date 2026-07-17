import type { JargoClient } from "@gojargo/jargo-client-js";
import { getJargoClient, subscribeJargoClient } from "./client-registry";

/**
 * Base class for client-driven jargo web components. It resolves the client
 * (an explicit `.client` property, else the {@link setJargoClient} registry),
 * re-binds when it changes, and renders in light DOM so the app's
 * `@gojargo/jargo-ui/theme.css` styles apply.
 */
export abstract class JargoClientElement extends HTMLElement {
  /** The bound client, available to subclasses in {@link bind}/{@link render}. */
  protected jargo: JargoClient | null = null;

  private clientOverride: JargoClient | null = null;
  private offRegistry?: () => void;
  private offs: Array<() => void> = [];

  /** Set a specific client, overriding the global {@link setJargoClient} registry. */
  set client(client: JargoClient | null) {
    this.clientOverride = client;
    this.rebind();
  }
  get client(): JargoClient | null {
    return this.clientOverride ?? getJargoClient();
  }

  connectedCallback(): void {
    this.offRegistry = subscribeJargoClient(() => {
      if (!this.clientOverride) this.rebind();
    });
    this.rebind();
  }

  disconnectedCallback(): void {
    this.offRegistry?.();
    this.teardown();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  /** Track a cleanup (e.g. an event unsubscribe) tied to the current binding. */
  protected track(off: () => void): void {
    this.offs.push(off);
  }

  private rebind(): void {
    this.teardown();
    this.jargo = this.client;
    if (this.jargo) this.bind(this.jargo);
    this.render();
  }

  private teardown(): void {
    this.offs.forEach((off) => off());
    this.offs = [];
  }

  /** Subscribe to client events here via {@link track}; called on each (re)bind. */
  protected bind(_client: JargoClient): void {}

  /** Render the element's light-DOM markup; called on bind and attribute changes. */
  protected abstract render(): void;
}

export function escapeHtml(s: string): string {
  return s.replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string,
  );
}

export function micIcon(muted: boolean): string {
  return `<svg class="jargo-mic-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="21"/>${
    muted ? '<line x1="3" y1="3" x2="21" y2="21"/>' : ""
  }</svg>`;
}
