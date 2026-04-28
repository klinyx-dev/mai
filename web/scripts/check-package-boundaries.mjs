import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const repoWebRoot = process.cwd();
const nuxtAppRoot = path.join(repoWebRoot, "examples", "nuxt-app");
const allowedExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".vue",
]);
const importLikePatterns = [
  /from\s*["'][^"']*core\/pkg/i,
  /from\s*["'][^"']*core\\pkg/i,
  /import\s*\(\s*["'][^"']*core\/pkg/i,
  /import\s*\(\s*["'][^"']*core\\pkg/i,
  /require\s*\(\s*["'][^"']*core\/pkg/i,
  /require\s*\(\s*["'][^"']*core\\pkg/i,
  /from\s*["'][^"']*mai_bg\.wasm/i,
  /import\s*\(\s*["'][^"']*mai_bg\.wasm/i,
];

function collectFiles(rootDir) {
  const results = [];
  const entries = readdirSync(rootDir);
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (
        entry === "node_modules" ||
        entry === ".nuxt" ||
        entry === ".output" ||
        entry === "dist"
      ) {
        continue;
      }
      results.push(...collectFiles(fullPath));
      continue;
    }

    const extension = path.extname(fullPath);
    if (allowedExtensions.has(extension)) {
      results.push(fullPath);
    }
  }
  return results;
}

const violations = [];
for (const filePath of collectFiles(nuxtAppRoot)) {
  const content = readFileSync(filePath, "utf8");
  const hasImportViolation = importLikePatterns.some((pattern) =>
    pattern.test(content)
  );
  if (hasImportViolation) {
    violations.push(path.relative(repoWebRoot, filePath));
  }
}

if (violations.length > 0) {
  const lines = [
    "Boundary check failed: direct core/pkg usage is not allowed in app source.",
    ...violations.map((value) => `- ${value}`),
  ];
  console.error(lines.join("\n"));
  process.exit(1);
}

console.log("Boundary check passed: no direct core/pkg imports in app source.");
