import type { DictationLanguage, JournalKeyword, Mood, MoodId } from './types';

export const APP_NAME = 'd-dairy';
export const APP_TAGLINE = 'A softer place for your days.';

export const MOODS: readonly Mood[] = [
  { id: 'rough', emoji: '😔', label: 'Rough', color: '#B96A6A' },
  { id: 'low', emoji: '😕', label: 'Low', color: '#B58A5B' },
  { id: 'okay', emoji: '😐', label: 'Okay', color: '#8C8C7A' },
  { id: 'good', emoji: '🙂', label: 'Good', color: '#6F8A64' },
  { id: 'great', emoji: '😊', label: 'Great', color: '#5F8A79' },
] as const;

export const MOOD_BY_ID: Record<MoodId, Mood> = Object.fromEntries(
  MOODS.map((mood) => [mood.id, mood]),
) as Record<MoodId, Mood>;

export const BOOK_ICONS = ['📖', '🌿', '✈️', '💡', '❤️', '💼', '🎓', '🌙', '🎨', '🏡'] as const;

export const BOOK_COLORS = [
  '#C25E46',
  '#6F8661',
  '#4F7D8A',
  '#8A5A7A',
  '#C18A3E',
  '#B65C6B',
  '#586B8A',
  '#7A6A58',
] as const;

export const DICTATION_LANGUAGES: readonly DictationLanguage[] = [
  { code: 'en-US', label: 'English', nativeLabel: 'United States' },
  { code: 'en-GB', label: 'English', nativeLabel: 'United Kingdom' },
  { code: 'en-IN', label: 'English', nativeLabel: 'India' },
  { code: 'hi-IN', label: 'हिन्दी', nativeLabel: 'Hindi' },
  { code: 'es-ES', label: 'Español', nativeLabel: 'Spanish' },
  { code: 'fr-FR', label: 'Français', nativeLabel: 'French' },
  { code: 'de-DE', label: 'Deutsch', nativeLabel: 'German' },
  { code: 'it-IT', label: 'Italiano', nativeLabel: 'Italian' },
  { code: 'pt-BR', label: 'Português', nativeLabel: 'Brazil' },
  { code: 'ja-JP', label: '日本語', nativeLabel: 'Japanese' },
  { code: 'ko-KR', label: '한국어', nativeLabel: 'Korean' },
  { code: 'zh-CN', label: '普通话', nativeLabel: 'Chinese' },
] as const;

/**
 * Prompt chips are intentionally short and low-pressure. The vocabulary is
 * drawn from the journaling/voice-journal keywords researched for this app.
 */
export const PROMPTS = [
  'A moment worth keeping',
  'Three things I’m grateful for',
  'A small win from today',
  'What’s on my mind right now',
  'Something I learned today',
  'How I’m really feeling',
  'A person who made my day better',
  'One thing I want to remember',
] as const;

/**
 * These keyword clusters power tag suggestions and guided prompts. They were
 * selected from popular journaling and voice-journal app language (see
 * docs/KEYWORD_RESEARCH.md).
 */
export const JOURNAL_KEYWORDS: readonly JournalKeyword[] = [
  {
    tag: 'gratitude',
    label: 'Gratitude',
    prompt: 'Three things I’m grateful for',
    terms: ['grateful', 'gratitude', 'thankful', 'blessed', 'appreciate'],
  },
  {
    tag: 'reflection',
    label: 'Reflection',
    prompt: 'What did today teach me?',
    terms: ['reflect', 'realize', 'realise', 'learned', 'lesson', 'wonder', 'thinking'],
  },
  {
    tag: 'memories',
    label: 'Memories',
    prompt: 'A moment worth keeping',
    terms: ['remember', 'memory', 'memories', 'moment', 'never forget', 'keepsake'],
  },
  {
    tag: 'mindfulness',
    label: 'Mindfulness',
    prompt: 'What am I noticing right now?',
    terms: ['mindful', 'present', 'breathe', 'breath', 'calm', 'notice', 'quiet'],
  },
  {
    tag: 'self-care',
    label: 'Self-care',
    prompt: 'How did I care for myself today?',
    terms: ['self care', 'self-care', 'rest', 'sleep', 'wellbeing', 'well-being', 'kind to myself', 'bath'],
  },
  {
    tag: 'wellness',
    label: 'Wellness',
    prompt: 'How am I feeling in my body?',
    terms: ['health', 'body', 'energy', 'exercise', 'walk', 'run', 'yoga', 'sick', 'tired'],
  },
  {
    tag: 'goals',
    label: 'Goals',
    prompt: 'One small step toward a goal',
    terms: ['goal', 'target', 'progress', 'plan', 'future', 'dream', 'ambition', 'resolution'],
  },
  {
    tag: 'wins',
    label: 'Wins',
    prompt: 'A small win from today',
    terms: ['win', 'won', 'proud', 'achieved', 'accomplished', 'finished', 'done'],
  },
  {
    tag: 'work',
    label: 'Work',
    prompt: 'What happened at work today?',
    terms: ['work', 'meeting', 'project', 'office', 'boss', 'colleague', 'deadline', 'client'],
  },
  {
    tag: 'family',
    label: 'Family',
    prompt: 'A moment with someone I love',
    terms: ['family', 'mom', 'mum', 'dad', 'parent', 'child', 'kids', 'sister', 'brother', 'home'],
  },
  {
    tag: 'relationships',
    label: 'Relationships',
    prompt: 'Who made my day better?',
    terms: ['friend', 'partner', 'husband', 'wife', 'love', 'date', 'together', 'conversation'],
  },
  {
    tag: 'travel',
    label: 'Travel',
    prompt: 'A place I want to remember',
    terms: ['travel', 'trip', 'journey', 'flight', 'hotel', 'beach', 'mountain', 'city', 'vacation'],
  },
  {
    tag: 'ideas',
    label: 'Ideas',
    prompt: 'An idea I don’t want to lose',
    terms: ['idea', 'notion', 'create', 'creative', 'write', 'design', 'build', 'imagine'],
  },
  {
    tag: 'habits',
    label: 'Habits',
    prompt: 'A habit that helped me today',
    terms: ['habit', 'routine', 'daily', 'streak', 'meditate', 'journal', 'practice'],
  },
] as const;

export const DEFAULT_TAG_SUGGESTIONS = [
  'gratitude',
  'reflection',
  'memories',
  'mindfulness',
  'wins',
  'self-care',
] as const;

export const MAX_BOOK_TITLE_LENGTH = 40;
export const MAX_TAG_LENGTH = 24;
export const MAX_TAGS_PER_ENTRY = 8;
export const MAX_ENTRY_TITLE_LENGTH = 120;
export const MAX_ENTRY_BODY_LENGTH = 50_000;
export const MAX_BOOKS = 30;
