import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookFormSheet } from '@/components/book/BookFormSheet';
import { BookSwitcher } from '@/components/book/BookSwitcher';
import { BookCover } from '@/components/book/BookCover';
import { EntryCard } from '@/components/entry/EntryCard';
import { MicButton } from '@/components/entry/MicButton';
import { VoiceWave } from '@/components/entry/VoiceWave';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeInView } from '@/components/ui/FadeInView';
import { PressableScale } from '@/components/ui/PressableScale';
import { useActiveBook, useApp } from '@/context/AppProvider';
import { createBookRecord } from '@/domain/books';
import { PROMPTS } from '@/domain/constants';
import { formatEntryDay, formatHeaderDate, greetingForHour } from '@/domain/date';
import { bookEntryCounts } from '@/domain/entries';
import { createId } from '@/domain/id';
import { groupEntriesByDay, searchEntries } from '@/domain/search';
import { calculateWritingStreak, entriesWrittenToday } from '@/domain/streak';
import { useHaptics } from '@/hooks/useHaptics';
import { useNow } from '@/hooks/useNow';
import { useResponsive } from '@/hooks/useResponsive';
import { FONTS, TAB_BAR_INSET } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/utils/color';

export default function JournalScreen() {
  const { state, dispatch } = useApp();
  const activeBook = useActiveBook();
  const { colors } = useTheme();
  const { isTablet, isExpanded, gutters } = useResponsive();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const triggerHaptic = useHaptics();

  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [bookFormOpen, setBookFormOpen] = useState(false);

  const now = useNow();
  const greeting = greetingForHour(new Date(now).getHours());
  const counts = useMemo(() => bookEntryCounts(state.entries), [state.entries]);
  const entries = useMemo(
    () => searchEntries(state.entries, { bookId: activeBook?.id, query }),
    [activeBook?.id, query, state.entries],
  );
  const groups = useMemo(() => groupEntriesByDay(entries), [entries]);
  const streak = useMemo(() => calculateWritingStreak(state.entries, now), [state.entries, now]);
  const writtenToday = useMemo(() => entriesWrittenToday(state.entries, now), [state.entries, now]);
  const activeEntries = counts[activeBook?.id ?? ''] ?? 0;
  const hasQuery = query.trim().length > 0;
  const hasEntries = (counts[activeBook?.id ?? ''] ?? 0) > 0;

  const openNewEntry = (options: { prompt?: string; autostart?: boolean } = {}) => {
    router.push({
      pathname: '/entry/[id]',
      params: {
        id: 'new',
        bookId: activeBook?.id ?? '',
        prompt: options.prompt ?? '',
        autostart: options.autostart ? '1' : '0',
      },
    });
  };

  const createBook = (values: { title: string; icon: string; color: string }) => {
    dispatch({
      type: 'CREATE_BOOK',
      book: createBookRecord({
        id: createId('book'),
        title: values.title,
        icon: values.icon,
        color: values.color,
      }),
    });
    setBookFormOpen(false);
    triggerHaptic('success');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <View style={styles.wordmarkRow}>
              <AppText variant="title" style={styles.wordmark}>
                d-dairy
              </AppText>
              <View style={[styles.brandDot, { backgroundColor: colors.accent }]} />
            </View>
            <AppText variant="label">{formatHeaderDate(now)}</AppText>
          </View>

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Current book: ${activeBook?.title ?? 'My Diary'}. Switch book`}
            onPress={() => setSwitcherOpen(true)}
            haptic="light"
            style={[
              styles.bookPill,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                maxWidth: isTablet ? 235 : 178,
              },
            ]}>
            {activeBook ? <BookCover book={activeBook} size="sm" /> : null}
            <View style={styles.bookPillText}>
              {isTablet ? (
                <AppText variant="caption" style={{ color: colors.textTertiary }}>
                  Writing in
                </AppText>
              ) : null}
              <AppText
                variant="bodySmall"
                numberOfLines={1}
                style={{ color: colors.text, fontFamily: FONTS.semibold, maxWidth: 108 }}>
                {activeBook?.title ?? 'My Diary'}
              </AppText>
            </View>
            <Feather name="chevron-down" size={15} color={colors.textSecondary} />
          </PressableScale>
        </View>

        <View style={[styles.mainGrid, isExpanded && styles.mainGridTablet]}>
          <View style={[styles.leftColumn, isExpanded && styles.leftColumnTablet]}>
            <FadeInView>
              <LinearGradient
                colors={[colors.surface, colors.surfaceTint]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.hero, { borderColor: colors.border }]}>
                <View style={styles.heroDecorOne} pointerEvents="none" />
                <View style={styles.heroDecorTwo} pointerEvents="none" />

                <View style={styles.heroTop}>
                  <AppText variant="label">{greeting}</AppText>
                  <View
                    style={[
                      styles.todayPill,
                      { backgroundColor: withAlpha(colors.accent, 0.12) },
                    ]}>
                    <View style={[styles.liveDot, { backgroundColor: colors.accent }]} />
                    <AppText
                      variant="caption"
                      style={{ color: colors.accent, fontFamily: FONTS.semibold }}>
                      {writtenToday > 0
                        ? `${writtenToday} ${writtenToday === 1 ? 'page' : 'pages'} today`
                        : 'A fresh page'}
                    </AppText>
                  </View>
                </View>

                <View style={[styles.heroBody, isExpanded && styles.heroBodyTablet]}>
                  <View style={styles.heroCopy}>
                    <AppText variant="display" style={styles.heroTitle}>
                      How was{'\n'}your day?
                    </AppText>
                    <AppText variant="body" style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                      Say it out loud, or write it down. d-dairy keeps the good, the messy, and the
                      ordinary.
                    </AppText>

                    <View style={styles.heroActions}>
                      <Button
                        label="Start dictating"
                        icon="mic"
                        onPress={() => openNewEntry({ autostart: true })}
                      />
                      <Button
                        label="Write instead"
                        icon="edit-3"
                        variant="secondary"
                        onPress={() => openNewEntry()}
                      />
                    </View>
                  </View>

                  <View style={styles.micWrap}>
                    <VoiceWave
                      active={false}
                      color={colors.waveform}
                      mutedColor={colors.waveformMuted}
                      bars={18}
                      height={34}
                    />
                    <MicButton
                      active={false}
                      size={68}
                      onPress={() => openNewEntry({ autostart: true })}
                    />
                    <AppText variant="caption" style={{ color: colors.textTertiary }}>
                      Tap to talk
                    </AppText>
                  </View>
                </View>
              </LinearGradient>
            </FadeInView>

            <View style={styles.statsRow}>
              <Stat
                icon="zap"
                value={`${streak} ${streak === 1 ? 'day' : 'days'}`}
                label="writing streak"
              />
              <Stat
                icon="book-open"
                value={`${activeEntries}`}
                label={activeEntries === 1 ? 'page here' : 'pages here'}
              />
              <Stat
                icon="layers"
                value={`${state.books.length}`}
                label={state.books.length === 1 ? 'book' : 'books'}
              />
            </View>

            <View style={styles.promptSection}>
              <View style={styles.sectionHeading}>
                <View style={styles.sectionTitleRow}>
                  <AppText variant="heading">A gentle starting point</AppText>
                  <View style={[styles.spark, { backgroundColor: colors.goldSoft }]}>
                    <Feather name="sun" size={13} color={colors.gold} />
                  </View>
                </View>
                <AppText variant="bodySmall">No blank-page pressure.</AppText>
              </View>

              {isTablet ? (
                <View style={styles.promptGrid}>
                  {PROMPTS.slice(0, 6).map((prompt, index) => (
                    <PromptCard
                      key={prompt}
                      prompt={prompt}
                      index={index}
                      onPress={() => openNewEntry({ prompt })}
                    />
                  ))}
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.promptScroll}>
                  {PROMPTS.map((prompt, index) => (
                    <PromptCard
                      key={prompt}
                      prompt={prompt}
                      index={index}
                      onPress={() => openNewEntry({ prompt })}
                    />
                  ))}
                </ScrollView>
              )}
            </View>
          </View>

          <View style={[styles.rightColumn, isExpanded && styles.rightColumnTablet]}>
            <View style={styles.entriesHeader}>
              <View style={styles.sectionTitleRow}>
                <AppText variant="heading">{hasQuery ? 'Found pages' : 'Recent pages'}</AppText>
                <View style={[styles.countPill, { backgroundColor: colors.surfaceMuted }]}>
                  <AppText variant="caption">{entries.length}</AppText>
                </View>
              </View>
              {!hasQuery && activeBook ? (
                <AppText variant="caption">{activeBook.title}</AppText>
              ) : null}
            </View>

            <View
              style={[
                styles.searchWrap,
                {
                  backgroundColor: colors.surface,
                  borderColor: searchFocused ? colors.accent : colors.border,
                },
              ]}>
              <Feather name="search" size={17} color={colors.textTertiary} />
              <TextInput
                accessibilityLabel="Search your entries"
                value={query}
                onChangeText={setQuery}
                placeholder="Search a feeling, person, or place…"
                placeholderTextColor={colors.placeholder}
                style={[styles.searchInput, { color: colors.text, fontFamily: FONTS.body }]}
                selectionColor={colors.accent}
                returnKeyType="search"
                autoCorrect={false}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              {hasQuery ? (
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  onPress={() => setQuery('')}
                  style={styles.clearButton}>
                  <Feather name="x" size={15} color={colors.textTertiary} />
                </PressableScale>
              ) : null}
            </View>

            {groups.length === 0 ? (
              <FadeInView delay={80}>
                <EmptyState
                  icon={hasQuery ? 'search' : 'feather'}
                  title={hasQuery ? 'No pages found' : 'Your first page is waiting'}
                  body={
                    hasQuery
                      ? 'Try a different word, or look through another book.'
                      : 'Talk about your day for a minute. Or start with one small thought — that counts.'
                  }
                  actionLabel={hasQuery ? undefined : 'Start dictating'}
                  onAction={hasQuery ? undefined : () => openNewEntry({ autostart: true })}
                  secondaryLabel={hasQuery ? undefined : 'Write instead'}
                  onSecondary={hasQuery ? undefined : () => openNewEntry()}
                />
              </FadeInView>
            ) : (
              <View style={styles.groups}>
                {groups.map((group, groupIndex) => (
                  <View key={group.key} style={styles.group}>
                    <View style={styles.groupHeading}>
                      <AppText variant="label">{formatEntryDay(group.timestamp, now)}</AppText>
                      <View style={[styles.groupLine, { backgroundColor: colors.border }]} />
                    </View>
                    <View style={styles.groupEntries}>
                      {group.entries.map((entry, entryIndex) => (
                        <FadeInView
                          key={entry.id}
                          delay={Math.min(260, (groupIndex * 40 + entryIndex) * 35)}>
                          <EntryCard
                            entry={entry}
                            onPress={() =>
                              router.push({ pathname: '/entry/[id]', params: { id: entry.id } })
                            }
                          />
                        </FadeInView>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {!isTablet && hasEntries ? (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Create a new entry"
                onPress={() => openNewEntry()}
                style={styles.writePrompt}
                haptic="light">
                <Feather name="plus" size={16} color={colors.accent} />
                <AppText variant="bodySmall" style={{ color: colors.accent, fontFamily: FONTS.semibold }}>
                  Add another page
                </AppText>
              </PressableScale>
            ) : null}
          </View>
        </View>

        <View style={styles.footerQuote}>
          <View style={[styles.quoteLine, { backgroundColor: colors.border }]} />
          <AppText variant="quote" align="center">
            Your days don’t need to be neat to matter.
          </AppText>
          <View style={[styles.quoteLine, { backgroundColor: colors.border }]} />
        </View>
      </ScrollView>

      <BookSwitcher
        visible={switcherOpen}
        books={state.books}
        activeBookId={state.activeBookId}
        counts={counts}
        onClose={() => setSwitcherOpen(false)}
        onSelect={(bookId) => {
          dispatch({ type: 'SET_ACTIVE_BOOK', bookId });
          setQuery('');
          setSwitcherOpen(false);
          triggerHaptic('light');
        }}
        onCreate={() => {
          setSwitcherOpen(false);
          setBookFormOpen(true);
        }}
        onManage={() => {
          setSwitcherOpen(false);
          router.navigate('/books');
        }}
      />

      <BookFormSheet
        visible={bookFormOpen}
        book={null}
        books={state.books}
        onClose={() => setBookFormOpen(false)}
        onSave={createBook}
      />
    </SafeAreaView>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Feather.glyphMap;
  value: string;
  label: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.stat,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <View style={[styles.statIcon, { backgroundColor: colors.surfaceMuted }]}>
        <Feather name={icon} size={14} color={colors.accent} />
      </View>
      <View>
        <AppText variant="bodySmall" style={{ color: colors.text, fontFamily: FONTS.semibold }}>
          {value}
        </AppText>
        <AppText variant="caption">{label}</AppText>
      </View>
    </View>
  );
}

function PromptCard({
  prompt,
  index,
  onPress,
}: {
  prompt: string;
  index: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <FadeInView delay={Math.min(280, index * 35)}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`Start a prompted entry: ${prompt}`}
        onPress={onPress}
        haptic="light"
        style={[
          styles.promptCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        <View style={[styles.promptMark, { backgroundColor: colors.accentSoft }]}>
          <Feather name="feather" size={12} color={colors.accent} />
        </View>
        <AppText variant="bodySmall" style={{ color: colors.text, fontFamily: FONTS.medium }}>
          {prompt}
        </AppText>
        <Feather name="arrow-up-right" size={14} color={colors.textTertiary} />
      </PressableScale>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  brandBlock: {
    gap: 3,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  wordmark: {
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1.6,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 10,
    marginLeft: 3,
  },
  bookPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingLeft: 8,
    paddingRight: 13,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 1,
  },
  bookPillText: {
    flexShrink: 1,
    gap: 0,
  },
  mainGrid: {
    gap: 28,
  },
  mainGridTablet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 40,
  },
  leftColumn: {
    gap: 22,
  },
  leftColumnTablet: {
    flex: 0.86,
    minWidth: 0,
  },
  rightColumn: {
    gap: 15,
    minWidth: 0,
  },
  rightColumnTablet: {
    flex: 1.14,
  },
  hero: {
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    overflow: 'hidden',
    gap: 18,
  },
  heroDecorOne: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1,
    borderColor: 'rgba(194, 94, 70, 0.13)',
    right: -75,
    top: -95,
  },
  heroDecorTwo: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    right: 34,
    bottom: -66,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  todayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  heroBody: {
    gap: 12,
  },
  heroBodyTablet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroCopy: {
    flex: 1,
    gap: 10,
  },
  heroTitle: {
    fontSize: 38,
    lineHeight: 41,
  },
  heroSubtitle: {
    maxWidth: 330,
    lineHeight: 23,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  micWrap: {
    alignItems: 'center',
    gap: 1,
    alignSelf: 'center',
    marginVertical: -10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  stat: {
    flexGrow: 1,
    flexBasis: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 11,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptSection: {
    gap: 12,
  },
  sectionHeading: {
    gap: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  spark: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPill: {
    minWidth: 24,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  promptScroll: {
    gap: 9,
    paddingRight: 20,
    paddingVertical: 2,
  },
  promptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  promptCard: {
    width: 174,
    minHeight: 98,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 13,
    justifyContent: 'space-between',
    gap: 8,
  },
  promptMark: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 11,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groups: {
    gap: 20,
  },
  group: {
    gap: 9,
  },
  groupHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  groupLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  groupEntries: {
    gap: 9,
  },
  writePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 14,
    marginTop: 2,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderColor: 'rgba(194, 94, 70, 0.35)',
  },
  footerQuote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 38,
    marginBottom: 10,
  },
  quoteLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});
