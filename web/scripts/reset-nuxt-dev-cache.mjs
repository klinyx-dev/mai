import { rmSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const nuxtAppRoot = path.join(webRoot, "examples", "nuxt-app");

const targets = [
  path.join(nuxtAppRoot, ".nuxt"),
  path.join(nuxtAppRoot, ".output"),
  path.join(nuxtAppRoot, "node_modules", ".vite"),
];

for (const target of targets) {
  rmSync(target, { recursive: true, force: true });
}

console.log("Nuxt example cache reset complete.");
