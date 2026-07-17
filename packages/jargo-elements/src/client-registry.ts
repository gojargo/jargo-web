// A tiny registry so the client-driven web components can find a JargoClient
// without a framework's context. Set one client for the page:
//
//   import { setJargoClient } from "@gojargo/jargo-elements";
//   setJargoClient(new JargoClient({ baseUrl }));
//
// Individual elements can override it by setting their `.client` property.

import type { JargoClient } from "@gojargo/jargo-client-js";

let current: JargoClient | null = null;
const subscribers = new Set<(client: JargoClient | null) => void>();

/** Set (or clear) the client the jargo web components use by default. */
export function setJargoClient(client: JargoClient | null): void {
  current = client;
  subscribers.forEach((fn) => fn(client));
}

/** The current default client, if any. */
export function getJargoClient(): JargoClient | null {
  return current;
}

/** Subscribe to default-client changes. Returns an unsubscribe function. */
export function subscribeJargoClient(
  fn: (client: JargoClient | null) => void,
): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}
