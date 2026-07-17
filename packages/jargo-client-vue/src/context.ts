import { inject, provide, type InjectionKey } from "vue";
import type { JargoClient } from "@gojargo/jargo-client-js";

/** Injection key the {@link provideJargoClient} / {@link useJargoClient} pair uses. */
export const JargoClientKey: InjectionKey<JargoClient> = Symbol("jargo-client");

/**
 * Provide a {@link JargoClient} to descendant components. Call it in the
 * `setup()` of a component that wraps your app:
 *
 *   provideJargoClient(client);
 */
export function provideJargoClient(client: JargoClient): void {
  provide(JargoClientKey, client);
}

/** The provided {@link JargoClient}. Throws if none was provided above. */
export function useJargoClient(): JargoClient {
  const client = inject(JargoClientKey, null);
  if (!client) {
    throw new Error(
      "useJargoClient() requires a client provided via provideJargoClient()",
    );
  }
  return client;
}

/** Like {@link useJargoClient} but returns null instead of throwing. */
export function injectJargoClient(): JargoClient | null {
  return inject(JargoClientKey, null);
}
