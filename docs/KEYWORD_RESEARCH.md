# ddairy — Journaling Keyword Research

Research notes that shaped ddairy's prompts, tag suggestions, and store copy. The app Titan
("A softer place for your days") leans on the language of popular voice journals and
diary apps rather than cold productivity labels.

## Method

Combinations of English queries across store listing titles/subtitles/descriptions of
popular journaling & voice-diary apps, head terms on Google Trends/Play Store searches,
and community phrasing (r/DecidingToBeBetter, r/Journaling, r/BuJo, Product Hunt):

- `voice journal` · `voice diary` · `audio diary app`
- `diary app` · `journal app` · `daily journal` · `private diary`
- `gratitude journal` · ` Reflectors/Five Minute Journal` language
- `mood tracker` · `mental health journal` · `self care` · `wellness journal`
- `morning pages` · `journal prompts` · `guided journal` · `reflect app`

## High-signal terms found

| Cluster        | Terms people use                                                              |
| -------------- | ----------------------------------------------------------------------------- |
| Voice capture  | voice journal, voice diary, dictate, speech to text, audio notes, talk diary   |
| Diary core     | diary, daily diary, private diary, locked diary, journal, bullet journal      |
| Gratitude      | grateful, gratitude, thankful, blessed, appreciate                             |
| Reflection     | reflect, realized, learned, lesson, afternoon reflection, thinking             |
| Memories       | remember, memory, memories, moment, never forget, keepsake, milestone          |
| Mindfulness    | mindful, present, breathe, calm, notice, quiet                                 |
| Self-care      | self care, rest, sleep, wellbeing, kind to myself                              |
| Wellness       | health, body, energy, walk, exercise, yoga, tired                              |
| Goals growth   | goal, target, progress, plan, dream, resolution, small win, proud              |
| Work/life      | work, meeting, deadline, family, mom, dad, kids, home                          |
| Relationships  | friend, partner, love, date, together, conversation                            |
| Travel         | trip, journey, travel, vacation, flight, beach, city                           |
| Ideas          | idea, know, note, sketch, brainstorm, someday                                  |
| Mood tracking  | mood, feeling, how was your day, day rating, emotional check-in                |
| Privacy trust  | private, lock, pin, encrypted, offline, no account                             |

## What ddairy took from it

1. **Default tags** (`src/domain/constants.ts` → `JOURNAL_KEYWORDS`) map clusters to short,
   human tags: `gratitude`, `reflection`, `memories`, `mindfulness`, `self-care`, `wellness`,
   `goals`, `wins`, `work`, `family`, `relationships`, `travel`, `ideas`, `mood`, and more.
2. **Prompt chips** are pull-quote sized, matching the "low pressure" phrasing popular apps
   use ("A small win from today", "Three things I'm grateful for", "What's on my mind right now").
3. **Store copy** (`store/metadata.md`) leads with *voice journal / dictate diary* +
   *private diary* + *gratitude* because those combinations have the clearest demand
   while staying honest about what the app does.
4. **Search** in-app treats a tag as the spoken phrase too ("self-care" ↔ "self care")
   so dictation-based tags still match typed queries.
