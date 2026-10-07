---
title: API surface and contracts
description: Generated and manual API routes, health checks, and the workflow for changing a contract.
source_files:
  - neofyis-geopulse/typespec/main.tsp
  - neofyis-geopulse/typespec/tspconfig.yaml
  - neofyis-geopulse/oapi-codegen.yaml
  - neofyis-geopulse/api/openapi.yaml
  - neofyis-geopulse/cmd/main.go
  - neofyis-geopulse/internal/handler/handler.go
  - neofyis-geopulse/internal/app/analytics.go
---

## Generated routes

The contract pipeline is TypeSpec → `api/openapi.yaml` → `internal/generated/server.gen.go`. The checked-in OpenAPI document is served at `/openapi.yaml`; Swagger UI is mounted under `/swagger/`.

| Routes | Methods | Purpose |
| --- | --- | --- |
| `/api/places` | GET, POST | List/filter and create places |
| `/api/places/{place_id}` | GET, PUT, DELETE | Individual place CRUD |
| `/api/retail-listings` | GET, POST | List/create manually managed listings |
| `/api/retail-listings/{id}` | GET, PUT, DELETE | Individual listing CRUD |
| `/api/metro/shapes`, `/api/metro/stops` | GET | GeoJSON transport data |
| `/api/parking-zones` | GET | Parking-zone GeoJSON |
| `/api/saturation` | GET | Competition density around a coordinate |
| `/api/heatmap` | GET | Scores for a requested bounding box/grid |
| `/api/sofiaplan/context` | GET | Planning context for a coordinate |
| `/api/sofiaplan/import` | POST | Start a planning-data import |
| `/api/osm/import`, `/api/osm/pois` | POST | Start OSM network/POI imports |
| `/scrape`, `/enrich` | POST | Start Google Places jobs |
| `/livez`, `/readyz` | GET | Process and database readiness checks |

`GET /api/places` supports `category` and `tag`. The frontend's other place filters are applied client-side after fetching a category.

Examples against a local API:

```bash
curl --fail 'http://localhost:8080/api/places?category=barbershop'
curl --fail 'http://localhost:8080/api/saturation?lat=42.6977&lng=23.3219&radius=500&category=barbershop'
curl --fail 'http://localhost:8080/api/sofiaplan/context?lat=42.6977&lng=23.3219'
```

The saturation score is currently density per km² multiplied by five and capped at 100. Heatmap score is anchor score minus competitor penalty plus foot-traffic bonus, clamped to 0–100. These are application heuristics, not guarantees about commercial success. The bonus contributes to the heatmap score but is not yet exposed as its own generated response field.

## Manual routes outside the generated contract

| Route | Purpose |
| --- | --- |
| `GET /api/places/export` | Full CSV export |
| `GET /api/places/export-simple` | Simplified CSV export |
| `POST /api/places/import` | Multipart CSV upload with field `file` |
| `GET /api/sofiaplan/neighborhoods` | Neighborhood name list |
| `GET /api/metro/transit-stops` | Transit-stop GeoJSON |
| `GET /api/adres-locations` | Address.bg listing locations |
| `GET /api/bgproperties-locations` | BulgarianProperties listing locations |

These are registered directly in `cmd/main.go`, so Swagger is not a complete inventory of runtime endpoints. CSV import uses `ParseMultipartForm` with a 10 MiB memory threshold; that is not the same as a hard request-body size limit.

## Change an API operation

1. Edit `typespec/main.tsp`; install TypeSpec dependencies inside `typespec` if needed.
2. Run `make generate` and review both the OpenAPI and Go generated diff.
3. Implement the handler and application/store behavior; add a migration if required.
4. Update tests and regenerate mocks when an interface changes.
5. Update the frontend client plus Vite/nginx routes if browser access is needed.

For manually registered endpoints, keep the explicit route and this inventory in sync. Do not edit generated bindings as the primary implementation path.

## Reachability is separate from implementation

An endpoint can exist in GeoPulse and still be absent from the frontend proxy. Direct local calls go to port 8080. Production backend calls go through Envoy and need a valid Clerk token. See [routing and authentication](/operations/auth-and-routing) for the actual browser-facing paths.
