import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page';
import { source } from '@/lib/source';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  await auth.protect();

  const { slug } = await props.params;
  const page = source.getPage(slug ?? []);
  if (!page) return {};

  return {
    title: page.data.title,
    description: page.data.description,
  };
}

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  await auth.protect();

  const { slug } = await props.params;
  const page = source.getPage(slug ?? []);
  if (!page) notFound();

  const MDX = page.data.body;
  return (
    <DocsPage toc={page.data.toc}>
      <DocsTitle className="handbook-title">{page.data.title}</DocsTitle>
      <DocsDescription className="handbook-description">{page.data.description}</DocsDescription>
      <DocsBody className="handbook-body">
        <MDX components={defaultMdxComponents} />
      </DocsBody>
    </DocsPage>
  );
}
