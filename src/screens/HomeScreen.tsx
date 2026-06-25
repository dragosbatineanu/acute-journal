import React, { useCallback, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { JournalEntry, Mood, MOODS, RootStackParamList } from '../types';
import { loadEntries } from '../storage/entries';
import { theme } from '../theme';
import EntryCard from '../components/EntryCard';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [search, setSearch] = useState('');
  const [moodFilter, setMoodFilter] = useState<Mood | null>(null);
  const [importantOnly, setImportantOnly] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadEntries().then(setEntries);
    }, [])
  );

  const filtered = entries.filter((e) => {
    if (moodFilter && e.mood.label !== moodFilter.label) return false;
    if (importantOnly && !e.important) return false;
    if (search) {
      const q = search.toLowerCase();
      const match = [e.happened, e.meaning, e.next, e.mood.label].some((t) =>
        t.toLowerCase().includes(q)
      );
      if (!match) return false;
    }
    return true;
  });

  const importantCount = entries.filter((e) => e.important).length;

  function toggleMoodFilter(mood: Mood) {
    setMoodFilter((prev) => (prev?.label === mood.label ? null : mood));
    setImportantOnly(false);
  }

  function toggleImportant() {
    setImportantOnly((prev) => !prev);
    setMoodFilter(null);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Acute</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('NewEntry', undefined)}
          accessibilityLabel="New entry"
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search entries..."
          placeholderTextColor={theme.colors.muted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <TouchableOpacity
          style={[styles.chip, !moodFilter && !importantOnly && styles.chipActive]}
          onPress={() => { setMoodFilter(null); setImportantOnly(false); }}
        >
          <Text style={[styles.chipText, !moodFilter && !importantOnly && styles.chipTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        {importantCount > 0 && (
          <TouchableOpacity
            style={[styles.chip, importantOnly && { borderColor: theme.colors.important, backgroundColor: theme.colors.important + '18' }]}
            onPress={toggleImportant}
          >
            <Text style={[styles.chipText, importantOnly && { color: theme.colors.important }]}>
              ★ Important
            </Text>
          </TouchableOpacity>
        )}

        {MOODS.map((mood) => {
          const active = moodFilter?.label === mood.label;
          return (
            <TouchableOpacity
              key={mood.label}
              style={[
                styles.chip,
                active && { borderColor: mood.color, backgroundColor: mood.color + '18' },
              ]}
              onPress={() => toggleMoodFilter(mood)}
            >
              <Text style={styles.filterEmoji}>{mood.emoji}</Text>
              <Text style={[styles.chipText, active && { color: mood.color }]}>{mood.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {entries.length > 0 && (
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {filtered.length === entries.length
              ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`
              : `${filtered.length} of ${entries.length}`}
          </Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => (
          <EntryCard
            entry={item}
            onPress={() => navigation.navigate('EntryDetail', { entry: item })}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {search || moodFilter || importantOnly ? 'No matches' : 'No entries yet'}
            </Text>
            <Text style={styles.emptyHint}>
              {search || moodFilter || importantOnly
                ? 'Try different filters or search terms'
                : 'Tap + to write your first entry'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 22,
    color: '#000',
    fontWeight: '400',
    lineHeight: 28,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
  },
  searchIcon: {
    fontSize: 18,
    color: theme.colors.subtext,
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: theme.spacing.xs,
  },
  clearText: {
    fontSize: 12,
    color: theme.colors.subtext,
  },
  filterRow: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  chipActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accent + '18',
  },
  chipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.subtext,
    fontWeight: '500',
  },
  chipTextActive: {
    color: theme.colors.accent,
  },
  filterEmoji: {
    fontSize: 13,
  },
  statsRow: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  statsText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.subtext,
    letterSpacing: 0.3,
  },
  list: {
    paddingBottom: theme.spacing.xl,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: theme.spacing.xl,
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
