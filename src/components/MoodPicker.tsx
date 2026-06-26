import React, { useMemo, useRef } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Mood, MOODS } from '../types';
import { Theme } from '../theme';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  selected?: Mood;
  onSelect: (mood: Mood) => void;
}

type Styles = ReturnType<typeof makeStyles>;

interface ChipProps {
  mood: Mood;
  active: boolean;
  styles: Styles;
  onSelect: (mood: Mood) => void;
}

function MoodChip({ mood, active, styles, onSelect }: ChipProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePress() {
    Haptics.selectionAsync();
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.08, useNativeDriver: true, speed: 50, bounciness: 14 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 8 }),
    ]).start();
    onSelect(mood);
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[
          styles.chip,
          active && {
            borderColor: mood.color,
            backgroundColor: mood.color + '20',
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={styles.emoji}>{mood.emoji}</Text>
        <Text style={[styles.label, active && { color: mood.color }]}>{mood.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
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
      {MOODS.map((mood) => (
        <MoodChip
          key={mood.label}
          mood={mood}
          active={selected?.label === mood.label}
          styles={styles}
          onSelect={onSelect}
        />
      ))}
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
