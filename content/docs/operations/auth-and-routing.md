---
title: Authentication and request routing
description: Clerk sessions, proxy paths, Envoy validation, and the limits of the current access model.
source_files:
  - my-map/src/services/auth.ts
  - my-map/src/api/httpClient.ts
  - my-map/src/composables/useMapInstance.ts
  - my-map/vite.config.ts
  - my-map/nginx.conf.template
  - map-infra/apps/places-scraper/envoy-config.yaml
  - map-infra/apps/martin/envoy-config.yaml
  - map-infra/apps/tileserver/envoy-config.yaml
  - neofyis-geopulse/cmd/main.go
---

## Browser identity

Clerk owns sign-in and session tokens. The Vue router requires a loaded, signed-in session for `/map`. REST calls through `httpClient.ts` await `session.getToken()` and attach `Authorization: Bearer ...`. MapLibre tile requests use the synchronous cached-token accessor from `auth.ts`.

The map's `transformRequest` only attaches that header for resources identified as tiles whose URL contains `/api/`. Direct diagnostic `fetch` calls, such as the Martin catalog check, do not inherit those headers automatically.

## Proxy routing

| Browser path | Upstream | Rewrite |
| --- | --- | --- |
| `/api/places`, `/api/metro`, `/api/heatmap` | GeoPulse | Preserve path |
| `/api/parking-zones`, `/api/sofiaplan` | GeoPulse | Preserve path |
| `/api/retail-listings`, `/api/adres-locations` | GeoPulse | Preserve path |
| `/api/martin` | Martin | Strip `/api/martin` |
| `/api/tiles` | TileServer | Vite strips prefix; nginx template does not use the same explicit rewrite |

The table describes explicit proxy locations in Vite/nginx, not every backend route. For example `/api/saturation`, `/api/bgproperties-locations`, `/api/osm`, `/scrape`, and `/enrich` are not separate forwarded families in the frontend template.

## Envoy behavior

Envoy validates Clerk JWTs using issuer `https://clerk.lonctus.com` and its JWKS endpoint, with a 300-second JWKS cache. Services route traffic to the sidecar's port 8000, then to the app container.

Role-based RBAC blocks are **commented out** in all three inspected sidecar configs. The roles described in older READMEs are intended policies, not active enforcement. A frontend route guard also does not enforce backend authorization.

GeoPulse does not register JWT middleware in its Go router and listens on `:8080`, not only loopback. A Service targeting Envoy does not by itself prevent another pod from contacting the application port directly. No NetworkPolicy is listed in the root Kustomization. Treat network isolation as a separate control to verify, not a property guaranteed by a diagram comment.

## nginx tile cache boundary

The frontend nginx caches Martin HTTP 200 responses for seven days, and 204/404 for one minute. It forwards Authorization on cache misses, but its configured cache key is only `$uri`.

That key does not distinguish query strings or users, and a cache hit need not reach the downstream Envoy validator. The checked-in template has no separate authentication step ahead of cache lookup. Review this path before relying on downstream JWT checks to protect cached tile responses or user-specific data. This is a source-level configuration finding; no live access test was performed.

For debugging, inspect HTTP status, content type, actual request path, Authorization presence, and `X-Cache-Status`. Keep token values out of shared logs and documentation.
