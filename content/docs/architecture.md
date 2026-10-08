---
title: System architecture
description: Repository boundaries, runtime services, and the path from data to map pixels.
source_files:
  - my-map/src/main.ts
  - my-map/src/router/index.ts
  - my-map/vite.config.ts
  - my-map/nginx.conf.template
  - neofyis-geopulse/cmd/main.go
  - neofyis-geopulse/docker-compose.yml
  - map-infra/apps/frontend/deployment.yaml
  - map-infra/apps/martin/deployment.yaml
  - map-infra/apps/places-scraper/deployment.yaml
  - map-infra/clusters/production/workloads.yaml
---

## Repository boundaries

```text
                     ┌── Clerk (sign-in)
                     ├── OpenFreeMap (basemaps)
Browser ──> my-map ──┼── Photon (geocoding)
                     ├── GeoPulse HTTP API ─────┐
                     └── Martin vector tiles ───┤
                                                v
                                      PostgreSQL + PostGIS
                                     ^          |
                                     |          ├── GeoPulse queries
                              data imports      └── Martin tile queries

map-infra (Kustomize + Flux CD) deploys my-map, GeoPulse, Martin, and docs.
```

`my-map` is a Vue SPA. MapLibre draws the basemap and native vector/GeoJSON layers; deck.gl draws clustered business locations. GeoPulse returns domain data and runs imports. Martin reads spatial tables/views and produces vector tiles directly from PostGIS.

The production Kubernetes backend is still named **`places-scraper`**, including its image repository. Its code is in **`neofyis-geopulse`**. Treat the deployment name as a historical name, not a second backend to find elsewhere.

## Request flow in production

```text
Browser       Clerk       frontend nginx       Envoy       GeoPulse/Martin       PostGIS
  |              |              |                |                |                 |
  |-- sign in -->|              |                |                |                 |
  |<-- token ----|              |                |                |                 |
  |-- GET + Bearer token ------>|                |                |                 |
  |                             |-- forward ---->|                |                 |
  |                             |                |-- verify JWT   |                 |
  |                             |                |-- request ---->|-- query -------->|
  |                             |                |                |<-- spatial data -|
  |<--------- JSON, GeoJSON, or vector tile ----|----------------|                 |
```

Traefik routes ingress traffic. The frontend serves static assets publicly and proxies selected API paths. Protected backend Services target Envoy on port 8000, which forwards to GeoPulse on 8080 or Martin on 3000. nginx caches Martin responses, so some requests can be answered before reaching Envoy; see [authentication and routing](/operations/auth-and-routing).

Clerk authentication and authorization are different concerns: JWT verification is configured, but role-based Envoy policies are commented out in the inspected manifests.

## Local ports

| Service | Port | Started from |
| --- | --- | --- |
| PostgreSQL/PostGIS | 5432 | GeoPulse Docker Compose |
| Martin | 3000 | GeoPulse Docker Compose |
| This handbook | 3001 | `internal-docs` |
| GeoPulse API | 8080 | Go binary |
| Frontend | 8888 | Vite |
| Optional legacy TileServer | 4000 → 8080 | Frontend development Compose |

The production TileServer deployment currently has zero replicas. OpenFreeMap is the active basemap provider; many application layers use Martin. Do not assume TileServer is needed for every map feature.

## Data has several freshness boundaries

An import changes base tables. A materialized view may still contain old results. Martin discovers sources when it starts, and nginx may serve tiles cached for seven days. Diagnose freshness at each boundary; refreshing the browser alone cannot refresh a materialized view or invalidate the server cache.
