import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Theme } from '../theme';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  tags: string[];
  suggestions: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ tags, suggestions, onChange }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [draft, setDraft] = useState('');

  function addTag(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const exists = tags.some((t) => t.toLowerCase() === trimmed.toLowerCase());
    if (!exists) onChange([...tags, trimmed]);
    setDraft('');
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleChange(text: string) {
    // Treat comma as a commit, so "work," adds the tag.
    if (text.endsWith(',')) {
      addTag(text.slice(0, -1));
    } else {
      setDraft(text);
    }
  }

  const q = draft.trim().toLowerCase();
  const matches = q
    ? suggestions
        .filter(
          (s) =>
            s.toLowerCase().includes(q) &&
            !tags.some((t) => t.toLowerCase() === s.toLowerCase())
        )
        .slice(0, 6)
    : [];

  return (
    <View>
      {tags.length > 0 && (
        <View style={styles.chipWrap}>
          {tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.chip}
              onPress={() => removeTag(tag)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipText}>{tag}</Text>
              <Text style={styles.chipRemove}>✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Add a tag…"
        placeholderTextColor={theme.colors.muted}
        value={draft}
        onChangeText={handleChange}
        onSubmitEditing={() => addTag(draft)}
        returnKeyType="done"
        blurOnSubmit={false}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {matches.length > 0 && (
        <View style={styles.suggestRow}>
          {matches.map((s) => (
            <TouchableOpacity
              key={s}
              style={styles.suggestChip}
              onPress={() => addTag(s)}
              activeOpacity={0.7}
            >
              <Text style={styles.suggestText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accent + '18',
  },
  chipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  chipRemove: {
    fontSize: 11,
    color: theme.colors.accent,
  },
  input: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  suggestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  suggestChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  suggestText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.subtext,
    fontWeight: '500',
  },
});
