import { fileURLToPath } from "node:url";

const corePkgDir = fileURLToPath(new URL("../../../core/pkg", import.meta.url));

export default defineNuxtConfig({
  compatibilityDate: "2026-04-21",
  devtools: { enabled: true },
  typescript: {
    strict: true,
  },
  vite: {
    server: {
      fs: {
        allow: [corePkgDir],
      },
    },
  },
});
