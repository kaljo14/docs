---
title: Monitoring and logs
description: Metrics collection, log flow, storage, and the checks that monitoring actually performs.
source_files:
  - map-infra/apps/monitoring/prometheus/configmap.yaml
  - map-infra/apps/monitoring/prometheus/alerts-configmap.yaml
  - map-infra/apps/monitoring/prometheus/deployment.yaml
  - map-infra/apps/monitoring/victoriametrics/deployment.yaml
  - map-infra/apps/monitoring/grafana/configmap.yaml
  - map-infra/apps/monitoring/grafana/storage.yaml
  - map-infra/apps/monitoring/promtail/configmap.yaml
  - map-infra/apps/monitoring/loki/deployment.yaml
  - map-infra/apps/monitoring/blackbox/configmap.yaml
---

## Signal flow

```text
Envoy stats ──┐                       ┌──> VictoriaMetrics ──┐
Node/kubelet ─┼──> Prometheus ───────┤                     ├──> Grafana
Blackbox ─────┘                       └──> Alertmanager      │
Pod logs ─────> Promtail ──> Loki ────────────────────────────┘
```

All monitoring manifests are grouped under `apps/monitoring`. Prometheus scrapes on a 30-second interval and evaluates rules every 30 seconds. It discovers annotated application pods in `lonctus` and collects Envoy metrics from port 9901 at `/stats/prometheus`.

Promtail ships pod logs to Loki. Grafana provisions data sources/dashboards through ConfigMaps. VictoriaMetrics receives Prometheus remote-write traffic for longer retention. Node exporter and kubelet/cAdvisor jobs provide host/container telemetry.

## Storage and retention

| Component | Declared PVC | Retention setting |
| --- | --- | --- |
| Prometheus | 5 GiB | 15 days |
| VictoriaMetrics | 20 GiB | `-retentionPeriod=12` |
| Loki | 5 GiB | Inspect Loki configuration for effective policy |
| Grafana | 2 GiB | Stores application state, not primary metric history |

These are requested capacities, not available free space. Check PVC usage and retention together when diagnosing growth.

## Endpoint checks

The configured `blackbox-public` job probes the frontend, Grafana, and Clerk's JWKS endpoint. The blackbox config also defines an `http_4xx_ok` module that accepts selected 4xx statuses for protected services. Defining a module does not mean every protected endpoint is actually included as a scrape target.

A passing unauthenticated probe does not validate a complete authenticated map session, data contents, or user-specific permissions.

## Alerts and first response

Rules cover crash loops, pod readiness, OOM kills, CPU/memory pressure, endpoint failures/latency, certificate expiry, disk capacity, and Prometheus memory use. Verify that required metrics are being scraped before treating a silent alert rule as proof of health.

```bash
kubectl get pods,pvc -n monitoring
kubectl logs deployment/prometheus -n monitoring --tail=100
kubectl logs deployment/loki -n monitoring --tail=100
kubectl logs deployment/alertmanager -n monitoring --tail=100
```

Start with the affected service's application and Envoy logs, then correlate with infrastructure metrics. See [troubleshooting](/operations/troubleshooting) for request-path diagnosis. The handbook records the monitoring configuration without copying alert destinations or administrative credential values.
