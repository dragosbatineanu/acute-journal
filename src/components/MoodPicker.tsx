import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Mood, MOODS } from '../types';
import { Theme } from '../theme';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  selected?: Mood;
  onSelect: (mood: Mood) => void;
}

export default function MoodPicker({ selected, onSelect }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {MOODS.map((mood) => {
        const active = selected?.label === mood.label;
        return (
          <TouchableOpacity
            key={mood.label}
            style={[
              styles.chip,
              active && {
                borderColor: mood.color,
                backgroundColor: mood.color + '20',
              },
            ]}
            onPress={() => onSelect(mood)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{mood.emoji}</Text>
            <Text style={[styles.label, active && { color: mood.color }]}>{mood.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  row: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.subtext,
    fontWeight: '500',
  },
});
