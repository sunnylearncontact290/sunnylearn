// @ts-ignore
import TinySegmenter from 'tiny-segmenter';
import { VocabularyItem, KanjiItem, JLPTLevel } from '../types';
import { alignRubyParts, renderRubyHtml, hasKanji, RubyChunk } from './furiganaRenderer';
import {
  CONTEXT_LEXICON,
  VERB_STEM_KUNYOMI,
  disambiguateContextualKanji,
  deconjugateAndInferReading
} from './japaneseContextLexicon';

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
  containsKanji: boolean;
  kanjiList: TokenKanjiInfo[];
  rawItem?: VocabularyItem;
  rubyParts: RubyChunk[];
  rubyHtml: string;
}

// Built-in dictionary of common particles, pronouns, auxiliaries, conversational words, and affixes
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

  // Common Conversational Adverbs & Expressions (Pure Kana - Never Kanji!)
  'どうぞ': { reading: 'どうぞ', mongolian: 'Тэгнэ үү, зүгээр, тавтай морил', partOfSpeech: 'Дайвар үг (副詞)', jlptLevel: 'N5' },
  'どうも': { reading: 'どうも', mongolian: 'Маш их, ер нь, баярлалаа', partOfSpeech: 'Сул үг / Дайвар үг', jlptLevel: 'N5' },
  'ありがとう': { reading: 'ありがとう', mongolian: 'Баярлалаа', partOfSpeech: 'Мэндчилгээ', jlptLevel: 'N5' },
  'こんにちは': { reading: 'こんにちは', mongolian: 'Сайн байна уу (өдрийн мэнд)', partOfSpeech: 'Мэндчилгээ', jlptLevel: 'N5' },
  'こんばんは': { reading: 'こんばんは', mongolian: 'Оройн мэнд', partOfSpeech: 'Мэндчилгээ', jlptLevel: 'N5' },
  'すみません': { reading: 'すみません', mongolian: 'Уучлаарай, өршөөгөөрэй', partOfSpeech: 'Мэндчилгээ / Сул үг', jlptLevel: 'N5' },
  'ごめんなさい': { reading: 'ごめんなさい', mongolian: 'Уучлаарай', partOfSpeech: 'Мэндчилгээ', jlptLevel: 'N5' },
  'はい': { reading: 'はい', mongolian: 'Тийм, за', partOfSpeech: 'Зөвшөөрөх үг', jlptLevel: 'N5' },
  'いいえ': { reading: 'いいえ', mongolian: 'Үгүй, зүгээр ээ', partOfSpeech: 'Татгалзах үг', jlptLevel: 'N5' },
  'とても': { reading: 'とても', mongolian: 'Маш, тун', partOfSpeech: 'Дайвар үг', jlptLevel: 'N5' },
  'もっと': { reading: 'もっと', mongolian: 'Илүү, дахиад', partOfSpeech: 'Дайвар үг', jlptLevel: 'N5' },
  'たくさん': { reading: 'たくさん', mongolian: 'Олон, их', partOfSpeech: 'Дайвар үг', jlptLevel: 'N5' },
  'すこし': { reading: 'すこし', mongolian: 'Бага зэрэг, жаахан', partOfSpeech: 'Дайвар үг', jlptLevel: 'N5' },
  'ちょっと': { reading: 'ちょっと', mongolian: 'Жаахан, түр зуур', partOfSpeech: 'Дайвар үг', jlptLevel: 'N5' },

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
  '何': { reading: 'なに', mongolian: 'Юу?', partOfSpeech: 'Асуух төлөөний үг', jlptLevel: 'N5' },
  'いつ': { reading: 'いつ', mongolian: 'Хэзээ?', partOfSpeech: 'Асуух төлөөний үг', jlptLevel: 'N5' },
  'どう': { reading: 'どう', mongolian: 'Яаж? Ямар?', partOfSpeech: 'Асуух төлөөний үг', jlptLevel: 'N5' },
  'どんな': { reading: 'どんな', mongolian: 'Ямар төрлийн?', partOfSpeech: 'Төлөөний үг', jlptLevel: 'N5' },

  // Common Verbs, Inflections & Auxiliaries
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
  'しないで': { reading: 'しないで', mongolian: 'Битгий хий, хийхгүйгээр', partOfSpeech: 'Үйл үг (холбох хэлбэр)', jlptLevel: 'N5' },
  'しないでください': { reading: 'しないでください', mongolian: 'Битгий хийгээрэй (хориглох гуйлт)', partOfSpeech: 'Үйл үг (дүрэм)', jlptLevel: 'N5' },
  'して': { reading: 'して', mongolian: 'Хийгээд, хийж (する-ийн て хэлбэр)', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  'する': { reading: 'する', mongolian: 'Хийх (төлөөний үйл үг)', partOfSpeech: 'Үйл үг (3-р бүлэг)', jlptLevel: 'N5' },
  'します': { reading: 'します', mongolian: 'Хийнэ (эелдэг)', partOfSpeech: 'Үйл үг (3-р бүлэг)', jlptLevel: 'N5' },
  'しました': { reading: 'しました', mongolian: 'Хийсэн (эелдэг)', partOfSpeech: 'Үйл үг (3-р бүлэг)', jlptLevel: 'N5' },
  'しません': { reading: 'しません', mongolian: 'Хийхгүй (эелдэг)', partOfSpeech: 'Үйл үг (3-р бүлэг)', jlptLevel: 'N5' },
  'した': { reading: 'した', mongolian: 'Хийсэн (энгийн)', partOfSpeech: 'Үйл үг (3-р бүлэг)', jlptLevel: 'N5' },
  'しない': { reading: 'しない', mongolian: 'Хийхгүй (энгийн)', partOfSpeech: 'Үйл үг (3-р бүлэг)', jlptLevel: 'N5' },
  'している': { reading: 'している', mongolian: 'Хийж байгаа (энгийн)', partOfSpeech: 'Үйл үг (3-р бүлэг)', jlptLevel: 'N5' },
  'しています': { reading: 'しています', mongolian: 'Хийж байна (эелдэг)', partOfSpeech: 'Үйл үг (3-р бүлэг)', jlptLevel: 'N5' },
  'いる': { reading: 'いる', mongolian: 'Байх (хүн, амьд биет)', partOfSpeech: 'Үйл үг (2-р бүлэг)', jlptLevel: 'N5' },
  'ある': { reading: 'ある', mongolian: 'Байх (эд зүйл, үзэгдэл)', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },

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
  s = s.replace(/<ruby[^>]*>([\s\S]*?)<rt[^>]*>[\s\S]*?<\/rt>[\s\S]*?<\/ruby>/gi, '$1');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/([\u4E00-\u9FFF々仝〆〇ヶ\u3400-\u4DBF]+[\u3041-\u3096]*)\s*[（\(\[【]\s*([ぁ-んァ-ヶー・\.\-]+)\s*[）\)\]】]/gu, '$1');
  return s.trim();
}

/**
 * Re-groups morphological segments split by TinySegmenter to form complete, natural Japanese words:
 * - Kanji verb stems + inflections (e.g. 降 + り + ました -> 降りました, 寝 + て + いる -> 寝ている)
 * - Compound kanji words and expressions (e.g. 今日 + 中 -> 今日中, 間 + に + 合う -> 間に合う)
 */
function regroupTokens(rawSegments: string[]): string[] {
  // 1. Normalize segments: split counters from accidentally glued verb/kana stems (e.g. "三人い" -> "三人", "い")
  const normalized: string[] = [];
  for (const seg of rawSegments) {
    const counterKanaMatch = seg.match(/^([一二三四五六七八九十何]+[人つ日月年回本匹枚個着冊杯歳])([ぁ-んァ-ヶ]+)$/);
    if (counterKanaMatch) {
      normalized.push(counterKanaMatch[1]);
      normalized.push(counterKanaMatch[2]);
    } else {
      normalized.push(seg);
    }
  }

  const result: string[] = [];

  for (let i = 0; i < normalized.length; i++) {
    const cur = normalized[i];
    const n1 = normalized[i + 1];
    const n2 = normalized[i + 2];
    const n3 = normalized[i + 3];

    // Case: い + ます / ました (from separate verb or after counter)
    if (cur === 'い' && (n1 === 'ます' || n1 === 'ました')) {
      result.push('い' + n1);
      i++;
      continue;
    }
    if (cur === 'い' && n1 === 'まし' && n2 === 'た') {
      result.push('いました');
      i += 2;
      continue;
    }
    if (cur === 'い' && (n1 === 'る' || n1 === 'た' || n1 === 'ない')) {
      result.push('い' + n1);
      i++;
      continue;
    }

    // Case: 今 + 日中 -> 今日中, 今 + 日 -> 今日
    if (cur === '今' && n1 === '日中') {
      if (n2 === 'に') {
        result.push('今日中に');
        i += 2;
        continue;
      }
      result.push('今日中');
      i++;
      continue;
    }
    if (cur === '今' && n1 === '日') {
      if (n2 === '中') {
        if (n3 === 'に') {
          result.push('今日中に');
          i += 3;
          continue;
        }
        result.push('今日中');
        i += 2;
        continue;
      }
      result.push('今日');
      i++;
      continue;
    }

    // Case: 今日 + 中 (or 今日 + 中 + に) -> 今日中 / 今日中に
    if (cur === '今日' && n1 === '中') {
      if (n2 === 'に') {
        result.push('今日中に');
        i += 2;
        continue;
      }
      result.push('今日中');
      i++;
      continue;
    }

    // Case: 終わら + せ + ます -> 終わらせます
    if (cur === '終わら' && n1 === 'せ' && (n2 === 'ます' || n2 === 'る')) {
      result.push('終わらせ' + n2);
      i += 2;
      continue;
    }

    // Case: 一 + 週 + 間 / 一 + 週間 -> 一週間
    if (cur === '一' && n1 === '週間') {
      result.push('一週間');
      i++;
      continue;
    }
    if (cur === '一' && n1 === '週' && n2 === '間') {
      result.push('一週間');
      i += 2;
      continue;
    }

    // Case: 間 + に + 合う / 合います / 合いました / 合わない
    if (cur === '間' && n1 === 'に' && n2 === '合いました') {
      result.push('間に合いました');
      i += 2;
      continue;
    }
    if (cur === '間' && n1 === 'に' && n2 === '合います') {
      result.push('間に合います');
      i += 2;
      continue;
    }
    if (cur === '間' && n1 === 'に' && n2 === '合う') {
      result.push('間に合う');
      i += 2;
      continue;
    }
    if (cur === '間' && n1 === 'に' && n2 === '合い' && (n3 === 'ました' || (n3 === 'まし' && rawSegments[i + 4] === 'た'))) {
      result.push('間に合いました');
      i += (n3 === 'まし' ? 4 : 3);
      continue;
    }
    if (cur === '間' && n1 === 'に' && n2 === '合い' && (n3 === 'ます' || (n3 === 'ませ' && rawSegments[i + 4] === 'ん'))) {
      result.push(n3 === 'ます' ? '間に合います' : '間に合いません');
      i += (n3 === 'ませ' ? 4 : 3);
      continue;
    }
    if (cur === '間' && n1 === 'に' && n2 === '合わ' && n3 === 'ない') {
      result.push('間に合わない');
      i += 3;
      continue;
    }

    // Case: 間 + 違い -> 間違い, 間 + 違う -> 間違う, 間 + 違える -> 間違える
    if (cur === '間' && n1 === '違い') {
      result.push('間違い');
      i++;
      continue;
    }
    if (cur === '間' && n1 === '違う') {
      result.push('間違う');
      i++;
      continue;
    }
    if (cur === '間' && n1 === '違える') {
      result.push('間違える');
      i++;
      continue;
    }

    // Case: Kanji verb with complex inflections (e.g. 降 + り + ました -> 降りました)
    if (hasKanji(cur)) {
      // cur + り + ました -> 降りました / 走りました / 終わりました
      if (n1 === 'り' && n2 === 'まし' && n3 === 'た') {
        result.push(cur + 'りました');
        i += 3;
        continue;
      }
      if (n1 === 'り' && n2 === 'ました') {
        result.push(cur + 'りました');
        i += 2;
        continue;
      }
      if (n1 === 'り' && n2 === 'ます') {
        result.push(cur + 'ります');
        i += 2;
        continue;
      }
      if (n1 === 'り' && n2 === 'ません') {
        result.push(cur + 'りません');
        i += 2;
        continue;
      }
      if (n1 === 'り' && n2 === 'そう') {
        result.push(cur + 'りそう');
        i += 2;
        continue;
      }
      if (n1 === 'り' && n2 === '始め' && n3 === 'ました') {
        result.push(cur + 'り始めました');
        i += 3;
        continue;
      }
      if (n1 === 'り' && n2 === '始め') {
        result.push(cur + 'り始め');
        i += 2;
        continue;
      }

      // cur + き + ました -> 行きました / 書きました / 聞きました
      if (n1 === 'き' && n2 === 'まし' && n3 === 'た') {
        result.push(cur + 'きました');
        i += 3;
        continue;
      }
      if (n1 === 'き' && n2 === 'ました') {
        result.push(cur + 'きました');
        i += 2;
        continue;
      }
      if (n1 === 'き' && n2 === 'ます') {
        result.push(cur + 'きます');
        i += 2;
        continue;
      }

      // cur + ぎ + ました / ます
      if (n1 === 'ぎ' && n2 === 'ました') {
        result.push(cur + 'ぎました');
        i += 2;
        continue;
      }
      if (n1 === 'ぎ' && n2 === 'ます') {
        result.push(cur + 'ぎます');
        i += 2;
        continue;
      }

      // cur + し + ました / ます
      // Only merge if cur is single-kanji stem (length 1)
      // Multi-kanji compound nouns (e.g. 勉強, 練習, 散歩) must remain separate lexical units!
      if (cur.length === 1) {
        if (n1 === 'し' && n2 === 'まし' && n3 === 'た') {
          result.push(cur + 'しました');
          i += 3;
          continue;
        }
        if (n1 === 'し' && n2 === 'ました') {
          result.push(cur + 'しました');
          i += 2;
          continue;
        }
        if (n1 === 'し' && n2 === 'ます') {
          result.push(cur + 'します');
          i += 2;
          continue;
        }
      }

      // cur + ち + ました / ます (待ちました / 立ちました)
      if (n1 === 'ち' && n2 === 'ました') {
        result.push(cur + 'ちました');
        i += 2;
        continue;
      }

      // cur + み + ました / ます (飲みました / 読みました / 休みました)
      if (n1 === 'み' && n2 === 'まし' && n3 === 'た') {
        result.push(cur + 'みました');
        i += 3;
        continue;
      }
      if (n1 === 'み' && n2 === 'ました') {
        result.push(cur + 'みました');
        i += 2;
        continue;
      }
      if (n1 === 'み' && n2 === 'ます') {
        result.push(cur + 'みます');
        i += 2;
        continue;
      }

      // Exclude counters (三人, 一人, etc.) from verb stem suffix merging
      const isCounterNoun = /^[一二三四五六七八九十何]+[人つ日月年回本匹枚個着冊杯歳]$/.test(cur);

      // cur + い + ました / ます (買いました / 会いました - but NOT 三人 + います)
      if (!isCounterNoun) {
        if (n1 === 'い' && n2 === 'まし' && n3 === 'た') {
          result.push(cur + 'いました');
          i += 3;
          continue;
        }
        if (n1 === 'い' && n2 === 'ました') {
          result.push(cur + 'いました');
          i += 2;
          continue;
        }
        if (n1 === 'い' && n2 === 'ます') {
          result.push(cur + 'います');
          i += 2;
          continue;
        }
      }

      // cur + て + いる / います / いた (寝ている, 生きている)
      if (n1 === 'て' && n2 === 'いる') {
        result.push(cur + 'ている');
        i += 2;
        continue;
      }
      if (n1 === 'て' && n2 === 'い' && n3 === 'ます') {
        result.push(cur + 'ています');
        i += 3;
        continue;
      }
      if (n1 === 'て' && n2 === 'い' && n3 === 'る') {
        result.push(cur + 'ている');
        i += 3;
        continue;
      }
      if (n1 === 'て' && n2 === 'いた') {
        result.push(cur + 'ていた');
        i += 2;
        continue;
      }

      // cur + って + いる / います (降っている / 降っています)
      if (n1 === 'って' && n2 === 'いる') {
        result.push(cur + 'っている');
        i += 2;
        continue;
      }
      if (n1 === 'って' && n2 === 'い' && n3 === 'ます') {
        result.push(cur + 'っています');
        i += 3;
        continue;
      }
      if (n1 === 'って' && n2 === 'います') {
        result.push(cur + 'っています');
        i += 2;
        continue;
      }

      // cur + んで + いる / います (読んでいる, 飲んでいる)
      if (n1 === 'んで' && n2 === 'いる') {
        result.push(cur + 'んでいる');
        i += 2;
        continue;
      }
      if (n1 === 'んで' && n2 === 'い' && n3 === 'ます') {
        result.push(cur + 'んでいます');
        i += 3;
        continue;
      }

      // cur + いて + いる / います (歩いている, 書いている)
      if (n1 === 'いて' && n2 === 'いる') {
        result.push(cur + 'いている');
        i += 2;
        continue;
      }
      if (n1 === 'いて' && n2 === 'い' && n3 === 'ます') {
        result.push(cur + 'いています');
        i += 3;
        continue;
      }

      // cur + られ + なかっ + た -> 寝られなかった / 食べられなかった
      if (n1 === 'られ' && n2 === 'なかっ' && n3 === 'た') {
        result.push(cur + 'られなかった');
        i += 3;
        continue;
      }
      if (n1 === 'られ' && n2 === 'なかった') {
        result.push(cur + 'られなかった');
        i += 2;
        continue;
      }
      if (n1 === 'られ' && (n2 === 'ない' || n2 === 'る' || n2 === 'た')) {
        result.push(cur + 'られ' + n2);
        i += 2;
        continue;
      }
      if (n1 === 'られ' && n2 === 'まし' && n3 === 'た') {
        result.push(cur + 'られました');
        i += 3;
        continue;
      }
      if (n1 === 'られ' && (n2 === 'ました' || n2 === 'ます' || n2 === 'ません')) {
        result.push(cur + 'られ' + n2);
        i += 2;
        continue;
      }

      // cur + れ + なかっ + た -> 寝れなかった / 食べれなかった / 行けなかった
      if (n1 === 'れ' && n2 === 'なかっ' && n3 === 'た') {
        result.push(cur + 'れなかった');
        i += 3;
        continue;
      }
      if (n1 === 'れ' && n2 === 'なかった') {
        result.push(cur + 'れなかった');
        i += 2;
        continue;
      }
      if (n1 === 'れ' && (n2 === 'ない' || n2 === 'る' || n2 === 'た' || n2 === 'ます' || n2 === 'ました')) {
        result.push(cur + 'れ' + n2);
        i += 2;
        continue;
      }

      // cur + なかっ + た -> 行かなかった / 降らなかった / 食べなかった
      if (n1 === 'なかっ' && n2 === 'た') {
        result.push(cur + 'なかった');
        i += 2;
        continue;
      }
      if (n1 === 'なく' && n2 === 'て') {
        result.push(cur + 'なくて');
        i += 2;
        continue;
      }
      if (n1 === 'ない' && n2 === 'で') {
        result.push(cur + 'ないで');
        i += 2;
        continue;
      }

      // cur + ました / ません / ます / て / た
      if (n1 === 'まし' && n2 === 'た') {
        result.push(cur + 'ました');
        i += 2;
        continue;
      }
      if (n1 === 'ませ' && n2 === 'ん') {
        result.push(cur + 'ません');
        i += 2;
        continue;
      }
      if (
        n1 === 'て' || n1 === 'た' || n1 === 'だ' || n1 === 'ます' || n1 === 'ました' ||
        n1 === 'ません' || n1 === 'ない' || n1 === 'たい' || n1 === 'ば'
      ) {
        result.push(cur + n1);
        i++;
        continue;
      }
    }

    // Standard auxiliary regrouping
    if (cur === 'し' && n1 === 'て' && n2 === 'い' && n3 === 'ます') {
      result.push('しています');
      i += 3;
      continue;
    }
    if (cur === 'し' && n1 === 'て' && n2 === 'い' && n3 === 'る') {
      result.push('している');
      i += 3;
      continue;
    }
    if (cur === 'て' && n1 === 'い' && n2 === 'ます') {
      result.push('ています');
      i += 2;
      continue;
    }
    if (cur === 'て' && n1 === 'い' && n2 === 'る') {
      result.push('ている');
      i += 2;
      continue;
    }
    if (cur === 'し' && n1 === 'なけれ' && n2 === 'ば') {
      result.push('しなければ');
      i += 2;
      continue;
    }
    if (cur === 'なけれ' && n1 === 'ば') {
      result.push('なければ');
      i++;
      continue;
    }
    if (cur === 'なり' && n1 === 'ませ' && n2 === 'ん') {
      result.push('なりません');
      i += 2;
      continue;
    }
    if (cur === 'なり' && n1 === 'ません') {
      result.push('なりません');
      i++;
      continue;
    }
    if (cur === 'なら' && n1 === 'ない') {
      result.push('ならない');
      i++;
      continue;
    }
    if (cur === 'あり' && n1 === 'が' && n2 === 'とう') {
      result.push('ありがとう');
      i += 2;
      continue;
    }
    if (cur === 'ござい' && n1 === 'ます') {
      result.push('ございます');
      i++;
      continue;
    }
    if (cur === 'ござい' && n1 === 'ました') {
      result.push('ございました');
      i++;
      continue;
    }
    if (cur === 'く' && n1 === 'ださい') {
      result.push('ください');
      i++;
      continue;
    }
    if (cur === 'し' && n1 === 'まし' && n2 === 'た') {
      result.push('しました');
      i += 2;
      continue;
    }
    if (cur === 'し' && n1 === 'ました') {
      result.push('しました');
      i++;
      continue;
    }
    if (cur === 'し' && n1 === 'ます') {
      result.push('します');
      i++;
      continue;
    }
    if (cur === 'し' && n1 === 'ませ' && n2 === 'ん') {
      result.push('しません');
      i += 2;
      continue;
    }
    if (cur === 'し' && n1 === 'ません') {
      result.push('しません');
      i++;
      continue;
    }
    if (cur === 'し' && n1 === 'た') {
      result.push('した');
      i++;
      continue;
    }
    if (cur === 'し' && n1 === 'ない' && n2 === 'で') {
      result.push('しないで');
      i += 2;
      continue;
    }
    if (cur === 'し' && n1 === 'ない') {
      result.push('しない');
      i++;
      continue;
    }
    if (cur === 'じゃ' && n1 === 'ない') {
      result.push('じゃない');
      i++;
      continue;
    }
    if (cur === 'で' && n1 === 'は' && n2 === 'ない') {
      result.push('ではない');
      i += 2;
      continue;
    }
    if (cur === 'まし' && n1 === 'た') {
      result.push('ました');
      i++;
      continue;
    }
    if (cur === 'ませ' && n1 === 'ん') {
      result.push('ません');
      i++;
      continue;
    }

    result.push(cur);
  }

  return result;
}

/**
 * Tokenizes a Japanese sentence into morphological words and enriches each word
 * with context-aware readings, script-aware Furigana ruby markup, Mongolian definitions, JLPT levels,
 * and Kanji breakdowns.
 *
 * @param sentence Raw Japanese sentence string.
 * @param allVocab Optional array of VocabularyItems from app context.
 * @param allKanji Optional array of KanjiItems from app context.
 * @param sentenceReading Optional authoritative, space-delimited reading from curriculum data.
 */
/**
 * Accurately aligns authoritative curriculum sentence readings with segmented word tokens
 * using okurigana and particle anchoring.
 */
function alignTokensWithSentenceReading(
  segments: string[],
  sentenceReading: string
): Record<string, string> {
  if (!sentenceReading || !sentenceReading.trim()) return {};

  let r = sentenceReading.replace(/[。\s、！？!?…・「」『』（）()[\]【】]/g, '');
  const readings: Record<string, string> = {};

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (PUNCTUATION_REGEX.test(seg)) continue;

    // If seg is pure kana, match and advance reading stream
    if (/^[ぁ-んァ-ヶー]+$/.test(seg)) {
      if (r.startsWith(seg)) {
        r = r.slice(seg.length);
      }
      continue;
    }

    // seg contains Kanji: locate reading boundary using next kana anchor or trailing okurigana
    const trailingKanaMatch = seg.match(/[ぁ-んァ-ヶー]+$/);
    const trailingKana = trailingKanaMatch ? trailingKanaMatch[0] : '';
    const nextKanaSeg = segments.slice(i + 1).find(s => /^[ぁ-んァ-ヶー]+$/.test(s) && !PUNCTUATION_REGEX.test(s));

    if (nextKanaSeg) {
      const idx = r.indexOf(nextKanaSeg);
      if (idx > 0) {
        readings[seg] = r.slice(0, idx);
        r = r.slice(idx);
      }
    } else if (trailingKana) {
      const idx = r.indexOf(trailingKana);
      if (idx >= 0) {
        readings[seg] = r.slice(0, idx + trailingKana.length);
        r = r.slice(idx + trailingKana.length);
      }
    } else {
      if (r.length > 0) {
        readings[seg] = r;
        r = '';
      }
    }
  }

  return readings;
}

/**
 * Tokenizes a Japanese sentence into morphological words and enriches each word
 * with context-aware readings, script-aware Furigana ruby markup, Mongolian definitions, JLPT levels,
 * and Kanji breakdowns.
 *
 * @param sentence Raw Japanese sentence string.
 * @param allVocab Optional array of VocabularyItems from app context.
 * @param allKanji Optional array of KanjiItems from app context.
 * @param sentenceReading Optional authoritative, space-delimited reading from curriculum data.
 */
export function tokenizeJapaneseSentence(
  sentence: string,
  allVocab: VocabularyItem[] = [],
  allKanji: KanjiItem[] = [],
  sentenceReading?: string
): DetailedWordInfo[] {
  if (!sentence || !sentence.trim()) return [];

  // Extract explicit readings if present in source text (e.g. 漢字（ふりがな） or <ruby>base<rt>reading</rt></ruby>)
  const explicitReadings: Record<string, string> = {};
  const bracketRegex = /([^\s（\(\[【<]+)\s*[（\(\[【]\s*([ぁ-んァ-ヶー・]+)\s*[）\)\]】]/g;
  let bMatch: RegExpExecArray | null;
  while ((bMatch = bracketRegex.exec(sentence)) !== null) {
    if (bMatch[1] && bMatch[2]) {
      explicitReadings[bMatch[1]] = bMatch[2];
    }
  }
  const rubyRegex = /<ruby[^>]*>([\s\S]*?)<rt[^>]*>([\s\S]*?)<\/rt>[\s\S]*?<\/ruby>/gi;
  let rMatch: RegExpExecArray | null;
  while ((rMatch = rubyRegex.exec(sentence)) !== null) {
    if (rMatch[1] && rMatch[2]) {
      explicitReadings[rMatch[1]] = rMatch[2];
    }
  }

  const clean = cleanSentenceForTokenization(sentence);
  const segmenter = getSegmenter();
  const rawSegments: string[] = segmenter.segment(clean);
  const segments = regroupTokens(rawSegments);

  // Align authoritative sentenceReading if provided
  const sentenceReadingsMap = sentenceReading
    ? alignTokensWithSentenceReading(segments, sentenceReading)
    : {};

  const result: DetailedWordInfo[] = [];

  for (let i = 0; i < segments.length; i++) {
    const rawWord = segments[i];
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
        containsKanji: false,
        kanjiList: [],
        rubyParts: [{ text: rawWord }],
        rubyHtml: rawWord
      });
      continue;
    }

    // Contextual tokens before and after
    const prevToken = segments[i - 1];
    const nextToken = segments[i + 1];
    const explicitReading = explicitReadings[rawWord] || sentenceReadingsMap[rawWord];

    // Enrich with dictionary, context lexicon, and de-conjugator
    const enriched = lookupWordDetail(
      rawWord,
      allVocab,
      allKanji,
      prevToken,
      nextToken,
      sentenceReading,
      explicitReading
    );
    result.push(enriched);
  }

  return result;
}

/**
 * Looks up word definition, part of speech, JLPT level, and Kanji details.
 * Strictly guarantees that Furigana is ONLY generated for Kanji characters.
 */
export function lookupWordDetail(
  surface: string,
  allVocab: VocabularyItem[] = [],
  allKanji: KanjiItem[] = [],
  prevToken?: string,
  nextToken?: string,
  sentenceReading?: string,
  explicitReading?: string
): DetailedWordInfo {
  const isSurfaceHasKanji = hasKanji(surface);
  const grammarInfo = COMMON_GRAMMAR_MAP[surface];
  const isParticleOrGrammar = surface in COMMON_GRAMMAR_MAP;

  // Extract Kanji characters and build Kanji breakdown ONLY if surface has Kanji
  const kanjiChars = isSurfaceHasKanji ? Array.from(new Set(surface.match(KANJI_REGEX) || [])) : [];
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
    return {
      kanji: kChar,
      onyomi: '—',
      kunyomi: '—',
      mongolian: 'Ханз үсэг',
      jlptLevel: 'N5'
    };
  });

  // Base properties initialization
  let word = surface;
  let reading = surface;
  let mongolian = '';
  let partOfSpeech = 'Япон үг';
  let jlptLevel: JLPTLevel = 'N5';
  let explanation: string | undefined;
  let vocabMatch: VocabularyItem | undefined;

  // --------------------------------------------------------------------------
  // STEP 1: Contextual Disambiguation Rules (間, 今日, 生, 中, 方, etc.)
  // --------------------------------------------------------------------------
  const disambiguatedReading = isSurfaceHasKanji
    ? disambiguateContextualKanji(surface, prevToken, nextToken)
    : null;

  // --------------------------------------------------------------------------
  // STEP 2: High-accuracy Context Lexicon (Validated compound & phrase readings)
  // --------------------------------------------------------------------------
  const contextEntry = CONTEXT_LEXICON[surface];

  // --------------------------------------------------------------------------
  // STEP 3: Check Dedicated Grammar / Particles
  // --------------------------------------------------------------------------
  const isDedicatedGrammarToken =
    isParticleOrGrammar &&
    ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'の', 'ね', 'よ', 'か', 'ない', 'て', 'で', 'どうぞ', 'しないで', 'ください'].includes(surface);

  if (isDedicatedGrammarToken && grammarInfo) {
    reading = grammarInfo.reading;
    mongolian = grammarInfo.mongolian;
    partOfSpeech = grammarInfo.partOfSpeech;
    jlptLevel = grammarInfo.jlptLevel;
  } else if (disambiguatedReading) {
    reading = disambiguatedReading;
    if (contextEntry) {
      mongolian = contextEntry.mongolian || '';
      partOfSpeech = contextEntry.partOfSpeech || 'Ханз үг';
      jlptLevel = contextEntry.jlptLevel || 'N5';
    }
  } else if (contextEntry) {
    reading = contextEntry.reading;
    mongolian = contextEntry.mongolian || '';
    partOfSpeech = contextEntry.partOfSpeech || 'Ханз үг';
    jlptLevel = contextEntry.jlptLevel || 'N5';
  } else {
    // --------------------------------------------------------------------------
    // STEP 4: Morphological Verb & Adjective De-conjugation (e.g. 降りました -> ふりました)
    // --------------------------------------------------------------------------
    const deconjugated = isSurfaceHasKanji ? deconjugateAndInferReading(surface) : null;
    if (deconjugated) {
      reading = deconjugated.reading;
      mongolian = 'Үйл үгийн хувилбар';
      partOfSpeech = 'Үйл үг';
    } else {
      // --------------------------------------------------------------------------
      // STEP 5: Check in App Vocabulary Database (allVocab)
      // --------------------------------------------------------------------------
      vocabMatch = allVocab.find(v => v.japanese === surface);

      if (!vocabMatch && (surface.startsWith('お') || surface.startsWith('ご'))) {
        vocabMatch = allVocab.find(v => v.japanese === surface.slice(1));
      }

      if (!vocabMatch && isSurfaceHasKanji) {
        const verbCandidates = [
          surface + 'る',
          surface + 'する',
          surface.replace(/し$/, 'する'),
          surface.replace(/します$/, 'する'),
          surface.replace(/しました$/, 'する'),
          surface.replace(/している$/, 'する'),
          surface.replace(/しています$/, 'する'),
          surface.replace(/します$/, ''),
          surface.replace(/しました$/, ''),
          surface.replace(/している$/, ''),
          surface.replace(/しています$/, ''),
          surface.replace(/て$/, 'る'),
          surface.replace(/た$/, 'る'),
          surface.replace(/きました$/, 'く'),
          surface.replace(/ぎました$/, 'ぐ'),
          surface.replace(/しました$/, 'す'),
          surface.replace(/ちました$/, 'つ'),
          surface.replace(/にました$/, 'ぬ'),
          surface.replace(/びました$/, 'ぶ'),
          surface.replace(/みました$/, 'む'),
          surface.replace(/りました$/, 'る'),
          surface.replace(/いました$/, 'う'),
          surface.replace(/ます$/, 'る'),
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

      if (vocabMatch) {
        word = vocabMatch.japanese;
        reading = vocabMatch.reading;
        mongolian = vocabMatch.mongolian;
        partOfSpeech = vocabMatch.partOfSpeech || 'Үг';
        jlptLevel = vocabMatch.jlptLevel || 'N5';
        explanation = vocabMatch.explanation;
      } else if (explicitReading) {
        reading = explicitReading;
        mongolian = 'Үгийн дуудлага';
      } else {
        // Fallback for kana-only words
        if (/^[ぁ-ん]+$/.test(surface)) {
          reading = surface;
          mongolian = 'Холбох / сул үг';
          partOfSpeech = 'Хирагана үг';
        } else if (/^[ァ-ヶー]+$/.test(surface)) {
          reading = surface;
          mongolian = 'Катакана гадаад үг';
          partOfSpeech = 'Катакана нэр үг';
        } else if (isSurfaceHasKanji) {
          // If single kanji word (e.g. 本, 犬), look up single kanji kun'yomi / on'yomi
          if (surface.length === 1) {
            const kInfo = kanjiList.find(k => k.kanji === surface);
            if (kInfo && kInfo.kunyomi && kInfo.kunyomi !== '—') {
              const primaryKun = kInfo.kunyomi.split(/[,、\s]+/)[0].replace(/[\(\)（）\.\-]/g, '').trim();
              if (primaryKun) {
                reading = primaryKun;
              }
            } else if (kInfo && kInfo.onyomi && kInfo.onyomi !== '—') {
              const primaryOn = kInfo.onyomi.split(/[,、\s]+/)[0].trim();
              reading = primaryOn.replace(/[\u30A1-\u30F6]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x60));
            }
          }
          // CRITICAL: NEVER synthesize multi-kanji compound readings by stitching character-by-character kun'yomi!
          // Compound words (e.g. 勉強, 学校, 友達) MUST NEVER be guessed as kun'yomi concatenations (勉=つとめる, 強=つよい).
          // If a multi-kanji compound is not in CONTEXT_LEXICON or allVocab, retain reading = surface so NO FALSE RUBY is emitted.

          const kanjiMeanings = kanjiList
            .map(k => (k.mongolian ? k.mongolian.split(/[,;]/)[0].trim() : ''))
            .filter(m => m && m !== 'Ханз үсэг');
          if (kanjiMeanings.length > 0) {
            mongolian = kanjiMeanings.join(' ') + ' (нийлмэл ханз үг)';
          } else {
            mongolian = 'Япон хэлний үг';
          }
          partOfSpeech = 'Ханз үг';
        } else {
          mongolian = 'Япон хэлний үг';
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // STEP 6: Derive inflected reading if matched with base dictionary verb
  // --------------------------------------------------------------------------
  let alignedReading = reading;
  if (isSurfaceHasKanji && vocabMatch && vocabMatch.japanese !== surface) {
    const baseWord = vocabMatch.japanese;
    const baseReading = vocabMatch.reading;

    if (baseWord.endsWith('る')) {
      const baseStem = baseWord.slice(0, -1);
      const readingStem = baseReading.slice(0, -1);
      if (surface.startsWith(baseStem)) {
        alignedReading = readingStem + surface.slice(baseStem.length);
      }
    } else {
      const godanMap: [string, string][] = [
        ['く', 'き'], ['ぐ', 'ぎ'], ['す', 'し'], ['つ', 'ち'],
        ['ぬ', 'に'], ['ぶ', 'び'], ['む', 'み'], ['る', 'り'], ['う', 'い']
      ];
      let matched = false;
      for (const [dictEnd, stemEnd] of godanMap) {
        if (baseWord.endsWith(dictEnd)) {
          const baseStem = baseWord.slice(0, -1);
          const readingStem = baseReading.slice(0, -1);
          if (surface === baseStem + stemEnd) {
            alignedReading = readingStem + stemEnd;
            matched = true;
            break;
          }
          if (surface.startsWith(baseStem + stemEnd)) {
            alignedReading = readingStem + stemEnd + surface.slice((baseStem + stemEnd).length);
            matched = true;
            break;
          }
        }
      }
      if (!matched && baseWord.length > 1 && surface.startsWith(baseWord.slice(0, -1))) {
        alignedReading = baseReading.slice(0, -1) + surface.slice(baseWord.length - 1);
      }
    }
  }

  // --------------------------------------------------------------------------
  // STEP 7: Generate Semantic Ruby Parts & Clean HTML
  // --------------------------------------------------------------------------
  const rubyParts = alignRubyParts(surface, alignedReading);
  const rubyHtml = renderRubyHtml(surface, alignedReading);

  return {
    surface,
    word,
    reading: alignedReading,
    mongolian,
    partOfSpeech,
    jlptLevel,
    explanation,
    isParticle: isParticleOrGrammar,
    containsKanji: isSurfaceHasKanji,
    kanjiList,
    rawItem: vocabMatch,
    rubyParts,
    rubyHtml
  };
}
