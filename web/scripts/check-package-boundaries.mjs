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
const packageInternalImportPatterns = [
  /from\s*["']@mai\/mai-web-core\/(?!package\.json["'])[^"']+["']/,
  /from\s*["']@mai\/mai-wasm-adapter\/(?!package\.json["'])[^"']+["']/,
  /from\s*["']@mai\/mai-ui-vue\/(?!styles\.css["'])[^"']+["']/,
  /import\s*\(\s*["']@mai\/mai-web-core\/(?!package\.json["'])[^"']+["']\s*\)/,
  /import\s*\(\s*["']@mai\/mai-wasm-adapter\/(?!package\.json["'])[^"']+["']\s*\)/,
  /import\s*\(\s*["']@mai\/mai-ui-vue\/(?!styles\.css["'])[^"']+["']\s*\)/,
  /require\s*\(\s*["']@mai\/mai-web-core\/(?!package\.json["'])[^"']+["']\s*\)/,
  /require\s*\(\s*["']@mai\/mai-wasm-adapter\/(?!package\.json["'])[^"']+["']\s*\)/,
  /require\s*\(\s*["']@mai\/mai-ui-vue\/(?!styles\.css["'])[^"']+["']\s*\)/,
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
  const hasPackageInternalImportViolation =
    packageInternalImportPatterns.some((pattern) => pattern.test(content));
  if (hasImportViolation || hasPackageInternalImportViolation) {
    violations.push(path.relative(repoWebRoot, filePath));
  }
}

if (violations.length > 0) {
  const lines = [
    "Boundary check failed: app source must use documented package entrypoints.",
    ...violations.map((value) => `- ${value}`),
  ];
  console.error(lines.join("\n"));
  process.exit(1);
}

console.log("Boundary check passed: app source uses documented package entrypoints.");
