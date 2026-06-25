import React, { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { JournalEntry, MOODS, Mood, RootStackParamList } from '../types';
import { addEntry, createId, updateEntry } from '../storage/entries';
import { theme } from '../theme';
import MoodPicker from '../components/MoodPicker';

type Nav = NativeStackNavigationProp<RootStackParamList, 'NewEntry'>;
type Route = RouteProp<RootStackParamList, 'NewEntry'>;

export default function NewEntryScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const existing = route.params?.entry;

  const [happened, setHappened] = useState(existing?.happened ?? '');
  const [meaning, setMeaning] = useState(existing?.meaning ?? '');
  const [next, setNext] = useState(existing?.next ?? '');
  const [mood, setMood] = useState<Mood>(existing?.mood ?? MOODS[0]);
  const [important, setImportant] = useState(existing?.important ?? false);
  const [saving, setSaving] = useState(false);

  const meaningRef = useRef<TextInput>(null);
  const nextRef = useRef<TextInput>(null);

  async function handleSave() {
    if (!happened.trim()) {
      Alert.alert('Required', 'Tell us what happened before saving.');
      return;
    }
    setSaving(true);
    const entry: JournalEntry = {
      id: existing?.id ?? createId(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      happened: happened.trim(),
      meaning: meaning.trim(),
      next: next.trim(),
      mood,
      important,
    };
    if (existing) {
      await updateEntry(entry);
    } else {
      await addEntry(entry);
    }
    setSaving(false);
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>{existing ? 'Edit entry' : 'New entry'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.field}>
            <Text style={styles.question}>What happened?</Text>
            <TextInput
              style={styles.input}
              placeholder="The event, the moment, the thing."
              placeholderTextColor={theme.colors.muted}
              value={happened}
              onChangeText={setHappened}
              multiline
              textAlignVertical="top"
              returnKeyType="next"
              onSubmitEditing={() => meaningRef.current?.focus()}
              blurOnSubmit={false}
              autoFocus={!existing}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.field}>
            <Text style={styles.question}>What did it mean?</Text>
            <TextInput
              ref={meaningRef}
              style={styles.input}
              placeholder="Why does it matter?"
              placeholderTextColor={theme.colors.muted}
              value={meaning}
              onChangeText={setMeaning}
              multiline
              textAlignVertical="top"
              returnKeyType="next"
              onSubmitEditing={() => nextRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.field}>
            <Text style={styles.question}>What now?</Text>
            <TextInput
              ref={nextRef}
              style={styles.input}
              placeholder="The decision, the next move."
              placeholderTextColor={theme.colors.muted}
              value={next}
              onChangeText={setNext}
              multiline
              textAlignVertical="top"
              returnKeyType="done"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Mood</Text>
            <MoodPicker selected={mood} onSelect={setMood} />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.importantRow}
            onPress={() => setImportant((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={[styles.starIcon, important && styles.starActive]}>
              {important ? '★' : '☆'}
            </Text>
            <View>
              <Text style={[styles.importantLabel, important && { color: theme.colors.important }]}>
                Mark as important
              </Text>
              <Text style={styles.importantHint}>Shows up in your important moments filter</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save entry'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    paddingBottom: theme.spacing.lg,
  },
  field: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  question: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    letterSpacing: -0.3,
  },
  input: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 24,
    minHeight: 72,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  section: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  sectionLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.subtext,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  importantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  starIcon: {
    fontSize: 28,
    color: theme.colors.muted,
  },
  starActive: {
    color: theme.colors.important,
  },
  importantLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.subtext,
    marginBottom: 2,
  },
  importantHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
  },
  footer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.3,
  },
});
