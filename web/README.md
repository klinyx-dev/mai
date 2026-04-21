# mai web workspace

Nuxt-first web packages with framework-reusable boundaries.

## Packages

- `@mai/mai-web-core`: framework-agnostic TypeScript runtime/client contracts for wasm JSON boundary.
- `@mai/mai-ui-vue`: Vue 3 UI package (Nuxt compatible) built on top of `mai-web-core`.

## Authority model

Backend remains the source of truth for synchronized patient/doctor state. These packages provide UI behavior, request/response shaping, and local interaction helpers.

## Start

```bash
cd web
npm install
npm run build
```
