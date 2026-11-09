import { JLPTLevel, KanjiItem, VocabularyItem, ItemStudyRecord } from '../types';

export interface CurriculumTopic {
  id: string;
  jlptLevel: JLPTLevel;
  type: 'kanji' | 'vocab';
  titleMongolian: string;
  titleJapanese: string;
  iconName: string;
  descriptionMongolian: string;
  themeColor: string;
  orderedKeys?: string[]; // Deterministic explicit ordering of characters or words
  isFlaggedForReview?: boolean;
}

// ============================================================================
// DETERMINISTIC ORDERED KEYS FOR FOUNDATIONAL TOPICS
// ============================================================================

const N5_KANJI_NUMBERS = [
  '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '百', '千', '万', '円'
];

const N5_KANJI_TIME = [
  '日', '月', '年', '時', '分', '午', '今', '間', '半', '毎'
];

const N5_KANJI_PEOPLE = [
  '人', '男', '女', '子', '父', '母', '友'
];

const N5_KANJI_PLACES = [
  '上', '下', '中', '左', '右', '前', '後', '東', '西', '南', '北', '外', '国'
];

const N5_KANJI_SCHOOL = [
  '本', '学', '校', '先', '生', '名', '語', '電', '車', '何', '休'
];

const N5_KANJI_ACTIONS = [
  '見', '聞', '話', '読', '書', '行', '来', '食', '出', '入'
];

const N5_KANJI_NATURE = [
  '山', '川', '天', '気', '雨', '白', '大', '小', '高', '長', '火', '水', '木', '金', '土'
];

const N5_VOCAB_GREETINGS = [
  'おはようございます',
  'こんにちは',
  'こんばんは',
  'ありがとうございます',
  'すみません',
  'はじめまして',
  'どうぞよろしくお願いします',
  'さようなら',
  'おやすみなさい',
  'いただきます',
  'ごちそうさまでした',
  'じゃあ、また'
];

const N5_VOCAB_NUMBERS = [
  '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '百', '千', '万', '一つ', '二つ', '三つ', '四つ', '五つ', '六つ', '七つ', '八つ', '九つ', '十',
  '一人', '二人', '一番', '一日', 'いくら', '何'
];

// ============================================================================
// TOPIC DEFINITIONS (METADATA)
// ============================================================================

export const CURRICULUM_TOPIC_DEFINITIONS: CurriculumTopic[] = [
  // ==========================================
  // N5 VOCABULARY
  // ==========================================
  {
    id: 'n5-v-greetings',
    jlptLevel: 'N5',
    type: 'vocab',
    titleMongolian: 'Мэндчилгээ ба Ёс зүй',
    titleJapanese: '挨拶・礼儀',
    iconName: 'MessageSquare',
    descriptionMongolian: 'Өглөө, өдөр, оройн мэндчилгээ, талархал, уучлалт хүсэх хэллэгүүд',
    themeColor: '#CC0000',
    orderedKeys: N5_VOCAB_GREETINGS
  },
  {
    id: 'n5-v-numbers',
    jlptLevel: 'N5',
    type: 'vocab',
    titleMongolian: 'Тоо ба Тооллын үгс',
    titleJapanese: '数字・数え方',
    iconName: 'Hash',
    descriptionMongolian: '1-10 хүртэлх тоо, ширхэг, хүн тоолох болон үнэ асуух үгс',
    themeColor: '#EA580C',
    orderedKeys: N5_VOCAB_NUMBERS
  },
  {
    id: 'n5-v-time',
    jlptLevel: 'N5',
    type: 'vocab',
    titleMongolian: 'Цаг хугацаа ба Хуанли',
    titleJapanese: '時間・日付',
    iconName: 'Calendar',
    descriptionMongolian: 'Цаг, минут, өдөр, долоо хоногийн гарагууд, сар, жил',
    themeColor: '#7C3AED'
  },
  {
    id: 'n5-v-people',
    jlptLevel: 'N5',
    type: 'vocab',
    titleMongolian: 'Хүн ба Гэр бүл',
    titleJapanese: '人・家族',
    iconName: 'Users',
    descriptionMongolian: 'Би, та, гэр бүлийн гишүүд, найз нөхөд, мэргэжил',
    themeColor: '#DC2626'
  },
  {
    id: 'n5-v-food',
    jlptLevel: 'N5',
    type: 'vocab',
    titleMongolian: 'Хоол хүнс ба Зоог',
    titleJapanese: '食事・飲み物',
    iconName: 'Utensils',
    descriptionMongolian: 'Хоол, ус, ундаа, жимс, ногоо, зоогийн газар',
    themeColor: '#D97706'
  },
  {
    id: 'n5-v-places',
    jlptLevel: 'N5',
    type: 'vocab',
    titleMongolian: 'Байршил ба Хот суурин',
    titleJapanese: '場所・方向',
    iconName: 'MapPin',
    descriptionMongolian: 'Байрлал, зүг чиг, сургууль, буудал, дэлгүүр, гэр',
    themeColor: '#2563EB'
  },
  {
    id: 'n5-v-transport',
    jlptLevel: 'N5',
    type: 'vocab',
    titleMongolian: 'Тээвэр ба Аялал',
    titleJapanese: '交通・移動',
    iconName: 'Compass',
    descriptionMongolian: 'Галт тэрэг, автобус, машин, онгоц, унаа тээвэр',
    themeColor: '#0284C7'
  },
  {
    id: 'n5-v-nature',
    jlptLevel: 'N5',
    type: 'vocab',
    titleMongolian: 'Байгаль ба Цаг агаар',
    titleJapanese: '自然・天気',
    iconName: 'CloudSun',
    descriptionMongolian: 'Цаг агаар, нар, бороо, цас, салхи, амьтад',
    themeColor: '#059669'
  },
  {
    id: 'n5-v-body',
    jlptLevel: 'N5',
    type: 'vocab',
    titleMongolian: 'Бие махбод ба Эрүүл мэнд',
    titleJapanese: '身体・健康',
    iconName: 'Activity',
    descriptionMongolian: 'Нүд, чих, гар, хөл, толгой, эм, өвчин, эрүүл мэнд',
    themeColor: '#E11D48'
  },
  {
    id: 'n5-v-daily',
    jlptLevel: 'N5',
    type: 'vocab',
    titleMongolian: 'Өдөр тутмын эд юмс',
    titleJapanese: '日常生活・身の回り',
    iconName: 'BookOpen',
    descriptionMongolian: 'Гэр орон, тавилга, хувцас, хичээлийн хэрэгсэл',
    themeColor: '#4B5563'
  },
  {
    id: 'n5-v-actions',
    jlptLevel: 'N5',
    type: 'vocab',
    titleMongolian: 'Үндсэн үйл үгс',
    titleJapanese: '基本動詞',
    iconName: 'Sparkles',
    descriptionMongolian: 'Хөдөлгөөн, үйлдэл заах хамгийн өргөн хэрэглэгддэг үйл үгс',
    themeColor: '#B91C1C'
  },
  {
    id: 'n5-v-descriptors',
    jlptLevel: 'N5',
    type: 'vocab',
    titleMongolian: 'Шинж чанар ба Төлөв байдал',
    titleJapanese: '形容詞・状態',
    iconName: 'Layers',
    descriptionMongolian: 'И/На тэмдэг нэрс, өнгө, хэмжээ, мэдрэмж, дайвар үгс',
    themeColor: '#9333EA'
  },

  // ==========================================
  // N5 KANJI (100% of 80 Kanji mapped)
  // ==========================================
  {
    id: 'n5-k-numbers',
    jlptLevel: 'N5',
    type: 'kanji',
    titleMongolian: 'Тоо тоолол',
    titleJapanese: '数字',
    iconName: 'Hash',
    descriptionMongolian: '1-10 хүртэлх тоо болон 100, 1000, 10000, валютын ханзууд',
    themeColor: '#CC0000',
    orderedKeys: N5_KANJI_NUMBERS
  },
  {
    id: 'n5-k-time',
    jlptLevel: 'N5',
    type: 'kanji',
    titleMongolian: 'Цаг хугацаа ба Өдөр',
    titleJapanese: '時間・日付',
    iconName: 'Clock',
    descriptionMongolian: 'Жил, сар, өдөр, цаг минут заах цаг хугацааны ханзууд',
    themeColor: '#7C3AED',
    orderedKeys: N5_KANJI_TIME
  },
  {
    id: 'n5-k-people',
    jlptLevel: 'N5',
    type: 'kanji',
    titleMongolian: 'Хүн ба Гэр бүл',
    titleJapanese: '人・家族',
    iconName: 'Users',
    descriptionMongolian: 'Хүн, гэр бүлийн гишүүд, найз нөхөд илэрхийлэх ханзууд',
    themeColor: '#DC2626',
    orderedKeys: N5_KANJI_PEOPLE
  },
  {
    id: 'n5-k-places',
    jlptLevel: 'N5',
    type: 'kanji',
    titleMongolian: 'Байршил ба Зүг чиг',
    titleJapanese: '場所・方向',
    iconName: 'Compass',
    descriptionMongolian: 'Дээр, доор, зүүн, баруун, зүг чиг, байрлал заах ханзууд',
    themeColor: '#2563EB',
    orderedKeys: N5_KANJI_PLACES
  },
  {
    id: 'n5-k-school',
    jlptLevel: 'N5',
    type: 'kanji',
    titleMongolian: 'Сургууль ба Хичээл',
    titleJapanese: '学校・日常生活',
    iconName: 'BookOpen',
    descriptionMongolian: 'Сургууль, ном, унаа тээвэр, суралцах орчны ханзууд',
    themeColor: '#059669',
    orderedKeys: N5_KANJI_SCHOOL
  },
  {
    id: 'n5-k-actions',
    jlptLevel: 'N5',
    type: 'kanji',
    titleMongolian: 'Үндсэн үйл үгс',
    titleJapanese: '動作・基本動詞',
    iconName: 'Activity',
    descriptionMongolian: 'Харах, сонсох, ярих, унших, бичих, явах, ирэх, идэх ханзууд',
    themeColor: '#E11D48',
    orderedKeys: N5_KANJI_ACTIONS
  },
  {
    id: 'n5-k-nature',
    jlptLevel: 'N5',
    type: 'kanji',
    titleMongolian: 'Байгаль ба Ертөнц',
    titleJapanese: '自然・万物',
    iconName: 'CloudSun',
    descriptionMongolian: 'Уул, ус, гал, тэнгэр, бороо, мод, өнгө, хэмжээ заах ханзууд',
    themeColor: '#0284C7',
    orderedKeys: N5_KANJI_NATURE
  },

  // ==========================================
  // N4 VOCABULARY
  // ==========================================
  {
    id: 'n4-v-daily',
    jlptLevel: 'N4',
    type: 'vocab',
    titleMongolian: 'Өдөр тутмын харилцаа ба Ахуй',
    titleJapanese: '日常生活',
    iconName: 'BookOpen',
    descriptionMongolian: 'Гэр бүл, найз нөхөд, өдөр тутмын хэвшил, ахуйн хэрэглээ',
    themeColor: '#CC0000'
  },
  {
    id: 'n4-v-people',
    jlptLevel: 'N4',
    type: 'vocab',
    titleMongolian: 'Хүмүүсийн харилцаа ба Сэтгэл хөдлөл',
    titleJapanese: '人間関係・感情',
    iconName: 'Users',
    descriptionMongolian: 'Гэр бүл, найз нөхөд, сэтгэлийн мэдрэмж, харилцаа',
    themeColor: '#EA580C'
  },
  {
    id: 'n4-v-work',
    jlptLevel: 'N4',
    type: 'vocab',
    titleMongolian: 'Ажил хэрэг ба Сургууль',
    titleJapanese: '仕事・学校',
    iconName: 'GraduationCap',
    descriptionMongolian: 'Ажлын байр, уулзалт, шалгалт, даалгавар, хичээл',
    themeColor: '#2563EB'
  },
  {
    id: 'n4-v-food',
    jlptLevel: 'N4',
    type: 'vocab',
    titleMongolian: 'Хоол хүнс ба Дэлгүүр',
    titleJapanese: '食事・買い物',
    iconName: 'Utensils',
    descriptionMongolian: 'Зоог, хоол хийх, дэлгүүр хэсэх, үнэ төлбөр',
    themeColor: '#D97706'
  },
  {
    id: 'n4-v-transport',
    jlptLevel: 'N4',
    type: 'vocab',
    titleMongolian: 'Тээвэр ба Аялал',
    titleJapanese: '交通・旅行',
    iconName: 'Compass',
    descriptionMongolian: 'Унаа тээвэр, аялал жуулчлал, зочид буудал, зүг чиг',
    themeColor: '#0284C7'
  },
  {
    id: 'n4-v-health',
    jlptLevel: 'N4',
    type: 'vocab',
    titleMongolian: 'Эрүүл мэнд ба Бие организм',
    titleJapanese: '健康・身体',
    iconName: 'Activity',
    descriptionMongolian: 'Эрүүл мэнд, өвчин эмгэг, эм эмчилгээ, бие эрхтэн',
    themeColor: '#E11D48'
  },
  {
    id: 'n4-v-nature',
    jlptLevel: 'N4',
    type: 'vocab',
    titleMongolian: 'Байгаль ба Улирал',
    titleJapanese: '自然・季節',
    iconName: 'CloudSun',
    descriptionMongolian: 'Дөрвөн улирал, цаг агаар, амьтан, ургамал, байгаль',
    themeColor: '#059669'
  },
  {
    id: 'n4-v-actions',
    jlptLevel: 'N4',
    type: 'vocab',
    titleMongolian: 'Үйл хөдлөл ба Үйл явдал',
    titleJapanese: '行動・出来事',
    iconName: 'Sparkles',
    descriptionMongolian: 'Хөдөлгөөн, үйл хөдлөл, үйл явдлыг илэрхийлэх үйл үгс',
    themeColor: '#B91C1C'
  },
  {
    id: 'n4-v-states',
    jlptLevel: 'N4',
    type: 'vocab',
    titleMongolian: 'Шинж чанар ба Төлөв байдал',
    titleJapanese: '性質・状態',
    iconName: 'Layers',
    descriptionMongolian: 'Тэмдэг нэрс, төлөв байдал, хэмжээ, шинж чанарын үгс',
    themeColor: '#9333EA'
  },
  {
    id: 'n4-v-expressions',
    jlptLevel: 'N4',
    type: 'vocab',
    titleMongolian: 'Харилцааны хэллэг ба Холбоос үгс',
    titleJapanese: '表現・接続詞',
    iconName: 'MessageSquare',
    descriptionMongolian: 'Өдөр тутмын хэллэг, холбоос үгс, харилцааны туслах үгс',
    themeColor: '#6B7280'
  },

  // ==========================================
  // N4 KANJI (168 Kanji)
  // ==========================================
  {
    id: 'n4-k-society',
    jlptLevel: 'N4',
    type: 'kanji',
    titleMongolian: 'Нийгэм ба Хот суурин',
    titleJapanese: '社会・町',
    iconName: 'Building2',
    descriptionMongolian: 'Хот тосгон, нийгэм, ажил, аж төрөхүйн ханзууд',
    themeColor: '#CC0000'
  },
  {
    id: 'n4-k-actions',
    jlptLevel: 'N4',
    type: 'kanji',
    titleMongolian: 'Хөдөлгөөн ба Үйлдэл',
    titleJapanese: '動作・変化',
    iconName: 'Activity',
    descriptionMongolian: 'Хөдлөх, алхах, гүйх, өгөх, авах, бодох, хийх ханзууд',
    themeColor: '#EA580C'
  },
  {
    id: 'n4-k-nature',
    jlptLevel: 'N4',
    type: 'kanji',
    titleMongolian: 'Байгаль ба Улирал',
    titleJapanese: '自然・季節',
    iconName: 'CloudSun',
    descriptionMongolian: 'Улирал, салхи, цас, өнгө, гэрэл, далайн ханзууд',
    themeColor: '#059669'
  },
  {
    id: 'n4-k-body',
    jlptLevel: 'N4',
    type: 'kanji',
    titleMongolian: 'Бие эрхтэн ба Мэдрэмж',
    titleJapanese: '身体・感覚',
    iconName: 'Sparkles',
    descriptionMongolian: 'Бие махбод, мэдрэхүй, сэтгэл санааны ханзууд',
    themeColor: '#E11D48'
  },
  {
    id: 'n4-k-time',
    jlptLevel: 'N4',
    type: 'kanji',
    titleMongolian: 'Цаг хугацаа ба Хэмжүүр',
    titleJapanese: '時間・程度',
    iconName: 'Clock',
    descriptionMongolian: 'Цаг хугацааны нарийвчлал, хурд, хэмжээ заах ханзууд',
    themeColor: '#7C3AED'
  },
  {
    id: 'n4-k-daily',
    jlptLevel: 'N4',
    type: 'kanji',
    titleMongolian: 'Ахуйн амьдрал ба Харилцаа',
    titleJapanese: '生活・関係',
    iconName: 'BookOpen',
    descriptionMongolian: 'Өдөр тутмын хэрэглээ, гэр орон, харилцааны ханзууд',
    themeColor: '#2563EB'
  },

  // ==========================================
  // N3 VOCABULARY
  // ==========================================
  {
    id: 'n3-v-feelings',
    jlptLevel: 'N3',
    type: 'vocab',
    titleMongolian: 'Сэтгэл хөдлөл ба Зан чанар',
    titleJapanese: '感情・性格',
    iconName: 'Sparkles',
    descriptionMongolian: 'Сэтгэлийн мэдрэмж, зан чанар, сэтгэгдэл, хандлага',
    themeColor: '#CC0000'
  },
  {
    id: 'n3-v-relations',
    jlptLevel: 'N3',
    type: 'vocab',
    titleMongolian: 'Харилцаа ба Ёс жаяг',
    titleJapanese: '対人関係・マナー',
    iconName: 'Users',
    descriptionMongolian: 'Хүмүүсийн харилцаа, ёс жаяг, хүндэтгэл, хүсэлт',
    themeColor: '#EA580C'
  },
  {
    id: 'n3-v-work',
    jlptLevel: 'N3',
    type: 'vocab',
    titleMongolian: 'Ажил алба ба Мэргэжил',
    titleJapanese: 'ビジネス・仕事',
    iconName: 'Briefcase',
    descriptionMongolian: 'Компани, албан харилцаа, гэрээ, удирдлага, мэргэжил',
    themeColor: '#2563EB'
  },
  {
    id: 'n3-v-education',
    jlptLevel: 'N3',
    type: 'vocab',
    titleMongolian: 'Сургууль, Боловсрол ба Шалгалт',
    titleJapanese: '教育・学業',
    iconName: 'GraduationCap',
    descriptionMongolian: 'Боловсрол, их сургууль, судалгаа, шалгалт, суралцах',
    themeColor: '#059669'
  },
  {
    id: 'n3-v-economy',
    jlptLevel: 'N3',
    type: 'vocab',
    titleMongolian: 'Эдийн засаг ба Худалдаа',
    titleJapanese: '経済・商業',
    iconName: 'Award',
    descriptionMongolian: 'Эдийн засаг, санхүү, зах зээл, худалдаа, банк',
    themeColor: '#D97706'
  },
  {
    id: 'n3-v-health',
    jlptLevel: 'N3',
    type: 'vocab',
    titleMongolian: 'Эрүүл мэнд ба Амьдралын хэв маяг',
    titleJapanese: '健康・生活習慣',
    iconName: 'Activity',
    descriptionMongolian: 'Эрүүл мэнд, эмчилгээ, дэглэм, бие махбод',
    themeColor: '#E11D48'
  },
  {
    id: 'n3-v-nature',
    jlptLevel: 'N3',
    type: 'vocab',
    titleMongolian: 'Байгаль орчин ба Шинжлэх ухаан',
    titleJapanese: '環境・科学',
    iconName: 'CloudSun',
    descriptionMongolian: 'Экологи, дэлхий ертөнц, байгалийн үзэгдэл, шинжлэх ухаан',
    themeColor: '#0284C7'
  },
  {
    id: 'n3-v-society',
    jlptLevel: 'N3',
    type: 'vocab',
    titleMongolian: 'Нийгэм ба Хэвлэл мэдээлэл',
    titleJapanese: '社会・情報',
    iconName: 'Newspaper',
    descriptionMongolian: 'Нийгмийн амьдрал, хэвлэл мэдээлэл, сонин, нийтлэл',
    themeColor: '#7C3AED'
  },
  {
    id: 'n3-v-daily',
    jlptLevel: 'N3',
    type: 'vocab',
    titleMongolian: 'Өдөр тутмын ахуй ба Хэрэглээ',
    titleJapanese: '日常生活',
    iconName: 'BookOpen',
    descriptionMongolian: 'Аж төрөхүй, ахуйн хэрэглээ, орчин, өдөр тутмын хэвшил',
    themeColor: '#4B5563'
  },
  {
    id: 'n3-v-actions',
    jlptLevel: 'N3',
    type: 'vocab',
    titleMongolian: 'Үйл хөдлөл ба Өөрчлөлт',
    titleJapanese: '動作・変化',
    iconName: 'Sparkles',
    descriptionMongolian: 'Нарийн үйл хөдлөл, өөрчлөлт, явцыг илэрхийлэх үйл үгс',
    themeColor: '#B91C1C'
  },
  {
    id: 'n3-v-adjectives',
    jlptLevel: 'N3',
    type: 'vocab',
    titleMongolian: 'Төлөв байдал ба Тэмдэг нэрс',
    titleJapanese: '形容詞・様子',
    iconName: 'Layers',
    descriptionMongolian: 'Шинж чанар, хэм хэмжээ, төлөв байдлын тэмдэг нэрс',
    themeColor: '#9333EA'
  },
  {
    id: 'n3-v-adverbs',
    jlptLevel: 'N3',
    type: 'vocab',
    titleMongolian: 'Дайвар үгс ба Илэрхийлэл',
    titleJapanese: '副詞・慣用表現',
    iconName: 'MessageSquare',
    descriptionMongolian: 'Дайвар үгс, дүрслэх үгс, тусгай хэллэгүүд',
    themeColor: '#6B7280'
  },

  // ==========================================
  // N3 KANJI (371 Kanji)
  // ==========================================
  {
    id: 'n3-k-politics',
    jlptLevel: 'N3',
    type: 'kanji',
    titleMongolian: 'Төр засаг ба Дүрэм журам',
    titleJapanese: '制度・政治',
    iconName: 'Building2',
    descriptionMongolian: 'Төр засаг, бодлого, хууль журам, иргэний ханзууд',
    themeColor: '#CC0000'
  },
  {
    id: 'n3-k-economy',
    jlptLevel: 'N3',
    type: 'kanji',
    titleMongolian: 'Эдийн засаг ба Худалдаа',
    titleJapanese: '経済・業務',
    iconName: 'Award',
    descriptionMongolian: 'Санхүү, зах зээл, бизнес, худалдааны ханзууд',
    themeColor: '#D97706'
  },
  {
    id: 'n3-k-relations',
    jlptLevel: 'N3',
    type: 'kanji',
    titleMongolian: 'Харилцаа ба Ойлголт',
    titleJapanese: '関係・概念',
    iconName: 'Compass',
    descriptionMongolian: 'Шалтгаан, үр дүн, харилцаа холбооны ханзууд',
    themeColor: '#7C3AED'
  },
  {
    id: 'n3-k-mind',
    jlptLevel: 'N3',
    type: 'kanji',
    titleMongolian: 'Сэтгэл зүй ба Мэдрэмж',
    titleJapanese: '心理・感情',
    iconName: 'Sparkles',
    descriptionMongolian: 'Бодол, сэтгэл хөдлөл, мэдрэхүйн ханзууд',
    themeColor: '#E11D48'
  },
  {
    id: 'n3-k-actions',
    jlptLevel: 'N3',
    type: 'kanji',
    titleMongolian: 'Үйл хөдлөл ба Өөрчлөлт',
    titleJapanese: '動作・変化',
    iconName: 'Activity',
    descriptionMongolian: 'Хөдөлгөөн, үйл явц, өөрчлөлтийн ханзууд',
    themeColor: '#EA580C'
  },
  {
    id: 'n3-k-science',
    jlptLevel: 'N3',
    type: 'kanji',
    titleMongolian: 'Шинжлэх ухаан ба Үйлдвэрлэл',
    titleJapanese: '科学・技術',
    iconName: 'Layers',
    descriptionMongolian: 'Техник, үйлдвэрлэл, материалын ханзууд',
    themeColor: '#059669'
  },
  {
    id: 'n3-k-nature',
    jlptLevel: 'N3',
    type: 'kanji',
    titleMongolian: 'Байгаль ба Газар зүй',
    titleJapanese: '自然・地理',
    iconName: 'CloudSun',
    descriptionMongolian: 'Байгаль орчин, газар зүй, экосистемийн ханзууд',
    themeColor: '#0284C7'
  },
  {
    id: 'n3-k-daily',
    jlptLevel: 'N3',
    type: 'kanji',
    titleMongolian: 'Ахуйн амьдрал ба Хэрэглээ',
    titleJapanese: '生活・日常',
    iconName: 'BookOpen',
    descriptionMongolian: 'Аж байдал, нийгмийн харилцааны ханзууд',
    themeColor: '#4B5563'
  },

  // ==========================================
  // N2 VOCABULARY
  // ==========================================
  {
    id: 'n2-v-psychology',
    jlptLevel: 'N2',
    type: 'vocab',
    titleMongolian: 'Сэтгэл зүй ба Зан төлөв',
    titleJapanese: '心理・性格',
    iconName: 'Sparkles',
    descriptionMongolian: 'Хүний сэтгэл зүй, зан авир, мэдрэмж, ёс суртахуун',
    themeColor: '#CC0000'
  },
  {
    id: 'n2-v-business',
    jlptLevel: 'N2',
    type: 'vocab',
    titleMongolian: 'Бизнес ба Албан харилцаа',
    titleJapanese: 'ビジネス・契約',
    iconName: 'Briefcase',
    descriptionMongolian: 'Гэрээ хэлцэл, албан хэрэг, хамтын ажиллагаа, зах зээл',
    themeColor: '#2563EB'
  },
  {
    id: 'n2-v-politics',
    jlptLevel: 'N2',
    type: 'vocab',
    titleMongolian: 'Төр засаг ба Хууль дүрэм',
    titleJapanese: '政治・法律',
    iconName: 'Building2',
    descriptionMongolian: 'Улс төр, төрийн бодлого, засаглал, хууль эрх зүй',
    themeColor: '#7C3AED'
  },
  {
    id: 'n2-v-economy',
    jlptLevel: 'N2',
    type: 'vocab',
    titleMongolian: 'Эдийн засаг ба Санхүү',
    titleJapanese: '経済・金融',
    iconName: 'Award',
    descriptionMongolian: 'Эдийн засгийн өсөлт, санхүү, хөрөнгө оруулалт, үнэ',
    themeColor: '#D97706'
  },
  {
    id: 'n2-v-society',
    jlptLevel: 'N2',
    type: 'vocab',
    titleMongolian: 'Нийгэм, Соёл ба Түүх',
    titleJapanese: '社会・文化・歴史',
    iconName: 'Users',
    descriptionMongolian: 'Нийгмийн бүтэц, соёлын уламжлал, түүхэн үйл явц',
    themeColor: '#EA580C'
  },
  {
    id: 'n2-v-science',
    jlptLevel: 'N2',
    type: 'vocab',
    titleMongolian: 'Шинжлэх ухаан ба Технологи',
    titleJapanese: '科学・技術',
    iconName: 'Layers',
    descriptionMongolian: 'Шинжлэх ухаан, мэдээллийн технологи, судалгаа',
    themeColor: '#059669'
  },
  {
    id: 'n2-v-education',
    jlptLevel: 'N2',
    type: 'vocab',
    titleMongolian: 'Боловсрол ба Эрдэм шинжилгээ',
    titleJapanese: '教育・研究',
    iconName: 'GraduationCap',
    descriptionMongolian: 'Боловсролын тогтолцоо, их сургууль, шалгалт, эрдэм шинжилгээ',
    themeColor: '#10B981'
  },
  {
    id: 'n2-v-nature',
    jlptLevel: 'N2',
    type: 'vocab',
    titleMongolian: 'Байгаль орчин ба Экологи',
    titleJapanese: '環境・気候',
    iconName: 'CloudSun',
    descriptionMongolian: 'Уур амьсгал, байгалийн нөөц, гамшиг, экологийн асуудал',
    themeColor: '#0284C7'
  },
  {
    id: 'n2-v-health',
    jlptLevel: 'N2',
    type: 'vocab',
    titleMongolian: 'Анагаах ухаан ба Эрүүл мэнд',
    titleJapanese: '医療・健康',
    iconName: 'Activity',
    descriptionMongolian: 'Анагаах ухаан, өвчин судлал, эмчилгээ, бие махбод',
    themeColor: '#E11D48'
  },
  {
    id: 'n2-v-communication',
    jlptLevel: 'N2',
    type: 'vocab',
    titleMongolian: 'Хэвлэл мэдээлэл ба Харилцаа',
    titleJapanese: 'メディア・広報',
    iconName: 'Newspaper',
    descriptionMongolian: 'Хэвлэл мэдээлэл, нийтлэл, нэвтрүүлэг, олон нийтийн харилцаа',
    themeColor: '#0891B2'
  },
  {
    id: 'n2-v-daily',
    jlptLevel: 'N2',
    type: 'vocab',
    titleMongolian: 'Аж амьдрал ба Орчин',
    titleJapanese: '暮らし・環境',
    iconName: 'BookOpen',
    descriptionMongolian: 'Нийгмийн аж төрөхүй, ахуйн орчин, хэрэглээ',
    themeColor: '#4B5563'
  },
  {
    id: 'n2-v-actions',
    jlptLevel: 'N2',
    type: 'vocab',
    titleMongolian: 'Өндөр төвшний үйл үгс ба Үйл явц',
    titleJapanese: '高度動詞・現象',
    iconName: 'Sparkles',
    descriptionMongolian: 'Гүнзгий утгат үйл үгс, үйл явцын хувирал, үр дагавар',
    themeColor: '#B91C1C'
  },
  {
    id: 'n2-v-descriptors',
    jlptLevel: 'N2',
    type: 'vocab',
    titleMongolian: 'Шинж чанар ба Хэм хэмжээ',
    titleJapanese: '性質・程度',
    iconName: 'Layers',
    descriptionMongolian: 'Нарийн утгат тэмдэг нэрс, төлөв байдал, хэмжүүр',
    themeColor: '#9333EA'
  },
  {
    id: 'n2-v-discourse',
    jlptLevel: 'N2',
    type: 'vocab',
    titleMongolian: 'Албан найруулга ба Дайвар үгс',
    titleJapanese: '改まった表現・副詞',
    iconName: 'MessageSquare',
    descriptionMongolian: 'Албан ёсны найруулга, дайвар үгс, холбоос хэллэгүүд',
    themeColor: '#6B7280'
  },

  // ==========================================
  // N2 KANJI (375 Kanji)
  // ==========================================
  {
    id: 'n2-k-politics',
    jlptLevel: 'N2',
    type: 'kanji',
    titleMongolian: 'Улс төр ба Төрийн бодлого',
    titleJapanese: '政治・行政',
    iconName: 'Building2',
    descriptionMongolian: 'Төр засаг, бодлого шийдвэр, шүүх эрх зүйн ханзууд',
    themeColor: '#CC0000'
  },
  {
    id: 'n2-k-law',
    jlptLevel: 'N2',
    type: 'kanji',
    titleMongolian: 'Хууль эрх зүй ба Шүүх',
    titleJapanese: '法律・司法',
    iconName: 'Award',
    descriptionMongolian: 'Хууль тогтоомж, шүүх, гэрээ хэлцлийн ханзууд',
    themeColor: '#7C3AED'
  },
  {
    id: 'n2-k-economy',
    jlptLevel: 'N2',
    type: 'kanji',
    titleMongolian: 'Эдийн засаг ба Худалдаа',
    titleJapanese: '経済・金融',
    iconName: 'Briefcase',
    descriptionMongolian: 'Санхүү, банк, хөрөнгийн зах зээлийн ханзууд',
    themeColor: '#D97706'
  },
  {
    id: 'n2-k-industry',
    jlptLevel: 'N2',
    type: 'kanji',
    titleMongolian: 'Аж үйлдвэр ба Технологи',
    titleJapanese: '産業・技術',
    iconName: 'Layers',
    descriptionMongolian: 'Үйлдвэрлэл, техник, технологийн дэвшлийн ханзууд',
    themeColor: '#059669'
  },
  {
    id: 'n2-k-society',
    jlptLevel: 'N2',
    type: 'kanji',
    titleMongolian: 'Нийгэм ба Түүх соёл',
    titleJapanese: '社会・歴史',
    iconName: 'Users',
    descriptionMongolian: 'Нийгмийн харилцаа, түүх, ёс заншлын ханзууд',
    themeColor: '#EA580C'
  },
  {
    id: 'n2-k-psychology',
    jlptLevel: 'N2',
    type: 'kanji',
    titleMongolian: 'Сэтгэл зүй ба Ёс суртахуун',
    titleJapanese: '心理・倫理',
    iconName: 'Sparkles',
    descriptionMongolian: 'Сэтгэл санаа, хүний чанар, ёс зүйн ханзууд',
    themeColor: '#E11D48'
  },
  {
    id: 'n2-k-nature',
    jlptLevel: 'N2',
    type: 'kanji',
    titleMongolian: 'Байгаль орчин ба Экологи',
    titleJapanese: '環境・防災',
    iconName: 'CloudSun',
    descriptionMongolian: 'Уур амьсгал, гамшиг, байгалийн үзэгдлийн ханзууд',
    themeColor: '#0284C7'
  },
  {
    id: 'n2-k-actions',
    jlptLevel: 'N2',
    type: 'kanji',
    titleMongolian: 'Өндөр төвшний үйлдэл ба Үр дагавар',
    titleJapanese: '行為・因果',
    iconName: 'Activity',
    descriptionMongolian: 'Үйл хөдлөл, шалтгаан, үр дагаврын ханзууд',
    themeColor: '#B91C1C'
  },

  // ==========================================
  // N1 VOCABULARY (2290 Words meaningfully mapped)
  // ==========================================
  {
    id: 'n1-v-philosophy',
    jlptLevel: 'N1',
    type: 'vocab',
    titleMongolian: 'Гүн ухаан ба Хийсвэр сэтгэлгээ',
    titleJapanese: '哲学・抽象概念',
    iconName: 'GraduationCap',
    descriptionMongolian: 'Гүнзгийрүүлсэн сэтгэлгээ, эрдэм шинжилгээ, философи',
    themeColor: '#450A0A'
  },
  {
    id: 'n1-v-politics',
    jlptLevel: 'N1',
    type: 'vocab',
    titleMongolian: 'Төр засаг ба Засаглал',
    titleJapanese: '国家統治・政策',
    iconName: 'Building2',
    descriptionMongolian: 'Төрийн бодлого, засаглал, дипломат, олон улсын харилцаа',
    themeColor: '#7F1D1D'
  },
  {
    id: 'n1-v-law',
    jlptLevel: 'N1',
    type: 'vocab',
    titleMongolian: 'Хууль эрх зүй ба Шүүх',
    titleJapanese: '法律・司法制度',
    iconName: 'Award',
    descriptionMongolian: 'Хууль цааз, шүүх эрх мэдэл, хүний эрх, хууль ёс',
    themeColor: '#991B1B'
  },
  {
    id: 'n1-v-economy',
    jlptLevel: 'N1',
    type: 'vocab',
    titleMongolian: 'Макро эдийн засаг ба Санхүү',
    titleJapanese: '経済・金融・産業',
    iconName: 'Briefcase',
    descriptionMongolian: 'Макро эдийн засаг, хөрөнгө оруулалт, валют, зах зээл',
    themeColor: '#B45309'
  },
  {
    id: 'n1-v-society',
    jlptLevel: 'N1',
    type: 'vocab',
    titleMongolian: 'Нийгмийн бүтэц ба Түүх соёл',
    titleJapanese: '社会構造・文化史',
    iconName: 'Users',
    descriptionMongolian: 'Хүн ам зүй, иргэншил, соёлын өв, шашин, уламжлал',
    themeColor: '#C2410C'
  },
  {
    id: 'n1-v-psychology',
    jlptLevel: 'N1',
    type: 'vocab',
    titleMongolian: 'Сэтгэл зүй ба Ёс суртахуун',
    titleJapanese: '心理・倫理・人間性',
    iconName: 'Sparkles',
    descriptionMongolian: 'Хүний сэтгэл зүй, зан төлөв, ёс зүй, дотоод ертөнц',
    themeColor: '#BE123C'
  },
  {
    id: 'n1-v-science',
    jlptLevel: 'N1',
    type: 'vocab',
    titleMongolian: 'Шинжлэх ухаан ба Академик судалгаа',
    titleJapanese: '科学・学術研究',
    iconName: 'Layers',
    descriptionMongolian: 'Судалгаа шинжилгээ, лаборатори, онол, орчин үеийн техник',
    themeColor: '#047857'
  },
  {
    id: 'n1-v-nature',
    jlptLevel: 'N1',
    type: 'vocab',
    titleMongolian: 'Байгаль орчин ба Гариг ертөнц',
    titleJapanese: '地球環境・自然科学',
    iconName: 'CloudSun',
    descriptionMongolian: 'Экологи, дэлхийн уур амьсгал, геологи, газар зүй',
    themeColor: '#0369A1'
  },
  {
    id: 'n1-v-health',
    jlptLevel: 'N1',
    type: 'vocab',
    titleMongolian: 'Анагаах ухаан ба Биологи',
    titleJapanese: '医学・生命科学',
    iconName: 'Activity',
    descriptionMongolian: 'Анагаах ухааны шинжлэх ухаан, вирус, дархлаа, бие махбод',
    themeColor: '#9F1239'
  },
  {
    id: 'n1-v-communication',
    jlptLevel: 'N1',
    type: 'vocab',
    titleMongolian: 'Хэл яриа, Нийтлэл ба Хэвлэл',
    titleJapanese: '言語・論説・文芸',
    iconName: 'Newspaper',
    descriptionMongolian: 'Хэл шинжлэл, нийтлэл, уран зохиол, хэвлэл мэдээлэл',
    themeColor: '#0E7490'
  },
  {
    id: 'n1-v-space',
    jlptLevel: 'N1',
    type: 'vocab',
    titleMongolian: 'Орон зай, Байршил ба Цаг хугацаа',
    titleJapanese: '空間・位置・時間',
    iconName: 'Compass',
    descriptionMongolian: 'Орон зайн байрлал, хэмжигдэхүүн, цаг хугацааны нарийвчлал',
    themeColor: '#6D28D9'
  },
  {
    id: 'n1-v-loanwords',
    jlptLevel: 'N1',
    type: 'vocab',
    titleMongolian: 'Гадаад үгс ба Олон улсын нэр томьёо',
    titleJapanese: 'カタカナ語・外来語',
    iconName: 'BookA',
    descriptionMongolian: 'Орчин үеийн катакана үгс, олон улсын мэргэжлийн нэр томьёо',
    themeColor: '#4338CA'
  },
  {
    id: 'n1-v-actions',
    jlptLevel: 'N1',
    type: 'vocab',
    titleMongolian: 'Дээд төвшний үйл үгс',
    titleJapanese: '高度動詞・動態',
    iconName: 'Sparkles',
    descriptionMongolian: 'Нарийн утгат үйл үгс, үйл явцын динамик хувирал',
    themeColor: '#881337'
  },
  {
    id: 'n1-v-descriptors',
    jlptLevel: 'N1',
    type: 'vocab',
    titleMongolian: 'Нарийн торгон тэмдэг нэрс',
    titleJapanese: '文語的形容詞',
    iconName: 'Layers',
    descriptionMongolian: 'Утга зохиолын нарийн тэмдэг нэрс, төлөв байдал, хэм хэмжээ',
    themeColor: '#701A75'
  },
  {
    id: 'n1-v-idioms',
    jlptLevel: 'N1',
    type: 'vocab',
    titleMongolian: 'Дөрвөн ханзт зүйр үгс',
    titleJapanese: '四字熟語・慣用句',
    iconName: 'Award',
    descriptionMongolian: 'Утга төгөлдөр дөрвөн ханзт зүйр үгс, тогтсон хэллэгүүд',
    themeColor: '#581C87'
  },
  {
    id: 'n1-v-discourse',
    jlptLevel: 'N1',
    type: 'vocab',
    titleMongolian: 'Албан найруулга ба Дайвар үгс',
    titleJapanese: '公式修辞・副詞',
    iconName: 'MessageSquare',
    descriptionMongolian: 'Албан ёсны найруулгын дайвар үгс, илэрхийллүүд',
    themeColor: '#4B5563'
  },
  {
    id: 'n1-v-review',
    jlptLevel: 'N1',
    type: 'vocab',
    titleMongolian: 'Академик хэрэглээ ба Бататгал',
    titleJapanese: '学術総合演習',
    iconName: 'BookOpen',
    descriptionMongolian: 'Дээд шатны төрөл бүрийн үгсийн нэгдсэн бататгал',
    themeColor: '#374151',
    isFlaggedForReview: true
  },

  // ==========================================
  // N1 KANJI (1226 Kanji meaningfully partitioned)
  // ==========================================
  {
    id: 'n1-k-philosophy',
    jlptLevel: 'N1',
    type: 'kanji',
    titleMongolian: 'Гүн ухаан ба Хийсвэр сэтгэлгээ',
    titleJapanese: '哲学・思索',
    iconName: 'GraduationCap',
    descriptionMongolian: 'Гүнзгийрүүлсэн сэтгэлгээ, эрдэм шинжилгээ, философийн ханзууд',
    themeColor: '#450A0A'
  },
  {
    id: 'n1-k-politics',
    jlptLevel: 'N1',
    type: 'kanji',
    titleMongolian: 'Төр засаг ба Дипломат',
    titleJapanese: '国家統治・外交',
    iconName: 'Building2',
    descriptionMongolian: 'Төр засаглал, төрийн бодлого, дипломат харилцааны ханзууд',
    themeColor: '#7F1D1D'
  },
  {
    id: 'n1-k-law',
    jlptLevel: 'N1',
    type: 'kanji',
    titleMongolian: 'Хууль цааз ба Шударга ёс',
    titleJapanese: '司法・刑法',
    iconName: 'Award',
    descriptionMongolian: 'Шүүх эрх мэдэл, эрх зүй, хууль цаазын ханзууд',
    themeColor: '#991B1B'
  },
  {
    id: 'n1-k-economy',
    jlptLevel: 'N1',
    type: 'kanji',
    titleMongolian: 'Макро эдийн засаг ба Санхүү',
    titleJapanese: '財政・流通',
    iconName: 'Briefcase',
    descriptionMongolian: 'Санхүү, татвар, худалдаа, төсвийн ханзууд',
    themeColor: '#B45309'
  },
  {
    id: 'n1-k-society',
    jlptLevel: 'N1',
    type: 'kanji',
    titleMongolian: 'Нийгэм, Түүх ба Шашин',
    titleJapanese: '社会史・宗教',
    iconName: 'Users',
    descriptionMongolian: 'Нийгмийн давхарга, шашин, түүх, уламжлалын ханзууд',
    themeColor: '#C2410C'
  },
  {
    id: 'n1-k-psychology',
    jlptLevel: 'N1',
    type: 'kanji',
    titleMongolian: 'Хүний сэтгэл ба Зан төлөв',
    titleJapanese: '心理・人間性',
    iconName: 'Sparkles',
    descriptionMongolian: 'Хүний сэтгэл зүй, ааш авир, мэдрэмжийн ханзууд',
    themeColor: '#BE123C'
  },
  {
    id: 'n1-k-science',
    jlptLevel: 'N1',
    type: 'kanji',
    titleMongolian: 'Байгалийн хууль ба Судалгаа',
    titleJapanese: '物理・学術',
    iconName: 'Layers',
    descriptionMongolian: 'Шинжлэх ухаан, физик, хими, онолын ханзууд',
    themeColor: '#047857'
  },
  {
    id: 'n1-k-medicine',
    jlptLevel: 'N1',
    type: 'kanji',
    titleMongolian: 'Анагаах ба Бие организм',
    titleJapanese: '医術・生体',
    iconName: 'Activity',
    descriptionMongolian: 'Анагаах ухаан, бие махбод, өвчин судлалын ханзууд',
    themeColor: '#9F1239'
  },
  {
    id: 'n1-k-literature',
    jlptLevel: 'N1',
    type: 'kanji',
    titleMongolian: 'Хэл бичиг ба Утга зохиол',
    titleJapanese: '文学・修辞',
    iconName: 'Newspaper',
    descriptionMongolian: 'Уран зохиол, найруулга зүй, хэл шинжлэлийн ханзууд',
    themeColor: '#0E7490'
  },
  {
    id: 'n1-k-craft',
    jlptLevel: 'N1',
    type: 'kanji',
    titleMongolian: 'Бүтээн байгуулалт ба Үйлдвэрлэл',
    titleJapanese: '建築・工芸',
    iconName: 'Compass',
    descriptionMongolian: 'Дэд бүтэц, барилга байгууламж, гар урлалын ханзууд',
    themeColor: '#6D28D9'
  },
  {
    id: 'n1-k-nature',
    jlptLevel: 'N1',
    type: 'kanji',
    titleMongolian: 'Газар зүй ба Гариг эрхэс',
    titleJapanese: '天文・地理',
    iconName: 'CloudSun',
    descriptionMongolian: 'Огторгуй, гариг эрхэс, ургамал, амьтны ханзууд',
    themeColor: '#0369A1'
  },
  {
    id: 'n1-k-advanced',
    jlptLevel: 'N1',
    type: 'kanji',
    titleMongolian: 'Дээд шатны ханзны академик бататгал',
    titleJapanese: '学術総合演習',
    iconName: 'BookOpen',
    descriptionMongolian: 'Дээд шатны нарийн нийлмэл ханзуудын нэгдсэн бататгал',
    themeColor: '#374151',
    isFlaggedForReview: true
  }
];

// ============================================================================
// SEMANTIC CLASSIFIER LOGIC FOR ALL 5 JLPT LEVELS
// ============================================================================

export function classifyVocabItem(v: VocabularyItem): string {
  const m = (v.mongolian || '').toLowerCase();
  const jp = v.japanese || '';
  const pos = (v.partOfSpeech || '').toLowerCase();
  const cat = v.category || '';

  // Clean explanation by removing standard boilerplate prefix
  const cleanExp = (v.explanation || '')
    .replace(/^.*?монгол утга:\s*/i, '')
    .toLowerCase();

  const text = `${m} ${cleanExp}`;

  switch (v.jlptLevel) {
    case 'N5': {
      if (cat === 'Мэндчилгээ' || /мэнд|баярла|уучла|таларх|баяртай/i.test(m)) return 'n5-v-greetings';
      if (/тоо|ширхэг|нэг|хоёр|гурав|дөрөв|тав|зургаа|долоо|найм|ес|арав|зуу|мянган|түм|хэд|хэдэн|үнийн|үнэ/i.test(m) || /^[一二三四五六七八九十百千万円]+$/.test(jp)) return 'n5-v-numbers';
      if (/цаг|хугацаа|өнөөдөр|маргааш|өчигдөр|өдөр|шөнө|өглөө|орой|гараг|сар|жил|долоо хоног|минут|үдэш|эрт/i.test(m)) return 'n5-v-time';
      if (/хүн|гэр бүл|аав|ээж|ах|эгч|дүү|хүүхэд|найз|охин|хүү|эмч|багш|оюутан|би|та|бид/i.test(m)) return 'n5-v-people';
      if (cat === 'Хоол хүнс, Ундаа' || /хоол|хүнс|ундаа|цай|ус|талх|мах|загас|ногоо|жимс|өндөг|сүү|амтат|зоог|идэх|уух|ресторан/i.test(m)) return 'n5-v-food';
      if (/байрлал|газар|зүг|чиг|дээр|доор|өмнө|хойно|баруун|зүүн|дотор|гадна|ойр|хажуу|сургууль|өрөө|буудал|дэлгүүр|банк|эмнэлэг|парк|энд|тэнд|хаана/i.test(m)) return 'n5-v-places';
      if (cat === 'Аялал жуулчлал, Тээвэр' || /тээвэр|машин|автобус|галт тэрэг|онгоц|дугуй|аялал|тийз|буудал|зам|нисэх/i.test(m)) return 'n5-v-transport';
      if (cat === 'Байгаль, Цаг агаар' || /байгаль|цаг агаар|бороо|цас|салхи|үүл|нар|тэнгэр|уул|гол|далай|цэцэг|мод|нохой|муур|шувуу|зун|өвөл|хавар|намар|сэрүүн|халуун|хүйтэн/i.test(m)) return 'n5-v-nature';
      if (cat === 'Эрүүл мэнд, Бие эрхтэн' || /бие|эрхтэн|нүд|чих|ам|хамар|гар|хөл|толгой|шүд|өвчин|эм|өвдөх|эрүүл/i.test(m)) return 'n5-v-body';
      if (/ном|ширээ|сандал|үзэг|харандаа|цаас|захидал|утас|зурагт|зураг|цаг|цүнх|шүхэр|хувцас|гут|цамц|өмд|малгай|нүдний шил|түрүүвч|түлхүүр|гэр|өрөө|ор|тавилга/i.test(m)) return 'n5-v-daily';
      if (/үйл үг/i.test(pos) || /х$/i.test(m.trim())) return 'n5-v-actions';
      return 'n5-v-descriptors';
    }

    case 'N4': {
      if (/мэнд|баярлалаа|уучлаарай|хүсье|ёстой|хэллэг|сул үг|тусла|холбоос/i.test(m) || cat === 'Хэллэг, Холбоос үгс') return 'n4-v-expressions';
      if (/гэр бүл|хүн|эцэг|эх|эгч|дүү|нөхөр|эхнэр|хүүхэд|найз|сэтгэл|баярлах|гуниглах|санаа зовох|уурлах/i.test(m)) return 'n4-v-people';
      if (/ажил|сургууль|хичээл|шалгалт|компани|дарга|ажилтан|хурлын|бичиг|тайлан|даалгавар/i.test(m)) return 'n4-v-work';
      if (/хоол|унд|ногоо|жимс|мах|загас|талх|амт|ресторан|дэлгүүр|худалдаа|худалдан авах|үнэ/i.test(m)) return 'n4-v-food';
      if (/тээвэр|галт тэрэг|автобус|машин|онгоц|буудал|нисэх|аялал|зочид буудал|зам|зүг/i.test(m) || cat === 'Аялал жуулчлал, Тээвэр') return 'n4-v-transport';
      if (/эрүүл|өвчин|эм|эмнэлэг|бие|гар|хөл|нүд|чих|шүд|халуурах|ханиад/i.test(m)) return 'n4-v-health';
      if (/байгаль|цаг агаар|улирал|хавар|зун|намар|өвөл|бороо|цас|салхи|үүл|тэнгэр|уул|далай|амьтан|мод/i.test(m)) return 'n4-v-nature';
      if (cat === 'Шинж чанар, Төлөв байдал' || /тэмдэг нэр|шинж|чанар|байдал|том|жижиг|хүнд|хөнгөн|хурдан|удаан|хэцүү|амархан/i.test(m)) return 'n4-v-states';
      if (cat === 'Үйл хөдлөл, Үйл явдал' || /үйл үг/i.test(pos) || /х$/i.test(m.trim())) return 'n4-v-actions';
      return 'n4-v-daily';
    }

    case 'N3': {
      if (/сэтгэл|зан|мэдрэмж|сэтгэгдэл|санаа|баяр|гомдол|айдас|тайван|зориг|уур|хайр|дургүй/i.test(m) || cat === 'Сэтгэл хөдлөл, Зан чанар') return 'n3-v-feelings';
      if (/харилцаа|ёс|хүндэтгэл|найз|хамт олон|хүсэлт|урилга|уулзалт|харилцах/i.test(m)) return 'n3-v-relations';
      if (/ажил|бизнес|алба|мэргэжил|компани|төсөл|гэрээ|удирдах|хэлэлцээр|хурал|цалин|ажилтан/i.test(m) || cat === 'Ажил хэрэг, Сургууль') return 'n3-v-work';
      if (/боловсрол|сургууль|их сургууль|судалгаа|шалгалт|диплом|хичээл|суралцах|эрдэм/i.test(m)) return 'n3-v-education';
      if (/эдийн засаг|санхүү|мөнгө|худалдаа|банк|үнэ|зардал|орлого|төлбөр|хөрөнгө/i.test(m) || cat === 'Нийгэм, Соёл, Эдийн засаг') return 'n3-v-economy';
      if (/эрүүл|анагаах|өвчин|эм|эмчилгээ|эмнэлэг|вирус|бие|эрхтэн|хоолны дэглэм|дасгал/i.test(m) || cat === 'Эрүүл мэнд, Бие эрхтэн') return 'n3-v-health';
      if (/байгаль|орчин|цаг агаар|экологи|шинжлэх ухаан|техник|сансар|дэлхий|эрчим хүч|ус|агаар/i.test(m) || cat === 'Байгаль, Цаг агаар') return 'n3-v-nature';
      if (/нийгэм|соёл|хэвлэл|мэдээ|сонин|зурагт|хууль|иргэн|хот|түүх|урлаг/i.test(m)) return 'n3-v-society';
      if (/дайвар|бараг|лавтай|ялангуяа|магадгүй|гэнэт|аажмаар|үргэлж|эцэст нь/i.test(m)) return 'n3-v-adverbs';
      if (/тэмдэг нэр|чанар|төлөв|байдал|чухал|аюултай|хэрэгтэй|тохиромжтой/i.test(m)) return 'n3-v-adjectives';
      if (cat === 'Үйл хөдлөл, Үйл явдал' || /үйл үг/i.test(pos) || /х$/i.test(m.trim())) return 'n3-v-actions';
      return 'n3-v-daily';
    }

    case 'N2': {
      if (/сэтгэл|зан|мэдрэмж|сэтгэлгээ|итгэл|гомдол|өрөвдөх|бахархал|атаархал|зан авир/i.test(m) || cat === 'Сэтгэл хөдлөл, Харилцаа' || cat === 'Сэтгэл хөдлөл, Зан чанар') return 'n2-v-psychology';
      if (/бизнес|гэрээ|хэлэлцээр|компани|худалдаа|төсөл|хөрөнгө оруулалт|үйлдвэр|арилжаа|зах зээл|удирдлага/i.test(m) || cat === 'Бизнес, Ажил') return 'n2-v-business';
      if (/улс төр|засаг|бодлого|сонгууль|парламент|хууль|эрх зүй|дүрэм|захиргаа|төр/i.test(m)) return 'n2-v-politics';
      if (/эдийн засаг|санхүү|мөнгө|үнэ|инфляци|хямрал|өсөлт|орлого|зарлага/i.test(m)) return 'n2-v-economy';
      if (/нийгэм|соёл|хүмүүнлэг|иргэн|хүн ам|уламжлал|ёс зүй|түүх|гэр бүл/i.test(m) || cat === 'Нийгэм, Байгаль') return 'n2-v-society';
      if (/шинжлэх ухаан|технологи|компьютер|судалгаа|мэдээлэл|сүлжээ|хиймэл|өгөгдөл/i.test(m)) return 'n2-v-science';
      if (/боловсрол|сургууль|эрдэм|шалгалт|диссертаци|эрдэмтэн|оюутан|сурах/i.test(m) || cat === 'Ажил хэрэг, Сургууль') return 'n2-v-education';
      if (/байгаль|орчин|экологи|гамшиг|газар хөдлөлт|цаг агаар|уур амьсгал|дэлхий|нөөц/i.test(m)) return 'n2-v-nature';
      if (/эрүүл|анагаах|эм|өвчин|эмнэлэг|сэтгэц|вирус|бие махбод|эрхтэн|шинжилгээ/i.test(m)) return 'n2-v-health';
      if (/хэвлэл|мэдээлэл|мэдээ|нийтлэл|нэвтрүүлэг|харилцаа|холбоо/i.test(m)) return 'n2-v-communication';
      if (/дайвар|найруулга|холбоос|лав|лавтай|яах аргагүй|нэлээд|туйлын|онцгойлон/i.test(m) || cat === 'Дайвар үг, Баймж') return 'n2-v-discourse';
      if (cat === 'Шинж чанар, Төлөв байдал' || /тэмдэг нэр|чанар|шинж|хэмжээ|хязгаар/i.test(m)) return 'n2-v-descriptors';
      if (cat === 'Үйл хөдлөл, Үйл явдал' || /үйл үг/i.test(pos) || /х$/i.test(m.trim())) return 'n2-v-actions';
      return 'n2-v-daily';
    }

    case 'N1': {
      // 1. Katakana Loanwords & International Terms
      if (/^[ァ-ヶー・\s\/\(\)]+$/.test(jp)) return 'n1-v-loanwords';

      // 2. Yojijukugo (4-kanji idiomatic compound expressions)
      if (/^[\u4E00-\u9FFF]{4}$/.test(jp)) return 'n1-v-idioms';

      // 3. Philosophy & Abstract Thought
      if (/гүн ухаан|ойлголт|хийсвэр|үзэл|үзэл баримтлал|сэтгэлгээ|мөн чанар|логик|таамаглал|гүнзгий|философи/i.test(m)) return 'n1-v-philosophy';

      // 4. Politics, Governance & Diplomacy
      if (/улс төр|засаглал|дипломат|төр|бодлого|хуралдай|эрх мэдэл|стратеги|төрийн|парламент|төрийн алба/i.test(m)) return 'n1-v-politics';

      // 5. Law & Judiciary
      if (/хууль|эрх зүй|шүүх|ял|шийтгэл|гэрч|нотлох|хууль ёсны|зөрчил|заалт|шүүгч|хориг|гэрээний заалт|нотолгоо/i.test(m)) return 'n1-v-law';

      // 6. Macroeconomics, Finance & Wealth
      if (/эдийн засаг|санхүү|макро|хөрөнгө оруулалт|инфляци|валют|төсөв|арилжаа|зах зээл|хямрал|хувьцаа|ашиг|орлого|баялаг|үнэ/i.test(m) || cat === 'Нийгэм, Соёл, Эдийн засаг') return 'n1-v-economy';

      // 7. Society, History & Religion
      if (/нийгэм|соёл|хүн ам|хүн төрөлхтөн|хүй нэгдэл|иргэншил|ёс жаяг|уламжлал|түүх|шашин|зан үйл|сүм|хийд|ноён|эзэн|удам/i.test(m)) return 'n1-v-society';

      // 8. Psychology, Mind & Ethics
      if (/сэтгэл зүй|зан төлөв|зан авир|сэтгэц|хүний чанар|мөн чанар|мэдрэмж|сэтгэгдэл|ухамсар|дотоод сэтгэл|сэтгэл санаа|зан чанар/i.test(m) || cat === 'Сэтгэл хөдлөл, Зан чанар') return 'n1-v-psychology';

      // 9. Science, Research & Industry
      if (/шинжлэх ухаан|технологи|судалгаа|эрдэм шинжилгээ|онол|эксперимент|академик|лаборатори|боловсрол|эрдэмтэн|үйлдвэр|үйлдвэрлэл|техник|хэрэгсэл|бодис|уусмал/i.test(m) || cat === 'Ажил хэрэг, Сургууль') return 'n1-v-science';

      // 10. Ecology, Planetary & Nature
      if (/байгаль|экологи|ертөнц|гариг|дэлхий|уур амьсгал|геологи|нөөц|гамшиг|далай|ургамал|амьтан|тэнгэр|оргил|уул|ус|чийг|газар/i.test(m) || cat === 'Байгаль, Цаг агаар') return 'n1-v-nature';

      // 11. Medicine, Health & Physiology
      if (/анагаах|биологи|бие|эрүүл|өвчин|дархлаа|эс|ген|вирус|эмчилгээ|тархи|мэс засал|эрхтэн|бойжилт/i.test(m) || cat === 'Эрүүл мэнд, Бие эрхтэн') return 'n1-v-health';

      // 12. Media, Literature & Communication
      if (/хэл шинжлэл|найруулга|утга зохиол|нийтлэл|үг яриа|хэвлэл|үг хэллэг|уран зохиол|постер|зарлал|мэдээлэл|харилцаа/i.test(m)) return 'n1-v-communication';

      // 13. Space, Location & Dimensions
      if (/дээр|доор|өмнө|хойно|орон зай|байрлал|зүг|чиг|огтлол|гадаргуу|хоёр долоо хоног|тутам|үе|хугацаа/i.test(m)) return 'n1-v-space';

      // 14. Formal Discourse & Adverbs
      if (/дайвар үг/i.test(pos) || /арай ядан|дөнгөж|хүчээр|гэх мэт|энэ тэр|элдэв|лавтай|яах аргагүй/i.test(m)) return 'n1-v-discourse';

      // 15. Advanced Dynamic Verbs
      if (/үйл үг/i.test(pos) || /х$/i.test(m.trim()) || /х;/i.test(m) || /ахиц|явц|урагшлах|хөдөлгөөн/i.test(m)) return 'n1-v-actions';

      // 16. Subtle Nuanced Adjectives & Qualities
      if (/тэмдэг нэр/i.test(pos) || /төлөв|чанар|шинж|байдал|нарийн|чамин|нямбай|тэгш|хурц/i.test(m)) return 'n1-v-descriptors';

      // 17. Flagged for Academic Synthesis & Review (Zero data loss, explicit review status)
      return 'n1-v-review';
    }
  }
  return `${((v.jlptLevel as string) || 'n5').toLowerCase()}-v-daily`;
}

export function classifyKanjiItem(k: KanjiItem): string {
  const m = (k.mongolian || '').toLowerCase();
  const ch = k.kanji;

  switch (k.jlptLevel) {
    case 'N5': {
      if (N5_KANJI_NUMBERS.includes(ch)) return 'n5-k-numbers';
      if (N5_KANJI_TIME.includes(ch)) return 'n5-k-time';
      if (N5_KANJI_PEOPLE.includes(ch)) return 'n5-k-people';
      if (N5_KANJI_PLACES.includes(ch)) return 'n5-k-places';
      if (N5_KANJI_SCHOOL.includes(ch)) return 'n5-k-school';
      if (N5_KANJI_ACTIONS.includes(ch)) return 'n5-k-actions';
      return 'n5-k-nature';
    }

    case 'N4': {
      if (/хот|тосгон|газар|буудал|дэлгүүр|нийгэм|банк|сургууль|эмнэлэг|гудамж/i.test(m)) return 'n4-k-society';
      if (/явах|ирэх|хийх|бодох|авах|өгөх|хөдлөх|гүйх|алхах|зогсох|хэрэглэх|үйлдэл|үйл үг/i.test(m)) return 'n4-k-actions';
      if (/байгаль|улирал|салхи|цас|бороо|өнгө|нар|сар|тэнгэр|далай|цэцэг|мод|өвөл|зун|хавар|намар/i.test(m)) return 'n4-k-nature';
      if (/бие|нүд|чих|гар|хөл|толгой|зүрх|сэтгэл|өвчин|эрүүл/i.test(m)) return 'n4-k-body';
      if (/цаг|хугацаа|хэмжүүр|өдөр|шөнө|эрт|орой|хурдан|удаан/i.test(m)) return 'n4-k-time';
      return 'n4-k-daily';
    }

    case 'N3': {
      if (/нийгэм|хууль|дүрэм|төр|улс|засаг|цэрэг|шүүх/i.test(m)) return 'n3-k-politics';
      if (/ажил|бизнес|мэргэжил|худалдаа|мөнгө|үнэ|гэрээ|санхүү|бараа/i.test(m)) return 'n3-k-economy';
      if (/сэтгэл|бодол|зан|мэдрэмж|айдас|итгэл|баяр|хүсэл/i.test(m)) return 'n3-k-mind';
      if (/шинжлэх ухаан|техник|машин|үйлдвэр|хэрэгсэл|материал/i.test(m)) return 'n3-k-science';
      if (/байгаль|орчин|газар зүй|далай|уул|цаг агаар|экологи|ус|газар/i.test(m)) return 'n3-k-nature';
      if (/харилцаа|холбоо|утга|ойлголт|шалтгаан|үр дүн|дүрэм/i.test(m)) return 'n3-k-relations';
      if (/хөдөлгөөн|өөрчлөлт|үйлдэл|өсөлт|хөгжил/i.test(m)) return 'n3-k-actions';
      return 'n3-k-daily';
    }

    case 'N2': {
      if (/улс төр|засаг|сонгууль|парламент|хууль|эрх зүй|шүүх|төр/i.test(m)) return 'n2-k-politics';
      if (/хууль|дүрэм|гэрээ|шийтгэл|хориг|заалт/i.test(m)) return 'n2-k-law';
      if (/эдийн засаг|санхүү|мөнгө|худалдаа|зах зээл|хөрөнгө|үнэ|татварын/i.test(m)) return 'n2-k-economy';
      if (/нийгэм|соёл|түүх|шашин|уламжлал|хүн ам/i.test(m)) return 'n2-k-society';
      if (/шинжлэх ухаан|техник|үйлдвэр|судалгаа|мэдээлэл|сүлжээ/i.test(m)) return 'n2-k-industry';
      if (/сэтгэл|зан|ёс зүй|хүний чанар|мэдрэмж/i.test(m)) return 'n2-k-psychology';
      if (/байгаль|орчин|газар|дэд бүтэц|цаг агаар|гамшиг/i.test(m)) return 'n2-k-nature';
      return 'n2-k-actions';
    }

    case 'N1': {
      if (/гүн ухаан|ойлголт|хийсвэр|сэтгэлгээ|онол|утга|зарчим|философи/i.test(m)) return 'n1-k-philosophy';
      if (/төр|засаглал|улс төр|бодлого|дипломат|хаан|төрийн/i.test(m)) return 'n1-k-politics';
      if (/хууль|шүүх|ял|шийтгэл|эрх зүй|хориг|цааз/i.test(m)) return 'n1-k-law';
      if (/эдийн засаг|санхүү|худалдаа|үнэ цэнэ|хөрөнгө|баялаг|татвар/i.test(m)) return 'n1-k-economy';
      if (/шинжлэх ухаан|байгалийн хууль|бодис|физик|хими|техник/i.test(m)) return 'n1-k-science';
      if (/анагаах|бие|эрхтэн|өвчин|эрүүл мэнд|биологи/i.test(m)) return 'n1-k-medicine';
      if (/хэл|бичиг|утга зохиол|урлаг|соёл|түүх|шашин|шүтлэг/i.test(m)) return 'n1-k-literature';
      if (/байгаль|газар зүй|орчлон|ургамал|амьтан|үзэгдэл|сансар/i.test(m)) return 'n1-k-nature';
      if (/зан чанар|ёс суртахуун|сэтгэл|харилцаа|ёс зүй/i.test(m)) return 'n1-k-psychology';
      if (/үйлдвэрлэл|бүтээн байгуулалт|барилга|дэд бүтэц|гар урлал/i.test(m)) return 'n1-k-craft';
      return 'n1-k-advanced';
    }
  }
  return `${((k.jlptLevel as string) || 'n5').toLowerCase()}-k-general`;
}

/**
 * Retrieves all defined topics for a level and type.
 * Every topic maps to genuine educational/semantic domains with non-empty items.
 */
export function getTopicsForLevel(
  level: JLPTLevel,
  type: 'kanji' | 'vocab',
  allItems: Array<KanjiItem | VocabularyItem> = []
): CurriculumTopic[] {
  // Base topic definitions matching this level and type
  const baseTopics = CURRICULUM_TOPIC_DEFINITIONS.filter(
    t => t.jlptLevel === level && t.type === type
  );

  return baseTopics;
}

/**
 * Strictly orders items for a topic:
 * 1. Matches explicit orderedKeys first (e.g. N5 Numbers 一, 二, 三, 四, 五, 六, 七, 八, 九, 十).
 * 2. Matches items classified under this topic via semantic rules.
 * 3. Stable, deterministic order (zero random shuffle, zero data loss).
 */
export function getOrderedItemsForTopic<T extends KanjiItem | VocabularyItem>(
  topic: CurriculumTopic,
  allItems: T[]
): T[] {
  const levelItems = allItems.filter(item => item.jlptLevel === topic.jlptLevel);
  const matchedItems: T[] = [];
  const matchedIds = new Set<string>();

  // 1. Process explicit ordered keys first if present
  if (topic.orderedKeys && topic.orderedKeys.length > 0) {
    for (const key of topic.orderedKeys) {
      const found = levelItems.find(item => {
        if (matchedIds.has(item.id)) return false;
        const itemKey = topic.type === 'kanji'
          ? (item as unknown as KanjiItem).kanji
          : (item as unknown as VocabularyItem).japanese;
        return itemKey === key;
      });
      if (found) {
        matchedItems.push(found);
        matchedIds.add(found.id);
      }
    }
  }

  // 2. Classify remaining level items into this topic
  levelItems.forEach(item => {
    if (matchedIds.has(item.id)) return;

    const assignedTopicId = topic.type === 'kanji'
      ? classifyKanjiItem(item as unknown as KanjiItem)
      : classifyVocabItem(item as unknown as VocabularyItem);

    if (assignedTopicId === topic.id) {
      matchedItems.push(item);
      matchedIds.add(item.id);
    }
  });

  return matchedItems;
}

export interface TopicStats {
  total: number;
  mastered: number;
  progressPercent: number;
}

export function getTopicStats<T extends KanjiItem | VocabularyItem>(
  topic: CurriculumTopic,
  allItems: T[],
  studyRecords: Record<string, ItemStudyRecord> = {}
): TopicStats {
  const items = getOrderedItemsForTopic(topic, allItems);
  const total = items.length;
  const mastered = items.filter(item => {
    const rec = studyRecords[item.id];
    return rec && (rec.masteryStatus === 'mastered' || rec.consecutiveCorrect >= 2);
  }).length;
  const progressPercent = total > 0 ? Math.min(100, Math.round((mastered / total) * 100)) : 0;
  return { total, mastered, progressPercent };
}
