import type { ReactNode } from 'react';
import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';

export const metadata = {
  title: {
    default: 'Lonctus Engineering',
    template: '%s · Lonctus Engineering',
  },
  description: 'Internal engineering documentation for my-map, map-infra, and neofyis-geopulse.',
  robots: { index: false, follow: false },
  icons: { icon: '/img/mark.svg' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
