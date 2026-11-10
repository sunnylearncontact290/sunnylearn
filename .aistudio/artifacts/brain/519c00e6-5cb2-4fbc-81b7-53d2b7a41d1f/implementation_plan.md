# SunnyLearn 2.0 — Product Transformation & Architecture

## Overview
SunnyLearn 2.0 (https://sunnylearn.online) has been upgraded into a cohesive, high-performance Japanese learning platform for Web and iOS (Capacitor). All JLPT levels (N5, N4, N3, N2, N1) have been systematized with topic-based curriculum sequences, responsive multi-card grids with 40-item pagination, interactive Kanji stroke-order animations with stroke stepping and visible number guides (1..N), a dedicated Gojūon (五十音) dictionary, smart continue personalization, and distinct AI assistance modalities.

---

## 1. Completed Implementations

### Phase 1 & 2: UX Simplification & Minimal Dashboard
- **Unified JLPT Level Selector**: Single canonical selector in the top navigation bar next to SunnyLearn BETA. Redundant duplicate selectors across sub-views were removed.
- **First-Time Onboarding Modal**: Beautiful 5-level selector with N5 recommended for beginners. Persists level choice to user profile and local storage, never prompting repeatedly.
- **Streamlined Homepage**:
  - Warm greeting with active JLPT level.
  - One primary action: **"Үргэлжлүүлэн сурах →"** (`handleSmartContinue`) resolving in priority: Due SRS Reviews → Last Studied SubTab → Learning Path.
  - Quick Dictionary Search entry.
  - Compact Learning Indicators: Daily Goal completion, Due SRS Reviews, XP, and Streak.
  - Compact Learning Shortcuts: Үгийн сан, Ханз, and Дүрэм with progress percentages.
  - Personalized Error Review card (triggered when missed quiz/practice items exist).
  - Daily Highlights (Word and Kanji of the Day) without internal scrollbars.

### Phase 3: Curriculum Restructuring & Multi-Card Learning Grid
- **Structured Categories Across N5–N1**: Eliminated generic catch-all buckets; vocabulary and kanji are classified into meaningful semantic categories (Numbers, Time, Family, Actions, Food, Society, etc.).
- **Pedagogical Number Sequence**: Introductory N5 Kanji strictly follows `一 → 二 → 三 → 四 → 五 → 六 → 七 → 八 → 九 → 十`.
- **Responsive Multi-Card Grid**:
  - Responsive layout (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`).
  - Natural card sizing with zero inner/nested scrollbars.
  - High-performance pagination (40 items/page) with quick page navigation and total count display.
- **Accurate Stroke Order & Controls**:
  - KanjiVG integration with stroke-by-stroke animation.
  - Full playback controls: Play/Pause, Replay (from stroke 1), Step backward, Step forward.
  - Stroke counter (`Зурлага: X / Y`).
  - Toggle for visible stroke order numbers `1..N` at origin points.
- **Clean Learning Status**:
  - Consistent toggle button: "Сурсан гэж тэмдэглэх" / "✓ Сурсан" with undo capability and anti-spam XP guard.

### Phase 4: Dedicated Japanese Dictionary ("Толь бичиг")
- Bottom navigation updated from "Номын сан" to **"Толь бичиг"**.
- Cross-level Japanese lookup across all 5,580 words.
- Japanese Gojūon (五十音) kana index (あ..ん with voiced/semi-voiced rows) sorted by Japanese reading.
- Tapping a kana filters words starting with that sound.
- Integrated with `WordDictionaryModal` for rich definition and kanji breakdowns.

### Phase 5: Clarified AI Modalities
- **Sunny AI (Tutor)**: 24/7 personal tutor explaining Japanese grammar nuances, vocabulary context, and quiz mistakes in Mongolian.
- **AI Roleplay (Speaking)**: Interactive scenarios (conbini, restaurant, interviews) with objectives and detailed feedback reports.
- **Чөлөөт яриа (Free Voice Conversation)**: Open-ended conversational voice practice with Sunny.
- Distinct entry cards on the Homepage and prominent navigation in the main header.

### Phase 6: Mobile & Platform Synchronization
- Mobile-first layout with safe-area inset padding (`.pb-safe`).
- No horizontal scrollbars or nested card overflow.
- Official Premium pricing verified at **¥480 / month**.
- Zero regression: All 16 Vitest tests passing; Capacitor iOS sync verified and compiled successfully.
