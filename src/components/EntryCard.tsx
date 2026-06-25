import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { JournalEntry } from '../types';
import { theme } from '../theme';
import { formatShortDate } from '../utils/date';

interface Props {
  entry: JournalEntry;
  onPress: () => void;
}

export default function EntryCard({ entry, onPress }: Props) {
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});
