import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookCard } from '@/components/book/BookCard';
import { BookFormSheet } from '@/components/book/BookFormSheet';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FadeInView } from '@/components/ui/FadeInView';
import { IconButton } from '@/components/ui/IconButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { useApp } from '@/context/AppProvider';
import { createBookRecord } from '@/domain/books';
import { bookEntryCounts } from '@/domain/entries';
import { createId } from '@/domain/id';
import type { Book } from '@/domain/types';
import { useHaptics } from '@/hooks/useHaptics';
import { useResponsive } from '@/hooks/useResponsive';
import { FONTS, TAB_BAR_INSET } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { confirmDestructive } from '@/utils/confirm';

export default function BooksScreen() {
  const { state, dispatch } = useApp();
  const { colors } = useTheme();
  const { gutters, isExpanded, isTablet } = useResponsive();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const triggerHaptic = useHaptics();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const counts = useMemo(() => bookEntryCounts(state.entries), [state.entries]);
  const books = useMemo(
    () =>
      [...state.books].sort((a, b) => {
        if (a.isMain !== b.isMain) return a.isMain ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      }),
    [state.books],
  );
  const totalTagged = useMemo(
    () => state.entries.filter((entry) => entry.tags.length > 0).length,
    [state.entries],
  );
  const cardBasis: `${number}%` = isExpanded ? '31.6%' : isTablet ? '48.4%' : '100%';

  const openCreate = () => {
    setEditingBook(null);
    setFormOpen(true);
  };

  const openEdit = (book: Book) => {
    setEditingBook(book);
    setFormOpen(true);
  };

  const saveBook = (values: { title: string; icon: string; color: string }) => {
    if (editingBook) {
      dispatch({ type: 'UPDATE_BOOK', id: editingBook.id, changes: values });
    } else {
      dispatch({
        type: 'CREATE_BOOK',
        book: createBookRecord({ id: createId('book'), ...values }),
      });
    }
    setFormOpen(false);
    setEditingBook(null);
    triggerHaptic('success');
  };

  const requestDelete = () => {
    if (!editingBook) return;
    const book = editingBook;
    confirmDestructive(
      `Delete “${book.title}”?`,
      'Every entry in this book will be removed. This cannot be undone.',
      () => {
        dispatch({ type: 'DELETE_BOOK', id: book.id });
        setFormOpen(false);
        setEditingBook(null);
        triggerHaptic('warning');
      },
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: gutters,
            paddingBottom: TAB_BAR_INSET + insets.bottom,
            maxWidth: 1180,
            alignSelf: 'center',
            width: '100%',
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.titleBlock}>
            <AppText variant="label">Your library</AppText>
            <AppText variant="display" style={styles.title}>
              Every version{'\n'}of you.
            </AppText>
            <AppText variant="body" style={styles.subtitle}>
              One diary for the everyday. Extra books for trips, ideas, work, or whatever needs a
              room of its own.
            </AppText>
          </View>
          <IconButton
            icon="plus"
            accessibilityLabel="Create a new book"
            variant="accent"
            size={46}
            iconSize={21}
            onPress={openCreate}
          />
        </View>

        <View
          style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SummaryStat value={state.books.length} label="books on the shelf" />
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <SummaryStat value={state.entries.length} label="pages written" />
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <SummaryStat value={totalTagged} label="threads annotated" />
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <AppText variant="heading">On the shelf</AppText>
            <View style={[styles.countPill, { backgroundColor: colors.surfaceMuted }]}>
              <AppText variant="caption">{books.length}</AppText>
            </View>
          </View>
          {!isTablet ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Create a new book"
              onPress={openCreate}
              style={styles.textAction}>
              <Feather name="plus" size={14} color={colors.accent} />
              <AppText
                variant="bodySmall"
                style={{ color: colors.accent, fontFamily: FONTS.semibold }}>
                New book
              </AppText>
            </PressableScale>
          ) : null}
        </View>

        <View style={styles.grid}>
          {books.map((book, index) => (
            <FadeInView key={book.id} delay={Math.min(index * 45, 240)} style={{ width: cardBasis }}>
              <BookCard
                book={book}
                entryCount={counts[book.id] ?? 0}
                isActive={book.id === state.activeBookId}
                onOpen={() => {
                  dispatch({ type: 'SET_ACTIVE_BOOK', bookId: book.id });
                  triggerHaptic('light');
                  router.navigate('/');
                }}
                onEdit={() => openEdit(book)}
              />
            </FadeInView>
          ))}

          <FadeInView delay={Math.min(books.length * 45, 280)} style={{ width: cardBasis }}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Create a new book"
              onPress={openCreate}
              haptic="light"
              style={[
                styles.newCard,
                { borderColor: colors.borderStrong, backgroundColor: colors.surface },
              ]}>
              <View style={[styles.newIcon, { backgroundColor: colors.accentSoft }]}>
                <Feather name="plus" size={21} color={colors.accent} />
              </View>
              <View style={styles.newCopy}>
                <AppText variant="subheading">Start another book</AppText>
                <AppText variant="bodySmall" align="center">
                  Give a part of your life its own cover.
                </AppText>
              </View>
            </PressableScale>
          </FadeInView>
        </View>

        <View style={styles.tipCard}>
          <View style={[styles.tipIcon, { backgroundColor: colors.goldSoft }]}>
            <Feather name="feather" size={16} color={colors.gold} />
          </View>
          <View style={styles.tipCopy}>
            <AppText variant="subheading">A small habit, softly kept</AppText>
            <AppText variant="bodySmall">
              You do not have to write every day. A line on the days that matter is enough.
            </AppText>
          </View>
          <Button
            label="Write now"
            icon="edit-3"
            variant="secondary"
            onPress={() => router.navigate('/')}
            style={styles.tipButton}
          />
        </View>
      </ScrollView>

      <BookFormSheet
        visible={formOpen}
        book={editingBook}
        books={state.books}
        onClose={() => {
          setFormOpen(false);
          setEditingBook(null);
        }}
        onSave={saveBook}
        onDelete={requestDelete}
      />
    </SafeAreaView>
  );
}

function SummaryStat({ value, label }: { value: number; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.summaryStat}>
      <AppText variant="heading" style={{ color: colors.text }}>
        {value}
      </AppText>
      <AppText variant="caption" align="center">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 22,
  },
  titleBlock: {
    flex: 1,
    gap: 8,
    maxWidth: 680,
  },
  title: {
    fontSize: 44,
    lineHeight: 48,
  },
  subtitle: {
    maxWidth: 540,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 8,
    marginBottom: 28,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
    paddingHorizontal: 4,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    height: 34,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  countPill: {
    minWidth: 24,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  textAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  newCard: {
    minHeight: 196,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  newIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newCopy: {
    alignItems: 'center',
    gap: 3,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 34,
    padding: 16,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(120, 100, 80, 0.16)',
  },
  tipIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipCopy: {
    flex: 1,
    minWidth: 210,
    gap: 2,
  },
  tipButton: {
    minHeight: 42,
    paddingHorizontal: 16,
  },
});
