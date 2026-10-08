---
title: Develop frontend features
description: Practical workflow for adding map layers, API integrations, and frontend checks.
source_files:
  - my-map/CLAUDE.md
  - my-map/package.json
  - my-map/vite.config.ts
  - my-map/nginx.conf.template
  - my-map/src/composables/mapLayerUtils.ts
  - my-map/src/stores/layerStore.ts
  - my-map/.github/workflows/docker-publish.yml
  - my-map/tests/map-migration.test.mjs
---

## Add a data layer

1. Define the data contract: vector source/layer name or JSON/GeoJSON response, geometry type, properties, and units.
2. Add its API function or tile URL in `src/api/`.
3. Add a composable that creates its MapLibre source/layers once, applies filters/visibility, and handles popups.
4. Expose state and actions through `layerStore.ts`; use `mapLayerUtils.ts` helpers where applicable.
5. Add the control to the relevant sidebar section and translations to both locales.
6. Validate initial load, toggle off/on, filter changes, light/dark switching, and leaving/reopening `/map`.

If the source is new, coordinate the backend migration/import and Martin configuration. A frontend toggle alone cannot make a missing dataset available.

## Add an API path

Use `src/api/httpClient.ts` for authenticated REST requests. It obtains the current Clerk session token and adds the Bearer header. For same-origin endpoints, ensure **both** Vite and nginx have the required proxy route. Otherwise a request may hit SPA fallback and return HTML rather than JSON.

Current GeoPulse proxy families are places, metro, heatmap, parking zones, SofiaPlan, retail listings, and Adres locations. `/api/martin` strips its prefix before reaching Martin. For newer paths such as BulgarianProperties locations, see [known gaps](/operations/known-gaps).

## Component conventions

Use Vue `<script setup lang="ts">`, typed `defineProps`/`defineEmits`, and `withDefaults` when needed. Put reusable controls in `components/ui/` and domain UI in `components/map/`. Keep component styles scoped. Do not put `v-if` and `v-for` on the same element.

Register lifecycle composables during setup, before asynchronous work. Keep native MapLibre objects in shallow refs rather than deeply reactive state. Distinguish data coordinates from screen coordinates and avoid guessing the order of coordinate tuples.

## Checks and delivery

```bash
npm test
npm run build
```

The build runs `vue-tsc -b` before Vite. The regression suite uses Node's module mocks and requires the documented Node version. The existing ESLint configuration needs separate repair: it scans generated output and does not parse the TypeScript source correctly.

The frontend CI workflow builds on `main` and publishes amd64 and arm64 images only for stable Git tags such as `v1.2.3`, producing `kaljo14/my-map:1.2.3`. Clerk's publishable key is passed as a build argument; changing it requires rebuilding the frontend. Runtime upstream URLs are nginx environment variables. `map-infra` pins the deployed frontend by digest, so pushing a new image does not by itself select it for deployment.
