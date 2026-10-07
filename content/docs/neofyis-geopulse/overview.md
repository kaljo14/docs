---
title: GeoPulse backend overview
description: Go service architecture, boot sequence, configuration, and development workflow.
source_files:
  - neofyis-geopulse/go.mod
  - neofyis-geopulse/cmd/main.go
  - neofyis-geopulse/internal/config/config.go
  - neofyis-geopulse/internal/app/app.go
  - neofyis-geopulse/internal/handler/handler.go
  - neofyis-geopulse/Makefile
  - neofyis-geopulse/.github/workflows/ci.yml
---

GeoPulse is the Go service behind the map. It provides places and listing CRUD, GeoJSON transport data, location context, spatial analytics, CSV transfer, and data-import entry points. Its Go module is `github.com/neofyis/geopulse`; the deployment and image are still called `places-scraper`.

## Layered implementation

```text
TypeSpec contract ──> OpenAPI ──> generated strict chi routes ──┐
Manual chi routes ──────────────────────────────────────────────┤
                                                               v
                                                           Handler
                                                               |
                                                               v
                                               App service / validation / jobs
                                                               |
                                                               v
                                                        Store interface
                                                               |
                                                               v
                                                sqlc + custom spatial SQL
                                                               |
                                                               v
                                                    pgx pool / PostGIS
```

`internal/handler` converts transport requests/responses. `internal/app` owns business logic and validation. `internal/store` provides generated CRUD queries and custom SQL. Interfaces in the app/store layers allow unit tests to replace database dependencies with mocks.

## Boot and shutdown

`cmd/main.go` loads configuration, creates a production Zap logger, and registers signal handling. When `DATABASE_URL` is set, it applies embedded migrations, constructs a pgx pool, and wires the store, application, handler, generated routes, and manual routes.

The server listens on `:<PORT>`, with 15-second read/write and 60-second idle timeouts. On shutdown it cancels and waits for application background jobs, then attempts HTTP shutdown with a 10-second context. The job wait occurs before the HTTP shutdown timeout; do not assume the whole shutdown is bounded by ten seconds.

Without `DATABASE_URL`, startup logs a warning and continues. That mode is not a usable data API: `/readyz` returns unavailable because no database pinger exists.

## Runtime configuration

| Variable | Default / role |
| --- | --- |
| `DATABASE_URL` | Postgres connection URL; enables migrations and database access |
| `PORT` | `8080` |
| `GOOGLE_API_KEY` | Required when invoking Google scrape/enrich jobs |
| `SCRAPE_LAT`, `SCRAPE_LNG` | Sofia center: `42.6977`, `23.3219` |
| `SCRAPE_RADIUS` | `5000` |
| `SCRAPE_TYPES` | `restaurant` |
| `SCRAPE_QUERY` | Optional text query; selects Text Search instead of Nearby Search |
| `SCRAPE_TAGS` | Optional comma-separated tags |

These names come from `internal/config/config.go`. In particular, `GOOGLE_API_KEY` differs from the Google key variable currently injected by `map-infra`; see [known gaps](/operations/known-gaps).

## Daily commands

| Command | Effect |
| --- | --- |
| `make build` | Builds `bin/geopulse` |
| `make test` | Runs `go test ./...` |
| `make lint` | Runs golangci-lint |
| `make generate` | Compiles TypeSpec and regenerates strict API bindings |
| `make sqlc` | Regenerates store query code |
| `make mock` | Regenerates mocks with mockery |
| `make mcp-server` | Builds the stdio MCP executable |

Code generators are separate tools; install the versions appropriate to the repository before regeneration. CI builds, tests, and lints on pull requests and pushes to `main`. It does not run the HTTP contract suite or publish the backend image.
