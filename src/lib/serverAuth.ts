import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const url = process.env.NEXT_PUBLIC_CONVEX_URL;

export async function requireUserFromRequest(
  request: Request,
): Promise<string | null> {
  if (!url) return null;
  const authorization = request.headers.get('authorization');
  if (!authorization) return null;
  try {
    const client = new ConvexHttpClient(url);
    client.setAuth(authorization);
    const { id } = await client.query(api.stats.me, {});
    void client.clearAuth();
    return id;
  } catch {
    return null;
  }
}
