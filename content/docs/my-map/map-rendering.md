---
title: MapLibre rendering and layers
description: How native MapLibre layers, deck.gl places, drawing, and lifecycle cleanup work together.
source_files:
  - my-map/src/composables/useMapInstance.ts
  - my-map/src/composables/useDeckOverlay.ts
  - my-map/src/composables/usePlacesDeckLayer.ts
  - my-map/src/composables/usePolygonDrawing.ts
  - my-map/src/composables/useMapMarkers.ts
  - my-map/src/stores/mapConfig.ts
  - my-map/src/api/tiles.ts
  - my-map/docs/maplibre-migration.md
---

## Rendering responsibilities

| Data | Rendering path |
| --- | --- |
| OpenFreeMap light/dark basemaps | MapLibre style, sources, and layers |
| Martin vector tiles | MapLibre vector sources with explicit `source-layer` names |
| Metro/transit stops and listings | MapLibre GeoJSON sources and native layers |
| Business places | Supercluster index → deck.gl scatterplot, text, and icon layers |
| Drawing/selected polygon | MapLibre GeoJSON line, circle, fill, and outline layers |
| Comparison pins, user pins, geocoding result | MapLibre DOM markers |
| Feature details | MapLibre popups; shop popups mount a Vue component |

There is no Leaflet runtime. In the installed deck.gl **9.2** release, `MapboxOverlay` from `@deck.gl/mapbox` is the adapter used with MapLibre. Its name does not mean Mapbox GL JS is installed. Check version-specific adapter compatibility when upgrading deck.gl.

## Map startup and teardown

`useMapInstance` fetches the selected style, namespaces basemap source/layer IDs, creates the map, attaches attribution/navigation controls, observes container size, and waits for `load`.

Place composables are registered synchronously during Vue setup. `InteractiveMap.vue` publishes a separate ready-map ref only after drawing sources and the deck overlay exist. This lets Vue own the watchers while keeping them away from a half-initialized map.

On teardown, the map is removed, pending initialization is aborted, resize observers and URL timers are cleared, marker resources are released, and popup Vue apps unmount on close. The map-owned Pinia layer store is disposed so reopening does not retain visibility state disconnected from a new map. Each map has its own deck overlay registry.

## Coordinates and URL state

MapLibre/GeoJSON use **`[longitude, latitude]`**. The application's polygon tuples and stored map center use **`[latitude, longitude]`**. Conversion happens at the drawing/camera boundary. A click exposes `event.lngLat`; shop/listing actions accept its `lat` and `lng` properties directly.

URL parameters are `lat`, `lng`, and `zoom`. Camera movement updates them after a short debounce. Route changes move the camera explicitly; fractional zoom is retained, and rounding tolerance prevents feedback loops.

## Theme switching preserves analysis

Basemap sources and layers use the reserved `basemap-` prefix. `switchBaseLayer` uses `setStyle` with a transform that keeps application sources and layers while replacing basemap resources. Do not use that prefix for a domain layer.

When testing a new layer, switch light/dark while it is visible, filtered, and accompanied by an active polygon. Confirm source data, visibility, layer order, and interactions survive the change.

## Tile contracts

A MapLibre source ID is a frontend identifier. A vector tile's `source-layer` is a server-side layer name. They need not match, but the latter must match Martin's TileJSON. Check `/api/martin/catalog` and `/api/martin/<source>` when a tile request succeeds but the map draws nothing.

`src/api/tiles.ts` owns URL templates. The map's request transform attaches the cached Clerk token to tile requests containing `/api/`. Other fetches need their own authenticated client; a tile transform does not automatically authenticate a diagnostic catalog request.

The migration regression tests cover lifecycle, URL sync, theme preservation, clustering, and polygon coordinate conversion using mocked map interfaces. They do not prove that a live GPU, tile service, or external style is working.
