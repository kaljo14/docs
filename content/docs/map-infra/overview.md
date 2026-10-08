---
title: Infrastructure overview
description: Kubernetes resources, namespaces, service ports, and GitOps ownership.
source_files:
  - map-infra/kustomization.yaml
  - map-infra/clusters/production/flux-system/gotk-sync.yaml
  - map-infra/clusters/production/workloads.yaml
  - map-infra/apps/kustomization.yaml
  - map-infra/apps/docs/deployment.yaml
  - map-infra/renovate.json
  - map-infra/apps/frontend/deployment.yaml
  - map-infra/apps/places-scraper/deployment.yaml
  - map-infra/apps/martin/deployment.yaml
  - map-infra/apps/tileserver/deployment.yaml
  - map-infra/apps/tileserver/generator/job.yaml
---

`map-infra` is the Kubernetes infrastructure repository for Lonctus. Its root `kustomization.yaml` includes application Deployments/Services/Ingresses, Envoy and Martin ConfigMaps, tile storage/generation, and the monitoring stack.

## Application workloads

| Workload | Namespace in Deployment | Replicas | Service → application |
| --- | --- | --- | --- |
| `frontend` | `lonctus` | 1 | 80 → nginx 80 |
| `docs` | `lonctus` | 1 | 80 → Next.js 3001 |
| `places-scraper` (GeoPulse) | `lonctus` | 1 | 80 → Envoy 8000 → app 8080 |
| `martin` | `lonctus` | 1 | 80 → Envoy 8000 → app 3000 |
| `tileserver` | `lonctus` | **0** | 80 → Envoy 8000 → app 8080 |

These are checked-in desired values, not observed running replicas. Frontend and GeoPulse images are pinned by digest. Martin and TileServer use `latest` image references; Envoy is standardized by the Kustomize image override.

The database is referenced through connection secrets. No production PostgreSQL Deployment is declared in the root Kustomization. Local PostGIS in GeoPulse Compose is a separate development setup.

## Namespaces and routing

Application Kustomize bundles assign `lonctus`; the monitoring bundle assigns `monitoring`. Render the complete bundles rather than applying individual files that may omit `metadata.namespace`.

Older repo docs mention `map` and `default`. Use the manifests and Flux bundles as the source of truth, and inspect rendered namespaces before deploying.

Ingresses define `lonctus.com` and the API/tile subdomains. Traefik and certificate infrastructure are prerequisites, not bootstrapped by this root Kustomization. The frontend uses short Service names as upstreams, which requires those Services to be available in the frontend namespace.

## TileServer is currently inactive

The TileServer Deployment is scaled to zero, but its Service, ingress, 2 GiB PVC, and `grid-tile-generator` Job remain declared. A zero replica count does not remove those resources or prevent the Job from existing. MapLibre basemaps come from OpenFreeMap; Martin remains the main spatial data tile path.

## GitOps

Flux watches `main` at `clusters/production`. Its five workload bundles manage namespaces, tile storage, applications (including docs), monitoring, and the tile generator. The root Kustomization provides an offline preview of those workloads.

Flux corrects drift, so changes made only with `kubectl` may be reverted. Resources deleted from Git can be pruned; namespaces and tile storage have explicit pruning protection. Renovate opens image digest update PRs, and Flux deploys merged changes. Bootstrap is a separate operation documented in `map-infra/DEPLOYMENT.md`.
