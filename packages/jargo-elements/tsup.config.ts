import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", define: "src/define.ts" },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "es2020",
  external: ["@gojargo/jargo-ui"],
});
