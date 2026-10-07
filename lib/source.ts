import { loader } from 'fumadocs-core/source';
import { pageSchema } from 'fumadocs-core/source/schema';
import { defineDocs } from 'fumadocs-mdx/macro';
import { z } from 'zod';

const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema.extend({ source_files: z.array(z.string()) }),
  },
});

export const source = loader({
  baseUrl: '/',
  source: docs.toFumadocsSource(),
});
