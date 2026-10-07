---
title: Troubleshooting runbooks
description: Diagnose startup failures, authentication errors, empty layers, stale tiles, and rollout issues.
source_files:
  - my-map/src/main.ts
  - my-map/src/composables/useMapInstance.ts
  - my-map/nginx.conf.template
  - neofyis-geopulse/cmd/main.go
  - neofyis-geopulse/internal/app/app.go
  - map-infra/apps/martin/martin-config.yaml
  - map-infra/argocd/application.yaml
---

## Frontend will not start

Check the console for a missing `VITE_CLERK_PUBLISHABLE_KEY`. Configure the publishable key before starting Vite or building the production bundle. Confirm Node matches the repo requirements and the browser can reach Clerk.

If public pages load but `/map` redirects to sign-in, inspect Clerk session loading and the route guard before investigating tile servers.

## Map is blank

1. Check the browser console for MapLibre initialization or WebGL errors.
2. Check the selected OpenFreeMap style request, then its tiles/fonts/sprites.
3. Confirm the map container has nonzero dimensions.
4. If the basemap works but a thematic layer is missing, inspect that layer's network requests and the steps below.

TileServer's checked-in replica count is zero. Do not start debugging it merely because the application displays a map; most active map paths use OpenFreeMap or Martin.

## A data layer has no features

Use local Martin directly for an unauthenticated development check:

```bash
curl --fail http://localhost:3000/catalog
curl --fail http://localhost:3000/sofiaplan_income_tiles
```

In production, use an authenticated request through the intended gateway. Compare the source ID, TileJSON vector-layer ID, and frontend `source-layer`. Then check source data coverage, selected zoom, visibility/filter conditions, and whether the data lies within the current viewport.

A schema migration can create an empty source. A materialized view can remain empty after importing its base table until refreshed. If the source was introduced after Martin started, verify discovery/restart behavior.

## API request returns HTML or a JSON parsing error

Inspect `Content-Type` and response body. nginx/Vite SPA fallback can return HTML for an unproxied route. Confirm that both development and production proxy configurations include the endpoint family. Directly compare with the same URL path on local GeoPulse port 8080.

## 401, 403, or unexpected access

Check that the request carries a current Bearer token, its issuer matches Clerk configuration, and Envoy can retrieve JWKS. Inspect sidecar logs without copying token values. A 403 does not automatically establish role enforcement: the checked-in RBAC sections are disabled, and another proxy or configuration may be responsible.

For cached tiles, compare `X-Cache-Status` and review [the cache/auth boundary](/operations/auth-and-routing). The map's direct development catalog diagnostic is not authenticated automatically, even when tile requests are.

## `/readyz` fails or backend never listens

If the process responds with `/livez` but `/readyz` is unavailable, inspect database connectivity and `DATABASE_URL`. If nothing listens, inspect startup logs for embedded migration errors before debugging ingress.

```bash
kubectl logs deployment/places-scraper -n lonctus -c places-scraper --tail=150
kubectl logs deployment/places-scraper -n lonctus -c envoy --tail=100
kubectl get services,endpoints -n lonctus
```

Check the deployment's secret key references by name and that Service selectors find ready pods. Do not print secret values as a diagnostic shortcut.

## Data looks stale after an import

Verify the import completion log, base-table rows, and affected materialized-view rows in that order. Refresh the required view under the team's database procedure. Then investigate Martin discovery and nginx cache freshness. Reloading the page alone cannot invalidate those server-side states.

## Changes disappear after manual operations

Argo CD self-heal can restore desired Git state. Compare the Application's target branch/revision with the manifest change and the pinned image digest. A pushed image does not update a digest-pinned Deployment; a `kubectl` edit is not durable GitOps configuration.

If a Service cannot be resolved by name, inspect namespaces. Some Service manifests omit a namespace and can land outside `lonctus` when applied manually with the wrong default.
