import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DictationPanel } from '@/components/entry/DictationPanel';
import { EntryCard } from '@/components/entry/EntryCard';
import { MoodPicker } from '@/components/entry/MoodPicker';
import { TagEditor } from '@/components/entry/TagEditor';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeInView } from '@/components/ui/FadeInView';
import { IconButton } from '@/components/ui/IconButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { useActiveBook, useApp } from '@/context/AppProvider';
import { MAX_ENTRY_BODY_LENGTH, MAX_ENTRY_TITLE_LENGTH } from '@/domain/constants';
import { formatLongDate, formatRelativeUpdate, formatTime } from '@/domain/date';
import { countWords, displayTitle } from '@/domain/entries';
import { createId } from '@/domain/id';
import { relatedEntries } from '@/domain/search';
import type { Entry, MoodId } from '@/domain/types';
import { useDictation } from '@/hooks/useDictation';
import { useHaptics } from '@/hooks/useHaptics';
import { useNow } from '@/hooks/useNow';
import { useResponsive } from '@/hooks/useResponsive';
import { FONTS } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/utils/color';
import { confirmDestructive } from '@/utils/confirm';

interface Draft {
  title: string;
  body: string;
  mood: MoodId | null;
  tags: string[];
  favorite: boolean;
}

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function SavePill({ tone, label }: { tone: 'saved' | 'saving' | 'error'; label: string }) {
  const { colors } = useTheme();
  const color = tone === 'error' ? colors.danger : tone === 'saving' ? colors.gold : colors.sage;

  return (
    <View style={[styles.savePill, { backgroundColor: withAlpha(color, 0.11) }]}>
      <View style={[styles.saveDot, { backgroundColor: color }]} />
      <AppText variant="caption" style={{ color }}>
        {label}
      </AppText>
    </View>
  );
}

export default function EntryScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    bookId?: string;
    prompt?: string;
    autostart?: string;
  }>();
  const { state, dispatch, saveState, lastSavedAt, storageError } = useApp();
  const activeBook = useActiveBook();
  const { colors, fonts } = useTheme();
  const { isExpanded, gutters } = useResponsive();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const triggerHaptic = useHaptics();
  const now = useNow();

  const routeId = firstParam(params.id) || 'new';
  const isNewRoute = routeId === 'new';
  const initialEntry = isNewRoute
    ? undefined
    : state.entries.find((entry) => entry.id === routeId);
  const prompt = firstParam(params.prompt);
  const autostart = firstParam(params.autostart) === '1';

  const [entryId] = useState(() => initialEntry?.id ?? createId('entry'));
  const [createdAt] = useState(() => initialEntry?.createdAt ?? Date.now());
  const [bookId] = useState(() => {
    if (initialEntry) return initialEntry.bookId;
    const requested = firstParam(params.bookId);
    if (requested && state.books.some((book) => book.id === requested)) return requested;
    return state.activeBookId;
  });
  const [draft, setDraft] = useState<Draft>(() => ({
    title: initialEntry?.title ?? '',
    body: initialEntry?.body ?? '',
    mood: initialEntry?.mood ?? null,
    tags: initialEntry?.tags ?? [],
    favorite: initialEntry?.favorite ?? false,
  }));
  const [dirty, setDirty] = useState(false);
  const [lastCommitAt, setLastCommitAt] = useState(0);
  const [promptVisible, setPromptVisible] = useState(Boolean(prompt));
  const [dictationOpen, setDictationOpen] = useState(autostart);

  const persistedRef = useRef(Boolean(initialEntry));
  const deletedRef = useRef(false);
  const selectionRef = useRef({ start: draft.body.length, end: draft.body.length });
  const bodyRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const entryMissing = !isNewRoute && !initialEntry;
  const book = state.books.find((item) => item.id === bookId) ?? activeBook;

  const hasContent = Boolean(draft.title.trim() || draft.body.trim());

  const buildEntry = useCallback(
    (): Entry => ({
      id: entryId,
      bookId,
      title: draft.title.slice(0, MAX_ENTRY_TITLE_LENGTH),
      body: draft.body.slice(0, MAX_ENTRY_BODY_LENGTH),
      mood: draft.mood,
      tags: draft.tags,
      favorite: draft.favorite,
      createdAt,
      updatedAt: Date.now(),
    }),
    [bookId, createdAt, draft, entryId],
  );

  const persistDraft = useCallback((): boolean => {
    if (deletedRef.current) return false;
    if (!persistedRef.current && !hasContent) return false;
    dispatch({ type: 'UPSERT_ENTRY', entry: buildEntry() });
    persistedRef.current = true;
    return true;
  }, [buildEntry, dispatch, hasContent]);

  const commit = useCallback(() => {
    if (!persistDraft()) return;
    setDirty(false);
    setLastCommitAt(Date.now());
  }, [persistDraft]);

  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(commit, 550);
    return () => clearTimeout(timer);
  }, [commit, dirty]);

  const latestPersistRef = useRef(persistDraft);
  useEffect(() => {
    latestPersistRef.current = persistDraft;
  }, [persistDraft]);

  useEffect(
    () => () => {
      latestPersistRef.current();
    },
    [],
  );

  const contextualStrings = useMemo(
    () => [book?.title ?? '', ...draft.tags].filter(Boolean),
    [book?.title, draft.tags],
  );

  const handleDictatedText = useCallback((text: string) => {
    setDraft((previous) => {
      const body = text.slice(0, MAX_ENTRY_BODY_LENGTH);
      return previous.body === body ? previous : { ...previous, body };
    });
    setDirty(true);
  }, []);

  const {
    status: dictationStatus,
    isActive: dictationActive,
    volume,
    elapsedMs,
    error: dictationError,
    interimPreview,
    stablePreview,
    availability,
    start: startRecognition,
    stop: stopRecognition,
  } = useDictation({
    language: state.settings.dictationLanguage,
    smartPunctuation: state.settings.smartPunctuation,
    removeFillers: state.settings.removeFillers,
    contextualStrings,
    onText: handleDictatedText,
    onEnd: () => setDictationOpen(false),
  });

  const startDictation = useCallback(() => {
    if (dictationActive) {
      stopRecognition();
      return;
    }
    const body = draft.body;
    const start = Math.max(0, Math.min(selectionRef.current.start, body.length));
    const end = Math.max(start, Math.min(selectionRef.current.end, body.length));
    setDictationOpen(true);
    void startRecognition({ prefix: body.slice(0, start), suffix: body.slice(end) });
  }, [dictationActive, draft.body, startRecognition, stopRecognition]);

  const retryDictation = useCallback(() => {
    setDictationOpen(true);
    void startRecognition({ prefix: draft.body, suffix: '' });
  }, [draft.body, startRecognition]);

  const autostartedRef = useRef(false);
  useEffect(() => {
    if (!autostart || autostartedRef.current || entryMissing) return;
    autostartedRef.current = true;
    void startRecognition({ prefix: draft.body, suffix: '' });
  }, [autostart, draft.body, entryMissing, startRecognition]);

  const updateDraft = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setDirty(true);
  }, []);

  const goHome = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

  const goBack = useCallback(() => {
    persistDraft();
    goHome();
  }, [goHome, persistDraft]);

  const toggleFavorite = useCallback(() => {
    const favorite = !draft.favorite;
    updateDraft('favorite', favorite);
    if (persistedRef.current) {
      dispatch({ type: 'TOGGLE_FAVORITE', id: entryId });
    }
    triggerHaptic('light');
  }, [dispatch, draft.favorite, entryId, triggerHaptic, updateDraft]);

  const requestDelete = useCallback(() => {
    if (!persistedRef.current) {
      goHome();
      return;
    }
    confirmDestructive(
      'Delete this page?',
      'This page will be removed from your book. This cannot be undone.',
      () => {
        deletedRef.current = true;
        dispatch({ type: 'DELETE_ENTRY', id: entryId });
        triggerHaptic('warning');
        goHome();
      },
    );
  }, [dispatch, entryId, goHome, triggerHaptic]);

  const words = useMemo(() => countWords(draft.body), [draft.body]);
  const characters = draft.body.trim().length;
  const saving =
    dirty || saveState === 'saving' || lastCommitAt > (lastSavedAt ?? 0);
  const saveTone: 'saved' | 'saving' | 'error' = storageError
    ? 'error'
    : saving
      ? 'saving'
      : 'saved';
  const saveLabel = storageError
    ? 'Not saved'
    : saving
      ? 'Saving…'
      : lastSavedAt
        ? `Saved at ${formatTime(lastSavedAt)}`
        : 'Saved on this device';

  const related = useMemo(() => {
    if (draft.tags.length === 0) return [];
    const current: Entry = {
      id: entryId,
      bookId,
      title: draft.title,
      body: draft.body,
      mood: draft.mood,
      tags: draft.tags,
      favorite: draft.favorite,
      createdAt,
      updatedAt: createdAt,
    };
    return relatedEntries(state.entries, current, 3);
  }, [
    bookId,
    createdAt,
    draft.body,
    draft.favorite,
    draft.mood,
    draft.tags,
    draft.title,
    entryId,
    state.entries,
  ]);

  const detailsPanel = (
    <View style={styles.detailsStack}>
      <View
        style={[styles.railCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.railHeading}>
          <AppText variant="label">Page details</AppText>
          <View style={[styles.railMark, { backgroundColor: colors.surfaceMuted }]}>
            <Feather name="tag" size={13} color={colors.textSecondary} />
          </View>
        </View>

        <View style={styles.detailSection}>
          <AppText variant="caption" style={{ color: colors.textSecondary }}>
            How does this page feel?
          </AppText>
          <MoodPicker
            value={draft.mood}
            onChange={(mood) => {
              updateDraft('mood', mood);
              triggerHaptic('light');
            }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TagEditor
          tags={draft.tags}
          text={`${draft.title} ${draft.body}`}
          onChange={(tags) => {
            updateDraft('tags', tags);
            triggerHaptic('light');
          }}
        />

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.detailStats}>
          <DetailStat value={`${words}`} label={words === 1 ? 'word' : 'words'} />
          <DetailStat value={`${characters}`} label="characters" />
          <DetailStat
            value={lastCommitAt ? formatRelativeUpdate(lastCommitAt, now) : 'Fresh'}
            label="last edit"
          />
        </View>
      </View>

      {related.length > 0 ? (
        <View
          style={[styles.railCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.railHeading}>
            <AppText variant="label">Same threads</AppText>
            <Feather name="link-2" size={14} color={colors.textTertiary} />
          </View>
          <View style={styles.relatedList}>
            {related.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                compact
                onPress={() =>
                  router.push({ pathname: '/entry/[id]', params: { id: entry.id } })
                }
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: gutters,
              borderBottomColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}>
          <IconButton
            icon="chevron-left"
            accessibilityLabel="Back to journal"
            variant="surface"
            size={40}
            onPress={goBack}
          />
          <View style={styles.headerCenter}>
            <View style={styles.bookLine}>
              <View
                style={[
                  styles.bookDot,
                  { backgroundColor: book?.color ?? colors.accent },
                ]}
              />
              <AppText variant="caption" numberOfLines={1} style={styles.bookTitle}>
                {book?.title ?? 'My Diary'}
              </AppText>
            </View>
            <AppText
              variant="bodySmall"
              numberOfLines={1}
              style={{ color: colors.text, fontFamily: FONTS.semibold }}>
              {isNewRoute ? 'A new page' : formatLongDate(createdAt)}
            </AppText>
          </View>
          <View style={styles.headerActions}>
            <IconButton
              icon="bookmark"
              accessibilityLabel={draft.favorite ? 'Remove from favourites' : 'Add to favourites'}
              variant={draft.favorite ? 'surface' : 'plain'}
              size={40}
              color={draft.favorite ? colors.gold : colors.textSecondary}
              onPress={toggleFavorite}
            />
            <IconButton
              icon="trash-2"
              accessibilityLabel="Delete this page"
              variant="plain"
              size={40}
              color={colors.danger}
              onPress={requestDelete}
            />
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: gutters,
              paddingBottom: Math.max(insets.bottom, 20) + 30,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {entryMissing ? (
            <View style={styles.missingWrap}>
              <EmptyState
                icon="book"
                title="This page has gone quiet"
                body="It may have been deleted, or the link was incomplete. Your other pages are still safe in the journal."
                actionLabel="Back to journal"
                actionIcon="arrow-left"
                onAction={goHome}
              />
            </View>
          ) : (
            <View style={[styles.layout, isExpanded && styles.layoutExpanded]}>
              <View style={[styles.mainColumn, isExpanded && styles.mainColumnExpanded]}>
                <FadeInView>
                  <View
                    style={[
                      styles.editorCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}>
                    <View style={styles.editorTop}>
                      <View style={styles.editorMeta}>
                        <View style={[styles.metaIcon, { backgroundColor: colors.accentSoft }]}>
                          <Feather
                            name={draft.favorite ? 'bookmark' : 'feather'}
                            size={13}
                            color={colors.accent}
                          />
                        </View>
                        <AppText variant="caption" style={{ color: colors.textSecondary }}>
                          {isNewRoute ? 'New page' : formatTime(createdAt)}
                        </AppText>
                      </View>
                      <SavePill tone={saveTone} label={saveLabel} />
                    </View>

                    {promptVisible && prompt ? (
                      <View
                        style={[
                          styles.promptBanner,
                          {
                            backgroundColor: colors.goldSoft,
                            borderColor: withAlpha(colors.gold, 0.32),
                          },
                        ]}>
                        <Feather name="sun" size={15} color={colors.gold} />
                        <View style={styles.promptCopy}>
                          <AppText variant="label" style={{ color: colors.gold }}>
                            A starting point
                          </AppText>
                          <AppText variant="bodySmall" style={{ color: colors.text }}>
                            {prompt}
                          </AppText>
                        </View>
                        <PressableScale
                          accessibilityRole="button"
                          accessibilityLabel="Hide prompt"
                          onPress={() => setPromptVisible(false)}
                          style={styles.promptClose}>
                          <Feather name="x" size={14} color={colors.gold} />
                        </PressableScale>
                      </View>
                    ) : null}

                    <TextInput
                      accessibilityLabel="Entry title"
                      value={draft.title}
                      onChangeText={(title) => updateDraft('title', title)}
                      placeholder="Give this page a name (optional)"
                      placeholderTextColor={colors.placeholder}
                      style={[
                        styles.titleInput,
                        { color: colors.text, fontFamily: fonts.display },
                      ]}
                      selectionColor={colors.accent}
                      maxLength={MAX_ENTRY_TITLE_LENGTH}
                      returnKeyType="next"
                      autoFocus={isNewRoute && !autostart}
                      onSubmitEditing={() => bodyRef.current?.focus()}
                    />

                    <View style={[styles.rule, { backgroundColor: colors.border }]} />

                    <TextInput
                      ref={bodyRef}
                      accessibilityLabel="Write your entry"
                      multiline
                      textAlignVertical="top"
                      value={draft.body}
                      onChangeText={(body) =>
                        updateDraft('body', body.slice(0, MAX_ENTRY_BODY_LENGTH))
                      }
                      onSelectionChange={(event) => {
                        selectionRef.current = event.nativeEvent.selection;
                      }}
                      placeholder={
                        prompt || 'Start anywhere. A sentence, a feeling, a small moment — it counts.'
                      }
                      placeholderTextColor={colors.placeholder}
                      style={[
                        styles.bodyInput,
                        isExpanded && styles.bodyInputExpanded,
                        { color: colors.text, fontFamily: fonts.body },
                      ]}
                      selectionColor={colors.accent}
                      maxLength={MAX_ENTRY_BODY_LENGTH}
                      scrollEnabled={false}
                    />

                    <View style={[styles.editorFooter, { borderTopColor: colors.border }]}>
                      <View style={styles.wordMeta}>
                        <AppText variant="caption">
                          {words} {words === 1 ? 'word' : 'words'}
                        </AppText>
                        <View style={[styles.metaDot, { backgroundColor: colors.borderStrong }]} />
                        <AppText variant="caption" numberOfLines={1}>
                          {displayTitle({ title: draft.title, body: draft.body })}
                        </AppText>
                      </View>
                      <Button
                        label={dictationActive ? 'Stop dictating' : 'Dictate'}
                        icon={dictationActive ? 'square' : 'mic'}
                        variant={dictationActive ? 'danger' : 'primary'}
                        onPress={startDictation}
                        style={styles.dictateButton}
                      />
                    </View>
                  </View>
                </FadeInView>

                <View style={styles.editorNote}>
                  <Feather name="shield" size={12} color={colors.textTertiary} />
                  <AppText variant="caption">
                    Saved only on this device. Your voice is handled by your device’s speech engine.
                  </AppText>
                </View>

                {!isExpanded ? (
                  <FadeInView delay={90}>{detailsPanel}</FadeInView>
                ) : null}
              </View>

              {isExpanded ? (
                <FadeInView delay={110} style={styles.railColumn}>
                  {detailsPanel}
                </FadeInView>
              ) : null}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <DictationPanel
        visible={dictationOpen && !entryMissing}
        status={dictationStatus}
        error={dictationError}
        volume={volume}
        elapsedMs={elapsedMs}
        interimPreview={interimPreview}
        stablePreview={stablePreview}
        language={state.settings.dictationLanguage}
        canRetry={availability.available}
        onFinish={stopRecognition}
        onDismiss={() => setDictationOpen(false)}
        onRetry={retryDictation}
      />
    </SafeAreaView>
  );
}

function DetailStat({ value, label }: { value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.detailStat}>
      <AppText
        variant="bodySmall"
        numberOfLines={1}
        style={{ color: colors.text, fontFamily: FONTS.semibold }}>
        {value}
      </AppText>
      <AppText variant="caption" align="center">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 62,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
    minWidth: 0,
  },
  bookLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '100%',
  },
  bookDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bookTitle: {
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingTop: 22,
  },
  layout: {
    gap: 18,
  },
  layoutExpanded: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 30,
  },
  mainColumn: {
    gap: 14,
    minWidth: 0,
  },
  mainColumnExpanded: {
    flex: 1.6,
  },
  railColumn: {
    width: 330,
    minWidth: 0,
  },
  editorCard: {
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    gap: 12,
  },
  editorTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  editorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  metaIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  saveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  promptBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  promptCopy: {
    flex: 1,
    gap: 1,
  },
  promptClose: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleInput: {
    fontSize: 29,
    lineHeight: 36,
    letterSpacing: -0.6,
    paddingVertical: 4,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.9,
  },
  bodyInput: {
    minHeight: 270,
    fontSize: 16.5,
    lineHeight: 27,
    paddingVertical: 6,
  },
  bodyInputExpanded: {
    minHeight: 400,
  },
  editorFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexWrap: 'wrap',
  },
  wordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 1,
    minWidth: 150,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    opacity: 0.6,
  },
  dictateButton: {
    minHeight: 44,
    paddingHorizontal: 18,
  },
  editorNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 4,
  },
  detailsStack: {
    gap: 14,
  },
  railCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 17,
    gap: 15,
  },
  railHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  railMark: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailSection: {
    gap: 9,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.85,
  },
  detailStats: {
    flexDirection: 'row',
    gap: 6,
  },
  detailStat: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
    paddingVertical: 6,
  },
  relatedList: {
    gap: 8,
  },
  missingWrap: {
    paddingTop: 12,
  },
});
