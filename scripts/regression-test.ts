import { tokenizeJapaneseSentence } from '../src/utils/japaneseTokenizer';
import { hasKanji, alignRubyParts } from '../src/utils/furiganaRenderer';

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
];

interface TestCase {
  name: string;
  sentence: string;
  expectedInteractiveWords: string[];
  expectedNonInteractiveWords: string[];
}

const testCases: TestCase[] = [
  {
    name: 'Test A — Pure Hiragana greeting',
    sentence: 'ありがとうございます。',
    expectedInteractiveWords: [],
    expectedNonInteractiveWords: ['ありがとう', 'ございます', '。']
  },
  {
    name: 'Test B — Mixed Kanji and Hiragana',
    sentence: '私は日本語を勉強しています。',
    expectedInteractiveWords: ['私', '日本語', '勉強'],
    expectedNonInteractiveWords: ['は', 'を', 'しています', '。']
  },
  {
    name: 'Test C — Verb with Okurigana',
    sentence: '本を食べる。',
    expectedInteractiveWords: ['本', '食べる'],
    expectedNonInteractiveWords: ['を', '。']
  },
  {
    name: 'Test D — Featured Lesson sentence',
    sentence: '漢字を毎日暗記しています。',
    expectedInteractiveWords: ['漢字', '毎日', '暗記'],
    expectedNonInteractiveWords: ['を', 'しています', '。']
  },
  {
    name: 'Test E — Visa renewal sentence with Katakana and grammar',
    sentence: 'ビザの更新手続きをしなければなりません。',
    expectedInteractiveWords: ['更新', '手続き'],
    expectedNonInteractiveWords: ['ビザ', 'の', 'を', 'しなければ', 'なりません', '。']
  }
];

let totalFailed = 0;

console.log('=====================================================');
console.log('RUNNING REGRESSION TEST SUITE FOR KANJI INTERACTIVITY');
console.log('=====================================================\n');

for (const tc of testCases) {
  console.log(`RUNNING: ${tc.name}`);
  console.log(`Sentence: "${tc.sentence}"`);

  const tokens = tokenizeJapaneseSentence(tc.sentence, mockVocab, mockKanji);
  const interactiveTokens = tokens.filter(t => !t.isPunctuation && hasKanji(t.surface));
  const nonInteractiveTokens = tokens.filter(t => t.isPunctuation || !hasKanji(t.surface));

  const interactiveSurfaces = interactiveTokens.map(t => t.surface);
  const nonInteractiveSurfaces = nonInteractiveTokens.map(t => t.surface);

  console.log(`  Tokens: [${tokens.map(t => t.surface).join(' | ')}]`);
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

  // 2. Strict Non-interactive verification: no Kanji token should be in non-interactive (unless punctuation)
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

  // 5. Furigana alignment verification: Furigana ruby must ONLY be attached to Kanji characters
  for (const t of tokens) {
    if (t.rubyParts) {
      for (const part of t.rubyParts) {
        if (part.kanji && !hasKanji(part.kanji)) {
          console.error(`  [FAIL] Ruby chunk has non-Kanji "${part.kanji}" with reading "${part.ruby}"!`);
          testPassed = false;
          totalFailed++;
        }
      }
    }
  }

  // 6. Special check for Test E: 手続き must align <ruby>手続<rt>てつづ</rt></ruby>き
  if (tc.name.includes('Test E')) {
    const tezuduki = tokens.find(t => t.surface === '手続き');
    if (!tezuduki) {
      console.error(`  [FAIL] Token '手続き' not found!`);
      testPassed = false;
      totalFailed++;
    } else {
      const parts = tezuduki.rubyParts;
      const kanjiPart = parts.find(p => p.kanji);
      const textPart = parts.find(p => p.text);
      if (!kanjiPart || kanjiPart.kanji !== '手続' || kanjiPart.ruby !== 'てつづ' || !textPart || textPart.text !== 'き') {
        console.error(`  [FAIL] '手続き' ruby alignment incorrect: ${JSON.stringify(parts)}`);
        testPassed = false;
        totalFailed++;
      } else {
        console.log(`  [PASS] '手続き' correctly aligned: <ruby>手続<rt>てつづ</rt></ruby>き`);
      }
    }
  }

  if (testPassed) {
    console.log(`  >>> PASSED\n`);
  } else {
    console.log(`  >>> FAILED\n`);
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
