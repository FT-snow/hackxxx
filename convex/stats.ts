import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { DEMO_USER_ID } from './consts';

async function currentUserId(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject ?? DEMO_USER_ID;
}

export const recordAttempt = mutation({
  args: {
    subjectId: v.optional(v.id('subjects')),
    mode: v.string(),
    totalQuestions: v.number(),
    score: v.number(),
    totalMarks: v.number(),
  },
  handler: async (ctx, a) => {
    const userId = await currentUserId(ctx);
    const pct =
      a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
    const id = await ctx.db.insert('quizAttempts', {
      userId,
      subjectId: a.subjectId,
      mode: a.mode,
      totalQuestions: a.totalQuestions,
      score: a.score,
      totalMarks: a.totalMarks,
      percentage: pct,
      takenAt: Date.now(),
    });

    const day = new Date().toISOString().slice(0, 10);
    const existing = await ctx.db
      .query('studyDays')
      .withIndex('by_user_day', (q) => q.eq('userId', userId).eq('day', day))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { count: existing.count + 1 });
    } else {
      await ctx.db.insert('studyDays', { userId, day, count: 1 });
    }
    return id;
  },
});

export const bumpStudyDay = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUserId(ctx);
    const day = new Date().toISOString().slice(0, 10);
    const existing = await ctx.db
      .query('studyDays')
      .withIndex('by_user_day', (q) => q.eq('userId', userId).eq('day', day))
      .first();
    if (existing)
      await ctx.db.patch(existing._id, { count: existing.count + 1 });
    else await ctx.db.insert('studyDays', { userId, day, count: 1 });
  },
});

export const dashboard = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUserId(ctx);

    const [subjects, pages, attempts, _days] = await Promise.all([
      ctx.db
        .query('subjects')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect(),
      ctx.db
        .query('pages')
        .withIndex('by_owner', (q) => q.eq('ownerId', userId))
        .take(1000),
      ctx.db
        .query('quizAttempts')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect(),
      ctx.db
        .query('studyDays')
        .withIndex('by_user_day', (q) => q.eq('userId', userId))
        .collect(),
    ]);

    const perSubject = subjects.map((sub) => ({
      id: sub._id,
      name: sub.name,
      pageCount: pages.filter((p) => p.subjectId === sub._id).length,
      attempts: attempts.filter((a) => a.subjectId === sub._id),
    }));

    const byDay: Record<string, number> = {};
    for (const p of pages) {
      const d = new Date(p.capturedAt).toISOString().slice(0, 10);
      byDay[d] = (byDay[d] ?? 0) + 1;
    }

    return {
      email: null,
      totals: {
        subjects: subjects.length,
        pagesDigitized: pages.length,
        quizzesTaken: attempts.length,
        avgScore:
          attempts.length > 0
            ? Math.round(
                attempts.reduce((s, a) => s + a.percentage, 0) /
                  attempts.length,
              )
            : 0,
        bestScore:
          attempts.length > 0
            ? Math.max(...attempts.map((a) => a.percentage))
            : 0,
      },
      perSubject: perSubject.map((ps) => ({
        ...ps,
        attemptCount: ps.attempts.length,
        avgScore:
          ps.attempts.length > 0
            ? Math.round(
                ps.attempts.reduce((s, x) => s + x.percentage, 0) /
                  ps.attempts.length,
              )
            : 0,
        lastAttemptAt: ps.attempts.length
          ? Math.max(...ps.attempts.map((a) => a.takenAt))
          : null,
      })),
      heatmap: Object.entries(byDay).map(([day, count]) => ({ day, count })),
      recentAttempts: [...attempts]
        .sort((x, y) => y.takenAt - x.takenAt)
        .slice(0, 10)
        .map((a) => ({
          id: a._id,
          mode: a.mode,
          score: a.score,
          totalMarks: a.totalMarks,
          percentage: a.percentage,
          takenAt: a.takenAt,
          subjectId: a.subjectId,
        })),
    };
  },
});
