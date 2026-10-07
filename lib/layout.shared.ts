import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'Lonctus · Engineering',
    },
    links: [
      { text: 'my-map', url: '/my-map/overview' },
      { text: 'GeoPulse', url: '/neofyis-geopulse/overview' },
      { text: 'Infrastructure', url: '/map-infra/overview' },
    ],
  };
}
