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

`check:sources` expects this checkout beside the three source repositories. The app uses Fumadocs MDX for local Markdown and MDX, with its content stored in `content/docs`. The `meta.json` files define the sidebar order and repository group names. CI checks and builds only; it does not publish.

## Content

- `content/docs/index.mdx`: start here and ownership map.
- `content/docs/architecture.md`: system and request-flow diagrams.
- `content/docs/local-development.md`: run the stack and verify each service.
- `content/docs/my-map/`: frontend structure, MapLibre, and feature development.
- `content/docs/neofyis-geopulse/`: Go service, API, database, ingestion, and MCP.
- `content/docs/map-infra/`: Kubernetes, Argo CD, deployment, and monitoring.
- `content/docs/operations/`: authentication, troubleshooting, and confirmed integration gaps.
- `content/docs/contributing.md`: writing and review conventions.
- `content/docs/sources.md`: inspected revisions and scope.

## Internal hosting

The app runs as a Next.js Node server. Protect the complete application and its assets behind your internal authentication gateway or private network. `private: true`, `noindex`, and `robots.txt` do not enforce access control. No remote repository, production domain, or deployment has been created.

Use the official [Fumadocs quick start](https://www.fumadocs.dev/docs), [Next.js setup](https://www.fumadocs.dev/docs/manual-installation/next), and [deployment guide](https://www.fumadocs.dev/docs/deployment) when selecting the internal hosting target.
