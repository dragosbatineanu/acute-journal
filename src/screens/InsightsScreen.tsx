import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { JournalEntry, RootStackParamList } from '../types';
import { loadEntries } from '../storage/entries';
import { moodDistribution } from '../utils/stats';
import { Theme } from '../theme';
import { useTheme } from '../theme/ThemeContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Insights'>;

type Range = 'all' | '30d';

const RANGES: { key: Range; label: string }[] = [
  { key: 'all', label: 'All time' },
  { key: '30d', label: 'Last 30 days' },
];

export default function InsightsScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadEntries().then(setEntries);
    }, [])
  );

  const [range, setRange] = useState<Range>('all');

  // Entries within the selected window. 'all' passes everything through; '30d'
  // keeps the last 30 days by createdAt.
  const ranged = useMemo(() => {
    if (range === 'all') return entries;
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return entries.filter((e) => new Date(e.createdAt).getTime() >= cutoff);
  }, [entries, range]);

  const stats = useMemo(() => moodDistribution(ranged), [ranged]);
  // Scale bars to the most frequent mood so the longest bar always fills the
  // track; percentages still reflect the true share of entries in range.
  const maxCount = stats.length > 0 ? stats[0].count : 0;
  const total = ranged.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Insights</Text>
        <View style={{ width: 40 }} />
      </View>

      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing to chart yet</Text>
          <Text style={styles.emptyHint}>
            Write a few entries and your mood mix will show up here.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.rangeRow}>
            {RANGES.map(({ key, label }) => {
              const active = range === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.rangeChip, active && styles.rangeChipActive]}
                  onPress={() => setRange(key)}
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.rangeText, active && styles.rangeTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {stats.length === 0 ? (
            <View style={styles.emptyInline}>
              <Text style={styles.emptyTitle}>No entries in the last 30 days</Text>
              <Text style={styles.emptyHint}>
                Switch to All time, or write an entry to fill this window.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionLabel}>Mood distribution</Text>
              <Text style={styles.summary}>
                {total} {total === 1 ? 'entry' : 'entries'}
              </Text>

              <View style={styles.chart}>
            {stats.map(({ mood, count, percent }) => (
              <View key={mood.label} style={styles.barRow}>
                <View style={styles.barHeader}>
                  <Text style={styles.barLabel}>
                    {mood.emoji}  <Text style={{ color: mood.color }}>{mood.label}</Text>
                  </Text>
                  <Text style={styles.barCount}>
                    {count}
                    <Text style={styles.barPercent}>  {percent}%</Text>
                  </Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        backgroundColor: mood.color,
                        // Guard against a zero-width division; maxCount is only
                        // 0 when there are no stats, which is handled above.
                        width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`,
                      },
                    ]}
                  />
                </View>
              </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 22,
    color: theme.colors.text,
  },
  screenTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    letterSpacing: 0.2,
  },
  scroll: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  rangeChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  rangeChipActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accent + '18',
  },
  rangeText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.subtext,
    fontWeight: '500',
  },
  rangeTextActive: {
    color: theme.colors.accent,
  },
  sectionLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.subtext,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  summary: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    marginBottom: theme.spacing.lg,
  },
  chart: {
    gap: theme.spacing.md,
  },
  barRow: {
    gap: theme.spacing.xs,
  },
  barHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
  },
  barCount: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
  },
  barPercent: {
    fontSize: theme.fontSize.xs,
    fontWeight: '500',
    color: theme.colors.subtext,
  },
  track: {
    height: 10,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 80,
  },
  emptyInline: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.subtext,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
