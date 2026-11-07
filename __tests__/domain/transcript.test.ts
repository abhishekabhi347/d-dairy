import {
  applyVoiceCommands,
  capitalizeSentences,
  composeDictationText,
  finalizePunctuation,
  formatTranscript,
  joinTranscriptSegments,
  removeFillerWords,
  smartJoin,
  transcriptStats,
} from '@/domain/transcript';

describe('voice commands', () => {
  it('turns spoken punctuation into marks', () => {
    expect(applyVoiceCommands('hello comma world')).toBe('hello , world');
    expect(applyVoiceCommands('are you there question mark')).toBe('are you there ?');
    expect(applyVoiceCommands('wow exclamation mark')).toBe('wow !');
    expect(applyVoiceCommands('wait semicolon then colon')).toBe('wait ; then :');
  });

  it('supports paragraphs, lines, quotes, and dashes', () => {
    expect(applyVoiceCommands('one new paragraph two')).toContain('\n\n');
    expect(applyVoiceCommands('one new line two')).toContain('\n');
    expect(applyVoiceCommands('open quote hello close quote')).toContain('"');
    expect(applyVoiceCommands('wait em dash go')).toContain('—');
  });

  it('is case-insensitive', () => {
    expect(applyVoiceCommands('Hello Comma World Question Mark')).toBe('Hello , World ?');
  });
});

describe('filler words', () => {
  it('removes conservative thinking sounds and tidies spacing', () => {
    expect(removeFillerWords('um I was, uh, thinking')).toBe('I was, thinking');
    expect(removeFillerWords('hmm that was good')).toBe('that was good');
    expect(removeFillerWords('mmm')).toBe('');
  });

  it('does not remove words that merely contain filler letters', () => {
    expect(removeFillerWords('The hummingbird and the umbrella')).toBe(
      'The hummingbird and the umbrella',
    );
  });
});

describe('capitalization and ending punctuation', () => {
  it('capitalizes the pronoun i and sentence starts', () => {
    expect(capitalizeSentences('i went home. i slept well')).toBe('I went home. I slept well');
  });

  it('adds a full stop to a finished thought', () => {
    expect(finalizePunctuation('Hello world')).toBe('Hello world.');
    expect(finalizePunctuation('Already fine!')).toBe('Already fine!');
    expect(finalizePunctuation('A question?')).toBe('A question?');
  });

  it('replaces a trailing comma, semicolon, or colon with a full stop', () => {
    expect(finalizePunctuation('Wait,')).toBe('Wait.');
    expect(finalizePunctuation('Here:')).toBe('Here.');
    expect(finalizePunctuation('So;')).toBe('So.');
  });

  it('can be disabled', () => {
    expect(finalizePunctuation('No full stop', false)).toBe('No full stop');
  });
});

describe('formatTranscript', () => {
  it('tidies a normal sentence', () => {
    expect(formatTranscript('hello there, how was your day')).toBe(
      'Hello there, how was your day.',
    );
  });

  it('handles spoken punctuation and paragraphs', () => {
    expect(formatTranscript('i woke up early comma went for a walk new paragraph it rained')).toBe(
      'I woke up early, went for a walk\n\nIt rained.',
    );
  });

  it('removes fillers when enabled', () => {
    expect(formatTranscript('um I think, uh, it was fine', { removeFillers: true })).toBe(
      'I think, it was fine.',
    );
    expect(formatTranscript('um I think it was fine', { removeFillers: false })).toBe(
      'Um I think it was fine.',
    );
  });

  it('leaves text alone when smart punctuation is disabled', () => {
    expect(formatTranscript('hello comma world', { smartPunctuation: false })).toBe(
      'hello comma world',
    );
  });

  it('can skip final punctuation for interim results', () => {
    expect(formatTranscript('hello wor', { finalize: false })).toBe('Hello wor');
  });

  it('does not add a period to emoji or symbols', () => {
    expect(formatTranscript('😊')).toBe('😊');
  });

  it('handles empty input', () => {
    expect(formatTranscript('')).toBe('');
    expect(formatTranscript('   ')).toBe('');
  });
});

describe('composeDictationText', () => {
  it('appends final segments at the cursor', () => {
    expect(
      composeDictationText({
        prefix: 'Today I',
        finalSegments: ['walked to the park'],
        suffix: '',
      }),
    ).toBe('Today I walked to the park');
  });

  it('preserves text on both sides of the cursor', () => {
    expect(
      composeDictationText({
        prefix: 'I felt',
        finalSegments: ['calm and grateful'],
        suffix: ' after the rain.',
      }),
    ).toBe('I felt calm and grateful after the rain.');
  });

  it('adds terminal punctuation only when the page ends after dictation', () => {
    expect(
      composeDictationText({
        prefix: '',
        finalSegments: ['hello there'],
        suffix: '',
        finalize: true,
      }),
    ).toBe('Hello there.');

    expect(
      composeDictationText({
        prefix: '',
        finalSegments: ['hello there'],
        suffix: '.',
        finalize: true,
      }),
    ).toBe('Hello there.');
  });

  it('composes live interim words without duplicating finals', () => {
    expect(
      composeDictationText({
        finalSegments: ['I went'],
        interim: 'to the market',
      }),
    ).toBe('I went to the market');
  });

  it('returns the surrounding text when nothing was dictated', () => {
    expect(composeDictationText({ prefix: 'Before', suffix: ' after' })).toBe('Before after');
  });

  it('joins multiple Android final segments', () => {
    expect(
      composeDictationText({
        finalSegments: ['We drove north', 'then stopped for coffee'],
        finalize: true,
      }),
    ).toBe('We drove north then stopped for coffee.');
  });
});

describe('smartJoin and transcriptStats', () => {
  it('adds spaces only when needed', () => {
    expect(smartJoin('hello', 'world')).toBe('hello world');
    expect(smartJoin('hello ', 'world')).toBe('hello world');
    expect(smartJoin('hello', ', world')).toBe('hello, world');
    expect(smartJoin('hello\n', 'world')).toBe('hello\nworld');
  });

  it('joins trimmed segments', () => {
    expect(joinTranscriptSegments([' one ', 'two'])).toBe('one two');
  });

  it('counts words and characters', () => {
    expect(transcriptStats(' one two  three ')).toEqual({ characters: 14, words: 3 });
    expect(transcriptStats('   ')).toEqual({ characters: 0, words: 0 });
  });
});
