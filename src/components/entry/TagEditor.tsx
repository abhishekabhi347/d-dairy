import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MAX_TAG_LENGTH, MAX_TAGS_PER_ENTRY } from '@/domain/constants';
import { normalizeTag, tagLabel } from '@/domain/entries';
import { suggestTags } from '@/domain/suggestions';
import { FONTS } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from '../ui/AppText';
import { Chip } from '../ui/Chip';
import { PressableScale } from '../ui/PressableScale';
import { TextField } from '../ui/TextField';

interface TagEditorProps {
  tags: readonly string[];
  text: string;
  onChange: (tags: string[]) => void;
}

export function TagEditor({ tags, text, onChange }: TagEditorProps) {
  const { colors } = useTheme();
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const suggestions = suggestTags(text, tags, 6).filter((tag) => !tags.includes(tag));
  const full = tags.length >= MAX_TAGS_PER_ENTRY;

  const addTag = () => {
    const normalized = normalizeTag(value);
    if (!normalized) {
      setError('Use a letter or number.');
      return;
    }
    if (tags.includes(normalized)) {
      setError('That tag is already here.');
      return;
    }
    onChange([...tags, normalized]);
    setValue('');
    setError(null);
    setAdding(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="label">Threads</AppText>
        <AppText variant="caption">Tap to annotate</AppText>
      </View>

      <View style={styles.chips}>
        {tags.map((tag) => (
          <Chip
            key={tag}
            label={tagLabel(tag)}
            selected
            icon="x"
            accessibilityLabel={`Remove ${tagLabel(tag)} tag`}
            onPress={() => onChange(tags.filter((item) => item !== tag))}
          />
        ))}

        {suggestions.map((tag) => (
          <Chip
            key={tag}
            label={tagLabel(tag)}
            icon="plus"
            accessibilityLabel={`Add ${tagLabel(tag)} tag`}
            onPress={() => onChange([...tags, tag])}
          />
        ))}

        {!adding && !full ? (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Add a custom tag"
            onPress={() => {
              setAdding(true);
              setError(null);
            }}
            style={[styles.addButton, { borderColor: colors.borderStrong }]}>
            <Feather name="tag" size={12} color={colors.textSecondary} />
            <AppText
              variant="bodySmall"
              style={{ color: colors.textSecondary, fontFamily: FONTS.medium }}>
              Custom
            </AppText>
          </PressableScale>
        ) : null}
      </View>

      {adding ? (
        <View style={styles.addRow}>
          <TextField
            value={value}
            onChangeText={(next) => {
              setValue(next);
              setError(null);
            }}
            placeholder="Add a thread…"
            autoFocus
            maxLength={MAX_TAG_LENGTH}
            returnKeyType="done"
            onSubmitEditing={addTag}
            error={error}
            containerStyle={styles.input}
          />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Save tag"
            onPress={addTag}
            style={[styles.saveTag, { backgroundColor: colors.accent }]}>
            <Feather name="check" size={16} color={colors.accentText} />
          </PressableScale>
        </View>
      ) : null}

      {full ? <AppText variant="caption">Up to {MAX_TAGS_PER_ENTRY} threads per entry.</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addButton: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  input: {
    flex: 1,
  },
  saveTag: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
