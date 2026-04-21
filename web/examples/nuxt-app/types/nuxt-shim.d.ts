declare function defineNuxtPlugin(fn: (...args: any[]) => any): any;
declare function useNuxtApp(): any;

declare module "*.vue" {
  const component: any;
  export default component;
}

declare module "../../../../core/pkg/mai.js" {
  export default function init(options?: unknown): Promise<void>;
  export class WasmBindgenAdapter {
    execute_command_json(input: string): string;
    execute_query_json(input: string): string;
  }
}
