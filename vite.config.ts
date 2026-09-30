/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Pair `npm start` with `npm run dev` (wrangler on 8787) for live API data.
    proxy: { "/api": "http://localhost:8787" },
  },
  // wrangler.jsonc serves assets from ./build.
  build: { outDir: "build" },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "app",
          include: ["src/**/*.test.{ts,tsx}"],
          environment: "jsdom",
          globals: true,
          setupFiles: ["src/setupTests.ts"],
          // Node 25's built-in localStorage global shadows jsdom's (and
          // doesn't work without --localstorage-file).
          execArgv: ["--no-experimental-webstorage"],
        },
      },
      {
        test: {
          name: "worker",
          include: ["worker/**/*.test.ts"],
          environment: "node",
        },
      },
    ],
  },
});
