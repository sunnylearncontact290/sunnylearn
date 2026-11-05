// @ts-ignore
import TinySegmenter from 'tiny-segmenter';
import { VocabularyItem, KanjiItem, JLPTLevel } from '../types';
import { alignRubyParts, renderRubyHtml, hasKanji, RubyChunk } from './furiganaRenderer';

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
  '何': { reading: 'なに / なん', mongolian: 'Юу?', partOfSpeech: 'Асуух төлөөний үг', jlptLevel: 'N5' },
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
  'いる': { reading: 'いる', mongolian: 'Байх (хүн, амьд биет)', partOfSpeech: 'Үйл үг (2-р бүлэг)', jlptLevel: 'N5' },
  'ある': { reading: 'ある', mongolian: 'Байх (эд зүйл, үзэгдэл)', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  'いく': { reading: 'いく', mongolian: 'Явах', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '行く': { reading: 'いく', mongolian: 'Явах', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  'くる': { reading: 'くる', mongolian: 'Ирэх', partOfSpeech: 'Үйл үг (3-р бүлэг)', jlptLevel: 'N5' },
  '来る': { reading: 'くる', mongolian: 'Ирэх', partOfSpeech: 'Үйл үг (3-р бүлэг)', jlptLevel: 'N5' },

  // Common inflected forms containing Kanji
  '食べて': { reading: 'たべて', mongolian: 'Идэх (идээд, идэж)', partOfSpeech: 'Үйл үг (2-р бүлэг)', jlptLevel: 'N5' },
  '食べます': { reading: 'たべます', mongolian: 'Иднэ (эелдэг одоо цаг)', partOfSpeech: 'Үйл үг (2-р бүлэг)', jlptLevel: 'N5' },
  '食べた': { reading: 'たべた', mongolian: 'Идсэн', partOfSpeech: 'Үйл үг (2-р бүлэг)', jlptLevel: 'N5' },
  '食べない': { reading: 'たべない', mongolian: 'Идэхгүй', partOfSpeech: 'Үйл үг (2-р бүлэг)', jlptLevel: 'N5' },
  '行って': { reading: 'いって', mongolian: 'Явах (яваад, явж)', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '行きます': { reading: 'いきます', mongolian: 'Явна (эелдэг одоо цаг)', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '見て': { reading: 'みて', mongolian: 'Харах (хараад, үзээд)', partOfSpeech: 'Үйл үг (2-р бүлэг)', jlptLevel: 'N5' },
  '見ます': { reading: 'みます', mongolian: 'Харна, үзнэ (эелдэг одоо цаг)', partOfSpeech: 'Үйл үг (2-р бүлэг)', jlptLevel: 'N5' },

  // High Frequency JLPT Kanji Compounds & Words
  '市内': { reading: 'しない', mongolian: 'Хотын дотор, хот дотор (хотын төв)', partOfSpeech: 'Нэр үг (Ханз үг)', jlptLevel: 'N3' },
  '日本': { reading: 'にほん', mongolian: 'Япон улс', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '日本語': { reading: 'にほんご', mongolian: 'Япон хэл', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '英語': { reading: 'えいご', mongolian: 'Англи хэл', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '案内': { reading: 'あんない', mongolian: 'Хөтөч, танилцуулга, зааварлах', partOfSpeech: 'Нэр үг / する үйл үг', jlptLevel: 'N4' },
  '案内する': { reading: 'あんないする', mongolian: 'Танилцуулах, газарчлах, хөтөч хийх', partOfSpeech: 'Үйл үг (3-р бүлэг)', jlptLevel: 'N4' },
  '案内し': { reading: 'あんないし', mongolian: 'Танилцуулж, газарчилж', partOfSpeech: 'Үйл үг (3-р бүлэг)', jlptLevel: 'N4' },
  'ご案内': { reading: 'ごあんない', mongolian: 'Хүндэтгэлтэй танилцуулга, газарчлах', partOfSpeech: 'Хүндэтгэлийн нэр үг', jlptLevel: 'N3' },
  'ご案内し': { reading: 'ごあんないし', mongolian: 'Танилцуулж, газарчилж (хүндэтгэл)', partOfSpeech: 'Үйл үг', jlptLevel: 'N3' },
  'ご案内します': { reading: 'ごあんないします', mongolian: 'Танилцуулъя, газарчилна (даруу хэлбэр)', partOfSpeech: 'Үйл үг (эелдэг)', jlptLevel: 'N3' },
  '遠慮': { reading: 'えんりょ', mongolian: 'Биеэ барих, зовох, эмээх', partOfSpeech: 'Нэр үг / する үйл үг', jlptLevel: 'N3' },
  '遠慮し': { reading: 'えんりょし', mongolian: 'Зовж, биеэ барьж', partOfSpeech: 'Үйл үг', jlptLevel: 'N3' },
  '遠慮する': { reading: 'えんりょする', mongolian: 'Биеэ барих, эмээх', partOfSpeech: 'Үйл үг (3-р бүлэг)', jlptLevel: 'N3' },
  '勉強': { reading: 'べんきょう', mongolian: 'Хичээл, сурлага', partOfSpeech: 'Нэр үг / する үйл үг', jlptLevel: 'N5' },
  '勉強し': { reading: 'べんきょうし', mongolian: 'Хичээллэж, суралцаж', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '約束': { reading: 'やくそく', mongolian: 'Амлалт, болзоо', partOfSpeech: 'Нэр үг / する үйл үг', jlptLevel: 'N4' },
  '毎朝': { reading: 'まいあさ', mongolian: 'Өглөө бүр', partOfSpeech: 'Нэр үг / Дайвар үг', jlptLevel: 'N5' },
  '毎日': { reading: 'まいにち', mongolian: 'Өдөр бүр', partOfSpeech: 'Нэр үг / Дайвар үг', jlptLevel: 'N5' },
  '毎晩': { reading: 'まいばん', mongolian: 'Орой бүр', partOfSpeech: 'Нэр үг / Дайвар үг', jlptLevel: 'N5' },
  '学校': { reading: 'がっこう', mongolian: 'Сургууль', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '先生': { reading: 'せんせい', mongolian: 'Багш', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '学生': { reading: 'がくせい', mongolian: 'Оюутан, сурагч', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '友達': { reading: 'ともだち', mongolian: 'Найз нөхөр', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '今日': { reading: 'きょう', mongolian: 'Өнөөдөр', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '明日': { reading: 'あした', mongolian: 'Маргааш', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '昨日': { reading: 'きのう', mongolian: 'Өчигдөр', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },

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
 * Re-groups morphological segments split by TinySegmenter to form complete, natural Japanese words:
 * - "く" + "ださい" -> "ください"
 * - "し" + "ない" + "で" -> "しないで"
 * - "じゃ" + "ない" -> "じゃない"
 * - Verb stems + okurigana: e.g. "食べ" + "て" -> "食べて", "行き" + "ます" -> "行きます"
 */
function regroupTokens(rawSegments: string[]): string[] {
  const result: string[] = [];

  for (let i = 0; i < rawSegments.length; i++) {
    const cur = rawSegments[i];
    const n1 = rawSegments[i + 1];
    const n2 = rawSegments[i + 2];
    const n3 = rawSegments[i + 3];

    // Case 1: "し" + "て" + "い" + "ます" -> "しています"
    if (cur === 'し' && n1 === 'て' && n2 === 'い' && n3 === 'ます') {
      result.push('しています');
      i += 3;
      continue;
    }

    // Case 2: "し" + "て" + "い" + "る" -> "している"
    if (cur === 'し' && n1 === 'て' && n2 === 'い' && n3 === 'る') {
      result.push('している');
      i += 3;
      continue;
    }

    // Case 3: "て" + "い" + "ます" -> "ています"
    if (cur === 'て' && n1 === 'い' && n2 === 'ます') {
      result.push('ています');
      i += 2;
      continue;
    }

    // Case 4: "て" + "い" + "る" -> "ている"
    if (cur === 'て' && n1 === 'い' && n2 === 'る') {
      result.push('ている');
      i += 2;
      continue;
    }

    // Case 5: "し" + "なけれ" + "ば" -> "しなければ"
    if (cur === 'し' && n1 === 'なけれ' && n2 === 'ば') {
      result.push('しなければ');
      i += 2;
      continue;
    }

    // Case 6: "なけれ" + "ば" -> "なければ"
    if (cur === 'なけれ' && n1 === 'ば') {
      result.push('なければ');
      i++;
      continue;
    }

    // Case 7: "なり" + "ませ" + "ん" -> "なりません"
    if (cur === 'なり' && n1 === 'ませ' && n2 === 'ん') {
      result.push('なりません');
      i += 2;
      continue;
    }

    // Case 8: "なり" + "ません" -> "なりません"
    if (cur === 'なり' && n1 === 'ません') {
      result.push('なりません');
      i++;
      continue;
    }

    // Case 9: "なら" + "ない" -> "ならない"
    if (cur === 'なら' && n1 === 'ない') {
      result.push('ならない');
      i++;
      continue;
    }

    // Case 10: "あり" + "が" + "とう" -> "ありがとう"
    if (cur === 'あり' && n1 === 'が' && n2 === 'とう') {
      result.push('ありがとう');
      i += 2;
      continue;
    }

    // Case 11: "ござい" + "ます" -> "ございます"
    if (cur === 'ござい' && n1 === 'ます') {
      result.push('ございます');
      i++;
      continue;
    }

    // Case 12: "ござい" + "ました" -> "ございました"
    if (cur === 'ござい' && n1 === 'ました') {
      result.push('ございました');
      i++;
      continue;
    }

    // Case 13: "く" + "ださい" -> "ください"
    if (cur === 'く' && n1 === 'ださい') {
      result.push('ください');
      i++;
      continue;
    }

    // Case 14: "し" + "ない" + "で" -> "しないで"
    if (cur === 'し' && n1 === 'ない' && n2 === 'で') {
      result.push('しないで');
      i += 2;
      continue;
    }

    // Case 15: "じゃ" + "ない" -> "じゃない"
    if (cur === 'じゃ' && n1 === 'ない') {
      result.push('じゃない');
      i++;
      continue;
    }

    // Case 16: "で" + "は" + "ない" -> "ではない"
    if (cur === 'で' && n1 === 'は' && n2 === 'ない') {
      result.push('ではない');
      i += 2;
      continue;
    }

    // Case 17: Kanji verb stem + inflection okurigana (e.g. "食べ" + "て" -> "食べて", "食べ" + "ます" -> "食べます")
    if (
      hasKanji(cur) &&
      (n1 === 'て' || n1 === 'た' || n1 === 'だ' || n1 === 'ます' || n1 === 'ました' || n1 === 'ません' || n1 === 'ない' || n1 === 'たい' || n1 === 'ば')
    ) {
      result.push(cur + n1);
      i++;
      continue;
    }

    // Case 18: "まし" + "た" -> "ました", "ませ" + "ん" -> "ません"
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
 * with readings, script-aware Furigana ruby markup, Mongolian definitions, JLPT levels,
 * and Kanji breakdowns.
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
  const segments = regroupTokens(rawSegments);

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

    // Enrich with dictionary and database
    const enriched = lookupWordDetail(rawWord, allVocab, allKanji, segments, i);
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
  _sentenceTokens?: string[],
  _currentIndex?: number
): DetailedWordInfo {
  const isSurfaceHasKanji = hasKanji(surface);
  const isParticleOrGrammar = surface in COMMON_GRAMMAR_MAP;
  const grammarInfo = COMMON_GRAMMAR_MAP[surface];

  // Specific single-character particles/affixes take priority over homophone vocab (e.g. ご = prefix, not number 5; し = auxiliary verb, not number 4)
  const isDedicatedGrammarToken =
    isParticleOrGrammar &&
    [
      'ご', 'お', 'し', 'ます', 'ました', 'ません', 'でした', 'は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'の', 'ね', 'よ', 'か',
      'ない', 'て', 'で', 'どうぞ', 'しないで', 'ください',
      '私', 'わたし', '僕', 'ぼく', '俺', '彼', '彼女', 'これ', 'それ', 'あれ', 'どれ', 'ここ', 'そこ', 'あそこ', 'どこ', 'だれ', '誰', '何',
      '市内', '案内', '案内し', '案内する', 'ご案内', 'ご案内し', 'ご案内します', '遠慮', '遠慮し', '遠慮する',
      '日本語', '日本', '英語', '勉強', '勉強し', '約束', '毎朝', '毎日', '毎晩', '学校', '先生', '学生', '友達', '今日', '明日', '昨日'
    ].includes(surface);

  let vocabMatch: VocabularyItem | undefined;

  // IMPORTANT: Only search vocabulary by reverse reading (v.reading === surface) if surface ACTUALLY contains Kanji!
  // Doing reverse lookup on Hiragana-only tokens mistakenly replaces "ない" with "内", "て" with "手", "く" with "苦"!
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

    // 3. If surface contains Kanji, check if surface is a verb stem (e.g. 案内し -> 案内する, 食べ -> 食べる, 買い -> 買う)
    if (!vocabMatch && isSurfaceHasKanji) {
      const verbCandidates = [
        surface + 'る',
        surface + 'する',
        surface.replace(/し$/, 'する'),
        surface.replace(/て$/, 'る'),
        surface.replace(/た$/, 'る'),
        surface.replace(/きます$/, 'く'),
        surface.replace(/ぎます$/, 'ぐ'),
        surface.replace(/します$/, 'す'),
        surface.replace(/ちます$/, 'つ'),
        surface.replace(/にます$/, 'ぬ'),
        surface.replace(/びます$/, 'ぶ'),
        surface.replace(/みます$/, 'む'),
        surface.replace(/ります$/, 'る'),
        surface.replace(/います$/, 'う'),
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

    // 4. If surface has Kanji and still not matched, check by exact reading match
    if (!vocabMatch && isSurfaceHasKanji) {
      vocabMatch = allVocab.find(v => v.reading === surface);
    }
  }

  // Extract Kanji characters and build Kanji breakdown ONLY if surface has Kanji!
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
      // If surface has Kanji and still has no reading, synthesize from constituent Kanji readings
      if (isSurfaceHasKanji && (reading === surface || !reading)) {
        const synthesizedParts: string[] = [];
        let allFound = true;
        for (const ch of surface) {
          if (/[\u4E00-\u9FFF々仝〆〇ヶ\u3400-\u4DBF]/.test(ch)) {
            const kInfo = kanjiList.find(k => k.kanji === ch);
            if (kInfo && kInfo.onyomi && kInfo.onyomi !== '—') {
              const primaryOn = kInfo.onyomi.split(/[,、\s]+/)[0].trim();
              const hira = primaryOn.replace(/[\u30A1-\u30F6]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x60));
              synthesizedParts.push(hira);
            } else if (kInfo && kInfo.kunyomi && kInfo.kunyomi !== '—') {
              const primaryKun = kInfo.kunyomi.split(/[,、\s]+/)[0].replace(/[\(\)（）\.\-]/g, '').trim();
              synthesizedParts.push(primaryKun);
            } else {
              allFound = false;
              break;
            }
          } else {
            synthesizedParts.push(ch);
          }
        }
        if (allFound && synthesizedParts.length > 0) {
          reading = synthesizedParts.join('');
        }
      }

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

  // Derive inflected reading if surface is inflected (e.g. 食べる reading たべる -> 食べて reading たべて, 飲む -> 飲み)
  let alignedReading = reading;
  if (isSurfaceHasKanji && vocabMatch && vocabMatch.japanese !== surface) {
    const baseWord = vocabMatch.japanese;
    const baseReading = vocabMatch.reading;

    // Ichidan verb inflection (ends in る)
    if (baseWord.endsWith('る')) {
      const baseStem = baseWord.slice(0, -1);
      const readingStem = baseReading.slice(0, -1);
      if (surface.startsWith(baseStem)) {
        alignedReading = readingStem + surface.slice(baseStem.length);
      }
    } else {
      // Godan verb inflections
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

  // Generate script-aware semantic Ruby parts & HTML
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
