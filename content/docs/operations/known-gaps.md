---
title: Known integration gaps
description: Concrete inconsistencies found while documenting the three repositories.
source_files:
  - my-map/src/components/InteractiveMap.vue
  - my-map/src/composables/useShopManagement.ts
  - my-map/vite.config.ts
  - my-map/nginx.conf.template
  - my-map/eslint.config.js
  - my-map/docker-compose.dev.yml
  - neofyis-geopulse/internal/config/config.go
  - neofyis-geopulse/cmd/main.go
  - neofyis-geopulse/internal/mcp/client.go
  - map-infra/apps/places-scraper/deployment.yaml
  - map-infra/apps/places-scraper/envoy-config.yaml
  - map-infra/apps/martin/deployment.yaml
  - map-infra/kustomization.yaml
---

These are observations from the [source snapshot](/sources), not fixes made by this docs repository. Reverify them before changing production.

| Finding | Practical effect | Follow-up |
| --- | --- | --- |
| Infra injects `GOOGLE_PLACES_API_KEY`; current Go config reads `GOOGLE_API_KEY` | Scrape/enrich may report a missing key if deployed code matches this snapshot | Align the environment name and secret mapping |
| Envoy RBAC filters are commented out | README role descriptions are not active role enforcement | Define intended read/write policy and test it before enabling |
| nginx caches Martin by `$uri` before downstream JWT validation | Cache hits can bypass that validation; query/user variants share the configured key | Review auth placement, cache policy, and data sensitivity |
| Go listens on `:8080`; no NetworkPolicy is listed | Sidecar Service routing alone is not complete isolation of app ports | Verify cluster networking and enforce the intended boundary |
| Some Services have no explicit namespace; Kustomize has no namespace transformer | Manual apply can separate Services from workloads | Standardize namespace handling or use the verified Argo path |
| Frontend proxy lacks `/api/bgproperties-locations` | Backend's latest listing endpoint is not connected through the frontend origin | Add client, proxy routes, and map UI when implementing the feature |
| Other backend routes such as saturation/import/job triggers lack frontend proxy families | Backend availability does not imply browser-origin availability | Add only the routes needed by the intended UI/workflow |
| Vite and nginx differ in explicit `/api/tiles` rewriting | Optional TileServer paths can behave differently across environments | Align routing when bringing that path back into use |
| Frontend development Compose uses machine-specific tile mounts | It is not portable on a fresh checkout | Parameterize paths or use the documented Vite setup |
| Frontend ESLint scans generated files and lacks TypeScript parsing | `npm run lint` does not provide a clean source check | Repair lint configuration separately from map migration |
| Shop edit action is a placeholder; comparison export handler is empty | Those UI affordances are not completed workflows | Implement behavior and corresponding checks |
| MCP HTTP client does not attach Clerk tokens | Protected production API URLs cannot be used by URL change alone | Add an explicit authentication strategy |

## Operational follow-ups

The application starts schema migrations automatically, imports are background jobs, and many tile views are materialized. There is no general end-to-end scheduling/refresh policy established by the inspected repositories. Document the actual import → view refresh → cache refresh procedure as it is implemented.

The frontend MapLibre regression suite passes with mocked map interfaces. Its migration notes retain live-browser checks for real WebGL, external tiles, Clerk, and backend data. Keep those checks in release validation rather than interpreting unit tests as production verification.
