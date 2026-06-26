import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { JournalEntry } from '../types';
import { Theme } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { formatShortDate } from '../utils/date';

interface Props {
  entry: JournalEntry;
  onPress: () => void;
}

const MAX_VISIBLE_TAGS = 3;

export default function EntryCard({ entry, onPress }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const visibleTags = entry.tags.slice(0, MAX_VISIBLE_TAGS);
  const overflow = entry.tags.length - visibleTags.length;
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.65}>
      <View style={styles.header}>
        <View style={styles.moodRow}>
          <Text style={styles.moodEmoji}>{entry.mood.emoji}</Text>
          <Text style={[styles.moodLabel, { color: entry.mood.color }]}>{entry.mood.label}</Text>
          {entry.important && <Text style={styles.star}>★</Text>}
        </View>
        <Text style={styles.date}>{formatShortDate(entry.createdAt)}</Text>
      </View>
      <Text style={styles.happened} numberOfLines={2}>
        {entry.happened}
      </Text>
      {entry.tags.length > 0 && (
        <View style={styles.tagWrap}>
          {visibleTags.map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagChipText} numberOfLines={1}>{tag}</Text>
            </View>
          ))}
          {overflow > 0 && <Text style={styles.tagMore}>+{overflow}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moodEmoji: {
    fontSize: 15,
  },
  moodLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  star: {
    fontSize: 13,
    color: theme.colors.important,
  },
  date: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.subtext,
    letterSpacing: 0.3,
  },
  happened: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 22,
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: theme.spacing.sm,
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    maxWidth: 140,
  },
  tagChipText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.subtext,
    fontWeight: '500',
  },
  tagMore: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    fontWeight: '600',
  },
});
