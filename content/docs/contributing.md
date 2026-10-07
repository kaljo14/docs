---
title: Maintain the handbook
description: Keep documentation accurate, scoped, and useful as the three projects change.
source_files:
  - my-map/package.json
  - neofyis-geopulse/Makefile
  - map-infra/kustomization.yaml
---

## Scope and ownership

This repository documents `my-map`, `map-infra`, and `neofyis-geopulse`. Add system context where it explains those projects, but do not expand into other sibling codebases without an explicit scope decision.

Keep factual statements close to source references. Each page has frontmatter containing `title`, `description`, and a `source_files` list. Use paths relative to the shared parent directory, starting with one of the three repository names. Do not copy application source trees or raw data into this site.

## Add or update a page

1. Inspect the relevant implementation, contracts, and manifests.
2. Explain the user-visible or operational behavior before listing files.
3. Separate checked-in desired state from observed live state and proposed changes.
4. Add the page to the appropriate `content/docs/**/meta.json` file and link to docs using absolute site routes, such as `/my-map/overview`.
5. Update the source revision/date in [sources](/sources) when refreshing the snapshot.
6. Run checks and review the generated site.

Use fenced code blocks for commands, config, and JSON. Keep credentials, `.env` contents, token examples with real values, and scraped datasets out of the repository.

## Validation

```bash
npm run check
npm run check:sources
npm run typecheck
npm run build
npm run dev
```

The dependency-free checker verifies required page metadata, Fumadocs page-tree coverage, local routes, and allowed source paths. `check:sources` additionally checks that referenced files exist in the sibling checkouts. Review the rendered sidebar, tables, code blocks, light/dark themes, and mobile layout before publishing.

The current environment cannot resolve the npm registry, so it cannot install the new framework packages or generate a complete lockfile. Run `npm install` in a network-enabled environment and commit the generated lockfile; CI will then use `npm ci`. Until `npm run build` succeeds, do not describe the app as build-verified.

## Internal publication

The site runs as a Next.js Node server. Protect the application and all its assets behind the internal access layer. `noindex` metadata and `robots.txt` discourage indexing but do not authenticate readers. The included CI workflow checks and builds the site and has no deploy step.

Official references: [Fumadocs MDX](https://www.fumadocs.dev/docs/mdx), [page tree](https://www.fumadocs.dev/docs/page-conventions), and [Next.js setup](https://www.fumadocs.dev/docs/manual-installation/next).
