import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BOOK_COLORS, BOOK_ICONS, MAX_BOOK_TITLE_LENGTH } from '@/domain/constants';
import { validateBookTitle } from '@/domain/books';
import type { Book } from '@/domain/types';
import { FONTS } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';
import { SheetModal } from '../ui/SheetModal';
import { TextField } from '../ui/TextField';

interface BookFormSheetProps {
  visible: boolean;
  book: Book | null;
  books: readonly Book[];
  onClose: () => void;
  onSave: (values: { title: string; icon: string; color: string }) => void;
  onDelete?: () => void;
}

export function BookFormSheet({
  visible,
  book,
  books,
  onClose,
  onSave,
  onDelete,
}: BookFormSheetProps) {
  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title={book ? 'Edit book' : 'Start a new book'}
      subtitle={
        book
          ? 'A new name, a new colour — same place for your words.'
          : 'A shelf for a trip, a project, a feeling, or anything that needs room.'
      }
      testID="book-form-sheet">
      {visible ? (
        <BookForm
          key={book?.id ?? 'new-book'}
          book={book}
          books={books}
          onSave={onSave}
          onDelete={onDelete}
        />
      ) : null}
    </SheetModal>
  );
}

interface BookFormProps {
  book: Book | null;
  books: readonly Book[];
  onSave: (values: { title: string; icon: string; color: string }) => void;
  onDelete?: () => void;
}

function BookForm({ book, books, onSave, onDelete }: BookFormProps) {
  const { colors } = useTheme();
  const [title, setTitle] = useState(book?.title ?? '');
  const [icon, setIcon] = useState<string>(book?.icon ?? BOOK_ICONS[1]);
  const [color, setColor] = useState<string>(book?.color ?? BOOK_COLORS[1]);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const validation = validateBookTitle(title, books, book?.id);
  const effectiveError = touched && !validation.valid ? error ?? validation.error : error;

  const handleSave = () => {
    setTouched(true);
    const result = validateBookTitle(title, books, book?.id);
    if (!result.valid) {
      setError(result.error);
      return;
    }
    onSave({ title: result.value, icon, color });
  };

  return (
    <View style={styles.form}>
      <TextField
        label="Book name"
        value={title}
        onChangeText={(value) => {
          setTitle(value);
          setTouched(true);
          setError(null);
        }}
        placeholder="Weekend notes, Big ideas, Gratitude…"
        autoCapitalize="sentences"
        maxLength={MAX_BOOK_TITLE_LENGTH}
        returnKeyType="done"
        error={effectiveError}
        hint={`${title.trim().length}/${MAX_BOOK_TITLE_LENGTH} · You can change this later`}
        onSubmitEditing={handleSave}
      />

      <View style={styles.group}>
        <AppText variant="label">Cover symbol</AppText>
        <View style={styles.iconGrid}>
          {BOOK_ICONS.map((item) => {
            const selected = icon === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityLabel={`Choose cover symbol ${item}`}
                accessibilityState={{ selected }}
                onPress={() => setIcon(item)}
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: selected ? colors.accentSoft : colors.surfaceRaised,
                    borderColor: selected ? colors.accent : colors.border,
                  },
                ]}>
                <AppText style={styles.iconText}>{item}</AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.group}>
        <AppText variant="label">Cover colour</AppText>
        <View style={styles.colorRow}>
          {BOOK_COLORS.map((item) => {
            const selected = color === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityLabel={`Choose cover colour ${item}`}
                accessibilityState={{ selected }}
                onPress={() => setColor(item)}
                style={[
                  styles.colorButton,
                  {
                    backgroundColor: item,
                    borderColor: selected ? colors.text : 'transparent',
                  },
                ]}>
                {selected ? <View style={styles.colorDot} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          label={book ? 'Save changes' : 'Create book'}
          onPress={handleSave}
          icon={book ? 'check' : 'plus'}
          style={styles.saveButton}
        />
        {book && !book.isMain && onDelete ? (
          <Button label="Delete book" onPress={onDelete} variant="danger" icon="trash-2" />
        ) : null}
      </View>

      {book?.isMain ? (
        <AppText variant="caption" align="center" style={{ fontFamily: FONTS.body }}>
          Your main diary always stays on the shelf.
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 22,
    paddingBottom: 8,
  },
  group: {
    gap: 10,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  iconButton: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconText: {
    fontSize: 21,
    lineHeight: 27,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 11,
  },
  colorButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 2,
  },
  saveButton: {
    flexGrow: 1,
  },
});
