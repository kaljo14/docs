# Lonctus internal docs

Fumadocs documentation for **my-map**, **map-infra**, and **neofyis-geopulse**. These are the only source repositories in scope.

## Start locally

Use Node 22.20 or newer (`nvm use`). Install dependencies and run the Next.js development server:

```bash
npm install
npm run dev
```

Open `http://localhost:3001`. Port 3001 avoids Martin on 3000, GeoPulse on 8080, and the frontend on 8888. `npm start` runs the production server and requires `npm run build` first.

## Check and build

```bash
npm run check          # Metadata, Fumadocs page-tree, and local-route checks
npm run check:sources  # Also verify source paths in the three sibling repos
npm run typecheck      # TypeScript validation
npm run build          # Checks plus the Next.js production build
npm start              # Serve the built app on localhost:3001
```

`check:sources` expects this checkout beside the three source repositories. The app uses Fumadocs MDX for local Markdown and MDX, with its content stored in `content/docs`. The `meta.json` files define the sidebar order and repository group names. CI builds pull requests and `main`; successful `vMAJOR.MINOR.PATCH` tag builds publish the Docker image.

## Content

- `content/docs/index.mdx`: start here and ownership map.
- `content/docs/architecture.md`: system and request-flow diagrams.
- `content/docs/local-development.md`: run the stack and verify each service.
- `content/docs/my-map/`: frontend structure, MapLibre, and feature development.
- `content/docs/neofyis-geopulse/`: Go service, API, database, ingestion, and MCP.
- `content/docs/map-infra/`: Kubernetes, Flux CD, deployment, and monitoring.
- `content/docs/operations/`: authentication, troubleshooting, and confirmed integration gaps.
- `content/docs/contributing.md`: writing and review conventions.
- `content/docs/sources.md`: inspected revisions and scope.

## Docker Hub and Flux deployment

The workflow publishes `kaljo14/docs:MAJOR.MINOR.PATCH` for `linux/amd64` and
`linux/arm64` when a stable Git tag such as `v1.2.3` is pushed. Main-branch builds
do not publish. See [Semantic image releases](RELEASE.md) for the required Docker
Hub secrets, tag commands, optional Renovate notification, and first-version
adoption in map-infra. Use a private Docker Hub repository for internal docs;
provision cluster pull credentials as described in `map-infra/DEPLOYMENT.md`.

The multi-stage Dockerfile uses Next.js standalone output and runs as a non-root
user on `0.0.0.0:3001`, including the public assets and Next.js static files:

```bash
docker build -t lonctus-docs:local .
docker run --rm -p 127.0.0.1:3001:3001 lonctus-docs:local
```

`map-infra/apps/docs` defines the Service, Deployment, and TLS ingress for
`https://docs.lonctus.com`, protected by Traefik BasicAuth across all paths.
Provision DNS, the `docs-basic-auth` secret, and registry pull access before
deployment, following the docs-site section in `map-infra/DEPLOYMENT.md`.
`private: true`, `noindex`, and `robots.txt` do not enforce access control.

Use the official [Fumadocs quick start](https://www.fumadocs.dev/docs), [Next.js setup](https://www.fumadocs.dev/docs/manual-installation/next), and [deployment guide](https://www.fumadocs.dev/docs/deployment) when selecting the internal hosting target.
