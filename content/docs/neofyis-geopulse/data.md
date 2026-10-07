---
title: Data model, migrations, and tiles
description: PostGIS conventions, dataset families, materialized views, and freshness management.
source_files:
  - neofyis-geopulse/migrations/embed.go
  - neofyis-geopulse/migrations/000002_places.up.sql
  - neofyis-geopulse/migrations/000043_materialize_tile_views.up.sql
  - neofyis-geopulse/migrations/000044_bgproperties_locations.up.sql
  - neofyis-geopulse/internal/store/queries.sql
  - neofyis-geopulse/internal/store/analytics.go
  - neofyis-geopulse/sqlc.yaml
  - neofyis-geopulse/Makefile
  - map-infra/apps/martin/martin-config.yaml
---

## Dataset families

| Family | Examples | Consumers |
| --- | --- | --- |
| Business places | `places`, category/tags, ratings, visitor estimates | Places API, clustering, competition analytics |
| Transport | GTFS stops/shapes, metro and surface transport views | GeoJSON endpoints and Martin layers |
| OSM | Nodes, edges, POIs | Pedestrian/network and POI layers |
| SofiaPlan | Zoning, income, property prices, demographics, buildings, health, flood risk | Location context and thematic vector tiles |
| Food access | Grocery-desert geometry and derived scores | Food-access map layers |
| Pedestrian movement | Sensors, calibrated and combined foot-traffic outputs | Traffic layers and analytics |
| Property listings | `retail_listings`, `adres_locations`, `bgproperties_locations` | Listing APIs and map overlays |

Tables and views are contracts, not proof of data coverage. A freshly migrated database can have valid tables and empty responses until imports are run.

## Spatial conventions

`places` stores scalar `lat`/`lng` columns and a `location` point geometry in SRID 4326. Build points in SQL as `ST_SetSRID(ST_MakePoint(lng, lat), 4326)`. The order is longitude first. Spatial distance queries cast to geography where meter-based distances are needed.

Follow the repository rule: do not scan raw `location`/`geom` values directly into ordinary Go scalar models. Use scalar coordinate columns or explicitly converted values. The sqlc geometry override does not make arbitrary binary PostGIS geometry automatically safe to read as a string.

`internal/store/queries.sql` drives generated CRUD code. Complex spatial analytics in `internal/store/analytics.go` use custom pgx queries. Metro GeoJSON is assembled in the application layer.

## Migration lifecycle

SQL files in `migrations/` are embedded into the Go binary. Startup applies pending numbered migrations before opening HTTP service. The inspected highest migration is **000044**, which introduces BulgarianProperties locations. Numbering has a gap; do not renumber historical files to fill it.

Add a new numbered up/down pair for schema changes, review the rollback behavior, and rebuild the binary so its embedded migration set is current. Test against a disposable database before shipping changes to imported data or derived views.

`make migrate-up` and `make migrate-down` run a Docker migration client. `MIGRATE_DB_URL` is a separate Makefile setting from `DATABASE_URL` and defaults to the host-Docker connection path. Confirm both when targeting a non-default database. `migrate-down` reverts one migration and can remove data; it is not an application restart command.

## Materialized tile views

Migration 000043 converts many live tile views into materialized views with unique and spatial indexes. This reduces repeated JSONB extraction on tile requests. Pedestrian-syntax and grocery-desert materializations were introduced earlier.

After an import, the corresponding materialized view needs refreshing. For example, after verifying the affected relation and its unique index:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY sofiaplan_income_tiles;
```

The importer does not establish a general automatic refresh policy for all these views. Refresh only the affected derived datasets after successful imports, check row counts, and account for nginx tile caching before judging freshness. See [troubleshooting](/operations/troubleshooting).

## Martin contract

Martin reads the same PostGIS data as GeoPulse. Local Compose uses database discovery; production mounts `apps/martin/martin-config.yaml`. Verify the running server's catalog and per-source TileJSON rather than relying solely on a filename or manifest comment.

For a new layer, align the table/view geometry and property columns, Martin source ID, emitted vector-layer ID, frontend URL template, and MapLibre `source-layer`. Restart local Martin after introducing new discoverable sources.

## Backup and restore helpers

`make db-dump` writes a compressed pg_dump archive to the Makefile's configured backup directory. `make db-restore` runs `pg_restore --clean --if-exists`; it replaces existing database objects. Confirm the target and restore plan before using it on shared data. No backups or restores were run while authoring this handbook.
