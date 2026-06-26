import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { deleteEntry } from '../storage/entries';
import { Theme } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { formatFullDate } from '../utils/date';

type Nav = NativeStackNavigationProp<RootStackParamList, 'EntryDetail'>;
type Route = RouteProp<RootStackParamList, 'EntryDetail'>;

export default function EntryDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [entry, setEntry] = useState(route.params.entry);

  function handleEdit() {
    navigation.navigate('NewEntry', { entry });
  }

  function handleDelete() {
    Alert.alert('Delete entry', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteEntry(entry.id);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleEdit} style={styles.editBtn}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.metaRow}>
          <View style={styles.moodRow}>
            <Text style={styles.moodEmoji}>{entry.mood.emoji}</Text>
            <Text style={[styles.moodLabel, { color: entry.mood.color }]}>{entry.mood.label}</Text>
            {entry.important && <Text style={styles.star}>★</Text>}
          </View>
          <Text style={styles.dateText}>{formatFullDate(entry.createdAt)}</Text>
        </View>

        <View style={styles.divider} />

        {entry.happened ? (
          <View style={styles.section}>
            <Text style={styles.questionLabel}>What happened</Text>
            <Text style={styles.answer}>{entry.happened}</Text>
          </View>
        ) : null}

        {entry.meaning ? (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.questionLabel}>What it meant</Text>
              <Text style={styles.answer}>{entry.meaning}</Text>
            </View>
          </>
        ) : null}

        {entry.next ? (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.questionLabel}>What now</Text>
              <Text style={styles.answer}>{entry.next}</Text>
            </View>
          </>
        ) : null}

        {entry.tags.length > 0 ? (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.questionLabel}>Tags</Text>
              <View style={styles.tagWrap}>
                {entry.tags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : null}

        <View style={styles.bottomSpace} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.7}>
          <Text style={styles.deleteBtnText}>Delete entry</Text>
        </TouchableOpacity>
      </View>
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
  editBtn: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  editText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  scroll: {
    paddingBottom: theme.spacing.lg,
  },
  metaRow: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  moodEmoji: {
    fontSize: 20,
  },
  moodLabel: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
  },
  star: {
    fontSize: 16,
    color: theme.colors.important,
  },
  dateText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.subtext,
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  questionLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.subtext,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
  },
  answer: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    lineHeight: 28,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  tagChipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.subtext,
    fontWeight: '500',
  },
  bottomSpace: {
    height: theme.spacing.xl,
  },
  footer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  deleteBtn: {
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.destructive + '60',
  },
  deleteBtnText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.destructive,
  },
});
