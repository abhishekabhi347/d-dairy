export interface TranscriptOptions {
  smartPunctuation?: boolean;
  removeFillers?: boolean;
  finalize?: boolean;
  /** Internal escape hatch for composing segments that continue an existing sentence. */
  capitalize?: boolean;
}

const COMMANDS: readonly (readonly [RegExp, string])[] = [
  [/\bnew paragraph\b/gi, '\n\n'],
  [/\bnew line\b/gi, '\n'],
  [/\bfull stop\b/gi, '.'],
  [/\bquestion mark\b/gi, '?'],
  [/\bexclamation (?:mark|point)\b/gi, '!'],
  [/\bperiod\b/gi, '.'],
  [/\bsemicolon\b/gi, ';'],
  [/\bcolon\b/gi, ':'],
  [/\bcomma\b/gi, ','],
  [/\b(?:open|opening) quote\b/gi, ' "'],
  [/\b(?:close|closing) quote\b/gi, '" '],
  [/\b(?:em dash|dash)\b/gi, ' — '],
] as const;

const FILLERS = /\b(?:um+|uh+|erm+|hmm+|hm+|mm+)\b[,\s]*/gi;

function normalizeLineSpacing(value: string): string {
  return value
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');
}

function normalizePunctuationSpacing(value: string): string {
  return value
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,.;:!?])(?=[A-Za-zÀ-ÖØ-öø-ÿ\u0400-\u04ff\u0900-\u097f])/g, '$1 ')
    .replace(/([!?])\1+/g, '$1')
    .replace(/\.{4,}/g, '...')
    .replace(/,\s*,/g, ',');
}

export function applyVoiceCommands(value: string): string {
  let result = value;
  for (const [pattern, replacement] of COMMANDS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export function removeFillerWords(value: string): string {
  return value
    .replace(FILLERS, '')
    .replace(/[ \t]+([,.;:!?])/g, '$1')
    .replace(/(^|\n)[ \t]*,/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+$/gm, '');
}

export function capitalizeSentences(value: string): string {
  return value
    .replace(/\bi\b/g, 'I')
    .replace(/(^|[.!?]\s+|\n+)([a-zà-öø-ÿ])/g, (_match, prefix: string, letter: string) => {
      return `${prefix}${letter.toUpperCase()}`;
    });
}

export function finalizePunctuation(value: string, enabled = true): string {
  const trimmed = value.trim();
  if (!enabled || !trimmed) return trimmed;
  if (/[.!?…]$/.test(trimmed)) return trimmed;
  if (/[,;:]$/.test(trimmed)) return `${trimmed.slice(0, -1)}.`;
  if (/[’”")\]]$/.test(trimmed)) return `${trimmed}.`;
  if (/[A-Za-zÀ-ÖØ-öø-ÿ0-9\u0400-\u04ff\u0900-\u097f\u3040-\u30ff\u4e00-\u9fff]$/.test(trimmed)) {
    return `${trimmed}.`;
  }
  return trimmed;
}

/**
 * Turns raw recognition output into tidy writing. It understands punctuation
 * commands ("comma", "new paragraph"), removes only conservative fillers, and
 * preserves sentence capitalization. `finalize: false` is used for interim
 * results so the text does not visually stutter while someone is speaking.
 */
export function formatTranscript(raw: string, options: TranscriptOptions = {}): string {
  const {
    smartPunctuation = true,
    removeFillers = true,
    finalize = true,
    capitalize = true,
  } = options;
  if (!raw.trim() && raw !== '\n') return '';

  let value = smartPunctuation ? applyVoiceCommands(raw) : raw;
  if (removeFillers) value = removeFillerWords(value);
  value = normalizeLineSpacing(value);
  value = normalizePunctuationSpacing(value);
  if (smartPunctuation && capitalize) value = capitalizeSentences(value);
  value = normalizeLineSpacing(value);
  return finalize ? finalizePunctuation(value, smartPunctuation) : value;
}

function needsSpaceBefore(left: string, right: string): boolean {
  if (!left || !right) return false;
  if (/\s$/.test(left) || /^\s/.test(right)) return false;
  if (/^[,.;:!?\n]/.test(right)) return false;
  return true;
}

export function smartJoin(left: string, right: string): string {
  if (!left) return right;
  if (!right) return left;
  return needsSpaceBefore(left, right) ? `${left} ${right}` : `${left}${right}`;
}

export function joinTranscriptSegments(segments: readonly string[]): string {
  return segments.reduce((joined, segment) => smartJoin(joined, segment.trim()), '');
}

export interface ComposeDictationInput {
  prefix?: string;
  suffix?: string;
  finalSegments?: readonly string[];
  interim?: string;
  smartPunctuation?: boolean;
  removeFillers?: boolean;
  finalize?: boolean;
}

/**
 * Composes a dictation session into the surrounding text. It handles cursor
 * insertion, Android's segmented final results, and live interim results.
 */
export function composeDictationText(input: ComposeDictationInput): string {
  const {
    prefix = '',
    suffix = '',
    finalSegments = [],
    interim = '',
    smartPunctuation = true,
    removeFillers = true,
    finalize = false,
  } = input;

  const formatOptions = {
    smartPunctuation,
    removeFillers,
    finalize: false,
    capitalize: false,
  };
  const stable = joinTranscriptSegments(
    finalSegments.map((segment) => formatTranscript(segment, formatOptions)).filter(Boolean),
  );
  const live = interim ? formatTranscript(interim, formatOptions) : '';
  const dictated = smartJoin(stable, live);

  if (!dictated) {
    return `${prefix}${suffix}`;
  }

  const finalText = finalize
    ? finalizePunctuation(dictated, smartPunctuation && suffix.trim().length === 0)
    : dictated;

  let composed = smartJoin(prefix, finalText);
  if (suffix) {
    composed = smartJoin(composed, suffix);
  }

  if (!prefix.trim() && smartPunctuation) {
    composed = capitalizeSentences(composed);
  }

  return normalizeLineSpacing(composed).replace(/^\n+/, '');
}

export function transcriptStats(raw: string): { characters: number; words: number } {
  const characters = raw.trim().length;
  const words = raw.trim() ? raw.trim().split(/\s+/).length : 0;
  return { characters, words };
}
