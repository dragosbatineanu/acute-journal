import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { JournalEntry, MOODS, Mood, RootStackParamList } from '../types';
import {
  addEntry,
  createId,
  getAllTags,
  loadEntries,
  normalizeTags,
  updateEntry,
} from '../storage/entries';
import { Theme } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import {
  MAX_PHOTOS_PER_ENTRY,
  cleanupRemovedPhotos,
  deletePhotos,
  photoUri,
  pickFromLibrary,
  takePhoto,
} from '../storage/photos';
import MoodPicker from '../components/MoodPicker';
import TagInput from '../components/TagInput';

type Nav = NativeStackNavigationProp<RootStackParamList, 'NewEntry'>;
type Route = RouteProp<RootStackParamList, 'NewEntry'>;

export default function NewEntryScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const existing = route.params?.entry;
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [happened, setHappened] = useState(existing?.happened ?? '');
  const [meaning, setMeaning] = useState(existing?.meaning ?? '');
  const [next, setNext] = useState(existing?.next ?? '');
  const [mood, setMood] = useState<Mood>(existing?.mood ?? MOODS[0]);
  const [important, setImportant] = useState(existing?.important ?? false);
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [photos, setPhotos] = useState<string[]>(existing?.photos ?? []);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Files persisted during this editing session. Used to clean up photos the
  // user added but never committed (e.g. they back out without saving).
  const sessionAddedRef = useRef<string[]>([]);
  const savedRef = useRef(false);

  useEffect(() => {
    loadEntries().then((all) => setTagSuggestions(getAllTags(all)));
  }, []);

  useEffect(() => {
    return () => {
      if (!savedRef.current && sessionAddedRef.current.length > 0) {
        deletePhotos(sessionAddedRef.current);
      }
    };
  }, []);

  async function addPhotos(source: 'camera' | 'library') {
    const remaining = MAX_PHOTOS_PER_ENTRY - photos.length;
    if (remaining <= 0) {
      Alert.alert('Photo limit', `You can attach up to ${MAX_PHOTOS_PER_ENTRY} photos.`);
      return;
    }
    const res = source === 'camera' ? await takePhoto() : await pickFromLibrary(remaining);
    if (res.status === 'denied') {
      Alert.alert(
        'Permission needed',
        source === 'camera'
          ? 'Allow camera access in your device settings to take photos.'
          : 'Allow photo access in your device settings to attach photos.'
      );
      return;
    }
    if (res.status === 'canceled') return;
    sessionAddedRef.current = [...sessionAddedRef.current, ...res.filenames];
    setPhotos((prev) => [...prev, ...res.filenames].slice(0, MAX_PHOTOS_PER_ENTRY));
  }

  function onAddPhotoPress() {
    Alert.alert('Add photo', undefined, [
      { text: 'Take photo', onPress: () => addPhotos('camera') },
      { text: 'Choose from library', onPress: () => addPhotos('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function removePhoto(filename: string) {
    setPhotos((prev) => prev.filter((p) => p !== filename));
    // A photo added this session isn't referenced by any saved entry yet, so
    // its file is safe to delete now. Original photos are kept until save, so
    // backing out preserves them.
    if (sessionAddedRef.current.includes(filename)) {
      sessionAddedRef.current = sessionAddedRef.current.filter((p) => p !== filename);
      deletePhotos([filename]);
    }
  }

  const meaningRef = useRef<TextInput>(null);
  const nextRef = useRef<TextInput>(null);
  const saveScale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(saveScale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  }

  function pressOut() {
    Animated.spring(saveScale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  }

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
      tags: normalizeTags(tags),
      photos,
    };
    if (existing) {
      // Delete files for photos that were on the entry but have been removed.
      cleanupRemovedPhotos(existing.photos, photos);
      await updateEntry(entry);
    } else {
      await addEntry(entry);
    }
    // Saved: keep the session's photos and let the unmount cleanup skip them.
    savedRef.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        behavior="padding"
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

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tags</Text>
            <View style={styles.tagSection}>
              <TagInput tags={tags} suggestions={tagSuggestions} onChange={setTags} />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Photos</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoRow}
              keyboardShouldPersistTaps="handled"
            >
              {photos.map((name) => (
                <View key={name} style={styles.photoThumbWrap}>
                  <Image source={{ uri: photoUri(name) }} style={styles.photoThumb} />
                  <TouchableOpacity
                    style={styles.photoRemove}
                    onPress={() => removePhoto(name)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.photoRemoveText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < MAX_PHOTOS_PER_ENTRY && (
                <TouchableOpacity style={styles.photoAdd} onPress={onAddPhotoPress} activeOpacity={0.7}>
                  <Text style={styles.photoAddIcon}>＋</Text>
                  <Text style={styles.photoAddLabel}>Photo</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
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
          <Animated.View style={{ transform: [{ scale: saveScale }] }}>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              onPressIn={pressIn}
              onPressOut={pressOut}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save entry'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
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
  tagSection: {
    paddingHorizontal: theme.spacing.md,
  },
  photoRow: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoThumbWrap: {
    position: 'relative',
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  photoRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    fontSize: 15,
    lineHeight: 18,
    color: theme.colors.text,
  },
  photoAdd: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  photoAddIcon: {
    fontSize: 22,
    color: theme.colors.subtext,
  },
  photoAddLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.subtext,
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
