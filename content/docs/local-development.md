---
title: Run the stack locally
description: Start PostGIS, GeoPulse, Martin, and the frontend without relying on production services.
source_files:
  - neofyis-geopulse/go.mod
  - neofyis-geopulse/Makefile
  - neofyis-geopulse/docker-compose.yml
  - neofyis-geopulse/cmd/main.go
  - my-map/package.json
  - my-map/vite.config.ts
  - my-map/src/main.ts
  - my-map/docker-compose.dev.yml
---

## Prerequisites

Use Node 22.20+ for the frontend regression runner and these docs, Go compatible with the backend's `go 1.24.0` directive, Docker Compose, and a Clerk publishable key configured for local development. Run the commands below from the indicated repository in separate terminals.

The three project directories and `internal-docs` should be siblings. No other project directories are needed for this guide.

## 1. Start the local database and Martin

From `neofyis-geopulse`:

```bash
docker compose up -d --wait
```

Compose starts PostGIS 16/3.4 and Martin. The local-only database username, password, and database name are all `geopulse` in the checked-in Compose file. Do not reuse those development defaults for a shared environment.

## 2. Start GeoPulse

```bash
go build -o bin/geopulse ./cmd/
DATABASE_URL='postgres://geopulse:geopulse@localhost:5432/geopulse?sslmode=disable' \
  PORT=8080 ./bin/geopulse
```

The API applies pending **embedded SQL migrations before starting its listener**. This creates the schema; it does not load all source datasets. After the first successful migration, restart Martin in another terminal so it discovers new tables/views:

```bash
docker compose restart martin
curl --fail http://localhost:8080/livez
curl --fail http://localhost:8080/readyz
curl --fail http://localhost:3000/catalog
```

`/livez` checks the process. `/readyz` checks the database connection. A healthy schema can still contain no business or planning data; empty map layers are not necessarily a rendering failure.

`make run` is available, but its current recipe kills whichever process owns port 8080 before launching. The direct binary command above avoids that side effect. `make seed` starts containers, applies migrations, and restarts Martin; despite its name it does not import all business data.

## 3. Configure and start the frontend

From `my-map`, install packages and create a local `.env` with these values:

```dotenv
VITE_CLERK_PUBLISHABLE_KEY=replace_with_your_local_publishable_key
PLACES_API_URL=http://localhost:8080
MARTIN_API_URL=http://localhost:3000
TILES_API_URL=http://localhost:4000
```

```bash
npm ci
npm run dev
```

Visit `http://localhost:8888`, sign in, and open `/map`. Vite proxies the configured API paths. The `PLACES_API_URL`, `MARTIN_API_URL`, and `TILES_API_URL` names are server-side proxy settings; they are different from the `VITE_*` variables exposed to browser code.

The existing frontend development Compose file mounts TileServer data from a machine-specific absolute path. Use the Vite workflow above for a portable start, and configure your own tile files before choosing that Compose workflow.

## 4. Verify and develop

```bash
# my-map
npm test
npm run build
```

```bash
# neofyis-geopulse
go test ./...
go build ./...
```

Backend unit tests use mocks. `make venom` is a separate HTTP contract suite that requires a running service/database, creates and deletes data, and triggers scraper/enricher endpoints. Run it only against a disposable local environment.

Use [data and migrations](/neofyis-geopulse/data) and [ingestion](/neofyis-geopulse/ingestion-and-mcp) when adding source data. If a request unexpectedly returns HTML, check the proxy path before changing API parsing code.
