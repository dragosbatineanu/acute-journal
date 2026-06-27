import { JournalEntry, Mood, MOODS } from '../types';

export interface MoodStat {
  mood: Mood;
  count: number;
  // Share of all entries, 0–100, rounded to a whole number.
  percent: number;
}

// Tally entries per mood and sort by frequency. Matches on mood.label (the same
// key the Home filter uses) so entries restored from older backups still line
// up with the current MOODS list. Moods with no entries are dropped. Ties keep
// the canonical MOODS order via the index lookup.
export function moodDistribution(entries: JournalEntry[]): MoodStat[] {
  const total = entries.length;
  if (total === 0) return [];

  const counts = new Map<string, number>();
  for (const entry of entries) {
    const label = entry.mood?.label;
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const order = new Map(MOODS.map((m, i) => [m.label, i]));

  return MOODS.filter((m) => counts.has(m.label))
    .map((mood) => {
      const count = counts.get(mood.label) ?? 0;
      return { mood, count, percent: Math.round((count / total) * 100) };
    })
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return (order.get(a.mood.label) ?? 0) - (order.get(b.mood.label) ?? 0);
    });
}
