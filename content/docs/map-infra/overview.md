---
title: Infrastructure overview
description: Kubernetes resources, namespaces, service ports, and GitOps ownership.
source_files:
  - map-infra/kustomization.yaml
  - map-infra/argocd/application.yaml
  - map-infra/apps/frontend/deployment.yaml
  - map-infra/apps/places-scraper/deployment.yaml
  - map-infra/apps/martin/deployment.yaml
  - map-infra/apps/tileserver/deployment.yaml
  - map-infra/apps/tileserver/job.yaml
---

`map-infra` is the Kubernetes infrastructure repository for Lonctus. Its root `kustomization.yaml` includes application Deployments/Services/Ingresses, Envoy and Martin ConfigMaps, tile storage/generation, and the monitoring stack.

## Application workloads

| Workload | Namespace in Deployment | Replicas | Service → application |
| --- | --- | --- | --- |
| `frontend` | `lonctus` | 1 | 80 → nginx 80 |
| `places-scraper` (GeoPulse) | `lonctus` | 1 | 80 → Envoy 8000 → app 8080 |
| `martin` | `lonctus` | 1 | 80 → Envoy 8000 → app 3000 |
| `tileserver` | `lonctus` | **0** | 80 → Envoy 8000 → app 8080 |

These are checked-in desired values, not observed running replicas. Frontend and GeoPulse images are pinned by digest. Martin and TileServer use `latest` image references; Envoy is standardized by the Kustomize image override.

The database is referenced through connection secrets. No production PostgreSQL Deployment is declared in the root Kustomization. Local PostGIS in GeoPulse Compose is a separate development setup.

## Namespaces and routing

Applications explicitly declare `lonctus`; monitoring resources generally declare `monitoring`. Some resources, including Martin and TileServer Services, omit `metadata.namespace`. The root Kustomization has no namespace transformer. Argo CD targets `lonctus` for resources without an explicit namespace; a manual apply under another current namespace can put them elsewhere.

Older repo docs mention `map` and `default`. Use the manifests and Argo Application as the source of truth, and inspect rendered namespaces before deploying.

Ingresses define `lonctus.com` and the API/tile subdomains. Traefik and certificate infrastructure are prerequisites, not bootstrapped by this root Kustomization. The frontend uses short Service names as upstreams, which requires those Services to be available in the frontend namespace.

## TileServer is currently inactive

The TileServer Deployment is scaled to zero, but its Service, ingress, 2 GiB PVC, and `grid-tile-generator` Job remain declared. A zero replica count does not remove those resources or prevent the Job from existing. MapLibre basemaps come from OpenFreeMap; Martin remains the main spatial data tile path.

## GitOps

`argocd/application.yaml` points at the repository's `main` branch and root path, targeting the in-cluster API server. Automated sync enables **prune** and **self-heal**, with namespace creation and server-side apply options.

Changes made only with `kubectl` may be reverted by self-heal. Resources deleted from Git can be pruned. Use a reviewed manifest change for durable configuration and image updates. The Argo Application itself is not listed as a resource in the root Kustomization; it needs separate bootstrap installation.
