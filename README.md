# ddairy 📖🎙️

**A softer place for your days.** ddairy is a voice-first diary for iOS, Android, and web —
dictate your day, keep one main diary, and make extra books for anything that deserves its
own space (trips, ideas, work, solo projects).

Built with [Expo](https://expo.dev) (SDK 58), Expo Router, React 19, and TypeScript.

## Features

- **Speak your diary.** Press the mic and talk; words appear live and are gently tidied
  with smart punctuation (spoken "comma", "new paragraph", filler-word cleanup). Voice
  dictation uses native on-device speech recognition through `expo-speech-recognition`,
  with the browser's SpeechRecognition API on web. If a device has no recognizer, the app
  says so kindly and typing always works.
- **One main diary, many books.** `My Diary` is always there; create up to 30 other books,
  each with its own icon and color, and switch instantly from the book switcher.
- **Low-pressure entry editing.** Calm editor with autosave (510 ms debounce plus a save on
  app background), save status, mood picker, tag suggestions based on what you wrote,
  favorite bookmarking, related pages, and guided prompt chips.
- **Local-first privacy.** Everything is stored on-device (AsyncStorage) with schema
  validation and migration so old or corrupt data degrades gracefully. Nothing leaves your
  device except a Markdown export you choose to share.
- **Designed for tablets.** Responsive layout expands to a two-rail arrangement at wide
  sizes (`width ≥ 1000`); the custom floating tab bar adapts to safe areas on phone/tablet.
- **Warm, quiet motion.** Spring-based press feedback, fade-in entries, a live voice wave,
  reduced-motion support, and soft haptics (configurable in Settings).

## Keywords & guided alignment

Tag suggestions and prompts are drawn from popular voice-journal and journaling vocabulary
(voice journal, gratitude, reflection, memories, mindfulness, self-care, wellness, goals,
habits, mood, private diary). See [`docs/KEYWORD_RESEARCH.md`](docs/KEYWORD_RESEARCH.md).

## Get started

```bash
npm install
npx expo start
```

Then open in:

- a browser (`w`) — full dictation in Chrome/Safari with speech recognition,
- an iOS simulator or Android emulator (`i` / `a`),
- or a development build. **Note:** `expo-speech-recognition` has native code and is not
  bundled in Expo Go; voice dictation there will show the graceful fallback message.

## Scripts

| Script                 | What it does                                    |
| ---------------------- | ----------------------------------------------- |
| `npm run typecheck`    | `tsc --noEmit`                                  |
| `npm run lint`         | ESLint (expo config, React Compiler rules)      |
| `npm test`             | Jest suite (148 tests)                          |
| `npm run test:coverage`| Coverage report (thresholds enforced)           |
| `npm run assets`       | Regenerate icons/splash from `scripts/generate-assets.mjs` |
| `npm run export:web`   | Static web export into `dist/`                  |
| `npm run doctor`       | `expo-doctor` diagnostics                       |

## Quality gates

- `npx tsc --noEmit` — clean
- `npx expo lint` — clean (React-Compiler aware)
- `npx jest` — 148 passing tests across domain, storage, hooks, utils, context, and components
- `npx expo-doctor` — 20/20 checks
- Coverage ≥ 97% statements / ≥ 91% branches on collected sources

## Project layout

```
src/
  app/            Expo Router screens: (tabs)/Journal·Books·Settings, entry/[id]
  components/     UI kit, TabBar, book/, entry/ components
  context/        AppProvider — hydration, autosave, AppState flush
  domain/         Pure logic: reducer, entries, books, search, streak,
                  suggestions, transcript (voice→text cleanup), date
  hooks/          useDictation, useHaptics, useNow, useResponsive, ...
  storage/        AsyncStorage validation + migration layer
  theme/          Warm paper/ink palette (light + dark), fonts
  utils/          color math, confirm dialogs, markdown export
__tests__/        Jest suites mirroring the above
```

## Voice-to-text stack

- **iOS/Android:** `expo-speech-recognition` — platform recognizer with final-result
  batching, ending-silence detection, and locale selection (12 dictation languages).
- **Web:** browser `SpeechRecognition` (Chrome/Edge best) with the same downstream
  transcript-processing pipeline.
- **Pipeline:** `src/domain/transcript.ts` — command parsing, filler removal, punctuation
  spacing/collapsing, sentence capitalization, cursor-aware composition for mid-entry
  dictation, and terminal-punctuation finalization only when the page ends.

## Store assets

App store copy, keyword list, and screenshot plan live in
[`store/metadata.md`](store/metadata.md).
