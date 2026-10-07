---
title: Ingestion jobs and MCP
description: Google, OSM, SofiaPlan, and property ingestion, plus the local MCP bridge.
source_files:
  - neofyis-geopulse/internal/app/scraper.go
  - neofyis-geopulse/internal/app/enricher.go
  - neofyis-geopulse/internal/app/osm.go
  - neofyis-geopulse/internal/app/sofiaplan.go
  - neofyis-geopulse/scraper/scrape_address.py
  - neofyis-geopulse/scraper/scrape_bgproperties.py
  - neofyis-geopulse/scraper/requirements.txt
  - neofyis-geopulse/cmd/mcp-server/main.go
  - neofyis-geopulse/internal/mcp/client.go
  - neofyis-geopulse/internal/mcp/tools.go
---

## Go background jobs

Google scrape/enrich, OSM imports, and SofiaPlan imports run in application-managed goroutines. A successful trigger returns **202 Accepted**, meaning work has started, not that data is complete. There is no durable external job queue or general job-status API in this implementation.

| Workflow | Trigger | Implementation notes |
| --- | --- | --- |
| Google Places discovery | `POST /scrape` | Reads `SCRAPE_*`; text query selects Text Search, otherwise Nearby Search |
| Google details enrichment | `POST /enrich` | Fetches missing details for selected places |
| OSM network | `POST /api/osm/import` | Downloads and builds network data through Overpass |
| OSM POIs | `POST /api/osm/pois` | Imports POI data |
| SofiaPlan | `POST /api/sofiaplan/import` | Imports configured planning datasets; inspect the layer selector before invoking |

Both Google workflows require `GOOGLE_API_KEY`. Job progress/failures are logged. The app owns cancellation and a wait group for shutdown; a process restart does not provide durable job resumption.

Before triggering a job, identify its database target and expected external requests. After it finishes, verify base data and refresh affected materialized views. Do not infer success from the trigger's 202 alone.

## Python property scrapers

`scraper/scrape_address.py` gathers Address.bg commercial rentals, fills missing coordinates/address details, and has a Nominatim fallback. It writes JSONL/CSV output and upserts `adres_locations`.

`scraper/scrape_bgproperties.py` gathers BulgarianProperties commercial rentals, visits detail pages for map coordinates, writes its own outputs, and upserts `bgproperties_locations`.

Both read `DATABASE_URL` and have local development defaults. They are standalone scripts, not Kubernetes CronJobs defined by this infrastructure repo. Install their dependencies into a virtual environment when needed:

```bash
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r scraper/requirements.txt
```

Review each script's search scope and database target before running it. Keep output datasets and operational credentials outside the docs repository.

## MCP bridge

`cmd/mcp-server` builds a **stdio** MCP server. It wraps REST GET calls; it does not access PostGIS directly or replace GeoPulse.

```bash
make mcp-server
GEOPULSE_API_URL=http://localhost:8080 ./bin/mcp-server
```

The second command is the process an MCP client launches, not an interactive HTTP server. The default API URL is already `http://localhost:8080`.

| Tool | REST capability |
| --- | --- |
| `search_places` | Place listing with category/tag filters |
| `get_saturation` | Competition score at a coordinate |
| `get_opportunity_heatmap` | Bounding-box heatmap |
| `get_location_context` | SofiaPlan context |
| `list_retail_listings` | Retail listing retrieval |

The current HTTP client uses a 30-second timeout and has no Clerk-token injection. Pointing it at a protected production Envoy endpoint will require authentication support or an appropriately protected internal access path; changing only `GEOPULSE_API_URL` is insufficient.
