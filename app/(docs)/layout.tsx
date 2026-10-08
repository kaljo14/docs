import type { ReactNode } from 'react';
import { auth } from '@clerk/nextjs/server';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/lib/source';
import { baseOptions } from '@/lib/layout.shared';

export default async function DocumentationLayout({ children }: { children: ReactNode }) {
  await auth.protect();

  return (
    <DocsLayout {...baseOptions()} tree={source.getPageTree()}>
      {children}
    </DocsLayout>
  );
}
