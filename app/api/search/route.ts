import { auth } from '@clerk/nextjs/server';
import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

const search = createFromSource(source);

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });
  return search.GET(request);
}
