'use client';

import { useQuery } from 'convex/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { api } from '@/convex/_generated/api';

type Dashboard = {
  email: string | null;
  totals: {
    subjects: number;
    pagesDigitized: number;
    quizzesTaken: number;
    avgScore: number;
    bestScore: number;
  };
  perSubject: Array<{
    id: string;
    name: string;
    pageCount: number;
    attemptCount: number;
    avgScore: number;
    lastAttemptAt: number | null;
  }>;
  heatmap: Array<{ day: string; count: number }>;
  recentAttempts: Array<{
    id: string;
    mode: string;
    score: number;
    totalMarks: number;
    percentage: number;
    takenAt: number;
    subjectId: string | null;
  }>;
};

const WEEKS = 16;

function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildHeatmapWeeks(counts: Record<string, number>) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const currentWeekMonday = new Date(today);
  const dow = (today.getDay() + 6) % 7;
  currentWeekMonday.setDate(today.getDate() - dow);

  const weeks: Array<Array<{ key: string; count: number; future: boolean }>> =
    [];
  for (let w = WEEKS - 1; w >= 0; w--) {
    const week: Array<{ key: string; count: number; future: boolean }> = [];
    for (let r = 0; r < 7; r++) {
      const cell = new Date(currentWeekMonday);
      cell.setDate(currentWeekMonday.getDate() - w * 7 + r);
      const key = toDayKey(cell);
      week.push({ key, count: counts[key] ?? 0, future: cell > today });
    }
    weeks.push(week);
  }
  return weeks;
}

function heatClass(count: number, future: boolean): string {
  if (future) return 'bg-white/[0.02]';
  if (count <= 0) return 'bg-white/[0.06]';
  if (count < 3) return 'bg-[#E9C468]/25';
  if (count < 6) return 'bg-[#E9C468]/45';
  if (count < 9) return 'bg-[#E9C468]/70';
  return 'bg-[#E9C468]';
}

function scoreTier(avgScore: number): { bar: string; text: string } {
  if (avgScore >= 75) return { bar: 'bg-[#E9C468]', text: 'text-[#E9C468]' };
  if (avgScore >= 50) return { bar: 'bg-[#E9C468]', text: 'text-[#E9C468]' };
  if (avgScore > 0) return { bar: 'bg-white/30', text: 'text-gray-400' };
  return { bar: 'bg-white/[0.08]', text: 'text-gray-500' };
}

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

function relativeDate(ts: number | null): string {
  if (!ts) return 'Never';
  const diffMs = Date.now() - ts;
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / dayMs);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return DATE_FMT.format(new Date(ts));
}

export default function ProfilePage() {
  const data = useQuery(api.stats.dashboard, {}) as Dashboard | undefined;

  const { weeks, activeDays } = useMemo(() => {
    const counts: Record<string, number> = {};
    let days = 0;
    for (const h of data?.heatmap ?? []) {
      counts[h.day] = h.count;
      if (h.count > 0) days++;
    }
    return { weeks: buildHeatmapWeeks(counts), activeDays: days };
  }, [data]);
  const isEmpty =
    data !== undefined &&
    data.totals.subjects === 0 &&
    data.totals.pagesDigitized === 0 &&
    data.totals.quizzesTaken === 0;

  const cards = [
    { label: 'Subjects', value: data?.totals.subjects ?? 0 },
    { label: 'Pages Digitized', value: data?.totals.pagesDigitized ?? 0 },
    { label: 'Quizzes Taken', value: data?.totals.quizzesTaken ?? 0 },
    { label: 'Avg Score', value: data ? `${data.totals.avgScore}%` : '—' },
    { label: 'Best Score', value: data ? `${data.totals.bestScore}%` : '—' },
  ];

  return (
    <div className="relative min-h-screen overflow-x-clip bg-black text-white">
      <Navbar />
      <div className="relative z-20 pt-20">
        <div className="mr-auto ml-0 max-w-5xl px-6 sm:px-10 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display mb-2 text-3xl sm:text-5xl">
              Study <span className="text-gray-400">Stats</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-gray-500">
              Every page captured and every quiz graded — your effort, measured.
            </p>
          </motion.div>
        </div>

        <div className="mx-auto max-w-5xl px-6 pb-24 pt-10 sm:px-10 lg:px-20">
          {data === undefined ? (
            <div className="flex min-h-[60vh] items-center justify-center">
              <p className="animate-pulse text-sm text-gray-400">
                Loading your stats…
              </p>
            </div>
          ) : isEmpty ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-lg border border-white/[0.08] bg-[#0c0f0d] px-8 py-16 text-center"
            >
              <h2 className="font-display mb-2 text-xl text-white">
                Nothing here yet
              </h2>
              <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-gray-500">
                Capture your first notebook pages and take a quiz — your
                subjects, scores and activity will appear here.
              </p>
              <Link
                href="/notebook"
                className="label-meta inline-block rounded-md bg-[#E9C468] px-5 py-2.5 text-black hover:bg-[#F0D284]"
              >
                Go to Notebook
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-12">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {cards.map((c) => (
                  <div
                    key={c.label}
                    className="rounded-lg border border-white/[0.08] bg-[#0c0f0d] p-4"
                  >
                    <div className="label-meta mb-2 text-gray-500">
                      {c.label}
                    </div>
                    <div className="font-display text-2xl text-white">
                      {c.value}
                    </div>
                  </div>
                ))}
              </div>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-lg text-white">Activity</h2>
                  <span className="label-meta text-gray-500">
                    Last {WEEKS} weeks · {activeDays} active days
                  </span>
                </div>
                <div className="rounded-lg border border-white/[0.08] bg-[#0c0f0d] p-5">
                  <div className="flex gap-2">
                    <div className="flex flex-col justify-between py-px text-[9px] uppercase tracking-wide text-gray-600">
                      <span>Mon</span>
                      <span>Wed</span>
                      <span>Fri</span>
                      <span>Sun</span>
                    </div>
                    <div className="flex flex-1 gap-[3px] overflow-x-auto">
                      {weeks.map((week, wi) => (
                        <div
                          key={`week-${wi}`}
                          className="flex flex-col gap-[3px]"
                        >
                          {week.map((cell) => (
                            <div
                              key={cell.key}
                              title={`${cell.key}: ${cell.count}`}
                              className={`h-3 w-3 rounded-[3px] ${heatClass(cell.count, cell.future)}`}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] text-gray-500">
                    <span>Less</span>
                    {[0, 1, 4, 7, 10].map((n) => (
                      <span
                        key={n}
                        className={`h-2.5 w-2.5 rounded-[2px] ${heatClass(n, false)}`}
                      />
                    ))}
                    <span>More</span>
                  </div>
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-lg text-white">Subjects</h2>
                  <span className="label-meta text-gray-500">
                    {data.perSubject.length} tracked
                  </span>
                </div>
                <div className="space-y-3">
                  {data.perSubject.map((sub) => {
                    const tier = scoreTier(sub.avgScore);
                    return (
                      <div
                        key={sub.id}
                        className="rounded-lg border border-white/[0.08] bg-[#0c0f0d] p-4"
                      >
                        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="font-display text-base text-white">
                            {sub.name}
                          </h3>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{sub.pageCount} pages</span>
                            <span>{sub.attemptCount} attempts</span>
                            <span>{relativeDate(sub.lastAttemptAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className={`h-full rounded-full ${tier.bar}`}
                              style={{
                                width: `${Math.min(sub.avgScore, 100)}%`,
                              }}
                            />
                          </div>
                          <span
                            className={`label-meta w-10 text-right ${tier.text}`}
                          >
                            {sub.avgScore}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-lg text-white">
                    Recent Attempts
                  </h2>
                  <span className="label-meta text-gray-500">
                    {data.recentAttempts.length} shown
                  </span>
                </div>
                {data.recentAttempts.length === 0 ? (
                  <div className="rounded-lg border border-white/[0.08] bg-[#0c0f0d] p-6 text-sm text-gray-500">
                    No quizzes yet — grade a paper or run a quiz to see results.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#0c0f0d]">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.08]">
                          {['Date', 'Mode', 'Score', 'Result'].map((h) => (
                            <th
                              key={h}
                              className="label-meta px-4 py-3 font-normal text-gray-500"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentAttempts.map((a) => {
                          const tier = scoreTier(a.percentage);
                          return (
                            <tr
                              key={a.id}
                              className="border-b border-white/[0.04] last:border-b-0"
                            >
                              <td className="whitespace-nowrap px-4 py-3 text-gray-400">
                                {DATE_FMT.format(new Date(a.takenAt))}
                              </td>
                              <td className="px-4 py-3 text-gray-300">
                                {a.mode}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-gray-300">
                                {a.score}/{a.totalMarks}
                              </td>
                              <td
                                className={`whitespace-nowrap px-4 py-3 ${tier.text}`}
                              >
                                {a.percentage}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
