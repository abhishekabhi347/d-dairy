import { Feather } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { formatCount, formatRelativeUpdate } from '@/domain/date';
import type { Book } from '@/domain/types';
import { FONTS } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/utils/color';
import { AppText } from '../ui/AppText';
import { IconButton } from '../ui/IconButton';
import { PressableScale } from '../ui/PressableScale';
import { BookCover } from './BookCover';

interface BookCardProps {
  book: Book;
  entryCount: number;
  isActive: boolean;
  onOpen: () => void;
  onEdit: () => void;
  style?: StyleProp<ViewStyle>;
}

export function BookCard({ book, entryCount, isActive, onOpen, onEdit, style }: BookCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isActive ? colors.surfaceTint : colors.surface,
          borderColor: isActive ? withAlpha(colors.accent, 0.5) : colors.border,
        },
        style,
      ]}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`Open ${book.title}`}
        accessibilityHint={`${formatCount(entryCount, 'entry', 'entries')} in this book`}
        onPress={onOpen}
        style={styles.pressable}>
        <View style={styles.topRow}>
          <BookCover book={book} size="md" />
          <View style={styles.badgeStack}>
            {book.isMain ? (
              <View style={[styles.badge, { backgroundColor: colors.goldSoft }]}>
                <Feather name="home" size={10} color={colors.gold} />
                <AppText variant="caption" style={{ color: colors.gold, fontFamily: FONTS.semibold }}>
                  Main diary
                </AppText>
              </View>
            ) : null}
            {isActive ? (
              <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
                <View style={[styles.dot, { backgroundColor: colors.accent }]} />
                <AppText
                  variant="caption"
                  style={{ color: colors.accent, fontFamily: FONTS.semibold }}>
                  Writing here
                </AppText>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.copy}>
          <AppText variant="heading" numberOfLines={1}>
            {book.title}
          </AppText>
          <AppText variant="bodySmall">
            {formatCount(entryCount, 'entry', 'entries')} · Updated{' '}
            {formatRelativeUpdate(book.updatedAt)}
          </AppText>
        </View>

        <View style={styles.footer}>
          <AppText
            variant="bodySmall"
            style={{
              color: isActive ? colors.accent : colors.textSecondary,
              fontFamily: FONTS.semibold,
            }}>
            {isActive ? 'Continue writing' : 'Switch to book'}
          </AppText>
          <Feather
            name="arrow-right"
            size={15}
            color={isActive ? colors.accent : colors.textSecondary}
          />
        </View>
      </PressableScale>

      <IconButton
        icon="more-horizontal"
        accessibilityLabel={`Edit ${book.title}`}
        variant="surface"
        size={34}
        iconSize={16}
        onPress={onEdit}
        style={styles.editButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  pressable: {
    padding: 18,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  badgeStack: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 1,
    maxWidth: '70%',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  copy: {
    gap: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(120, 100, 80, 0.15)',
  },
  editButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
});
