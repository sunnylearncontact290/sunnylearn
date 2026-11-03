// @ts-ignore
import TinySegmenter from 'tiny-segmenter';
import { VocabularyItem, KanjiItem, JLPTLevel } from '../types';

export interface TokenKanjiInfo {
  kanji: string;
  onyomi: string;
  kunyomi: string;
  mongolian: string;
  strokeCount?: number;
  jlptLevel: JLPTLevel;
  exampleWords?: Array<{ word: string; reading: string; mongolian: string }>;
}

export interface DetailedWordInfo {
  surface: string;
  word: string;
  reading: string;
  mongolian: string;
  partOfSpeech: string;
  jlptLevel: JLPTLevel;
  explanation?: string;
  exampleSentence?: string;
  exampleReading?: string;
  exampleMongolian?: string;
  isPunctuation?: boolean;
  isParticle?: boolean;
  kanjiList: TokenKanjiInfo[];
  rawItem?: VocabularyItem;
}

// Built-in dictionary of common particles, pronouns, auxiliaries, and affixes
const COMMON_GRAMMAR_MAP: Record<string, { reading: string; mongolian: string; partOfSpeech: string; jlptLevel: JLPTLevel }> = {
  // Particles
  'は': { reading: 'は (わ)', mongolian: 'Сэдэв заах нөхцөл (бол, болбол)', partOfSpeech: 'Нөхцөл (助詞)', jlptLevel: 'N5' },
  'が': { reading: 'が', mongolian: 'Үйлийн эзэн, субъект заах нөхцөл', partOfSpeech: 'Нөхцөл (助詞)', jlptLevel: 'N5' },
  'を': { reading: 'を (お)', mongolian: 'Заах тийн ялгалын нөхцөл (юуг, хэнийг)', partOfSpeech: 'Нөхцөл (助詞)', jlptLevel: 'N5' },
  'に': { reading: 'に', mongolian: 'Цаг хугацаа, чиглэл, байрлал заах (-д, -т, руу)', partOfSpeech: 'Нөхцөл (助詞)', jlptLevel: 'N5' },
  'で': { reading: 'で', mongolian: 'Үйл явдал болох газар, арга хэрэгсэл (-аар, -ээр, -д, -т)', partOfSpeech: 'Нөхцөл (助詞)', jlptLevel: 'N5' },
  'へ': { reading: 'へ (え)', mongolian: 'Чиглэл заах нөхцөл (-руу, -рүү)', partOfSpeech: 'Нөхцөл (助詞)', jlptLevel: 'N5' },
  'と': { reading: 'と', mongolian: 'Хамт заах, холбох (мөн, хамт, гэж)', partOfSpeech: 'Нөхцөл (助詞)', jlptLevel: 'N5' },
  'も': { reading: 'も', mongolian: 'Бас, ч гэсэн заах нөхцөл', partOfSpeech: 'Нөхцөл (助詞)', jlptLevel: 'N5' },
  'から': { reading: 'から', mongolian: '-аас, -ээс (эхлэл, шалтгаан)', partOfSpeech: 'Нөхцөл (助詞)', jlptLevel: 'N5' },
  'まで': { reading: 'まで', mongolian: 'Хүртэл (хязгаар, төгсгөл)', partOfSpeech: 'Нөхцөл (助詞)', jlptLevel: 'N5' },
  'より': { reading: 'より', mongolian: '-аас илүү (харьцуулалт)', partOfSpeech: 'Нөхцөл (助詞)', jlptLevel: 'N5' },
  'の': { reading: 'の', mongolian: 'Хамаатуулах тийн ялгал (-ийн, -ын, -ний, -нийх)', partOfSpeech: 'Нөхцөл (助詞)', jlptLevel: 'N5' },
  'ね': { reading: 'ね', mongolian: 'Тийм ээ? (лавлах, зөвшөөрөл хүсэх сул үг)', partOfSpeech: 'Төгсгөлийн сул үг (終助詞)', jlptLevel: 'N5' },
  'よ': { reading: 'よ', mongolian: 'Шүү, мэдээлэх, анхааруулах сул үг', partOfSpeech: 'Төгсгөлийн сул үг (終助詞)', jlptLevel: 'N5' },
  'か': { reading: 'か', mongolian: 'Асуух сул үг (уу? үү? юу?)', partOfSpeech: 'Төгсгөлийн сул үг (終助詞)', jlptLevel: 'N5' },
  'やら': { reading: 'やら', mongolian: 'Эсвэл, гэх мэт', partOfSpeech: 'Нөхцөл (助詞)', jlptLevel: 'N3' },
  'など': { reading: 'など', mongolian: 'Гэх мэт, зэрэг', partOfSpeech: 'Дагавар үг', jlptLevel: 'N4' },

  // Pronouns
  '私': { reading: 'わたし', mongolian: 'Би (би өөрөө)', partOfSpeech: 'Төлөөний үг (代名詞)', jlptLevel: 'N5' },
  'わたし': { reading: 'わたし', mongolian: 'Би (би өөрөө)', partOfSpeech: 'Төлөөний үг (代名詞)', jlptLevel: 'N5' },
  '僕': { reading: 'ぼく', mongolian: 'Би (эрэгтэй)', partOfSpeech: 'Төлөөний үг (代名詞)', jlptLevel: 'N5' },
  'ぼく': { reading: 'ぼく', mongolian: 'Би (эрэгтэй)', partOfSpeech: 'Төлөөний үг (代名詞)', jlptLevel: 'N5' },
  '俺': { reading: 'おれ', mongolian: 'Би (эрэгтэй, энгийн яриа)', partOfSpeech: 'Төлөөний үг (代名詞)', jlptLevel: 'N4' },
  'あなた': { reading: 'あなた', mongolian: 'Та, чи', partOfSpeech: 'Төлөөний үг (代名詞)', jlptLevel: 'N5' },
  '彼': { reading: 'かれ', mongolian: 'Тэр (эрэгтэй), найз залуу', partOfSpeech: 'Төлөөний үг (代名詞)', jlptLevel: 'N5' },
  '彼女': { reading: 'かのじょ', mongolian: 'Тэр (эмэгтэй), найз охин', partOfSpeech: 'Төлөөний үг (代名詞)', jlptLevel: 'N5' },
  'これ': { reading: 'これ', mongolian: 'Энэ (өөрт ойр зүйл)', partOfSpeech: 'Заах төлөөний үг', jlptLevel: 'N5' },
  'それ': { reading: 'それ', mongolian: 'Тэр (сонсогчид ойр зүйл)', partOfSpeech: 'Заах төлөөний үг', jlptLevel: 'N5' },
  'あれ': { reading: 'あれ', mongolian: 'Тээр тэр (хоёулангаас хол зүйл)', partOfSpeech: 'Заах төлөөний үг', jlptLevel: 'N5' },
  'どれ': { reading: 'どれ', mongolian: 'Аль нь?', partOfSpeech: 'Асуух төлөөний үг', jlptLevel: 'N5' },
  'ここ': { reading: 'ここ', mongolian: 'Энд (байршил)', partOfSpeech: 'Заах төлөөний үг', jlptLevel: 'N5' },
  'そこ': { reading: 'そこ', mongolian: 'Тэнд (байршил)', partOfSpeech: 'Заах төлөөний үг', jlptLevel: 'N5' },
  'あそこ': { reading: 'あそこ', mongolian: 'Тээр тэнд (байршил)', partOfSpeech: 'Заах төлөөний үг', jlptLevel: 'N5' },
  'どこ': { reading: 'どこ', mongolian: 'Хаана?', partOfSpeech: 'Асуух төлөөний үг', jlptLevel: 'N5' },
  'だれ': { reading: 'だれ', mongolian: 'Хэн?', partOfSpeech: 'Асуух төлөөний үг', jlptLevel: 'N5' },
  '誰': { reading: 'だれ', mongolian: 'Хэн?', partOfSpeech: 'Асуух төлөөний үг', jlptLevel: 'N5' },
  '何': { reading: 'なに / なん', mongolian: 'Юу?', partOfSpeech: 'Асуух төлөөний үг', jlptLevel: 'N5' },
  'いつ': { reading: 'いつ', mongolian: 'Хэзээ?', partOfSpeech: 'Асуух төлөөний үг', jlptLevel: 'N5' },
  'どう': { reading: 'どう', mongolian: 'Яаж? Ямар?', partOfSpeech: 'Асуух төлөөний үг', jlptLevel: 'N5' },
  'どんな': { reading: 'どんな', mongolian: 'Ямар төрлийн?', partOfSpeech: 'Төлөөний үг', jlptLevel: 'N5' },

  // Common Verbs / Auxiliaries
  'です': { reading: 'です', mongolian: 'Мөн, байна (эелдэг төгсгөл)', partOfSpeech: 'Туслах үйл үг (助動詞)', jlptLevel: 'N5' },
  'だ': { reading: 'だ', mongolian: 'Мөн, байна (энгийн төгсгөл)', partOfSpeech: 'Туслах үйл үг (助動詞)', jlptLevel: 'N5' },
  'でした': { reading: 'でした', mongolian: 'Байсан (эелдэг өнгөрсөн цаг)', partOfSpeech: 'Туслах үйл үг', jlptLevel: 'N5' },
  'だった': { reading: 'だった', mongolian: 'Байсан (энгийн өнгөрсөн цаг)', partOfSpeech: 'Туслах үйл үг', jlptLevel: 'N5' },
  'ます': { reading: 'ます', mongolian: 'Үйлийн эелдэг одоо/ирээдүй цагийн төгсгөл', partOfSpeech: 'Туслах үйл үг', jlptLevel: 'N5' },
  'ました': { reading: 'ました', mongolian: 'Үйлийн эелдэг өнгөрсөн цагийн төгсгөл', partOfSpeech: 'Туслах үйл үг', jlptLevel: 'N5' },
  'ません': { reading: 'ません', mongolian: 'Үйлийн эелдэг үгүйсгэх төгсгөл (-гүй, хийхгүй)', partOfSpeech: 'Туслах үйл үг', jlptLevel: 'N5' },
  'ませんでした': { reading: 'ませんでした', mongolian: 'Үйлийн эелдэг өнгөрсөн үгүйсгэх төгсгөл (-гүй байсан)', partOfSpeech: 'Туслах үйл үг', jlptLevel: 'N5' },
  'ない': { reading: 'ない', mongolian: 'Үгүй, байхгүй, хийхгүй (үгүйсгэл)', partOfSpeech: 'Туслах үйл үг / Тэмдэг нэр', jlptLevel: 'N5' },
  'たい': { reading: 'たい', mongolian: '-маар байна, хүсэх төгсгөл', partOfSpeech: 'Туслах үйл үг', jlptLevel: 'N5' },
  'たくない': { reading: 'たくない', mongolian: '-мааргүй байна (хүсэл үгүйсгэх)', partOfSpeech: 'Туслах үйл үг', jlptLevel: 'N5' },
  'ください': { reading: 'ください', mongolian: '-аарай, -ээрэй, өгөөч (гуйлт)', partOfSpeech: 'Үйл үг (гуйх хэлбэр)', jlptLevel: 'N5' },
  'し': { reading: 'し', mongolian: 'Хийх (する-ийн холбох хэлбэр)', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  'して': { reading: 'して', mongolian: 'Хийгээд, хийж (する-ийн て хэлбэр)', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  'する': { reading: 'する', mongolian: 'Хийх (төлөөний үйл үг)', partOfSpeech: 'Үйл үг (3-р бүлэг)', jlptLevel: 'N5' },
  'いる': { reading: 'いる', mongolian: 'Байх (хүн, амьд биет)', partOfSpeech: 'Үйл үг (2-р бүлэг)', jlptLevel: 'N5' },
  'ある': { reading: 'ある', mongolian: 'Байх (эд зүйл, үзэгдэл)', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  'いく': { reading: 'いく', mongolian: 'Явах', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '行く': { reading: 'いく', mongolian: 'Явах', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  'くる': { reading: 'くる', mongolian: 'Ирэх', partOfSpeech: 'Үйл үг (3-р бүлэг)', jlptLevel: 'N5' },
  '来る': { reading: 'くる', mongolian: 'Ирэх', partOfSpeech: 'Үйл үг (3-р бүлэг)', jlptLevel: 'N5' },

  // Polite Prefixes
  'ご': { reading: 'ご', mongolian: 'Хүндэтгэлийн угтвар (эсрэг хүнд зориулсан үйл болон ханз үгэнд залгана)', partOfSpeech: 'Хүндэтгэлийн угтвар (接頭辞)', jlptLevel: 'N4' },
  'お': { reading: 'お', mongolian: 'Хүндэтгэлийн угтвар (эелдэг, цэвэр ярианы угтвар)', partOfSpeech: 'Хүндэтгэлийн угтвар (接頭辞)', jlptLevel: 'N5' }
};

const PUNCTUATION_REGEX = /^[。、！？!?…・「」『』（）()[\]【】\s\-_:;]+$/;
const KANJI_REGEX = /[\u4E00-\u9FFF々仝〆〇ヶ\u3400-\u4DBF]/g;

let segmenterInstance: any = null;
function getSegmenter() {
  if (!segmenterInstance) {
    segmenterInstance = new (TinySegmenter as any)();
  }
  return segmenterInstance;
}

/**
 * Strips ruby tags and furigana brackets while preserving clean Japanese
 */
export function cleanSentenceForTokenization(sentence: string): string {
  if (!sentence) return '';
  let s = sentence;
  // Replace <ruby>X<rt>Y</rt></ruby> with X
  s = s.replace(/<ruby[^>]*>([\s\S]*?)<rt[^>]*>[\s\S]*?<\/rt>[\s\S]*?<\/ruby>/gi, '$1');
  s = s.replace(/<[^>]+>/g, '');
  // Remove bracket furigana: 漢字【ふりがな】 or 漢字(ふりがな) -> 漢字
  s = s.replace(/([\u4E00-\u9FFF々仝〆〇ヶ\u3400-\u4DBF]+[\u3041-\u3096]*)\s*[（\(\[【]\s*([ぁ-んァ-ヶー・\.\-]+)\s*[）\)\]】]/gu, '$1');
  return s.trim();
}

/**
 * Tokenizes a Japanese sentence into morphological words and enriches each word
 * with readings, Mongolian definitions, JLPT levels, and Kanji breakdowns.
 */
export function tokenizeJapaneseSentence(
  sentence: string,
  allVocab: VocabularyItem[] = [],
  allKanji: KanjiItem[] = []
): DetailedWordInfo[] {
  if (!sentence || !sentence.trim()) return [];

  const clean = cleanSentenceForTokenization(sentence);
  const segmenter = getSegmenter();
  const rawSegments: string[] = segmenter.segment(clean);

  // Group compound words like "ご" + "案内" + "し" + "ます" when helpful,
  // or preserve each segment as distinct clickable token
  const result: DetailedWordInfo[] = [];

  for (let i = 0; i < rawSegments.length; i++) {
    const rawWord = rawSegments[i];
    if (!rawWord || !rawWord.trim()) continue;

    const isPunct = PUNCTUATION_REGEX.test(rawWord);
    if (isPunct) {
      result.push({
        surface: rawWord,
        word: rawWord,
        reading: rawWord,
        mongolian: '',
        partOfSpeech: 'Цэг таслал',
        jlptLevel: 'N5',
        isPunctuation: true,
        kanjiList: []
      });
      continue;
    }

    // Attempt to enrich with dictionary and database
    const enriched = lookupWordDetail(rawWord, allVocab, allKanji, rawSegments, i);
    result.push(enriched);
  }

  return result;
}

/**
 * Looks up word definition, part of speech, JLPT level, and Kanji details
 */
export function lookupWordDetail(
  surface: string,
  allVocab: VocabularyItem[] = [],
  allKanji: KanjiItem[] = [],
  _sentenceTokens?: string[],
  _currentIndex?: number
): DetailedWordInfo {
  const isParticleOrGrammar = surface in COMMON_GRAMMAR_MAP;
  const grammarInfo = COMMON_GRAMMAR_MAP[surface];

  // Specific single-character particles/affixes take priority over homophone vocab (e.g. ご = prefix, not number 5; し = auxiliary verb, not number 4)
  const isDedicatedGrammarToken = isParticleOrGrammar && ['ご', 'お', 'し', 'ます', 'ました', 'ません', 'でした', 'は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'の', 'ね', 'よ', 'か'].includes(surface);

  let vocabMatch: VocabularyItem | undefined;

  if (!isDedicatedGrammarToken) {
    // 1. Check exact match in SunnyLearn vocabulary database
    vocabMatch = allVocab.find(v => v.japanese === surface);

    // 2. If not matched, try matching by stripping polite prefixes (お/ご) or checking if base verb matches
    if (!vocabMatch) {
      if (surface.startsWith('お') || surface.startsWith('ご')) {
        const stripped = surface.slice(1);
        vocabMatch = allVocab.find(v => v.japanese === stripped);
      }
    }

    // 3. If still not matched, check if surface is a verb stem (e.g. 案内し -> 案内する, 食べ -> 食べる, 買い -> 買う)
    if (!vocabMatch) {
      const verbCandidates = [
        surface + 'る',
        surface + 'する',
        surface.replace(/し$/, 'する'),
        surface.replace(/き$/, 'く'),
        surface.replace(/ぎ$/, 'ぐ'),
        surface.replace(/ち$/, 'つ'),
        surface.replace(/み$/, 'む'),
        surface.replace(/び$/, 'ぶ'),
        surface.replace(/り$/, 'る'),
        surface.replace(/い$/, 'う')
      ];
      for (const cand of verbCandidates) {
        const found = allVocab.find(v => v.japanese === cand);
        if (found) {
          vocabMatch = found;
          break;
        }
      }
    }

    // 4. If still not matched, check by reading
    if (!vocabMatch) {
      vocabMatch = allVocab.find(v => v.reading === surface);
    }
  }

  // 5. Extract Kanji characters and build Kanji breakdown
  const kanjiChars = Array.from(new Set(surface.match(KANJI_REGEX) || []));
  const kanjiList: TokenKanjiInfo[] = kanjiChars.map(kChar => {
    const kFound = allKanji.find(k => k.kanji === kChar);
    if (kFound) {
      return {
        kanji: kFound.kanji,
        onyomi: kFound.onyomi,
        kunyomi: kFound.kunyomi,
        mongolian: kFound.mongolian,
        jlptLevel: kFound.jlptLevel,
        exampleWords: kFound.exampleWords
      };
    }
    // Fallback if not found in db.kanji
    return {
      kanji: kChar,
      onyomi: '—',
      kunyomi: '—',
      mongolian: 'Ханз үсэг',
      jlptLevel: 'N5'
    };
  });

  // Determine primary properties
  let word = surface;
  let reading = surface;
  let mongolian = '';
  let partOfSpeech = 'Япон үг';
  let jlptLevel: JLPTLevel = 'N5';
  let explanation: string | undefined;

  if (isDedicatedGrammarToken && grammarInfo) {
    reading = grammarInfo.reading;
    mongolian = grammarInfo.mongolian;
    partOfSpeech = grammarInfo.partOfSpeech;
    jlptLevel = grammarInfo.jlptLevel;
  } else if (vocabMatch) {
    word = vocabMatch.japanese;
    reading = vocabMatch.reading;
    mongolian = vocabMatch.mongolian;
    partOfSpeech = vocabMatch.partOfSpeech || 'Үг';
    jlptLevel = vocabMatch.jlptLevel || 'N5';
    explanation = vocabMatch.explanation;
  } else if (grammarInfo) {
    reading = grammarInfo.reading;
    mongolian = grammarInfo.mongolian;
    partOfSpeech = grammarInfo.partOfSpeech;
    jlptLevel = grammarInfo.jlptLevel;
  } else {
    // If not in database or grammar map, infer sensible defaults
    if (/^[ぁ-ん]+$/.test(surface)) {
      reading = surface;
      mongolian = 'Холбох / сул үг';
      partOfSpeech = 'Хирагана үг';
    } else if (/^[ァ-ヶー]+$/.test(surface)) {
      reading = surface;
      mongolian = 'Катакана гадаад үг';
      partOfSpeech = 'Катакана нэр үг';
    } else if (kanjiList.length > 0) {
      // Synthesize meaning from constituent Kanji
      const kanjiMeanings = kanjiList
        .map(k => k.mongolian.split(/[,;]/)[0].trim())
        .filter(m => m && m !== 'Ханз үсэг');
      if (kanjiMeanings.length > 0) {
        mongolian = kanjiMeanings.join(' ') + ' (нийлмэл ханз үг)';
      } else {
        mongolian = 'Япон хэлний үг';
      }
      partOfSpeech = 'Ханз үг (Нэр үг)';
    } else {
      mongolian = 'Япон хэлний үг';
    }
  }

  return {
    surface,
    word,
    reading,
    mongolian,
    partOfSpeech,
    jlptLevel,
    explanation,
    isParticle: isParticleOrGrammar,
    kanjiList,
    rawItem: vocabMatch
  };
}
