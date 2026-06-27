import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../theme';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  // The left-hand label, e.g. an emoji + colored mood name or a "#tag".
  label: React.ReactNode;
  count: number;
  percent: number;
  // Bar fill color.
  color: string;
  // 0–1 share of the track to fill; callers scale this to the largest item so
  // the longest bar always fills.
  fillRatio: number;
}

// A single horizontal stat bar: label and count/percent on top, a colored fill
// below. Shared by the mood and tag sections of the Insights screen.
export default function StatBar({ label, count, percent, color, fillRatio }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  // Clamp so a rounding overshoot can't push the fill past the track.
  const width = `${Math.max(0, Math.min(1, fillRatio)) * 100}%` as const;

  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.count}>
          {count}
          <Text style={styles.percent}>  {percent}%</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { backgroundColor: color, width }]} />
      </View>
    </View>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  row: {
    gap: theme.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  label: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
  },
  count: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
  },
  percent: {
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
});
