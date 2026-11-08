# SunnyLearn 2.0 — Phased Architecture & UI/UX Implementation Plan

A phased, production-grade roadmap to evolve SunnyLearn into a gamified, mobile-first Japanese learning platform for both the website and Capacitor iOS app, beginning with the mobile bottom navigation, interactive learning path, and redesigned homepage dashboard.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Key Architectural Guarantees for SunnyLearn 2.0:**
> 1. **Zero Data or Progress Loss**: Existing `learnedVocabIds`, `learnedKanjiIds`, `learnedGrammarIds`, `quizHistory`, and `GamificationProgress` (streak, XP, badges) are preserved 100% and map directly to completed nodes on the new learning path.
> 2. **Complete Content Preservation**: All JLPT N5–N1 datasets (`n5VocabAdditions.ts` through `n1VocabBatch2.ts`), example sentences, audio pronunciation, and dictionary search remain fully intact.
> 3. **Public Beta Kept Active**: `PUBLIC_BETA_ENABLED = true` remains in effect. No forced checkout, paywalls, or payment processing are activated.
> 4. **Brand Integrity**: Preserves SunnyLearn's signature dark red (`#990000`), crimson (`#CC0000`), and pink (`#FF3366`) palette with dynamic time-of-day mascot illustrations.

- **Phase 1 Priority**: Build the Mobile Bottom Navigation and the Gamified Vertical Learning Path (`/learn`), while keeping existing tab routes functional.
- **Phase 2 Priority**: Redesign the Homepage Dashboard to showcase the user's active path node, daily XP ring, streak flame, and quick review deck.
- **Phase 3 Priority**: Implement the full Interactive Lesson Player supporting multi-step exercises (vocab intro, word tiles scramble, matching, audio listening, and typing).

---

## 1. Overview & Core Concept

SunnyLearn 2.0 transforms passive dictionary lists into an engaging, structured journey:
- **Pedagogical Structure**: `JLPT Level` → `Unit` → `Lesson` → `Interactive Exercises` → `Unit Boss Challenge`.
- **Vertical Learning Path**: Stepping-stone path with nodes that indicate completion status (completed with checkmark, current pulsing node, locked node with padlock, and milestone chest).
- **Mobile-First Touch Ergonomics**:
  - Sticky glass bottom navigation bar with thumb-zone targets ($\ge 48\text{px}$).
  - Full compatibility with the Capacitor iOS app (respects `env(safe-area-inset-bottom)` and `env(safe-area-inset-top)`).
  - Clean 3-column responsive layout on desktop ($1440\text{px}$ canvas) that seamlessly collapses to an ergonomic single-column touch feed on mobile ($375\text{px}$–$430\text{px}$).

---

## 2. User Experience & Visual Design

### 2.1 The Vertical Learning Path
```
                          [ UNIT 1: ТАНИЛЦУУЛГА ]
                                    │
                                   (✓)  Lesson 1: Мэндчилгээ (Completed)
                                  ╱
                                (✓)    Lesson 2: Анхны үгс (Completed)
                                  ╲
                                  (●)  Lesson 3: Өөрийгөө танилцуулах (Current)
                                 ▲ │ ▲ [ Floating "Эхлэх / Start" Card ]
                                  ╱
                                (🔒)   Lesson 4: Дүрмийн үндэс (Locked)
                                  ╲
                                [ 🎁 ] Unit 1 Challenge (Milestone Chest)
```

- **Node States**:
  - **Completed (✓)**: Vibrant crimson-red radial gradient (`#CC0000` to `#FF0000`) with white checkmark and subtle golden rim.
  - **Active / Current (●)**: High-contrast pulsing ruby glow with mascot encouragement and quick "Эхлэх" (Start) tooltip card.
  - **Locked (🔒)**: Sleek dark stone circular node (`#1C1917` / `#292524`) with quiet lock glyph.
  - **Milestone Chest (🎁)**: Unit reward node that unlocks badges, bonus XP, and celebratory animations upon completion.

### 2.2 Mobile Bottom Navigation Bar (`MobileTabBar.tsx`)
- Appears on viewports $< 768\text{px}$ and in the native Capacitor iOS app.
- 5 primary thumb-zone tabs:
  1. **Суралцах (Path)**: Compass / Path icon (`/learn`).
  2. **Дасгал (Practice)**: Target / Practice icon (`/practice`).
  3. **Номын сан (Library)**: Book / Dictionary icon (`/dictionary`).
  4. **AI Яриа (AI Chat)**: Mascot / Speech bubble icon (`/roleplay` or `/conversation`).
  5. **Профайл (Profile)**: User avatar / Streak flame icon (`/profile`).
- Native haptic feedback on tab selection using `triggerHapticFeedback('light')`.
- Safe area bottom padding: `padding-bottom: max(env(safe-area-inset-bottom), 12px)`.

### 2.3 Desktop 3-Column Layout
- **Left Column ($260\text{px}$)**: Brand logo, dynamic time-of-day mascot, persistent navigation rail, and JLPT level selector.
- **Center Column ($680\text{px}$–$760\text{px}$)**: Centered vertical winding learning path with animated nodes, unit banners, and milestone chests.
- **Right Column ($340\text{px}$)**:
  - Daily Streak Card with flame icon and calendar history.
  - Daily XP Mission Ring (e.g. 15 / 20 XP).
  - Quick Spaced-Repetition Review Card (reviews items with `masteryStatus === 'review_needed'`).
  - Active JLPT Level Mastery summary.

---

## 3. Technical Architecture & Data Strategy

### 3.1 System Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SUNNYLEARN 2.0 APP CONTAINER                       │
│                   (Web Browser SPA & Capacitor iOS Native)                  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
     ┌─────────────────────────────────┴─────────────────────────────────┐
     ▼                                                                   ▼
┌───────────────────────────────┐                   ┌───────────────────────────────┐
│     NAVIGATION & SHELL        │                   │     CURRICULUM ENGINE         │
│  - Desktop Sidebar & Header   │                   │  - Deterministic Unit Builder │
│  - Mobile Bottom Tab Bar      │                   │  - N5–N1 Curriculum Mapper    │
│  - iOS Safe-Area Padding      │                   │  - Spaced Repetition Tracker  │
└──────────────┬────────────────┘                   └───────────────┬───────────────┘
               │                                                    │
               ▼                                                    ▼
┌───────────────────────────────┐                   ┌───────────────────────────────┐
│       CORE VIEWS & PATH       │                   │    INTERACTIVE LESSON PLAYER  │
│  - Gamified Learning Path     │                   │  - Vocab Intro Cards          │
│  - Modernized Home Dashboard  │                   │  - Sentence Word Scramble     │
│  - Library / Dictionary Hub   │                   │  - Audio Comprehension        │
│  - AI Conversation Center     │                   │  - Word Matching Pairs        │
└──────────────┬────────────────┘                   └───────────────┬───────────────┘
               │                                                    │
               └───────────────────────┬────────────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CENTRALIZED STATE & SERVICES                          │
│  - AppContext (Progress, Streaks, XP, Favorites, Auth)                      │
│  - SpeechService (Neural TTS, Audio Prefetching, Pronunciation)             │
│  - NativePlatform (Haptics, Status Bar, Splash Screen)                      │
│  - JapaneseTokenizer (Accurate Furigana Alignment & Ruby Tags)              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PERSISTENCE & BACKEND API LAYER                          │
│  - Express / Serverless API (/api/*)                                        │
│  - File / DB Persistence (data/db.json)                                     │
│  - Neural TTS & Gemini AI Proxy Endpoints (No client secrets)               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Models & State Additions
```typescript
export interface PathNodeState {
  nodeId: string;
  unitId: string;
  level: JLPTLevel;
  title: string;
  description: string;
  type: 'lesson' | 'review' | 'quiz' | 'boss_challenge';
  status: 'completed' | 'active' | 'locked';
  itemIds: string[]; // Associated vocabulary/kanji/grammar IDs
  xpReward: number;
}

export interface UnitProgressState {
  unitId: string;
  completedLessons: number;
  totalLessons: number;
  isUnlocked: boolean;
  isCompleted: boolean;
}
```

---

## 4. Phased Implementation Roadmap

### Phase 1: Core Curriculum Mapper, Mobile Bottom Tab Bar & Gamified Path
1. **Curriculum Synthesizer (`src/data/curriculumGenerator.ts`)**:
   - Algorithmic grouping of existing N5–N1 vocabulary, kanji, and grammar into thematic Units and bite-sized Lessons.
   - Automatically computes completion based on existing `learnedVocabIds` so existing users never lose progress.
2. **Mobile Bottom Navigation (`src/components/common/MobileTabBar.tsx`)**:
   - Ergonomic 5-tab thumb-friendly navigation bar for mobile viewports and iOS app.
   - Fully integrated with safe-area insets and haptic feedback.
3. **Gamified Vertical Learning Path (`src/components/learn/LearningPathView.tsx`)**:
   - Visual winding path with custom SVG connectors, crimson/pink glowing nodes, and unit headers.
   - Preserves tabbed access to the existing Vocabulary, Kanji, and Grammar dictionary lists.

### Phase 2: Modernized Dashboard & Home Screen
1. **Dynamic User Home Screen (`src/components/home/HomePage.tsx`)**:
   - Shows user's active lesson node with 1-tap "Үргэлжлүүлэх" (Continue Learning) button.
   - Live daily mission progress ring (e.g. 15 / 20 XP).
   - Streak flame counter with celebration modal on milestone reach.
   - Mascot integration with time-of-day mood greetings.

### Phase 3: Interactive Lesson Player Engine
1. **Lesson Engine Components (`src/components/lesson/*`)**:
   - `LessonPlayer.tsx`: Orchestrates the study session with animated top progress bar.
   - `ExerciseRenderer.tsx`: Renders vocab introductions, tap-to-scramble sentence tiles, audio listening choices, and card matching.
   - `LessonCompletionModal.tsx`: Celebrates completion with mascot animation, XP tally, and streak increments.

### Phase 4: Verification, Cross-Platform Testing & Build
1. Run full regression test suite (`npm test`).
2. Run TypeScript compilation (`compile_applet`) and lint verification (`lint_applet`).
3. Sync native iOS container (`npx cap sync ios`).
4. Verify responsive display on mobile ($375\text{px}$–$430\text{px}$) and desktop ($1440\text{px}$).
