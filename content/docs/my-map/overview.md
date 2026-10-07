---
title: Frontend overview
description: Vue application structure, navigation, state, and feature ownership in my-map.
source_files:
  - my-map/package.json
  - my-map/src/main.ts
  - my-map/src/App.vue
  - my-map/src/router/index.ts
  - my-map/src/components/InteractiveMap.vue
  - my-map/src/stores/layerStore.ts
  - my-map/src/composables/usePlacesManager.ts
  - my-map/src/composables/useShopManagement.ts
---

`my-map` is the browser application. Its stack is Vue 3, TypeScript, Vite, Pinia, Vue Router, Clerk, and Vue-i18n. The map uses MapLibre GL JS 5 with deck.gl 9.2 and Supercluster for business locations.

## Startup and routes

`src/main.ts` loads global and MapLibre CSS, registers Pinia, the router, i18n, and Clerk, then mounts `App.vue`. A missing `VITE_CLERK_PUBLISHABLE_KEY` causes startup to throw.

`App.vue` synchronizes Clerk state into `src/services/auth.ts`. Router guards wait for Clerk to load before deciding whether the user may enter `/map`.

| Route | Component | Access |
| --- | --- | --- |
| `/` | `LandingView.vue` | Public |
| `/features` | `FeaturesView.vue` | Public |
| `/sign-in/...` | `SignInView.vue` | Sign-in flow |
| `/map` | `MapView.vue` → `InteractiveMap.vue` | Requires signed-in session |

## Main code boundaries

| Location | Responsibility |
| --- | --- |
| `src/components/InteractiveMap.vue` | Coordinates map lifecycle, sidebar, spatial modes, popups, and modals |
| `src/components/map/sidebar/` | UI for groups of map layers |
| `src/components/ui/` | Reusable controls such as toggles, modals, and stat rows |
| `src/composables/` | Domain and rendering behavior |
| `src/api/` | HTTP clients, API models, and tile URL templates |
| `src/stores/layerStore.ts` | Owns layer composables and injects the active map into toggles |
| `src/stores/mapViewStore.ts` | URL-backed center and zoom |
| `src/stores/mapConfig.ts` | Light/dark OpenFreeMap styles |
| `src/locales/` | English and Bulgarian translations |

## Places and spatial tools

`usePlacesManager` creates reactive category instances for barbershops, gyms, car washes, and grocery stores. Each combines fetched data, rating/review/price/service filters, category visibility, and polygon filtering. Grocery chain tags add a separate filtering dimension.

The map component connects those instances to GPU layers. It also coordinates polygon drawing, up to five comparison pins, retail listing placement, geocoding, and low-count DOM markers. See [map rendering](/my-map/map-rendering) before modifying any of those lifecycles.

## Capabilities versus placeholders

Rendering a button does not establish that its action is implemented. `useShopManagement.editBarbershop` currently displays a placeholder alert, and the comparison panel's export event is connected to an empty handler in `InteractiveMap.vue`. Document these as gaps, not completed edit/export workflows.
