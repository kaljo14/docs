---
title: Source snapshot and scope
description: Revisions and evidence behind this handbook, with clear limits on what was verified.
source_files:
  - my-map/package.json
  - my-map/docs/maplibre-migration.md
  - neofyis-geopulse/cmd/main.go
  - map-infra/kustomization.yaml
---

This handbook was authored from the three named local checkouts on **2026-10-07**.

| Repository | Inspected revision | Subject |
| --- | --- | --- |
| `my-map` | `b360419` | Complete MapLibre migration and lifecycle cleanup |
| `map-infra` | `5d65f99` | Fix backend |
| `neofyis-geopulse` | `ffa38e0` | BulgarianProperties scraper and locations API |

## Evidence order

Prefer implementation and checked-in manifests over older descriptions. For example, the frontend router has a landing page, features page, sign-in, and `/map`; it is no longer the single-route application described in an older frontend guide. Infrastructure workloads specify `lonctus`, despite older docs using `map` or `default`.

Every page includes `source_files` frontmatter. These paths are relative to the shared parent directory. Run `npm run check:sources` to ensure those references still exist and stay within the allowed repositories. This validates provenance paths, not whether every statement is still current after code changes.

## What was not verified

- No live Kubernetes or Argo CD state was queried.
- No production databases, imports, deployments, or authentication settings were changed.
- No local `.env` contents or raw scraped datasets were copied.
- No other sibling project directories were inspected.
- The app and content have been migrated to Fumadocs. This environment currently cannot resolve `registry.npmjs.org`, so dependency installation, lockfile generation, and the application build remain unverified until registry access returns.

Repository declarations do not prove that a source is populated, that a pinned image matches the current local code, or that the cluster has reconciled the latest Git revision. Pages call out those distinctions where they affect operations.
