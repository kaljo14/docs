---
title: Deployment and release workflow
description: Build artifacts, review manifest changes, reconcile configuration, and verify releases.
source_files:
  - map-infra/clusters/production/flux-system/gotk-sync.yaml
  - map-infra/clusters/production/workloads.yaml
  - map-infra/apps/docs/deployment.yaml
  - map-infra/apps/docs/ingress.yaml
  - map-infra/renovate.json
  - map-infra/DEPLOYMENT.md
  - map-infra/kustomization.yaml
  - map-infra/apps/frontend/deployment.yaml
  - map-infra/apps/places-scraper/deployment.yaml
  - map-infra/apps/martin/deployment.yaml
  - my-map/.github/workflows/docker-publish.yml
  - my-map/Dockerfile
  - neofyis-geopulse/deploy.sh
  - neofyis-geopulse/Dockerfile
  - neofyis-geopulse/cmd/main.go
---

## Release artifacts

| Repository | Artifact path | What selects production |
| --- | --- | --- |
| `my-map` | GitHub Actions builds/pushes multiarch frontend images on `main` | Digest in `apps/frontend/deployment.yaml` |
| `neofyis-geopulse` | `deploy.sh` builds/pushes `kaljo14/places-scraper` | Digest in `apps/places-scraper/deployment.yaml` |
| Docs | GitHub Actions publishes `kaljo14/docs:latest` and Git SHA tags for AMD64/ARM64 | `apps/docs/deployment.yaml`, updated by Renovate |
| `map-infra` | Rendered Kubernetes resources | Flux CD reconciliation of `main` |

GeoPulse's `deploy.sh` also creates and pushes a Git version tag. It is a publishing operation, not a local build check. Use `go build ./...` for compilation without publishing.

## Before updating manifests

Run frontend/backend checks appropriate to the change, identify the resulting immutable image digest, and review any migrations embedded in the new backend binary. The backend performs migrations during startup; a schema failure can prevent the new process from listening.

Provision required secrets separately from application source. GeoPulse and Martin reference `places-scraper-secret`; the key `POSTGRES_CONN_STRING` is mapped into `DATABASE_URL`. The backend manifest also references `scraper-gg-secret`. Secret placeholder files are not listed in the root Kustomization and are not a credential provisioning system.

The frontend's Clerk publishable key is baked into the Vite build. `PLACES_API_URL`, `TILES_API_URL`, and `MARTIN_API_URL` are runtime nginx upstreams. Do not expect changing a pod variable to replace an already compiled Vite key.

## Review desired changes

From `map-infra`:

```bash
kubectl kustomize . > /tmp/lonctus-manifests.yaml
```

Review images, environment names, ConfigMaps, namespaces, selectors, and Service ports. Application bundles assign `lonctus`; the monitoring bundle assigns `monitoring`. Check [known gaps](/operations/known-gaps) for current cross-repository inconsistencies.

Publish the tracked `latest` image, then review Renovate's digest update PR and merge it to `main`. Flux reconciles the merged manifests. Publishing the application image alone does not change an already pinned production digest; automatic merge is disabled.

## Docs deployment

The docs Deployment serves Next.js on port 3001 through a ClusterIP Service.
Traefik routes `https://docs.lonctus.com` to it and requires BasicAuth for every
path. Provision `docs-basic-auth` separately, point DNS at the production ingress,
and ensure the `letsencrypt-prod` ClusterIssuer can issue `docs-tls`.
Private Docker Hub images also need cluster pull credentials. Follow the docs-site
section of `map-infra/DEPLOYMENT.md` before merging the initial manifests.

The initial `latest` tag has no digest until an image exists and Renovate pins it.
Merge the initial pin before relying on reproducible image rollbacks.

## Verify a reconciled release

These commands inspect state; they do not trigger a deployment:

```bash
flux get sources git
flux get kustomizations
kubectl get deployments,pods,services,ingresses -n lonctus
kubectl rollout status deployment/frontend -n lonctus
kubectl rollout status deployment/docs -n lonctus
kubectl rollout status deployment/places-scraper -n lonctus
kubectl rollout status deployment/martin -n lonctus
kubectl logs deployment/places-scraper -n lonctus -c places-scraper --tail=100
kubectl logs deployment/martin -n lonctus -c envoy --tail=100
```

Check migration logs, local backend readiness through an appropriate diagnostic path, signed-in browser API calls, a known populated Martin layer, and light/dark map switching. A public unauthenticated request to a protected ingress may return 401 even when its backend is healthy.

## ConfigMap changes and rollback

These manifests mount Envoy/Martin ConfigMaps without a general checksum annotation or declared reload controller. A changed ConfigMap alone does not guarantee the process reloads it. Coordinate a workload restart through the release procedure when its process requires one.

To roll back an application, revert the desired digest in Git and reconcile it. For backend releases, first verify the old binary is compatible with the current database schema. Reverting an image does not reverse a startup migration, and running a down migration may delete data.
