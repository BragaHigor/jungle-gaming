import { defineConfig } from "vitest/config";
import base from "./vitest.config";

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ["tests/**/*.integration.test.ts"],
    exclude: [],
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
});
