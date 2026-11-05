import { tokenizeJapaneseSentence } from '../src/utils/japaneseTokenizer';
import { hasKanji, alignRubyParts, stripFurigana } from '../src/utils/furiganaRenderer';

// Sample vocabulary items
const mockVocab: any[] = [
  { id: '1', japanese: '私', reading: 'わたし', mongolian: 'Би', jlptLevel: 'N5' },
  { id: '2', japanese: '日本語', reading: 'にほんご', mongolian: 'Япон хэл', jlptLevel: 'N5' },
  { id: '3', japanese: '勉強', reading: 'べんきょう', mongolian: 'Хичээл хийх, суралцах', jlptLevel: 'N5' },
  { id: '4', japanese: '本', reading: 'ほん', mongolian: 'Ном', jlptLevel: 'N5' },
  { id: '5', japanese: '食べる', reading: 'たべる', mongolian: 'Идэх', jlptLevel: 'N5' },
  { id: '6', japanese: '漢字', reading: 'かんじ', mongolian: 'Ханз', jlptLevel: 'N5' },
  { id: '7', japanese: '毎日', reading: 'まいにち', mongolian: 'Өдөр бүр', jlptLevel: 'N5' },
  { id: '8', japanese: '暗記', reading: 'あんき', mongolian: 'Цээжлэх', jlptLevel: 'N4' },
  { id: '9', japanese: '更新', reading: 'こうしん', mongolian: 'Шинэчлэх, сунгах', jlptLevel: 'N2' },
  { id: '10', japanese: '手続き', reading: 'てつづき', mongolian: 'Процесс, бичиг баримтын бүрдүүлэлт', jlptLevel: 'N3' },
  { id: '11', japanese: 'ビザ', reading: 'ビザ', mongolian: 'Виз', jlptLevel: 'N5' },
  { id: '12', japanese: '雨', reading: 'あめ', mongolian: 'Бороо', jlptLevel: 'N5' },
  { id: '13', japanese: '降る', reading: 'ふる', mongolian: 'Орох (бороо, цас)', jlptLevel: 'N5' },
  { id: '14', japanese: '間', reading: 'あいだ', mongolian: 'Хооронд, зай', jlptLevel: 'N5' },
  { id: '15', japanese: '寝る', reading: 'ねる', mongolian: 'Унтах', jlptLevel: 'N5' },
  { id: '16', japanese: '生徒', reading: 'せいと', mongolian: 'Сурагч', jlptLevel: 'N5' },
  { id: '17', japanese: '時間', reading: 'じかん', mongolian: 'Цаг хугацаа', jlptLevel: 'N5' },
  { id: '18', japanese: '生きる', reading: 'いきる', mongolian: 'Амьдрах', jlptLevel: 'N4' },
  { id: '19', japanese: '生まれる', reading: 'うまれる', mongolian: 'Төрөх', jlptLevel: 'N4' }
];

const mockKanji: any[] = [
  { id: 'k1', kanji: '私', onyomi: 'シ', kunyomi: 'わたし', mongolian: 'Би', jlptLevel: 'N5' },
  { id: 'k2', kanji: '日', onyomi: 'ニチ, ジツ', kunyomi: 'ひ, び', mongolian: 'Нар, өдөр', jlptLevel: 'N5' },
  { id: 'k3', kanji: '本', onyomi: 'ホン', kunyomi: 'もと', mongolian: 'Ном, үндэс', jlptLevel: 'N5' },
  { id: 'k4', kanji: '語', onyomi: 'ゴ', kunyomi: 'かた.る', mongolian: 'Хэл', jlptLevel: 'N5' },
  { id: 'k5', kanji: '勉', onyomi: 'ベン', kunyomi: 'つと.める', mongolian: 'Зүтгэх', jlptLevel: 'N5' },
  { id: 'k6', kanji: '強', onyomi: 'キョウ, ゴウ', kunyomi: 'つよ.い', mongolian: 'Хүчтэй', jlptLevel: 'N5' },
  { id: 'k7', kanji: '食', onyomi: 'ショク', kunyomi: 'た.べる', mongolian: 'Идэх', jlptLevel: 'N5' },
  { id: 'k8', kanji: '漢', onyomi: 'カン', kunyomi: '', mongolian: 'Ханз', jlptLevel: 'N5' },
  { id: 'k9', kanji: '字', onyomi: 'ジ', kunyomi: 'あざ', mongolian: 'Үсэг', jlptLevel: 'N5' },
  { id: 'k10', kanji: '毎', onyomi: 'マイ', kunyomi: '', mongolian: 'Бүр, тутам', jlptLevel: 'N5' },
  { id: 'k11', kanji: '暗', onyomi: 'アン', kunyomi: 'くら.い', mongolian: 'Харанхуй, цээж', jlptLevel: 'N4' },
  { id: 'k12', kanji: '記', onyomi: 'キ', kunyomi: 'しる.す', mongolian: 'Тэмдэглэх', jlptLevel: 'N4' },
  { id: 'k13', kanji: '更', onyomi: 'コウ', kunyomi: 'さら', mongolian: 'Шинэчлэх', jlptLevel: 'N2' },
  { id: 'k14', kanji: '新', onyomi: 'シン', kunyomi: 'あたら.しい', mongolian: 'Шинэ', jlptLevel: 'N5' },
  { id: 'k15', kanji: '手', onyomi: 'シュ', kunyomi: 'て', mongolian: 'Гар', jlptLevel: 'N5' },
  { id: 'k16', kanji: '続', onyomi: 'ゾク', kunyomi: 'つづ.く', mongolian: 'Үргэлжлэх', jlptLevel: 'N4' },
  { id: 'k17', kanji: '雨', onyomi: 'ウ', kunyomi: 'あめ, あま', mongolian: 'Бороо', jlptLevel: 'N5' },
  { id: 'k18', kanji: '降', onyomi: 'コウ', kunyomi: 'ふ.る, お.りる', mongolian: 'Буух, орох', jlptLevel: 'N5' },
  { id: 'k19', kanji: '間', onyomi: 'カン, ケン', kunyomi: 'あいだ, ま', mongolian: 'Зай, хооронд', jlptLevel: 'N5' },
  { id: 'k20', kanji: '寝', onyomi: 'シン', kunyomi: 'ね.る', mongolian: 'Унтах', jlptLevel: 'N5' },
  { id: 'k21', kanji: '生', onyomi: 'セイ, ショウ', kunyomi: 'い.きる, う.まれる, なま', mongolian: 'Амьдрал, төрөх', jlptLevel: 'N5' },
  { id: 'k22', kanji: '徒', onyomi: 'ト', kunyomi: 'いたずら', mongolian: 'Дагалдагч, сурагч', jlptLevel: 'N5' },
];

interface TestCase {
  name: string;
  sentence: string;
  expectedInteractiveWords: string[];
  expectedNonInteractiveWords: string[];
  expectedReadings?: Record<string, string>;
  expectedRubyParts?: Record<string, string>;
}

const testCases: TestCase[] = [
  {
    name: 'Test 1 — Rain past tense verb (雨が降りました。)',
    sentence: '雨が降りました。',
    expectedInteractiveWords: ['雨', '降りました'],
    expectedNonInteractiveWords: ['が', '。'],
    expectedReadings: {
      '雨': 'あめ',
      '降りました': 'ふりました'
    },
    expectedRubyParts: {
      '降りました': '<ruby>降<rt>ふ</rt></ruby>りました'
    }
  },
  {
    name: 'Test 2 — Contextualの間 in dependent clause (寝ている間に雨が降りました。)',
    sentence: '寝ている間に雨が降りました。',
    expectedInteractiveWords: ['寝ている', '間', '雨', '降りました'],
    expectedNonInteractiveWords: ['に', 'が', '。'],
    expectedReadings: {
      '寝ている': 'ねている',
      '間': 'あいだ', // Strictly NOT 'かん'
      '雨': 'あめ',
      '降りました': 'ふりました'
    },
    expectedRubyParts: {
      '間': '<ruby>間<rt>あいだ</rt></ruby>',
      '降りました': '<ruby>降<rt>ふ</rt></ruby>りました'
    }
  },
  {
    name: 'Test 3 — Contextual 今日中 vs 今日 (今日中に仕事を終わらせます。)',
    sentence: '今日中に仕事を終わらせます。',
    expectedInteractiveWords: ['今日中に', '仕事', '終わらせます'],
    expectedNonInteractiveWords: ['を', '。'],
    expectedReadings: {
      '今日中に': 'きょうじゅうに',
      '仕事': 'しごと',
      '終わらせます': 'おわらせます'
    }
  },
  {
    name: 'Test 4 — Polysemous 間: 時間 (じかん) vs 間に合いました (まにあいました)',
    sentence: '会議の時間に間に合いました。',
    expectedInteractiveWords: ['会議', '時間', '間に合いました'],
    expectedNonInteractiveWords: ['の', 'に', '。'],
    expectedReadings: {
      '会議': 'かいぎ',
      '時間': 'じかん',
      '間に合いました': 'まニアいました'.replace('ニア', 'にあ')
    }
  },
  {
    name: 'Test 5 — Contextual 生: 生徒 (せいと) vs 生きる (いきる) vs 生まれました (うまれました)',
    sentence: '生徒は日本で生まれました。',
    expectedInteractiveWords: ['生徒', '日本', '生まれました'],
    expectedNonInteractiveWords: ['は', 'で', '。'],
    expectedReadings: {
      '生徒': 'せいと',
      '日本': 'にほん',
      '生まれました': 'うまれました'
    }
  },
  {
    name: 'Test 6 — Pure Hiragana greeting (ありがとうございます。)',
    sentence: 'ありがとうございます。',
    expectedInteractiveWords: [],
    expectedNonInteractiveWords: ['ありがとう', 'ございます', '。']
  },
  {
    name: 'Test 7 — Mixed Kanji and Hiragana (私は日本語を勉強しています。)',
    sentence: '私は日本語を勉強しています。',
    expectedInteractiveWords: ['私', '日本語', '勉強'],
    expectedNonInteractiveWords: ['は', 'を', 'しています', '。']
  },
  {
    name: 'Test 8 — Verb with Okurigana (本を食べる。)',
    sentence: '本を食べる。',
    expectedInteractiveWords: ['本', '食べる'],
    expectedNonInteractiveWords: ['を', '。'],
    expectedReadings: {
      '食べる': 'たべる'
    },
    expectedRubyParts: {
      '食べる': '<ruby>食<rt>た</rt></ruby>べる'
    }
  },
  {
    name: 'Test 9 — Featured Lesson sentence (漢字を毎日暗記しています。)',
    sentence: '漢字を毎日暗記しています。',
    expectedInteractiveWords: ['漢字', '毎日', '暗記'],
    expectedNonInteractiveWords: ['を', 'しています', '。']
  },
  {
    name: 'Test 10 — Visa renewal sentence with Katakana and grammar',
    sentence: 'ビザの更新手続きをしなければなりません。',
    expectedInteractiveWords: ['更新', '手続き'],
    expectedNonInteractiveWords: ['ビザ', 'の', 'を', 'しなければ', 'なりません', '。'],
    expectedReadings: {
      '更新': 'こうしん',
      '手続き': 'てつづき'
    },
    expectedRubyParts: {
      '手続き': '<ruby>手続<rt>てつづ</rt></ruby>き'
    }
  }
];

let totalFailed = 0;

console.log('=====================================================');
console.log('RUNNING REGRESSION TEST SUITE FOR GLOBAL FURIGANA & INTERACTIVITY');
console.log('=====================================================\n');

for (const tc of testCases) {
  console.log(`RUNNING: ${tc.name}`);
  console.log(`Sentence: "${tc.sentence}"`);

  const tokens = tokenizeJapaneseSentence(tc.sentence, mockVocab, mockKanji);
  const interactiveTokens = tokens.filter(t => !t.isPunctuation && hasKanji(t.surface));
  const nonInteractiveTokens = tokens.filter(t => t.isPunctuation || !hasKanji(t.surface));

  const interactiveSurfaces = interactiveTokens.map(t => t.surface);
  const nonInteractiveSurfaces = nonInteractiveTokens.map(t => t.surface);

  console.log(`  Tokens: [${tokens.map(t => `${t.surface}(${t.reading})`).join(' | ')}]`);
  console.log(`  Interactive (Kanji-only): [${interactiveSurfaces.join(', ')}]`);
  console.log(`  Non-interactive (Kana/Punct): [${nonInteractiveSurfaces.join(', ')}]`);

  let testPassed = true;

  // 1. Strict Kanji-Only interactive verification
  for (const t of interactiveTokens) {
    if (!hasKanji(t.surface)) {
      console.error(`  [FAIL] Token "${t.surface}" is interactive but contains NO Kanji!`);
      testPassed = false;
      totalFailed++;
    }
  }

  // 2. Strict Non-interactive verification: no Kanji token should be non-interactive
  for (const t of nonInteractiveTokens) {
    if (!t.isPunctuation && hasKanji(t.surface)) {
      console.error(`  [FAIL] Token "${t.surface}" contains Kanji but is non-interactive!`);
      testPassed = false;
      totalFailed++;
    }
  }

  // 3. Expected interactive match
  for (const exp of tc.expectedInteractiveWords) {
    if (!interactiveSurfaces.includes(exp)) {
      console.error(`  [FAIL] Expected interactive word "${exp}" not found in interactive tokens!`);
      testPassed = false;
      totalFailed++;
    }
  }

  // 4. Expected non-interactive match (e.g. ビザ, しなければ, なりません)
  for (const exp of tc.expectedNonInteractiveWords) {
    if (interactiveSurfaces.includes(exp)) {
      console.error(`  [FAIL] Kana-only word "${exp}" was marked INTERACTIVE!`);
      testPassed = false;
      totalFailed++;
    }
  }

  // 5. Expected readings verification (e.g. 間 -> あいだ, NOT かん; 降りました -> ふりました, NOT こう)
  if (tc.expectedReadings) {
    for (const [surf, expectedRead] of Object.entries(tc.expectedReadings)) {
      const match = tokens.find(t => t.surface === surf);
      if (!match) {
        console.error(`  [FAIL] Expected token "${surf}" not found for reading check!`);
        testPassed = false;
        totalFailed++;
      } else if (match.reading !== expectedRead) {
        console.error(`  [FAIL] Token "${surf}" reading mismatch: expected "${expectedRead}", got "${match.reading}"!`);
        testPassed = false;
        totalFailed++;
      } else {
        console.log(`  [PASS] Token "${surf}" reading verified: "${match.reading}"`);
      }
    }
  }

  // 6. Expected ruby parts & HTML verification (e.g. <ruby>降<rt>ふ</rt></ruby>りました)
  if (tc.expectedRubyParts) {
    for (const [surf, expectedHtml] of Object.entries(tc.expectedRubyParts)) {
      const match = tokens.find(t => t.surface === surf);
      if (!match) {
        console.error(`  [FAIL] Expected token "${surf}" not found for ruby check!`);
        testPassed = false;
        totalFailed++;
      } else if (match.rubyHtml !== expectedHtml) {
        console.error(`  [FAIL] Token "${surf}" ruby mismatch: expected "${expectedHtml}", got "${match.rubyHtml}"!`);
        testPassed = false;
        totalFailed++;
      } else {
        console.log(`  [PASS] Token "${surf}" ruby verified: "${match.rubyHtml}"`);
      }
    }
  }

  if (testPassed) {
    console.log(`  >>> PASSED\n`);
  } else {
    console.log(`  >>> FAILED\n`);
  }
}

// 7. Furigana ON/OFF stripping test
console.log('RUNNING: Furigana ON/OFF Stripping Verification');
const sampleAnnotated = '寝ている<ruby>間<rt>あいだ</rt></ruby>に<ruby>雨<rt>あめ</rt></ruby>が<ruby>降<rt>ふ</rt></ruby>りました。';
const cleanStripped = stripFurigana(sampleAnnotated);
if (cleanStripped === '寝ている間に雨が降りました。') {
  console.log('  [PASS] stripFurigana correctly removed ruby tags to pure Japanese text.');
} else {
  console.error(`  [FAIL] stripFurigana failed: "${cleanStripped}"`);
  totalFailed++;
}

console.log('=====================================================');
if (totalFailed === 0) {
  console.log('ALL REGRESSION TESTS PASSED (0 failures)!');
  console.log('=====================================================\n');
  process.exit(0);
} else {
  console.error(`TEST SUITE FAILED with ${totalFailed} failure(s)!`);
  console.log('=====================================================\n');
  process.exit(1);
}
