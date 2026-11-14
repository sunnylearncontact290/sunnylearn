import { tokenizeJapaneseSentence } from '../src/utils/japaneseTokenizer';
import { hasKanji, alignRubyParts, stripFurigana } from '../src/utils/furiganaRenderer';
import {
  MONGOLIAN_ALPHABET,
  getPrimaryMongolianInitialLetter,
  getPrimaryMongolianMeaning,
  compareMongolianStrings
} from '../src/utils/mongolianUtils';
import { cleanJapaneseText } from '../src/services/speech';

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
  { id: '19', japanese: '生まれる', reading: 'うまれる', mongolian: 'Төрөх', jlptLevel: 'N4' },
  { id: '20', japanese: '飛行機', reading: 'ひこうき', mongolian: 'Онгоц', jlptLevel: 'N5' },
  { id: '21', japanese: '日本', reading: 'にほん', mongolian: 'Япон', jlptLevel: 'N5' },
  { id: '22', japanese: '行く', reading: 'いく', mongolian: 'Явах', jlptLevel: 'N5' },
  { id: '23', japanese: '帰る', reading: 'かえる', mongolian: 'Буцах, харих', jlptLevel: 'N5' }
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
  forbiddenReadings?: Array<{ surface: string; forbidden: string }>;
  expectedFullRubyHtml?: string;
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
    },
    forbiddenReadings: [
      { surface: '降りました', forbidden: 'こう' },
      { surface: '降りました', forbidden: 'こうりました' }
    ],
    expectedFullRubyHtml: '<ruby>雨<rt>あめ</rt></ruby>が<ruby>降<rt>ふ</rt></ruby>りました。'
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
  },
  {
    name: 'Test 11 — Word-level Counter Compound (三人います。)',
    sentence: '三人います。',
    expectedInteractiveWords: ['三人'],
    expectedNonInteractiveWords: ['います', '。'],
    expectedReadings: {
      '三人': 'さんにん',
      'います': 'います'
    },
    expectedRubyParts: {
      '三人': '<ruby>三人<rt>さんにん</rt></ruby>'
    }
  },
  {
    name: 'Test 12 — Potential Verb Okurigana Separation (昨日あまり寝られなかったの？)',
    sentence: '昨日あまり寝られなかったの？',
    expectedInteractiveWords: ['昨日', '寝られなかった'],
    expectedNonInteractiveWords: ['あまり', 'の', '？'],
    expectedReadings: {
      '昨日': 'きのう',
      '寝られなかった': 'ねられなかった'
    },
    expectedRubyParts: {
      '昨日': '<ruby>昨日<rt>きのう</rt></ruby>',
      '寝られなかった': '<ruby>寝<rt>ね</rt></ruby>られなかった'
    }
  },
  {
    name: 'Test 13 — Conversational Compound Word (大丈夫？)',
    sentence: '大丈夫？',
    expectedInteractiveWords: ['大丈夫'],
    expectedNonInteractiveWords: ['？'],
    expectedReadings: {
      '大丈夫': 'だいじょうぶ'
    },
    expectedRubyParts: {
      '大丈夫': '<ruby>大丈夫<rt>だいじょうぶ</rt></ruby>'
    }
  },
  {
    name: 'Test 14 — Destination & Motion Verb (明日は学校に行きます。)',
    sentence: '明日は学校に行きます。',
    expectedInteractiveWords: ['明日', '学校', '行きます'],
    expectedNonInteractiveWords: ['は', 'に', '。'],
    expectedReadings: {
      '明日': 'あした',
      '学校': 'がっこう',
      '行きます': 'いきます'
    },
    expectedRubyParts: {
      '明日': '<ruby>明日<rt>あした</rt></ruby>',
      '学校': '<ruby>学校<rt>がっこう</rt></ruby>',
      '行きます': '<ruby>行<rt>い</rt></ruby>きます'
    }
  },
  {
    name: 'Test 15 — Bug from screenshot (ご飯の後で勉強します。)',
    sentence: 'ご飯の後で勉強します。',
    expectedInteractiveWords: ['ご飯', '後', '勉強'],
    expectedNonInteractiveWords: ['の', 'で', 'します', '。'],
    expectedReadings: {
      'ご飯': 'ごはん',
      '後': 'あと',
      '勉強': 'べんきょう'
    },
    expectedRubyParts: {
      'ご飯': '<ruby>ご飯<rt>ごはん</rt></ruby>',
      '後': '<ruby>後<rt>あと</rt></ruby>',
      '勉強': '<ruby>勉強<rt>べんきょう</rt></ruby>'
    },
    forbiddenReadings: [
      { surface: '勉強', forbidden: 'つとめる' },
      { surface: '勉強', forbidden: 'つよい' }
    ],
    expectedFullRubyHtml: '<ruby>ご飯<rt>ごはん</rt></ruby>の<ruby>後<rt>あと</rt></ruby>で<ruby>勉強<rt>べんきょう</rt></ruby>します。'
  },
  {
    name: 'Test 16 — Friend and Play verb (明日は友達と遊びます。)',
    sentence: '明日は友達と遊びます。',
    expectedInteractiveWords: ['明日', '友達', '遊びます'],
    expectedNonInteractiveWords: ['は', 'と', '。'],
    expectedReadings: {
      '明日': 'あした',
      '友達': 'ともだち',
      '遊びます': 'あそびます'
    },
    expectedRubyParts: {
      '明日': '<ruby>明日<rt>あした</rt></ruby>',
      '友達': '<ruby>友達<rt>ともだち</rt></ruby>',
      '遊びます': '<ruby>遊<rt>あそ</rt></ruby>びます'
    },
    expectedFullRubyHtml: '<ruby>明日<rt>あした</rt></ruby>は<ruby>友達<rt>ともだち</rt></ruby>と<ruby>遊<rt>あそ</rt></ruby>びます。'
  },
  {
    name: 'Test 17 — Dictionary Example Sentence (飛行機で日本へ行きます。)',
    sentence: '飛行機で日本へ行きます。',
    expectedInteractiveWords: ['飛行機', '日本', '行きます'],
    expectedNonInteractiveWords: ['で', 'へ', '。'],
    expectedReadings: {
      '飛行機': 'ひこうき',
      '日本': 'にほん',
      '行きます': 'いきます'
    },
    expectedRubyParts: {
      '飛行機': '<ruby>飛行機<rt>ひこうき</rt></ruby>',
      '日本': '<ruby>日本<rt>にほん</rt></ruby>',
      '行きます': '<ruby>行<rt>い</rt></ruby>きます'
    },
    expectedFullRubyHtml: '<ruby>飛行機<rt>ひこうき</rt></ruby>で<ruby>日本<rt>にほん</rt></ruby>へ<ruby>行<rt>い</rt></ruby>きます。'
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

  // 7. Strictly enforce FORBIDDEN readings (e.g. 勉強 must NEVER contain つとめる or つよい; 降りました must NEVER contain こう)
  if (tc.forbiddenReadings) {
    for (const { surface: surf, forbidden } of tc.forbiddenReadings) {
      const match = tokens.find(t => t.surface === surf);
      if (match) {
        if (match.reading.includes(forbidden) || match.rubyHtml.includes(forbidden)) {
          console.error(`  [CRITICAL FAIL] Token "${surf}" contains FORBIDDEN reading "${forbidden}"! Reading: "${match.reading}", Ruby: "${match.rubyHtml}"`);
          testPassed = false;
          totalFailed++;
        } else {
          console.log(`  [PASS] Negative assertion verified: "${surf}" does NOT contain forbidden reading "${forbidden}".`);
        }
      }
    }
  }

  // 8. Expected full ruby HTML output verification
  if (tc.expectedFullRubyHtml) {
    const fullHtml = tokens.map(t => t.rubyHtml).join('');
    if (fullHtml !== tc.expectedFullRubyHtml) {
      console.error(`  [FAIL] Full sentence ruby HTML mismatch:\n    Expected: "${tc.expectedFullRubyHtml}"\n    Got:      "${fullHtml}"`);
      testPassed = false;
      totalFailed++;
    } else {
      console.log(`  [PASS] Full sentence ruby HTML verified: "${fullHtml}"`);
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

// 8. Conjugated base-form resolution verification
console.log('\nRUNNING: Base-form Deconjugation Verification');
const travelTokens = tokenizeJapaneseSentence('飛行機で日本へ行きます。', mockVocab, mockKanji);
const ikimasuToken = travelTokens.find(t => t.surface === '行きます');
if (ikimasuToken && ikimasuToken.word === '行く' && ikimasuToken.dictionaryReading === 'いく') {
  console.log('  [PASS] "行きます" resolves base dictionary word "行く" (いく) while keeping surface reading "いきます".');
} else {
  console.error('  [FAIL] "行きます" base resolution mismatch:', ikimasuToken);
  totalFailed++;
}

const kaeriTokens = tokenizeJapaneseSentence('家に帰りました。', mockVocab, mockKanji);
const kaeriToken = kaeriTokens.find(t => t.surface === '帰りました');
if (kaeriToken && kaeriToken.word === '帰る') {
  console.log('  [PASS] "帰りました" resolves base dictionary word "帰る".');
} else {
  console.error('  [FAIL] "帰りました" base resolution mismatch:', kaeriToken);
  totalFailed++;
}

const tabeteTokens = tokenizeJapaneseSentence('ご飯を食べて。', mockVocab, mockKanji);
const tabeteToken = tabeteTokens.find(t => t.surface === '食べて');
if (tabeteToken && tabeteToken.word === '食べる') {
  console.log('  [PASS] "食べて" resolves base dictionary word "食べる".');
} else {
  console.error('  [FAIL] "食べて" base resolution mismatch:', tabeteToken);
  totalFailed++;
}

// 9. Mongolian Cyrillic alphabet indexing & sorting verification
console.log('\nRUNNING: Mongolian Alphabet Indexing & Sorting Verification');
if (MONGOLIAN_ALPHABET.length !== 35 || !MONGOLIAN_ALPHABET.includes('Ө') || !MONGOLIAN_ALPHABET.includes('Ү') || !MONGOLIAN_ALPHABET.includes('Ё')) {
  console.error(`  [FAIL] MONGOLIAN_ALPHABET incomplete (length ${MONGOLIAN_ALPHABET.length}).`);
  totalFailed++;
} else {
  console.log('  [PASS] MONGOLIAN_ALPHABET contains all 35 Mongolian Cyrillic letters.');
}

const mnCases: Array<{ input: string; expectedLetter: string | null; expectedPrimary: string }> = [
  { input: '  Ажил хийх', expectedLetter: 'А', expectedPrimary: 'ажил хийх' },
  { input: '...-аас дээш', expectedLetter: 'А', expectedPrimary: 'аас дээш' },
  { input: 'хайр; дурлал', expectedLetter: 'Х', expectedPrimary: 'хайр' },
  { input: 'Өдөр бүр, өглөө', expectedLetter: 'Ө', expectedPrimary: 'өдөр бүр' },
  { input: 'үзэсгэлэнтэй', expectedLetter: 'Ү', expectedPrimary: 'үзэсгэлэнтэй' },
  { input: '10 минут', expectedLetter: null, expectedPrimary: '10 минут' }
];

for (const mc of mnCases) {
  const gotLetter = getPrimaryMongolianInitialLetter(mc.input);
  const gotPrimary = getPrimaryMongolianMeaning(mc.input);
  if (gotLetter !== mc.expectedLetter || gotPrimary !== mc.expectedPrimary) {
    console.error(`  [FAIL] Mongolian classification mismatch for "${mc.input}": got (${gotLetter}, "${gotPrimary}"), expected (${mc.expectedLetter}, "${mc.expectedPrimary}")`);
    totalFailed++;
  } else {
    console.log(`  [PASS] "${mc.input}" -> letter=${gotLetter}, primary="${gotPrimary}"`);
  }
}

if (compareMongolianStrings('орон', 'өрөө') < 0 && compareMongolianStrings('ус', 'үсэг') < 0) {
  console.log('  [PASS] Mongolian locale collation orders О < Ө and У < Ү correctly.');
} else {
  console.error('  [FAIL] Mongolian locale collation order incorrect.');
  totalFailed++;
}

// 10. Dictionary N5-N1 Furigana & Tokenization Edge Cases
console.log('\nRUNNING: Dictionary Example Sentence Furigana Edge Cases');
const edgeVocab: any[] = [
  ...mockVocab,
  { id: 'e1', japanese: '耳', reading: 'みみ', mongolian: 'Чих', jlptLevel: 'N5' },
  { id: 'e2', japanese: '痛い', reading: 'いたい', mongolian: 'Өвдөх', jlptLevel: 'N5' },
  { id: 'e3', japanese: '二人', reading: 'ふたり', mongolian: 'Хоёр хүн', jlptLevel: 'N5' },
  { id: 'e4', japanese: '意見', reading: 'いけん', mongolian: 'Санал бодол', jlptLevel: 'N4' },
  { id: 'e5', japanese: '一致', reading: 'いっち', mongolian: 'Тохирох, нэгдэх', jlptLevel: 'N2' },
  { id: 'e6', japanese: '黒い', reading: 'くろい', mongolian: 'Хар', jlptLevel: 'N5' },
  { id: 'e7', japanese: '車', reading: 'くるま', mongolian: 'Машин', jlptLevel: 'N5' },
  { id: 'e8', japanese: '暇', reading: 'ひま', mongolian: 'Чөлөөт зав', jlptLevel: 'N5' },
  { id: 'e9', japanese: '時', reading: 'とき', mongolian: 'Цаг үе', jlptLevel: 'N5' },
  { id: 'e10', japanese: '読む', reading: 'よむ', mongolian: 'Унших', jlptLevel: 'N5' },
  { id: 'e11', japanese: '毎年', reading: 'まいとし / まいねん', mongolian: 'Жил бүр', jlptLevel: 'N5' }
];
const edgeKanji: any[] = [
  ...mockKanji,
  { id: 'ek1', kanji: '痛', onyomi: 'ツウ', kunyomi: 'いた.い', mongolian: 'Өвдөх', jlptLevel: 'N4' },
  { id: 'ek2', kanji: '致', onyomi: 'チ', kunyomi: 'いた.す', mongolian: 'Хүргэх', jlptLevel: 'N2' },
  { id: 'ek3', kanji: '黒', onyomi: 'コク', kunyomi: 'くろ.い', mongolian: 'Хар', jlptLevel: 'N5' },
  { id: 'ek4', kanji: '車', onyomi: 'シャ', kunyomi: 'くるま', mongolian: 'Машин', jlptLevel: 'N5' },
  { id: 'ek5', kanji: '読', onyomi: 'ドク', kunyomi: 'よ.む', mongolian: 'Унших', jlptLevel: 'N5' }
];

const itaiTokens = tokenizeJapaneseSentence('耳が痛いです。', edgeVocab, edgeKanji, 'みみがいたいです。');
const itaiTok = itaiTokens.find(t => t.surface.includes('痛'));
if (!itaiTok || !itaiTok.reading.startsWith('いた') || itaiTok.rubyHtml !== '<ruby>痛<rt>いた</rt></ruby>い') {
  console.error('  [FAIL] "耳が痛いです。" token failed:', itaiTok);
  totalFailed++;
} else {
  console.log('  [PASS] "耳が痛いです。" -> "<ruby>痛<rt>いた</rt></ruby>い" + です');
}

const icchiTokens = tokenizeJapaneseSentence('二人の意見が一致しました。', edgeVocab, edgeKanji, 'ふたりのいけんがいっちしました。');
const icchiHtml = icchiTokens.map(t => t.rubyHtml).join('');
if (icchiHtml.includes('いっ致') || !icchiHtml.includes('<ruby>一致<rt>いっち</rt></ruby>')) {
  console.error('  [FAIL] "一致しました" corrupted base Kanji:', icchiHtml);
  totalFailed++;
} else {
  console.log(`  [PASS] "二人の意見が一致しました。" -> "${icchiHtml}"`);
}

const kuroTokens = tokenizeJapaneseSentence('黒い車です。', edgeVocab, edgeKanji, 'くろいくるまです。');
const kuroTok = kuroTokens.find(t => t.surface === '黒い');
const kurumaTok = kuroTokens.find(t => t.surface === '車');
if (!kuroTok || kuroTok.reading !== 'くろい' || !kurumaTok || kurumaTok.reading !== 'くるま') {
  console.error('  [FAIL] "黒い車です。" split/reading failed:', kuroTokens);
  totalFailed++;
} else {
  console.log('  [PASS] "黒い車です。" cleanly separated "黒い(くろい)" + "車(くるま)"');
}

const multiParts = alignRubyParts('毎年', 'まいとし / まいねん');
if (multiParts.length !== 1 || multiParts[0].ruby !== 'まいとし') {
  console.error('  [FAIL] alignRubyParts failed on multi-reading:', multiParts);
  totalFailed++;
} else {
  console.log('  [PASS] alignRubyParts resolved primary reading "まいとし" from "まいとし / まいねん".');
}

// 11. TTS Speech Text Cleaning Verification
console.log('\nRUNNING: Unified Speech Text Cleaning Verification');
const speechCases: Array<[string, string | undefined, string]> = [
  ['飛行機で日本へ行きます。', 'ひこうきでにほんへいきます。', '飛行機で日本へ行きます。'],
  ['<ruby>飛行機<rt>ひこうき</rt></ruby>で<ruby>日本<rt>にほん</rt></ruby>へ<ruby>行<rt>い</rt></ruby>きます。', undefined, '飛行機で日本へ行きます。'],
  ['安全【あんぜん】', undefined, 'あんぜん'],
  ['今日（きょう）はいい天気（てんき）だね。', undefined, '今日はいい天気だね。']
];
for (const [inp, read, exp] of speechCases) {
  const got = cleanJapaneseText(inp, read);
  if (got !== exp) {
    console.error(`  [FAIL] cleanJapaneseText("${inp}") expected "${exp}", got "${got}"`);
    totalFailed++;
  } else {
    console.log(`  [PASS] cleanJapaneseText("${inp}") -> "${got}"`);
  }
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
