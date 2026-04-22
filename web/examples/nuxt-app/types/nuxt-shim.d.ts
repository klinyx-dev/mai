declare function defineNuxtPlugin(fn: (...args: any[]) => any): any;
declare function useNuxtApp(): any;

declare module "*.vue" {
  const component: any;
  export default component;
}
