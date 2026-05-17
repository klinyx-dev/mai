import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const entrypoint = path.join(packageRoot, "src/styles/index.css");
const outputFile = path.join(packageRoot, "dist/styles.css");
const localImportPattern = /^@import\s+["'](\.[^"']+)["'];\s*$/gm;

async function inlineCss(filePath, seen = new Set()) {
  const absolutePath = path.resolve(filePath);
  if (seen.has(absolutePath)) {
    throw new Error(`Circular CSS import detected: ${absolutePath}`);
  }

  seen.add(absolutePath);
  const source = await readFile(absolutePath, "utf8");
  const directory = path.dirname(absolutePath);
  let output = "";
  let cursor = 0;

  for (const match of source.matchAll(localImportPattern)) {
    output += source.slice(cursor, match.index);
    output += await inlineCss(path.join(directory, match[1]), new Set(seen));
    output += "\n";
    cursor = match.index + match[0].length;
  }

  output += source.slice(cursor);
  return output;
}

const bundledCss = await inlineCss(entrypoint);

if (/^@import\s+["']\.\//m.test(bundledCss)) {
  throw new Error("Generated CSS still contains unresolved local imports.");
}

await mkdir(path.dirname(outputFile), { recursive: true });
await writeFile(outputFile, `${bundledCss.trim()}\n`);
