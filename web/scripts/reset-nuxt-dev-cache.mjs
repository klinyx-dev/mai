import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, "..");
const nuxtAppRoot = path.join(webRoot, "examples", "nuxt-app");
const nuxtEntry = path.join(nuxtAppRoot, "node_modules", "nuxt");

if (!existsSync(nuxtEntry)) {
  console.error(
    "Nuxt example dependencies are missing. Run `pnpm install` in `web/` before starting dev."
  );
  process.exit(1);
}

const targets = [
  path.join(webRoot, "node_modules", ".vite"),
  path.join(webRoot, "node_modules", ".cache", "vite"),
  path.join(nuxtAppRoot, ".nuxt"),
  path.join(nuxtAppRoot, ".output"),
  path.join(nuxtAppRoot, ".nitro"),
  path.join(nuxtAppRoot, "node_modules", ".vite"),
  path.join(nuxtAppRoot, "node_modules", ".cache", "vite"),
];

let removedCount = 0;
for (const target of targets) {
  const existed = existsSync(target);
  rmSync(target, { recursive: true, force: true });
  if (existed) {
    removedCount += 1;
    console.log(`reset: removed ${path.relative(webRoot, target)}`);
  }
}

console.log(
  `Nuxt example cache reset complete. Removed ${removedCount}/${targets.length} cache targets.`
);
