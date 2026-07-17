import { defineConfig } from "tsup";

// The base library (@gojargo/jargo-client-js) is a runtime dependency, kept
// external so it isn't bundled into these outputs.
const external = ["@gojargo/jargo-client-js"];

// Two entry points: `.` re-exports the base library (no "use client", usable in
// any JS env), while `./react` holds the React bindings with the directive
// stamped on so Next.js App Router treats them as client components.
export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
    target: "es2020",
    external,
  },
  {
    entry: { react: "src/react/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    target: "es2020",
    external: [...external, "react", "react-dom"],
    banner: { js: '"use client";' },
  },
]);
