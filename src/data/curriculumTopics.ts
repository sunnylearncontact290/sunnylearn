import { JLPTLevel, KanjiItem, VocabularyItem } from '../types';

export interface CurriculumTopic {
  id: string;
  jlptLevel: JLPTLevel;
  type: 'kanji' | 'vocab';
  titleMongolian: string;
  titleJapanese: string;
  iconName: string;
  descriptionMongolian: string;
  themeColor: string;
  orderedKeys: string[]; // Deterministic explicit ordering of characters or words
}

export const CURRICULUM_TOPICS: CurriculumTopic[] = [
  // =========================================================================
  // JLPT N5 KANJI TOPICS
  // =========================================================================
  {
    id: 'n5-k-numbers',
    jlptLevel: 'N5',
    type: 'kanji',
    titleMongolian: 'Тоо тоолол',
    titleJapanese: '数字',
    iconName: 'Hash',
    descriptionMongolian: '1-10 хүртэлх тоо болон 100, 1000, 10000, валютын ханзууд',
    themeColor: '#CC0000',
    // MANDATORY ACCEPTANCE TEST A: Exactly 一, 二, 三, 四, 五, 六, 七, 八, 九, 十
    orderedKeys: ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '百', '千', '万', '円']
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
    orderedKeys: ['日', '月', '年', '時', '分', '午', '今', '間', '半', '毎']
  },
  {
    id: 'n5-k-people',
    jlptLevel: 'N5',
    type: 'kanji',
    titleMongolian: 'Хүн ба Гэр бүл',
    titleJapanese: '人・家族',
    iconName: 'Users',
    descriptionMongolian: 'Хүн, гэр бүлийн гишүүд, найз нөхөд илэрхийлэх ханзууд',
    themeColor: '#EA580C',
    orderedKeys: ['人', '男', '女', '子', '父', '母', '友']
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
    orderedKeys: ['上', '下', '中', '左', '右', '前', '後', '東', '西', '南', '北', '外', '国']
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
    orderedKeys: ['本', '学', '校', '先', '生', '名', '語', '電', '車', '何', '休']
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
    orderedKeys: ['見', '聞', '話', '読', '書', '行', '来', '食', '出', '入']
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
    orderedKeys: ['山', '川', '天', '気', '雨', '白', '大', '小', '高', '長', '火', '水', '木', '金', '土']
  },

  // =========================================================================
  // JLPT N5 VOCABULARY TOPICS
  // =========================================================================
  {
    id: 'n5-v-greetings',
    jlptLevel: 'N5',
    type: 'vocab',
    titleMongolian: 'Мэндчилгээ',
    titleJapanese: '挨拶',
    iconName: 'MessageSquare',
    descriptionMongolian: 'Өдөр тутмын мэндчилгээ, талархал, уучлал хүсэх болон ёс зүйн хэллэгүүд',
    themeColor: '#CC0000',
    // MANDATORY ACCEPTANCE TEST B: Appropriate greetings only
    orderedKeys: [
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
    ]
  },
  {
    id: 'n5-v-numbers',
    jlptLevel: 'N5',
    type: 'vocab',
    titleMongolian: 'Тоо ба Тоолол',
    titleJapanese: '数字・数え方',
    iconName: 'Hash',
    descriptionMongolian: 'Тоо, ширхэг, хүн тоолох болон үнэ асуух үгс',
    themeColor: '#EA580C',
    orderedKeys: [
      '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
      '百', '千', '万', '一つ', '二つ', '三つ', '一人', '二人', '一番', '一日', '五日', 'いくら'
    ]
  },
  {
    id: 'n5-v-people',
    jlptLevel: 'N5',
    type: 'vocab',
    titleMongolian: 'Хүн ба Гэр бүл',
    titleJapanese: '人・家族',
    iconName: 'Users',
    descriptionMongolian: 'Би, та, гэр бүлийн гишүүд, найз нөхөд, мэргэжил',
    themeColor: '#DC2626',
    orderedKeys: [
      'わたし', 'あなた', '人', '家族', '父', '母', '兄', '弟', '姉', '妹',
      '友達', '先生', '学生', '医者'
    ]
  },
  {
    id: 'n5-v-time',
    jlptLevel: 'N5',
    type: 'vocab',
    titleMongolian: 'Цаг хугацаа ба Хуанли',
    titleJapanese: '時間・日付',
    iconName: 'Calendar',
    descriptionMongolian: 'Өнөөдөр, маргааш, өдөр шөнө, 7 хоногийн гарагууд, цаг хугацаа',
    themeColor: '#7C3AED',
    orderedKeys: [
      '今', '今日', '明日', '昨日', '毎日', '朝', '昼', '晩', '夜',
      '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日',
      '時間', '分', '間'
    ]
  },
  {
    id: 'n5-v-places',
    jlptLevel: 'N5',
    type: 'vocab',
    titleMongolian: 'Газар орон ба Зүг',
    titleJapanese: '場所・方向',
    iconName: 'MapPin',
    descriptionMongolian: 'Сургууль, өрөө, буудал, зүг чиг заах төлөөний үгс',
    themeColor: '#2563EB',
    orderedKeys: [
      'ここ', 'そこ', 'あそこ', 'どこ', '家', '学校', '駅', '店', 'ホテル',
      '入口', '池', '部屋', '上', '下', '前', '後ろ', '右', '左', '中', '外'
    ]
  },
  {
    id: 'n5-v-food',
    jlptLevel: 'N5',
    type: 'vocab',
    titleMongolian: 'Хоол хүнс ба Зоог',
    titleJapanese: '食事・買い物',
    iconName: 'Utensils',
    descriptionMongolian: 'Хоол, ус, ундаа, өглөө өдрийн хоол болон худалдан авалт',
    themeColor: '#D97706',
    orderedKeys: [
      '食べる', '飲む', 'ご飯', '昼ご飯', '水', 'お茶', 'パン', '卵', '魚', '肉', '買う'
    ]
  },
  {
    id: 'n5-v-daily',
    jlptLevel: 'N5',
    type: 'vocab',
    titleMongolian: 'Өдөр тутмын хэрэглээ',
    titleJapanese: '日常・身の回り',
    iconName: 'Smile',
    descriptionMongolian: 'Ном, сандал, амьтан, өнгө болон өдөр тутмын эд юмс',
    themeColor: '#059669',
    orderedKeys: [
      '本', '本棚', '椅子', '犬', '色', '色々', '飛行機', '暇', '本当', '意味', '一緒', '新しい'
    ]
  },
  {
    id: 'n5-v-verbs',
    jlptLevel: 'N5',
    type: 'vocab',
    titleMongolian: 'Үндсэн үйл үгс',
    titleJapanese: '基本動詞',
    iconName: 'Activity',
    descriptionMongolian: 'Явах, ирэх, харах, сонсох, ярих, унших, бичих, унтах, суралцах',
    themeColor: '#E11D48',
    orderedKeys: [
      '行く', '来る', '帰る', '見る', '聞く', '話す', '読む', '書く',
      '寝る', '起きる', '勉強する', '降る', '会う'
    ]
  },

  // =========================================================================
  // JLPT N4 KANJI TOPICS
  // =========================================================================
  {
    id: 'n4-k-society',
    jlptLevel: 'N4',
    type: 'kanji',
    titleMongolian: 'Нийгэм ба Амьдрал',
    titleJapanese: '社会・生活',
    iconName: 'Building2',
    descriptionMongolian: 'Хот тосгон, нийгэм, ажил, аж төрөхүйн ханзууд',
    themeColor: '#CC0000',
    orderedKeys: ['会', '社', '市', '町', '村', '店', '銀', '病', '院', '屋']
  },
  {
    id: 'n4-k-actions',
    jlptLevel: 'N4',
    type: 'kanji',
    titleMongolian: 'Хөдөлгөөн ба Хэлбэр',
    titleJapanese: '動作・変化',
    iconName: 'Activity',
    descriptionMongolian: 'Хөдлөх, алхах, гүйх, өгөх, авах, бодох, хэрэглэх ханзууд',
    themeColor: '#EA580C',
    orderedKeys: ['動', '歩', '走', '止', '送', '考', '使', '作', '持', '知']
  },
  {
    id: 'n4-k-nature',
    jlptLevel: 'N4',
    type: 'kanji',
    titleMongolian: 'Байгаль ба Цаг агаар',
    titleJapanese: '自然・季節',
    iconName: 'CloudSun',
    descriptionMongolian: 'Улирал, салхи, цас, өнгө, гэрэл, далайн ханзууд',
    themeColor: '#059669',
    orderedKeys: ['春', '夏', '秋', '冬', '風', '雪', '海', '空', '花', '光']
  },

  // =========================================================================
  // JLPT N4 VOCABULARY TOPICS
  // =========================================================================
  {
    id: 'n4-v-daily',
    jlptLevel: 'N4',
    type: 'vocab',
    titleMongolian: 'Өдөр тутмын харилцаа',
    titleJapanese: '日常生活',
    iconName: 'MessageSquare',
    descriptionMongolian: 'Гэр бүл, найз нөхөд, өдөр тутмын хэвшил',
    themeColor: '#CC0000',
    orderedKeys: ['案内する', '手伝う', '故障', '都合', '用意', '準備', '相談']
  },
  {
    id: 'n4-v-work',
    jlptLevel: 'N4',
    type: 'vocab',
    titleMongolian: 'Ажил ба Сургууль',
    titleJapanese: '仕事・学校',
    iconName: 'Briefcase',
    descriptionMongolian: 'Ажлын байр, уулзалт, шалгалт, даалгавар',
    themeColor: '#2563EB',
    orderedKeys: ['連絡', '報告', '説明', '出席', '欠席', '試験', '宿題']
  },

  // =========================================================================
  // JLPT N3 KANJI TOPICS
  // =========================================================================
  {
    id: 'n3-k-concepts',
    jlptLevel: 'N3',
    type: 'kanji',
    titleMongolian: 'Ойлголт ба Харилцаа',
    titleJapanese: '概念・関係',
    iconName: 'Compass',
    descriptionMongolian: 'Шалтгаан, үр дүн, харилцаа холбоо, дүрэм журам',
    themeColor: '#990000',
    orderedKeys: ['因', '果', '関', '係', '制', '度', '規', '則', '法', '律']
  },
  {
    id: 'n3-k-work',
    jlptLevel: 'N3',
    type: 'kanji',
    titleMongolian: 'Бизнес ба Мэргэжил',
    titleJapanese: '業務・職業',
    iconName: 'Briefcase',
    descriptionMongolian: 'Ажил мэргэжил, албан харилцаа, гэрээ хэлцэл',
    themeColor: '#7C2D12',
    orderedKeys: ['職', '業', '務', '資', '料', '報', '告', '契', '約']
  },

  // =========================================================================
  // JLPT N3 VOCABULARY TOPICS
  // =========================================================================
  {
    id: 'n3-v-society',
    jlptLevel: 'N3',
    type: 'vocab',
    titleMongolian: 'Нийгэм ба Мэдээ',
    titleJapanese: '社会・情報',
    iconName: 'Newspaper',
    descriptionMongolian: 'Нийгмийн харилцаа, мэдээлэл, сонин нийтлэл',
    themeColor: '#990000',
    orderedKeys: ['遠慮する', '手続き', '効果的', '経済', '環境', '発展', '影響']
  },

  // =========================================================================
  // JLPT N2 TOPICS
  // =========================================================================
  {
    id: 'n2-k-business',
    jlptLevel: 'N2',
    type: 'kanji',
    titleMongolian: 'Албан хэрэг ба Улс төр',
    titleJapanese: '公式・政治',
    iconName: 'Award',
    descriptionMongolian: 'Төр засаг, бодлого шийдвэр, шүүх эрх зүйн ханзууд',
    themeColor: '#7F1D1D',
    orderedKeys: ['政', '治', '経', '済', '統', '計', '総', '裁', '選', '挙']
  },
  {
    id: 'n2-v-business',
    jlptLevel: 'N2',
    type: 'vocab',
    titleMongolian: 'Мэргэжлийн хэллэг',
    titleJapanese: '専門用語',
    iconName: 'Briefcase',
    descriptionMongolian: 'Бизнесийн албан ёсны харилцаа, гэрээ, зах зээл',
    themeColor: '#7F1D1D',
    orderedKeys: ['妥協', '顕著', '掌握', '推進', '協議', '契約', '実績']
  },

  // =========================================================================
  // JLPT N1 TOPICS
  // =========================================================================
  {
    id: 'n1-k-academic',
    jlptLevel: 'N1',
    type: 'kanji',
    titleMongolian: 'Академик ба Гүн ухаан',
    titleJapanese: '学術・哲学',
    iconName: 'GraduationCap',
    descriptionMongolian: 'Гүнзгийрүүлсэн сэтгэлгээ, эрдэм шинжилгээ, соёл урлаг',
    themeColor: '#450A0A',
    orderedKeys: ['哲', '学', '概', '念', '範', '疇', '乖', '離', '齟', '齬']
  },
  {
    id: 'n1-v-academic',
    jlptLevel: 'N1',
    type: 'vocab',
    titleMongolian: 'Дээд төвшний хэллэг',
    titleJapanese: '高度語彙',
    iconName: 'BookOpen',
    descriptionMongolian: 'Нийтлэл, эрдэм шинжилгээний нарийн илэрхийллүүд',
    themeColor: '#450A0A',
    orderedKeys: ['一目瞭然', '言語道断', '変貌', '兆候', '網羅', '喚起']
  }
];

/**
 * Retrieves all defined topics for a level and type.
 * Also appends a catch-all "Бусад үгс / ханзууд" topic for remaining items in the dataset,
 * ensuring 100% of the database is browsable and accessible without any data loss.
 */
export function getTopicsForLevel(
  level: JLPTLevel,
  type: 'kanji' | 'vocab',
  allItems: Array<KanjiItem | VocabularyItem> = []
): CurriculumTopic[] {
  const topics = CURRICULUM_TOPICS.filter(t => t.jlptLevel === level && t.type === type);
  
  // Find which items are not yet included in any defined topic
  const usedKeys = new Set<string>();
  topics.forEach(t => t.orderedKeys.forEach(k => usedKeys.add(k)));

  const remainingKeys: string[] = [];
  allItems
    .filter(item => item.jlptLevel === level)
    .forEach(item => {
      const key = type === 'kanji' ? (item as KanjiItem).kanji : (item as VocabularyItem).japanese;
      if (!usedKeys.has(key) && !remainingKeys.includes(key)) {
        remainingKeys.push(key);
      }
    });

  if (remainingKeys.length > 0) {
    topics.push({
      id: `${level.toLowerCase()}-${type}-additional`,
      jlptLevel: level,
      type,
      titleMongolian: 'Нэмэлт үгс ба бататгал',
      titleJapanese: '追加・総合練習',
      iconName: 'Layers',
      descriptionMongolian: `Энэ түвшний нийт ${remainingKeys.length} нэмэлт үгс`,
      themeColor: '#6B7280',
      orderedKeys: remainingKeys
    });
  }

  return topics;
}

/**
 * Strictly orders items according to topic.orderedKeys.
 * Guarantees that:
 * 1. Introductory numbers appear as: 一, 二, 三, 四, 五, 六, 七, 八, 九, 十
 * 2. Introductory greetings appear as greetings only.
 * 3. Stable, deterministic order (no random shuffle, no database insertion artifacts).
 */
export function getOrderedItemsForTopic<T extends KanjiItem | VocabularyItem>(
  topic: CurriculumTopic,
  allItems: T[]
): T[] {
  const itemMap = new Map<string, T>();
  
  allItems
    .filter(item => item.jlptLevel === topic.jlptLevel)
    .forEach(item => {
      const key = topic.type === 'kanji' ? (item as unknown as KanjiItem).kanji : (item as unknown as VocabularyItem).japanese;
      if (!itemMap.has(key)) {
        itemMap.set(key, item);
      }
    });

  const ordered: T[] = [];
  for (const key of topic.orderedKeys) {
    const item = itemMap.get(key);
    if (item) {
      ordered.push(item);
    }
  }

  return ordered;
}
