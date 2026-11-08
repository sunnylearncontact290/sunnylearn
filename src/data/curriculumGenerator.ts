import {
  JLPTLevel,
  VocabularyItem,
  KanjiItem,
  GrammarItem,
  CurriculumUnit,
  CurriculumLesson,
  CurriculumExercise,
  PathNodeStatus
} from '../types';

export interface UnitMetadata {
  title: string;
  mongolianDescription: string;
  themeColor: string;
  iconName: string;
  categoryKeywords?: string[];
}

const UNIT_BLUEPRINTS: Record<JLPTLevel, UnitMetadata[]> = {
  N5: [
    {
      title: 'Мэндчилгээ ба Эхлэл',
      mongolianDescription: 'Өдөр тутмын анхны мэндчилгээ, өөрийгөө танилцуулах болон үндсэн үгс',
      themeColor: '#CC0000',
      iconName: 'Sparkles',
      categoryKeywords: ['Мэндчилгээ', 'Танилцуулга', 'Өдөр тутмын яриа', 'Эхлэл']
    },
    {
      title: 'Гэр бүл ба Өдөр тутам',
      mongolianDescription: 'Гэр бүлийн гишүүд, өдөр тутмын хэвшил болон хүмүүсийн тухай',
      themeColor: '#DC2626',
      iconName: 'Users',
      categoryKeywords: ['Гэр бүл', 'Хүмүүс', 'Өдөр тутмын яриа']
    },
    {
      title: 'Хоол хүнс ба Зоогийн газар',
      mongolianDescription: 'Япон хоол, ногоо жимс, ундаа болон захиалга өгөх хэллэгүүд',
      themeColor: '#EA580C',
      iconName: 'Utensils',
      categoryKeywords: ['Хоол хүнс', 'Ундаа', 'Зоог']
    },
    {
      title: 'Цаг хугацаа ба Байршил',
      mongolianDescription: 'Цаг тоолол, гаригууд, байрлал заах үгс болон хаана байгааг асуух',
      themeColor: '#7C3AED',
      iconName: 'Clock',
      categoryKeywords: ['Цаг хугацаа', 'Байрлал', 'Газар']
    },
    {
      title: 'Хөдөлгөөн ба Тээвэр',
      mongolianDescription: 'Явах, ирэх, буцах үйл үгс, тээврийн хэрэгсэл болон замын чиглэл',
      themeColor: '#2563EB',
      iconName: 'Navigation',
      categoryKeywords: ['Тээвэр', 'Хөдөлгөөн', 'Аялал']
    },
    {
      title: 'Сургууль ба Хичээл',
      mongolianDescription: 'Хичээлийн хэрэгсэл, суралцах үйл үгс болон танхимын яриа',
      themeColor: '#059669',
      iconName: 'BookOpen',
      categoryKeywords: ['Сургууль', 'Хичээл', 'Боловсрол']
    },
    {
      title: 'Дэлгүүр ба Худалдан авалт',
      mongolianDescription: 'Үнэ асуух, бараа бүтээгдэхүүн сонгох, тоо ширхэг тоолох',
      themeColor: '#DB2777',
      iconName: 'ShoppingBag',
      categoryKeywords: ['Дэлгүүр', 'Худалдаа', 'Үнэ']
    },
    {
      title: 'Байгаль ба Цаг агаар',
      mongolianDescription: 'Дөрвөн улирал, бороо цас, цаг агаарын төлөв байдал',
      themeColor: '#0284C7',
      iconName: 'CloudSun',
      categoryKeywords: ['Цаг агаар', 'Байгаль', 'Улирал']
    }
  ],
  N4: [
    {
      title: 'Өдөр тутмын харилцаа',
      mongolianDescription: 'Ажил, сургууль, найз нөхөдтэйгөө чөлөөтэй харилцах үгс',
      themeColor: '#CC0000',
      iconName: 'MessageSquare'
    },
    {
      title: 'Хүсэлт ба Зөвшөөрөл',
      mongolianDescription: 'Бусдаас тусламж гуйх, зөвшөөрөл авах болон хориглох хэлбэрүүд',
      themeColor: '#E11D48',
      iconName: 'CheckCircle'
    },
    {
      title: 'Төлөвлөгөө ба Цагийн хуваарь',
      mongolianDescription: 'Ирээдүйн төлөвлөгөө, цаг товлох, урилга хүлээн авах',
      themeColor: '#D97706',
      iconName: 'Calendar'
    },
    {
      title: 'Эрүүл мэнд ба Эмнэлэг',
      mongolianDescription: 'Өвдөлт, шинж тэмдэг тайлбарлах, эмчийн заавар сонсох',
      themeColor: '#059669',
      iconName: 'HeartPulse'
    },
    {
      title: 'Аялал жуулчлал & Соёл',
      mongolianDescription: 'Японы уламжлалт баяр, зочид буудал, үзвэр үйлчилгээ',
      themeColor: '#4F46E5',
      iconName: 'MapPin'
    }
  ],
  N3: [
    {
      title: 'Нийгэм ба Өдөр тутмын мэдээ',
      mongolianDescription: 'Мэдээ мэдээлэл, сонин, нийгмийн үйл явдлын тайлбар',
      themeColor: '#990000',
      iconName: 'Newspaper'
    },
    {
      title: 'Ажлын байрны соёл',
      mongolianDescription: 'Японы бизнесийн ёс зүй, имэйл бичих, даргатайгаа харилцах',
      themeColor: '#7C2D12',
      iconName: 'Briefcase'
    },
    {
      title: 'Сэтгэл хөдлөл ба Үзэл бодол',
      mongolianDescription: 'Өөрийн байр суурийг нарийвчлан илэрхийлэх, харьцуулах',
      themeColor: '#9333EA',
      iconName: 'Smile'
    },
    {
      title: 'Шинжлэх ухаан ба Технологи',
      mongolianDescription: 'Интернэт, тоног төхөөрөмж, хөгжил дэвшлийн тухай үгс',
      themeColor: '#0284C7',
      iconName: 'Cpu'
    }
  ],
  N2: [
    {
      title: 'Мэргэжлийн харилцаа ба Бизнес',
      mongolianDescription: 'Албан харилцаа, хурал уулзалт, бизнесийн гэрээ хэлэлцээр',
      themeColor: '#990000',
      iconName: 'Award'
    },
    {
      title: 'Эдийн засаг ба Нийгмийн асуудал',
      mongolianDescription: 'Зах зээл, санхүү, нийгмийн өөрчлөлт, дүн шинжилгээ',
      themeColor: '#4338CA',
      iconName: 'TrendingUp'
    },
    {
      title: 'Шүүмж ба Эссэ бичлэг',
      mongolianDescription: 'Уран зохиол, нийтлэл, шүүмж бичвэрийн нарийн илэрхийллүүд',
      themeColor: '#0F766E',
      iconName: 'Feather'
    }
  ],
  N1: [
    {
      title: 'Академик ба Гүнзгийрүүлсэн яриа',
      mongolianDescription: 'Эрдэм шинжилгээний өгүүлэл, дээд түвшний нийтлэлийн үгс',
      themeColor: '#7F1D1D',
      iconName: 'GraduationCap'
    },
    {
      title: 'Дээд төвшний Соёл ба Түүх',
      mongolianDescription: 'Гүн ухаан, түүхэн уламжлал, соёлын өвийн тухай хэллэгүүд',
      themeColor: '#312E81',
      iconName: 'Bookmark'
    }
  ]
};

/**
 * Deterministically synthesizes curated units and lessons from the existing N5–N1 database.
 * Guarantees zero data loss: uses existing vocabulary, kanji, and grammar datasets directly.
 */
export function generateCurriculumForLevel(
  level: JLPTLevel,
  allVocab: VocabularyItem[],
  allKanji: KanjiItem[],
  allGrammar: GrammarItem[]
): CurriculumUnit[] {
  const levelVocab = allVocab.filter(v => v.jlptLevel === level);
  const levelKanji = allKanji.filter(k => k.jlptLevel === level);
  const levelGrammar = allGrammar.filter(g => g.jlptLevel === level);

  const blueprints = UNIT_BLUEPRINTS[level] || UNIT_BLUEPRINTS.N5;
  const units: CurriculumUnit[] = [];

  const vocabChunkSize = Math.max(15, Math.ceil(levelVocab.length / blueprints.length));
  const kanjiChunkSize = Math.max(4, Math.ceil((levelKanji.length || 1) / blueprints.length));
  const grammarChunkSize = Math.max(3, Math.ceil((levelGrammar.length || 1) / blueprints.length));

  blueprints.forEach((bp, unitIdx) => {
    const unitId = `unit-${level.toLowerCase()}-${unitIdx + 1}`;
    const unitVocab = levelVocab.slice(unitIdx * vocabChunkSize, (unitIdx + 1) * vocabChunkSize);
    const unitKanji = levelKanji.slice(unitIdx * kanjiChunkSize, (unitIdx + 1) * kanjiChunkSize);
    const unitGrammar = levelGrammar.slice(unitIdx * grammarChunkSize, (unitIdx + 1) * grammarChunkSize);

    // Create 4 standard learning lessons + 1 review + 1 boss challenge
    const lessonChunkSize = Math.max(3, Math.ceil(unitVocab.length / 4));
    const lessons: CurriculumLesson[] = [];

    // Lesson 1: Vocabulary Foundation
    const l1Vocab = unitVocab.slice(0, lessonChunkSize);
    lessons.push({
      id: `${unitId}-l1`,
      unitId,
      lessonNumber: 1,
      title: `${bp.title} — Үгсийн сан I`,
      description: `${l1Vocab.length} шинэ үг, жишээ өгүүлбэрүүдтэй танилцах`,
      type: 'lesson',
      jlptLevel: level,
      vocabIds: l1Vocab.map(v => v.id),
      kanjiIds: unitKanji.slice(0, 2).map(k => k.id),
      grammarIds: [],
      xpReward: 15,
      totalExercises: Math.min(10, Math.max(6, l1Vocab.length * 2))
    });

    // Lesson 2: Vocabulary & Kanji
    const l2Vocab = unitVocab.slice(lessonChunkSize, lessonChunkSize * 2);
    const l2Kanji = unitKanji.slice(2, 4);
    lessons.push({
      id: `${unitId}-l2`,
      unitId,
      lessonNumber: 2,
      title: `${bp.title} — Үг ба Ханз`,
      description: `Ханзны дуудлага, шинэ үгс, сонсох дасгалууд`,
      type: 'lesson',
      jlptLevel: level,
      vocabIds: l2Vocab.map(v => v.id),
      kanjiIds: l2Kanji.map(k => k.id),
      grammarIds: [],
      xpReward: 15,
      totalExercises: Math.min(10, Math.max(6, (l2Vocab.length + l2Kanji.length) * 2))
    });

    // Lesson 3: Grammar & Sentence Structure
    const l3Vocab = unitVocab.slice(lessonChunkSize * 2, lessonChunkSize * 3);
    const l3Grammar = unitGrammar.slice(0, 2);
    lessons.push({
      id: `${unitId}-l3`,
      unitId,
      lessonNumber: 3,
      title: `${bp.title} — Өгүүлбэр зүй`,
      description: `Үгсийн холбоо, өгүүлбэр эвлүүлэх болон дүрмийн хэрэглээ`,
      type: 'lesson',
      jlptLevel: level,
      vocabIds: l3Vocab.map(v => v.id),
      kanjiIds: [],
      grammarIds: l3Grammar.map(g => g.id),
      xpReward: 15,
      totalExercises: Math.min(10, Math.max(6, l3Vocab.length * 2))
    });

    // Lesson 4: Everyday Application
    const l4Vocab = unitVocab.slice(lessonChunkSize * 3);
    const l4Grammar = unitGrammar.slice(2, 4);
    lessons.push({
      id: `${unitId}-l4`,
      unitId,
      lessonNumber: 4,
      title: `${bp.title} — Бодит хэрэглээ`,
      description: `Амьдралд хэрэглэгдэх өгүүлбэрүүд ба сонсох чадвар`,
      type: 'lesson',
      jlptLevel: level,
      vocabIds: l4Vocab.map(v => v.id),
      kanjiIds: unitKanji.slice(4).map(k => k.id),
      grammarIds: l4Grammar.map(g => g.id),
      xpReward: 15,
      totalExercises: Math.min(10, Math.max(6, l4Vocab.length * 2))
    });

    // Lesson 5: Unit Review & Practice
    lessons.push({
      id: `${unitId}-review`,
      unitId,
      lessonNumber: 5,
      title: `${bp.title} — Нэгдсэн Давтлага`,
      description: `Тухайн бүлгийн бүх үг, ханз, дүрмийн цогц бататгал`,
      type: 'review',
      jlptLevel: level,
      vocabIds: unitVocab.map(v => v.id),
      kanjiIds: unitKanji.map(k => k.id),
      grammarIds: unitGrammar.map(g => g.id),
      xpReward: 20,
      totalExercises: 10
    });

    // Lesson 6: Unit Challenge (Boss Milestone)
    lessons.push({
      id: `${unitId}-challenge`,
      unitId,
      lessonNumber: 6,
      title: `${bp.title} — Бүлгийн Сорил 🏆`,
      description: `Бүлгийг бүрэн дуусгаж, дараагийн шатыг нээх сорилт`,
      type: 'boss_challenge',
      jlptLevel: level,
      vocabIds: unitVocab.map(v => v.id),
      kanjiIds: unitKanji.map(k => k.id),
      grammarIds: unitGrammar.map(g => g.id),
      xpReward: 30,
      totalExercises: 12
    });

    units.push({
      id: unitId,
      unitNumber: unitIdx + 1,
      title: bp.title,
      mongolianDescription: bp.mongolianDescription,
      jlptLevel: level,
      themeColor: bp.themeColor,
      iconName: bp.iconName,
      lessons
    });
  });

  return units;
}

/**
 * Computes the real-time status of a lesson node based on the user's actual learning history.
 * Guarantees zero progress loss: previously learned vocabulary automatically marks nodes as completed!
 */
export function calculateLessonStatus(
  lesson: CurriculumLesson,
  learnedVocabIds: string[] = [],
  learnedKanjiIds: string[] = [],
  completedLessonIds: string[] = [],
  isFirstLesson: boolean = false,
  previousLessonStatus?: PathNodeStatus
): PathNodeStatus {
  // 1. Explicitly marked as completed in progress state
  if (completedLessonIds.includes(lesson.id)) {
    return 'completed';
  }

  // 2. Check if a high percentage (>= 75%) of this lesson's vocab has already been learned
  if (lesson.vocabIds.length > 0) {
    const learnedCount = lesson.vocabIds.filter(id => learnedVocabIds.includes(id)).length;
    if (learnedCount >= Math.ceil(lesson.vocabIds.length * 0.75)) {
      return 'completed';
    }
  }

  // 3. First lesson of the entire level is always unlocked and active
  if (isFirstLesson) {
    return 'active';
  }

  // 4. If previous lesson in sequence is completed, this lesson is now active
  if (previousLessonStatus === 'completed') {
    return 'active';
  }

  // 5. Default locked state
  return 'locked';
}

/**
 * Generates an interactive exercise deck for a lesson session.
 * Supports: Vocab intro cards, word scramble tiles, multiple choice, and audio listening.
 */
export function generateExercisesForLesson(
  lesson: CurriculumLesson,
  allVocab: VocabularyItem[],
  allKanji: KanjiItem[],
  allGrammar: GrammarItem[]
): CurriculumExercise[] {
  const exercises: CurriculumExercise[] = [];
  const vocabItems = allVocab.filter(v => lesson.vocabIds.includes(v.id));
  const kanjiItems = allKanji.filter(k => lesson.kanjiIds.includes(k.id));
  const poolVocab = allVocab.filter(v => v.jlptLevel === lesson.jlptLevel);

  // 1. Vocab Introductions & Recognition
  vocabItems.forEach((vocab, idx) => {
    // A. Intro Card
    exercises.push({
      id: `ex-${lesson.id}-intro-${idx}`,
      type: 'vocab_intro',
      prompt: 'Шинэ үгтэй танилцаарай',
      targetJapanese: vocab.japanese,
      targetReading: vocab.reading,
      targetMongolian: vocab.mongolian,
      correctAnswer: vocab.mongolian,
      explanation: vocab.explanation || `Тайлбар: ${vocab.partOfSpeech}`
    });

    // B. Multiple Choice Translation
    const distractors = poolVocab
      .filter(v => v.id !== vocab.id && v.mongolian !== vocab.mongolian)
      .slice(0, 3)
      .map(v => v.mongolian);

    const options = [...distractors, vocab.mongolian].sort(() => Math.random() - 0.5);

    exercises.push({
      id: `ex-${lesson.id}-mc-${idx}`,
      type: 'multiple_choice',
      prompt: 'Зөв монгол утгыг сонгоно уу',
      targetJapanese: vocab.japanese,
      targetReading: vocab.reading,
      targetMongolian: vocab.mongolian,
      options,
      correctAnswer: vocab.mongolian,
      explanation: `「${vocab.japanese}」(${vocab.reading}) — ${vocab.mongolian}`
    });

    // C. Sentence Word Scramble (if example sentence is present)
    if (vocab.exampleSentence && vocab.exampleSentence.includes('(')) {
      // Parse Japanese part and Mongolian part from: "私は学生です。(Би оюутан.)"
      const match = vocab.exampleSentence.match(/^([^\(（]+)[\(（]([^\)）]+)[\)）]/);
      if (match) {
        const japaneseSentence = match[1].trim();
        const mongolianSentence = match[2].trim();

        // Split Japanese sentence into word chunks using spaces or natural segments
        const chunks = japaneseSentence.split(/(\s+|は|が|を|に|で|と|も|です|ます|でした|ました)/).filter(c => c.trim().length > 0);
        if (chunks.length >= 3 && chunks.length <= 8) {
          const tiles = chunks.map((c, i) => ({ id: `tile-${i}`, text: c }));
          exercises.push({
            id: `ex-${lesson.id}-scramble-${idx}`,
            type: 'sentence_scramble',
            prompt: 'Өгүүлбэрийг зөв дарааллаар эвлүүлнэ үү',
            targetJapanese: japaneseSentence,
            targetMongolian: mongolianSentence,
            correctAnswer: japaneseSentence.replace(/\s+/g, ''),
            wordTiles: [...tiles].sort(() => Math.random() - 0.5),
            explanation: `Зөв өгүүлбэр: ${japaneseSentence} — ${mongolianSentence}`
          });
        }
      }
    }
  });

  // 2. Kanji Recognition
  kanjiItems.forEach((kanji, idx) => {
    exercises.push({
      id: `ex-${lesson.id}-kanji-${idx}`,
      type: 'multiple_choice',
      prompt: `Энэ ханзны утга юу вэ?`,
      targetJapanese: kanji.kanji,
      targetReading: kanji.onyomi || kanji.kunyomi || '',
      targetMongolian: kanji.mongolian,
      options: [kanji.mongolian, 'Ус', 'Гал', 'Мод'].sort(() => Math.random() - 0.5),
      correctAnswer: kanji.mongolian,
      explanation: `「${kanji.kanji}」ханз нь 「${kanji.mongolian}」утгатай.`
    });
  });

  // Limit to target total exercises
  return exercises.slice(0, lesson.totalExercises || 10);
}
