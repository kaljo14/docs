---
title: Source snapshot and scope
description: Revisions and evidence behind this handbook, with clear limits on what was verified.
source_files:
  - my-map/package.json
  - my-map/docs/maplibre-migration.md
  - neofyis-geopulse/cmd/main.go
  - map-infra/kustomization.yaml
  - map-infra/clusters/production/workloads.yaml
  - map-infra/apps/docs/deployment.yaml
  - map-infra/apps/docs/ingress.yaml
  - map-infra/renovate.json
  - map-infra/scripts/adopt-release.py
  - my-map/.github/workflows/docker-publish.yml
  - neofyis-geopulse/.github/workflows/ci.yml
---

This handbook was authored from the three named local checkouts on **2026-10-07**.

On **2026-10-08**, the infrastructure deployment, overview, and troubleshooting
sections were refreshed against `map-infra` revision `5be0b49` plus local docs
deployment changes. They now describe Flux/Renovate and the desired
`docs.lonctus.com` route. These are checked-in configuration changes, not evidence
of a live docs rollout; unrelated source snapshots below retain their original scope.

| Repository | Inspected revision | Subject |
| --- | --- | --- |
| `my-map` | `b360419` | Complete MapLibre migration and lifecycle cleanup |
| `map-infra` | `5d65f99` | Fix backend |
| `neofyis-geopulse` | `ffa38e0` | BulgarianProperties scraper and locations API |

The release sections were also refreshed on **2026-10-08** against local semantic
release workflow changes in my-map (`b360419`), docs (`c7bde8d`), GeoPulse
(`381d82a` plus existing local CI edits), and map-infra (`6800985`). Release image
pushes and live cluster adoption were not performed or verified in this refresh.

## Evidence order

Prefer implementation and checked-in manifests over older descriptions. For example, the frontend router has a landing page, features page, sign-in, and `/map`; it is no longer the single-route application described in an older frontend guide. Infrastructure workloads specify `lonctus`, despite older docs using `map` or `default`.

Every page includes `source_files` frontmatter. These paths are relative to the shared parent directory. Run `npm run check:sources` to ensure those references still exist and stay within the allowed repositories. This validates provenance paths, not whether every statement is still current after code changes.

## What was not verified

- No live Kubernetes or Argo CD state was queried.
- No production databases, imports, deployments, or authentication settings were changed.
- No local `.env` contents or raw scraped datasets were copied.
- No other sibling project directories were inspected.
- The app and content have been migrated to Fumadocs. Dependencies and a lockfile are present, and the production build passed on 2026-10-07 with `npm run build -- --webpack`.

Repository declarations do not prove that a source is populated, that a pinned image matches the current local code, or that the cluster has reconciled the latest Git revision. Pages call out those distinctions where they affect operations.
