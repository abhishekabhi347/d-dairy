import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { formatCount } from '@/domain/date';
import type { Book } from '@/domain/types';
import { FONTS } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/utils/color';
import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';
import { PressableScale } from '../ui/PressableScale';
import { SheetModal } from '../ui/SheetModal';
import { BookCover } from './BookCover';

interface BookSwitcherProps {
  visible: boolean;
  books: readonly Book[];
  activeBookId: string;
  counts: Record<string, number>;
  onClose: () => void;
  onSelect: (bookId: string) => void;
  onCreate: () => void;
  onManage: () => void;
}

export function BookSwitcher({
  visible,
  books,
  activeBookId,
  counts,
  onClose,
  onSelect,
  onCreate,
  onManage,
}: BookSwitcherProps) {
  const { colors } = useTheme();

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title="Your books"
      subtitle="Switch shelves without leaving your words behind."
      testID="book-switcher">
      <View style={styles.list}>
        {books.map((book) => {
          const active = book.id === activeBookId;
          return (
            <PressableScale
              key={book.id}
              accessibilityRole="button"
              accessibilityLabel={`Switch to ${book.title}`}
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(book.id)}
              style={[
                styles.row,
                {
                  backgroundColor: active ? colors.surfaceTint : colors.surfaceRaised,
                  borderColor: active ? withAlpha(colors.accent, 0.45) : colors.border,
                },
              ]}>
              <BookCover book={book} size="sm" />
              <View style={styles.rowText}>
                <View style={styles.titleLine}>
                  <AppText variant="subheading" numberOfLines={1} style={styles.title}>
                    {book.title}
                  </AppText>
                  {book.isMain ? (
                    <View style={[styles.badge, { backgroundColor: colors.goldSoft }]}>
                      <AppText
                        variant="caption"
                        style={{ color: colors.gold, fontFamily: FONTS.semibold }}>
                        Main
                      </AppText>
                    </View>
                  ) : null}
                </View>
                <AppText variant="caption">
                  {formatCount(counts[book.id] ?? 0, 'entry', 'entries')}
                </AppText>
              </View>
              <View
                style={[
                  styles.check,
                  {
                    backgroundColor: active ? colors.accent : 'transparent',
                    borderColor: active ? colors.accent : colors.borderStrong,
                  },
                ]}>
                {active ? <Feather name="check" size={12} color={colors.accentText} /> : null}
              </View>
            </PressableScale>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Button label="New book" icon="plus" onPress={onCreate} style={styles.flex} />
        <Button label="Manage shelf" icon="grid" onPress={onManage} variant="secondary" />
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 9,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 12,
    paddingRight: 14,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  title: {
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 20,
  },
  flex: {
    flexGrow: 1,
  },
});
