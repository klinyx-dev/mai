import type { JsonAdapter } from "@mai/mai-web-core";

const DEFAULT_WASM_MODULE_PATH = "../../../../core/pkg/mai.js";

export interface WasmAdapterFactoryOptions {
  wasmModulePath?: string;
}

interface WasmModule {
  default: (moduleOrPath?: unknown) => Promise<unknown>;
  WasmBindgenAdapter: new () => JsonAdapter;
}

let initializedPromise: Promise<void> | null = null;

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function importWasmModule(modulePath: string): Promise<WasmModule> {
  let imported: unknown;
  try {
    imported = await import(/* @vite-ignore */ modulePath);
  } catch (error) {
    throw new Error(
      `mai wasm adapter import failed for "${modulePath}": ${toMessage(error)}`
    );
  }

  if (!imported || typeof imported !== "object") {
    throw new Error(
      `mai wasm adapter module is invalid for "${modulePath}": expected object export`
    );
  }

  const wasmModule = imported as Partial<WasmModule>;
  if (typeof wasmModule.default !== "function") {
    throw new Error(
      `mai wasm adapter module is invalid for "${modulePath}": missing default init export`
    );
  }

  if (typeof wasmModule.WasmBindgenAdapter !== "function") {
    throw new Error(
      `mai wasm adapter module is invalid for "${modulePath}": missing WasmBindgenAdapter export`
    );
  }

  return wasmModule as WasmModule;
}

export async function createWasmAdapter(
  options: WasmAdapterFactoryOptions = {}
): Promise<JsonAdapter> {
  const modulePath = options.wasmModulePath ?? DEFAULT_WASM_MODULE_PATH;
  const wasmModule = await importWasmModule(modulePath);

  if (!initializedPromise) {
    initializedPromise = wasmModule
      .default()
      .then(() => undefined)
      .catch((error) => {
        initializedPromise = null;
        throw new Error(`mai wasm adapter init failed: ${toMessage(error)}`);
      });
  }

  await initializedPromise;

  try {
    return new wasmModule.WasmBindgenAdapter();
  } catch (error) {
    throw new Error(`mai wasm adapter construction failed: ${toMessage(error)}`);
  }
}
