import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { DEMO_USER_ID } from './consts';

async function currentUserId(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject ?? DEMO_USER_ID;
}

export const add = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await currentUserId(ctx);
    const clean = name.trim().slice(0, 60);
    if (!clean) throw new Error('Subject name required');
    const dupe = await ctx.db
      .query('subjects')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('name'), clean))
      .first();
    if (dupe) return dupe._id;
    return ctx.db.insert('subjects', { userId, name: clean, createdAt: Date.now() });
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUserId(ctx);
    return ctx.db
      .query('subjects')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
  },
});

export const remove = mutation({
  args: { id: v.id('subjects') },
  handler: async (ctx, { id }) => {
    const userId = await currentUserId(ctx);
    const doc = await ctx.db.get(id);
    if (!doc || doc.userId !== userId) throw new Error('Not found');
    await ctx.db.delete(id);
  },
});
