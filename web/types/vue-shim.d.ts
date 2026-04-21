declare module "vue" {
  export function ref<T>(value: T): { value: T };
  export function computed<T>(getter: () => T): { value: T };
  export function defineComponent(options: any): any;
  export function h(type: any, props?: any, children?: any): any;
}
