/**
 * Context-Aware Japanese Morphological Reading & Disambiguation Lexicon
 * Provides high-accuracy, context-sensitive readings for JLPT N5–N1 Japanese words,
 * compound kanji, verb/adjective conjugations, and homographic characters (e.g. 間, 今日, 生, 行).
 */

export interface WordLexiconEntry {
  reading: string;
  mongolian?: string;
  partOfSpeech?: string;
  jlptLevel?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
}

/**
 * High-frequency contextual Japanese words & phrases with guaranteed validated readings.
 */
export const CONTEXT_LEXICON: Record<string, WordLexiconEntry> = {
  // --- Target Disambiguation Homographs (as explicitly specified) ---
  '間': { reading: 'あいだ', mongolian: 'Хооронд, зай, хугацаа', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '間に': { reading: 'あいだに', mongolian: 'Хооронд, зуур, үед', partOfSpeech: 'Холбоо үг (дүрэм)', jlptLevel: 'N4' },
  '間に合う': { reading: 'まにあう', mongolian: 'Амжих, цагтаа хүрэх', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N4' },
  '間に合います': { reading: 'まにあいます', mongolian: 'Амжина (эелдэг одоо цаг)', partOfSpeech: 'Үйл үг', jlptLevel: 'N4' },
  '間に合いました': { reading: 'まにあいました', mongolian: 'Амжсан (эелдэг өнгөрсөн цаг)', partOfSpeech: 'Үйл үг', jlptLevel: 'N4' },
  '間に合わない': { reading: 'まにあわない', mongolian: 'Амжихгүй', partOfSpeech: 'Үйл үг', jlptLevel: 'N4' },
  '間に合わなかった': { reading: 'まにあわなかった', mongolian: 'Амжаагүй', partOfSpeech: 'Үйл үг', jlptLevel: 'N4' },
  '間に合わせる': { reading: 'まにあわせる', mongolian: 'Амжуулах, тааруулах', partOfSpeech: 'Үйл үг (2-р бүлэг)', jlptLevel: 'N3' },
  '間違い': { reading: 'まちがい', mongolian: 'Алдаа, эндүүрэл', partOfSpeech: 'Нэр үг', jlptLevel: 'N4' },
  '間違う': { reading: 'まちがう', mongolian: 'Алдаа гаргах, эндүүрэх', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N3' },
  '間違える': { reading: 'まちがえる', mongolian: 'Андуурах, алдах', partOfSpeech: 'Үйл үг (2-р бүлэг)', jlptLevel: 'N3' },
  '時間': { reading: 'じかん', mongolian: 'Цаг хугацаа, цаг', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '一時間': { reading: 'いちじかん', mongolian: 'Нэг цаг', partOfSpeech: 'Цаг хугацааны тоо хэмжээ', jlptLevel: 'N5' },
  '二時間': { reading: 'にじかん', mongolian: 'Хоёр цаг', partOfSpeech: 'Цаг хугацааны тоо хэмжээ', jlptLevel: 'N5' },
  '三時間': { reading: 'さんじかん', mongolian: 'Гурван цаг', partOfSpeech: 'Цаг хугацааны тоо хэмжээ', jlptLevel: 'N5' },
  '週間': { reading: 'しゅうかん', mongolian: 'Долоо хоног (хугацаа)', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '一週間': { reading: 'いっしゅうかん', mongolian: 'Нэг долоо хоног', partOfSpeech: 'Хугацааны тоо хэмжээ', jlptLevel: 'N5' },
  '二週間': { reading: 'にしゅうかん', mongolian: 'Хоёр долоо хоног', partOfSpeech: 'Хугацааны тоо хэмжээ', jlptLevel: 'N5' },
  '期間': { reading: 'きかん', mongolian: 'Хугацаа, үе шат', partOfSpeech: 'Нэр үг', jlptLevel: 'N3' },
  '年間': { reading: 'ねんかん', mongolian: 'Жил (жилийн турш)', partOfSpeech: 'Нэр үг', jlptLevel: 'N3' },
  '人間': { reading: 'にんげん', mongolian: 'Хүн төрөлхтөн, хүн', partOfSpeech: 'Нэр үг', jlptLevel: 'N3' },
  '居間': { reading: 'いま', mongolian: 'Зочны өрөө', partOfSpeech: 'Нэр үг', jlptLevel: 'N3' },

  // --- 今日 & Time Contexts ---
  '今日': { reading: 'きょう', mongolian: 'Өнөөдөр', partOfSpeech: 'Нэр үг / Дайвар үг', jlptLevel: 'N5' },
  '今日中': { reading: 'きょうじゅう', mongolian: 'Өнөөдөртөө багтаж, өнөөдөр дотор', partOfSpeech: 'Дайвар үг', jlptLevel: 'N3' },
  '今日中に': { reading: 'きょうじゅうに', mongolian: 'Өнөөдөртөө багтаан', partOfSpeech: 'Дайвар үг', jlptLevel: 'N3' },
  '明日': { reading: 'あした', mongolian: 'Маргааш', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '昨日': { reading: 'きのう', mongolian: 'Өчигдөр', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '今朝': { reading: 'けさ', mongolian: 'Өнөө өглөө', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '今晩': { reading: 'こんばん', mongolian: 'Өнөө орой', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '今年': { reading: 'ことし', mongolian: 'Энэ жил', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '去年': { reading: 'きょねん', mongolian: 'Өнгөрсөн жил', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '来年': { reading: 'らいねん', mongolian: 'Ирэх жил', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '毎日': { reading: 'まいにち', mongolian: 'Өдөр бүр', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '毎朝': { reading: 'まいあさ', mongolian: 'Өглөө бүр', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '毎晩': { reading: 'まいばん', mongolian: 'Орой бүр', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '午前': { reading: 'ごぜん', mongolian: 'Үдээс өмнө', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '午前中': { reading: 'ごぜんちゅう', mongolian: 'Үдээс өмнөдөө, өглөөний турш', partOfSpeech: 'Нэр үг', jlptLevel: 'N4' },
  '午後': { reading: 'ごご', mongolian: 'Үдээс хойш', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },

  // --- 生 Contexts ---
  '生きる': { reading: 'いきる', mongolian: 'Амьдрах, амьд явах', partOfSpeech: 'Үйл үг (2-р бүлэг)', jlptLevel: 'N4' },
  '生きます': { reading: 'いきます', mongolian: 'Амьдарна', partOfSpeech: 'Үйл үг', jlptLevel: 'N4' },
  '生きて': { reading: 'いきて', mongolian: 'Амьдарч, амьд', partOfSpeech: 'Үйл үг', jlptLevel: 'N4' },
  '生きている': { reading: 'いきている', mongolian: 'Амьдарч байна, амьд байна', partOfSpeech: 'Үйл үг', jlptLevel: 'N4' },
  '生きた': { reading: 'いきた', mongolian: 'Амьдарсан', partOfSpeech: 'Үйл үг', jlptLevel: 'N4' },
  '生きない': { reading: 'いきない', mongolian: 'Амьдрахгүй', partOfSpeech: 'Үйл үг', jlptLevel: 'N4' },
  '生まれる': { reading: 'うまれる', mongolian: 'Төрөх, мэндлэх', partOfSpeech: 'Үйл үг (2-р бүлэг)', jlptLevel: 'N4' },
  '生まれます': { reading: 'うまれます', mongolian: 'Төрнө', partOfSpeech: 'Үйл үг', jlptLevel: 'N4' },
  '生まれました': { reading: 'うまれました', mongolian: 'Төрсөн (мэндэлсэн)', partOfSpeech: 'Үйл үг', jlptLevel: 'N4' },
  '生まれて': { reading: 'うまれて', mongolian: 'Төрөөд, төрж', partOfSpeech: 'Үйл үг', jlptLevel: 'N4' },
  '生まれた': { reading: 'うまれた', mongolian: 'Төрсөн', partOfSpeech: 'Үйл үг', jlptLevel: 'N4' },
  '生まれ': { reading: 'うまれ', mongolian: 'Төрсөн газар, гарал үүсэл', partOfSpeech: 'Нэр үг', jlptLevel: 'N3' },
  '生徒': { reading: 'せいと', mongolian: 'Сурагч, дунд ангийн хүүхэд', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '先生': { reading: 'せんせい', mongolian: 'Багш', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '学生': { reading: 'がくせい', mongolian: 'Оюутан, сурагч', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '生活': { reading: 'せいかつ', mongolian: 'Амьдрал, ахуй', partOfSpeech: 'Нэр үг / する үйл үг', jlptLevel: 'N4' },
  '一生': { reading: 'いっしょう', mongolian: 'Бүх насаараа, насан турш', partOfSpeech: 'Нэр үг', jlptLevel: 'N3' },
  '一生懸命': { reading: 'いっしょうけんめい', mongolian: 'Хамаг чадлаараа, хичээнгүйлэн', partOfSpeech: 'Дайвар үг', jlptLevel: 'N4' },
  '人生': { reading: 'じんせい', mongolian: 'Хүний амьдрал', partOfSpeech: 'Нэр үг', jlptLevel: 'N3' },

  // --- 雨 & 降 Contexts ---
  '雨': { reading: 'あめ', mongolian: 'Бороо', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '大雨': { reading: 'おおあめ', mongolian: 'Ширүүн бороо, их бороо', partOfSpeech: 'Нэр үг', jlptLevel: 'N3' },
  '梅雨': { reading: 'つゆ', mongolian: 'Борооны улирал (Цүю)', partOfSpeech: 'Нэр үг', jlptLevel: 'N3' },
  '降る': { reading: 'ふる', mongolian: 'Орох (бороо, цас)', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '降ります': { reading: 'ふります', mongolian: 'Орно (бороо, цас орно)', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '降りました': { reading: 'ふりました', mongolian: 'Орсон (бороо орсон)', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '降りません': { reading: 'ふりません', mongolian: 'Орохгүй (бороо орохгүй)', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '降って': { reading: 'ふって', mongolian: 'Ороод, орж (降る-ийн て хэлбэр)', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '降っている': { reading: 'ふっている', mongolian: 'Орж байна (бороо орж байна)', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '降っています': { reading: 'ふっています', mongolian: 'Орж байна (эелдэг)', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '降っていた': { reading: 'ふっていた', mongolian: 'Орж байсан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '降った': { reading: 'ふった', mongolian: 'Орсон (бороо, цас орсон)', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '降らない': { reading: 'ふらない', mongolian: 'Орохгүй', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '降らなかった': { reading: 'ふらなかった', mongolian: 'Ороогүй', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '降りそう': { reading: 'ふりそう', mongolian: 'Орох шинжтэй, орох гэж байна', partOfSpeech: 'Үйл үг (төлөв)', jlptLevel: 'N4' },
  '降り始め': { reading: 'ふりはじめ', mongolian: 'Орж эхлэх', partOfSpeech: 'Үйл үг', jlptLevel: 'N3' },
  '降り始めました': { reading: 'ふりはじめました', mongolian: 'Орж эхэлсэн', partOfSpeech: 'Үйл үг', jlptLevel: 'N3' },
  '降り続く': { reading: 'ふりつづく', mongolian: 'Үргэлжлэн орох', partOfSpeech: 'Үйл үг', jlptLevel: 'N3' },
  '降り続いている': { reading: 'ふりつづいている', mongolian: 'Үргэлжлэн орсоор байна', partOfSpeech: 'Үйл үг', jlptLevel: 'N3' },
  '降り出す': { reading: 'ふりだす', mongolian: 'Гэнэт орж эхлэх', partOfSpeech: 'Үйл үг', jlptLevel: 'N4' },
  '降り出しました': { reading: 'ふりだしました', mongolian: 'Орж эхэлсэн', partOfSpeech: 'Үйл үг', jlptLevel: 'N4' },
  '下りる': { reading: 'おりる', mongolian: 'Буух (унаанаас, шатаар)', partOfSpeech: 'Үйл үг (2-р бүлэг)', jlptLevel: 'N5' },
  '降りる': { reading: 'おりる', mongolian: 'Буух (унаанаас буух)', partOfSpeech: 'Үйл үг (2-р бүлэг)', jlptLevel: 'N5' },
  '電車を降りる': { reading: 'でんしゃをおりる', mongolian: 'Галт тэрэгнээс буух', partOfSpeech: 'Холбоо үг', jlptLevel: 'N5' },

  // --- 寝る Contexts ---
  '寝る': { reading: 'ねる', mongolian: 'Унтах, хэвтэх', partOfSpeech: 'Үйл үг (2-р бүлэг)', jlptLevel: 'N5' },
  '寝ます': { reading: 'ねます', mongolian: 'Унтана', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '寝ました': { reading: 'ねました', mongolian: 'Унтсан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '寝て': { reading: 'ねて', mongolian: 'Унтаад, унтаж', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '寝ている': { reading: 'ねている', mongolian: 'Унтаж байгаа, унтаж буй', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '寝ています': { reading: 'ねています', mongolian: 'Унтаж байна', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '寝ていた': { reading: 'ねていた', mongolian: 'Унтаж байсан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '寝た': { reading: 'ねた', mongolian: 'Унтсан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '寝ない': { reading: 'ねない', mongolian: 'Унтахгүй', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },

  // --- 行く Contexts ---
  '行く': { reading: 'いく', mongolian: 'Явах', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '行きます': { reading: 'いきます', mongolian: 'Явна', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '行きました': { reading: 'いきました', mongolian: 'Явсан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '行きません': { reading: 'いきません', mongolian: 'Явахгүй', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '行って': { reading: 'いって', mongolian: 'Яваад, явж', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '行った': { reading: 'いった', mongolian: 'Явсан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '行かない': { reading: 'いかない', mongolian: 'Явахгүй', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '行こう': { reading: 'いこう', mongolian: 'Явцгаая', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '銀行': { reading: 'ぎんこう', mongolian: 'Банк', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '旅行': { reading: 'りょこう', mongolian: 'Аялал', partOfSpeech: 'Нэр үг / する үйл үг', jlptLevel: 'N5' },
  '行う': { reading: 'おこなう', mongolian: 'Зохион байгуулах, үйлдэх', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N4' },

  // --- 食べる Contexts ---
  '食べる': { reading: 'たべる', mongolian: 'Идэх', partOfSpeech: 'Үйл үг (2-р бүлэг)', jlptLevel: 'N5' },
  '食べます': { reading: 'たべます', mongolian: 'Иднэ', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '食べました': { reading: 'たべました', mongolian: 'Идсэн', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '食べません': { reading: 'たべません', mongolian: 'Идэхгүй', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '食べて': { reading: 'たべて', mongolian: 'Идээд, идэж', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '食べた': { reading: 'たべた', mongolian: 'Идсэн', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '食べない': { reading: 'たべない', mongolian: 'Идэхгүй', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '食べ物': { reading: 'たべもの', mongolian: 'Хоол хүнс, идэх юм', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },

  // --- 飲む Contexts ---
  '飲む': { reading: 'のむ', mongolian: 'Уух', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '飲みます': { reading: 'のみます', mongolian: 'Ууна', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '饮みました': { reading: 'のみました', mongolian: 'Уусан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '飲んで': { reading: 'のんで', mongolian: 'Уугаад, ууж', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '飲んだ': { reading: 'のんだ', mongolian: 'Уусан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '飲み物': { reading: 'のみもの', mongolian: 'Уух зүйл, ундаа', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },

  // --- 見る Contexts ---
  '見る': { reading: 'みる', mongolian: 'Харах, үзэх', partOfSpeech: 'Үйл үг (2-р бүлэг)', jlptLevel: 'N5' },
  '見ます': { reading: 'みます', mongolian: 'Харна, үзнэ', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '見ました': { reading: 'みました', mongolian: 'Харсан, үзсэн', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '見て': { reading: 'みて', mongolian: 'Хараад, үзээд', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '見た': { reading: 'みた', mongolian: 'Харсан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '見ない': { reading: 'みない', mongolian: 'Харахгүй', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },

  // --- 聞く Contexts ---
  '聞く': { reading: 'きく', mongolian: 'Сонсох, асуух', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '聞きます': { reading: 'ききます', mongolian: 'Сонсоно', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '聞きました': { reading: 'ききました', mongolian: 'Сонссон', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '聞いて': { reading: 'きいて', mongolian: 'Сонсоод', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '聞いた': { reading: 'きいた', mongolian: 'Сонссон', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },

  // --- 書く Contexts ---
  '書く': { reading: 'かく', mongolian: 'Бичих', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '書きます': { reading: 'かきます', mongolian: 'Бичнэ', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '書きました': { reading: 'かきました', mongolian: 'Бичсэн', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '書いて': { reading: 'かいて', mongolian: 'Бичээд', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '書いた': { reading: 'かいた', mongolian: 'Бичсэн', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },

  // --- 読む Contexts ---
  '読む': { reading: 'よむ', mongolian: 'Унших', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '読みます': { reading: 'よみます', mongolian: 'Уншина', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '読みました': { reading: 'よみました', mongolian: 'Уншсан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '読んで': { reading: 'よんで', mongolian: 'Уншаад', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '読んだ': { reading: 'よんだ', mongolian: 'Уншсан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },

  // --- 話す Contexts ---
  '話す': { reading: 'はなす', mongolian: 'Ярих', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '話します': { reading: 'はなします', mongolian: 'Ярина', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '話しました': { reading: 'はなしました', mongolian: 'Ярьсан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '話して': { reading: 'はなして', mongolian: 'Яриад', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '話した': { reading: 'はなした', mongolian: 'Ярьсан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '話': { reading: 'はなし', mongolian: 'Яриа, түүх', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },

  // --- 買う Contexts ---
  '買う': { reading: 'かう', mongolian: 'Худалдаж авах', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '買います': { reading: 'かいます', mongolian: 'Авна', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '買いました': { reading: 'かいました', mongolian: 'Авсан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '買って': { reading: 'かって', mongolian: 'Аваад', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '買った': { reading: 'かった', mongolian: 'Авсан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '買い物': { reading: 'かいもの', mongolian: 'Худалдан авалт, дэлгүүр хэсэх', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },

  // --- 会う Contexts ---
  '会う': { reading: 'あう', mongolian: 'Уулзах', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '会います': { reading: 'あいます', mongolian: 'Уулзана', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '会いました': { reading: 'あいました', mongolian: 'Уулзсан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '会って': { reading: 'あって', mongolian: 'Уулзаад', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '会った': { reading: 'あった', mongolian: 'Уулзсан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '会社': { reading: 'かいしゃ', mongolian: 'Компани', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '会話': { reading: 'かいわ', mongolian: 'Харилцан яриа', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },

  // --- 待つ Contexts ---
  '待つ': { reading: 'まつ', mongolian: 'Хүлээх', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '待ちます': { reading: 'まちます', mongolian: 'Хүлээнэ', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '待ちました': { reading: 'まちました', mongolian: 'Хүлээсэн', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '待って': { reading: 'まって', mongolian: 'Хүлээгээрэй, хүлээгээд', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '待った': { reading: 'まった', mongolian: 'Хүлээсэн', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },

  // --- 帰る Contexts ---
  '帰る': { reading: 'かえる', mongolian: 'Харих, буцах', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '帰ります': { reading: 'かえります', mongolian: 'Харина', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '帰りました': { reading: 'かえりました', mongolian: 'Харьсан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '帰って': { reading: 'かえって', mongolian: 'Хариад', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '帰った': { reading: 'かえった', mongolian: 'Харьсан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },

  // --- 走る Contexts ---
  '走る': { reading: 'はしる', mongolian: 'Гүйх', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '走ります': { reading: 'はしります', mongolian: 'Гүйнэ', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '走りました': { reading: 'はしりました', mongolian: 'Гүйсэн', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '走って': { reading: 'はしって', mongolian: 'Гүйгээд', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '走った': { reading: 'はしった', mongolian: 'Гүйсэн', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },

  // --- 歩く Contexts ---
  '歩く': { reading: 'あるく', mongolian: 'Алхах', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '歩きます': { reading: 'あるきます', mongolian: 'Алхана', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '歩きました': { reading: 'あるきました', mongolian: 'Алхсан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '歩いて': { reading: 'あるいて', mongolian: 'Алхаад', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '歩いた': { reading: 'あるいた', mongolian: 'Алхсан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },

  // --- 終わる & 始める ---
  '終わる': { reading: 'おわる', mongolian: 'Дуусах', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '終わります': { reading: 'おわります', mongolian: 'Дуусна', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '終わりました': { reading: 'おわりました', mongolian: 'Дууссан', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '終わりに': { reading: 'おわりに', mongolian: 'Төгсгөлд нь', partOfSpeech: 'Нэр үг', jlptLevel: 'N4' },
  '始める': { reading: 'はじめる', mongolian: 'Эхлүүлэх', partOfSpeech: 'Үйл үг (2-р бүлэг)', jlptLevel: 'N5' },
  '始めます': { reading: 'はじめます', mongolian: 'Эхлүүлнэ', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '始めました': { reading: 'はじめました', mongolian: 'Эхлүүлсэн', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '始まります': { reading: 'はじまります', mongolian: 'Эхэлнэ', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '始まりました': { reading: 'はじまりました', mongolian: 'Эхэлсэн', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },

  // --- 手続き & 更新 (from user regression) ---
  '更新': { reading: 'こうしん', mongolian: 'Шинэчлэх, сунгах', partOfSpeech: 'Нэр үг / する үйл үг', jlptLevel: 'N2' },
  '手続き': { reading: 'てつづき', mongolian: 'Процесс, бичиг баримтын бүрдүүлэлт', partOfSpeech: 'Нэр үг', jlptLevel: 'N3' },
  '手紙': { reading: 'てがみ', mongolian: 'Захидал', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '漢字': { reading: 'かんじ', mongolian: 'Ханз үсэг', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '暗記': { reading: 'あんき', mongolian: 'Цээжлэх', partOfSpeech: 'Нэр үг / する үйл үг', jlptLevel: 'N4' },
  '日本語': { reading: 'にほんご', mongolian: 'Япон хэл', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '日本': { reading: 'にほん', mongolian: 'Япон улс', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '学校': { reading: 'がっこう', mongolian: 'Сургууль', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '大学': { reading: 'だいがく', mongolian: 'Их сургууль', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '勉強': { reading: 'べんきょう', mongolian: 'Хичээл, сурлага', partOfSpeech: 'Нэр үг / する үйл үг', jlptLevel: 'N5' },
  '友達': { reading: 'ともだち', mongolian: 'Найз нөхөр', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '仕事': { reading: 'しごと', mongolian: 'Ажил, хөдөлмөр', partOfSpeech: 'Нэр үг / する үйл үг', jlptLevel: 'N5' },
  '教室': { reading: 'きょうしつ', mongolian: 'Анги танхим', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '会議': { reading: 'かいぎ', mongolian: 'Хурал, зөвлөгөөн', partOfSpeech: 'Нэр үг / する үйл үг', jlptLevel: 'N4' },
  '質問': { reading: 'しつもん', mongolian: 'Асуулт', partOfSpeech: 'Нэр үг / する үйл үг', jlptLevel: 'N5' },
  '問題': { reading: 'もんだい', mongolian: 'Асуудал, бодлого', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '意味': { reading: 'いみ', mongolian: 'Утга учир', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '電話': { reading: 'でんわ', mongolian: 'Утас, яриа', partOfSpeech: 'Нэр үг / する үйл үг', jlptLevel: 'N5' },
  '電車': { reading: 'でんしゃ', mongolian: 'Цахилгаан галт тэрэг', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '駅': { reading: 'えき', mongolian: 'Буудал, өртөө', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '写真': { reading: 'しゃしん', mongolian: 'Зураг', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '部屋': { reading: 'へや', mongolian: 'Өрөө тасалгаа', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '料理': { reading: 'りょうり', mongolian: 'Хоол, хоол хийх', partOfSpeech: 'Нэр үг / する үйл үг', jlptLevel: 'N5' },
  '病院': { reading: 'びょういん', mongolian: 'Эмнэлэг', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '映画': { reading: 'えいが', mongolian: 'Кино', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '家族': { reading: 'かぞく', mongolian: 'Гэр бүл', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '終わらせます': { reading: 'おわらせます', mongolian: 'Дуусгана, дуусгавар болгоно', partOfSpeech: 'Үйл үг', jlptLevel: 'N3' },
  '終わらせる': { reading: 'おわらせる', mongolian: 'Дуусгах', partOfSpeech: 'Үйл үг (2-р бүлэг)', jlptLevel: 'N3' },
  '集まりました': { reading: 'あつまりました', mongolian: 'Цугласан, цугларав', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N4' },
  '集まります': { reading: 'あつまります', mongolian: 'Цуглана', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N4' },
  '集まる': { reading: 'あつまる', mongolian: 'Цуглах', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N4' },

  // --- People Counters (一人〜十人, 何人) ---
  '一人': { reading: 'ひとり', mongolian: 'Нэг хүн', partOfSpeech: 'Тоо ширхэг', jlptLevel: 'N5' },
  '二人': { reading: 'ふたり', mongolian: 'Хоёр хүн', partOfSpeech: 'Тоо ширхэг', jlptLevel: 'N5' },
  '三人': { reading: 'さんにん', mongolian: 'Гурван хүн', partOfSpeech: 'Тоо ширхэг', jlptLevel: 'N5' },
  '四人': { reading: 'よにん', mongolian: 'Дөрвөн хүн', partOfSpeech: 'Тоо ширхэг', jlptLevel: 'N5' },
  '五人': { reading: 'ごにん', mongolian: 'Таван хүн', partOfSpeech: 'Тоо ширхэг', jlptLevel: 'N5' },
  '六人': { reading: 'ろくにん', mongolian: 'Зургаан хүн', partOfSpeech: 'Тоо ширхэг', jlptLevel: 'N5' },
  '七人': { reading: 'しちにん', mongolian: 'Долоон хүн', partOfSpeech: 'Тоо ширхэг', jlptLevel: 'N5' },
  '八人': { reading: 'はちにん', mongolian: 'Найман хүн', partOfSpeech: 'Тоо ширхэг', jlptLevel: 'N5' },
  '九人': { reading: 'きゅうにん', mongolian: 'Есөн хүн', partOfSpeech: 'Тоо ширхэг', jlptLevel: 'N5' },
  '十人': { reading: 'じゅうにん', mongolian: 'Арван хүн', partOfSpeech: 'Тоо ширхэг', jlptLevel: 'N5' },
  '何人': { reading: 'なんにん', mongolian: 'Хэдэн хүн', partOfSpeech: 'Асуух үг', jlptLevel: 'N5' },

  // --- Things Counters (一つ〜十) ---
  '一つ': { reading: 'ひとつ', mongolian: 'Нэг ширхэг', partOfSpeech: 'Тоо ширхэг', jlptLevel: 'N5' },
  '二つ': { reading: 'ふたつ', mongolian: 'Хоёр ширхэг', partOfSpeech: 'Тоо ширхэг', jlptLevel: 'N5' },
  '三つ': { reading: 'みっつ', mongolian: 'Гурван ширхэг', partOfSpeech: 'Тоо ширхэг', jlptLevel: 'N5' },
  '四つ': { reading: 'よっつ', mongolian: 'Дөрвөн ширхэг', partOfSpeech: 'Тоо ширхэг', jlptLevel: 'N5' },
  '五つ': { reading: 'いつつ', mongolian: 'Таван ширхэг', partOfSpeech: 'Тоо ширхэг', jlptLevel: 'N5' },
  '六つ': { reading: 'むっつ', mongolian: 'Зургаан ширхэг', partOfSpeech: 'Тоо ширхэг', jlptLevel: 'N5' },
  '七つ': { reading: 'ななつ', mongolian: 'Долоон ширхэг', partOfSpeech: 'Тоо ширхэг', jlptLevel: 'N5' },
  '八つ': { reading: 'やっつ', mongolian: 'Найман ширхэг', partOfSpeech: 'Тоо ширхэг', jlptLevel: 'N5' },
  '九つ': { reading: 'ここのつ', mongolian: 'Есөн ширхэг', partOfSpeech: 'Тоо ширхэг', jlptLevel: 'N5' },
  '十': { reading: 'とお', mongolian: 'Арав', partOfSpeech: 'Тоо ширхэг', jlptLevel: 'N5' },

  // --- Common Conversational Adjectives & Idiomatic Phrases ---
  '大丈夫': { reading: 'だいじょうぶ', mongolian: 'Зүгээр, асуудалгүй', partOfSpeech: 'Тэмдэг нэр (な)', jlptLevel: 'N5' },
  '大丈夫です': { reading: 'だいじょうぶです', mongolian: 'Зүгээр ээ', partOfSpeech: 'Тэмдэг нэр (な)', jlptLevel: 'N5' },
  '大丈夫だ': { reading: 'だいじょうぶだ', mongolian: 'Зүгээр', partOfSpeech: 'Тэмдэг нэр (な)', jlptLevel: 'N5' },
  '大丈夫だよ': { reading: 'だいじょうぶだよ', mongolian: 'Зүгээр дээ', partOfSpeech: 'Тэмдэг нэр (な)', jlptLevel: 'N5' },
  '大丈夫かな': { reading: 'だいじょうぶかな', mongolian: 'Зүгээр болов уу', partOfSpeech: 'Тэмдэг нэр (な)', jlptLevel: 'N5' },
  '大丈夫そう': { reading: 'だいじょうぶそう', mongolian: 'Зүгээр шинжтэй', partOfSpeech: 'Тэмдэг нэр (な)', jlptLevel: 'N4' },
  '本当': { reading: 'ほんとう', mongolian: 'Үнэн, үнэхээр', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '本当に': { reading: 'ほんとうに', mongolian: 'Үнэхээр', partOfSpeech: 'Дайвар үг', jlptLevel: 'N5' },
  '元気': { reading: 'げんき', mongolian: 'Эрүүл энх, цовоо сэргэлэн', partOfSpeech: 'Тэмдэг нэр (な)', jlptLevel: 'N5' },
  '天気': { reading: 'てんき', mongolian: 'Цаг агаар', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '最近': { reading: 'さいきん', mongolian: 'Сүүлийн үед', partOfSpeech: 'Дайвар үг', jlptLevel: 'N5' },
  '今度': { reading: 'こんど', mongolian: 'Дараагийн удаа', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '最初': { reading: 'さいしょ', mongolian: 'Эхлээд, анх', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '最後': { reading: 'さいご', mongolian: 'Хамгийн сүүлд', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '一番': { reading: 'いちばん', mongolian: 'Хамгийн, нэгдүгээрт', partOfSpeech: 'Дайвар үг', jlptLevel: 'N5' },
  '一緒': { reading: 'いっしょ', mongolian: 'Хамт, адил', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '一緒に': { reading: 'いっしょに', mongolian: 'Хамтдаа', partOfSpeech: 'Дайвар үг', jlptLevel: 'N5' },
  '自分': { reading: 'じぶん', mongolian: 'Өөрөө, би өөрөө', partOfSpeech: 'Төлөөний үг', jlptLevel: 'N5' },

  // --- 寝る Potential & Conversational Inflections ---
  '寝られなかった': { reading: 'ねられなかった', mongolian: 'Унтаж чадаагүй (боломжгүйн өнгөрсөн)', partOfSpeech: 'Үйл үг', jlptLevel: 'N4' },
  '寝られない': { reading: 'ねられない', mongolian: 'Унтаж чадахгүй', partOfSpeech: 'Үйл үг', jlptLevel: 'N4' },
  '寝られる': { reading: 'ねられる', mongolian: 'Унтаж чадах', partOfSpeech: 'Үйл үг', jlptLevel: 'N4' },
  '寝られた': { reading: 'ねられた', mongolian: 'Унтаж чадсан', partOfSpeech: 'Үйл үг', jlptLevel: 'N4' },
  '寝れなかった': { reading: 'ねれなかった', mongolian: 'Унтаж чадаагүй (ярианы хэлбэр)', partOfSpeech: 'Үйл үг', jlptLevel: 'N4' },
  '寝れない': { reading: 'ねれない', mongolian: 'Унтаж чадахгүй (ярианы хэлбэр)', partOfSpeech: 'Үйл үг', jlptLevel: 'N4' },

  // --- ご飯, 後, 勉強 & Specific High-Frequency Compounds ---
  'ご飯': { reading: 'ごはん', mongolian: 'Хоол, агшаасан будаа', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '飯': { reading: 'はん', mongolian: 'Хоол, будаа', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '後': { reading: 'あと', mongolian: 'Дараа, хойно', partOfSpeech: 'Нэр үг', jlptLevel: 'N5' },
  '後で': { reading: 'あとで', mongolian: 'Дараа нь', partOfSpeech: 'Холбоо үг (дүрэм)', jlptLevel: 'N5' },
  '勉強する': { reading: 'べんきょうする', mongolian: 'Хичээл хийх, сурах', partOfSpeech: 'Үйл үг (3-р бүлэг)', jlptLevel: 'N5' },
  '勉強します': { reading: 'べんきょうします', mongolian: 'Хичээл хийнэ', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '勉強しました': { reading: 'べんきょうしました', mongolian: 'Хичээл хийсэн', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '勉強している': { reading: 'べんきょうしている', mongolian: 'Хичээл хийж байгаа', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '勉強しています': { reading: 'べんきょうしています', mongolian: 'Хичээл хийж байна', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '勉強しない': { reading: 'べんきょうしない', mongolian: 'Хичээл хийхгүй', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '勉強した': { reading: 'べんきょうした', mongolian: 'Хичээл хийсэн', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '遊ぶ': { reading: 'あそぶ', mongolian: 'Тоглох, зугаалах', partOfSpeech: 'Үйл үг (1-р бүлэг)', jlptLevel: 'N5' },
  '遊びます': { reading: 'あそびます', mongolian: 'Тоглоно, зугаална', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '遊びました': { reading: 'あそびました', mongolian: 'Тоглосон', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '遊んだ': { reading: 'あそんだ', mongolian: 'Тоглосон', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '遊んで': { reading: 'あそんで', mongolian: 'Тоглоод', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' },
  '遊ばない': { reading: 'あそばない', mongolian: 'Тоглохгүй', partOfSpeech: 'Үйл үг', jlptLevel: 'N5' }
};

/**
 * Standard kanji kun'yomi stem table for verbs and adjectives.
 * Used when an inflected verb or word stem is deconstructed.
 */
export const VERB_STEM_KUNYOMI: Record<string, string> = {
  '遊': 'あそ',  // 遊ぶ -> あそぶ, 遊びます -> あそびます
  '降': 'ふ',    // 降る -> ふる, 降ります -> ふります
  '寝': 'ね',    // 寝る -> ねる, 寝ている -> ねている
  '食': 'た',    // 食べる -> たべる, 食べました -> たべました
  '飲': 'の',    // 飲む -> のむ, 飲みました -> のみました
  '行': 'い',    // 行く -> いく, 行きました -> いきました
  '来': 'き',    // 来る -> きます (stem)
  '見': 'み',    // 見る -> みる, 見ました -> みました
  '聞': 'き',    // 聞く -> きく, 聞きました -> ききました
  '書': 'か',    // 書く -> かく, 書きました -> かきました
  '読': 'よ',    // 読む -> よむ, 読みました -> よみました
  '話': 'はな',  // 話す -> はなす, 話しました -> はなしました
  '買': 'か',    // 買う -> かう, 買いました -> かいました
  '会': 'あ',    // 会う -> あう, 会いました -> あいました
  '待': 'ま',    // 待つ -> まつ, 待ちました -> まちました
  '走': 'はし',  // 走る -> はしる, 走りました -> はしりました
  '歩': 'ある',  // 歩く -> あるく, 歩きました -> あるきました
  '帰': 'かえ',  // 帰る -> かえる, 帰りました -> かえりました
  '休': 'やす',  // 休む -> やすむ, 休みました -> やすみました
  '働': 'はたら',// 働く -> はたらく, 働きました -> はたらきました
  '集': 'あつ',  // 集まる -> あつまる, 集まりました -> あつまりました
  '開': 'あ',    // 開ける -> あける
  '閉': 'し',    // 閉める -> しめる
  '教': 'おし',  // 教える -> おしえる
  '習': 'なら',  // 習う -> ならう
  '作': 'つく',  // 作る -> つくる
  '泳': 'およ',  // 泳ぐ -> およぐ
  '立': 'た',    // 立つ -> たつ
  '座': 'すわ',  // 座る -> すわる
  '知': 'し',    // 知る -> しる
  '思': 'おも',  // 思う -> おもう
  '言': 'い',    // 言う -> いう
  '持': 'も',    // 持つ -> もつ
  '忘': 'わす',  // 忘れる -> わすれる
  '始': 'はじ',  // 始める -> はじめる, 始まる -> はじまる
  '終': 'お',    // 終わる -> おわる
  '生': 'い',    // 生きる -> いきる
  '死': 'し',    // 死ぬ -> しぬ
  '呼': 'よ',    // 呼ぶ -> よぶ
  '頼': 'たの',  // 頼む -> たのむ
  '置': 'お',    // 置く -> おく
  '乗': 'の',    // 乗る -> のる
  '使': 'つか',  // 使う -> つかう
  '直': 'なお',  // 直す -> なおす
  '変': 'か',    // 変える -> かえる
  '降（お）': 'お' // 降りる -> おりる
};

/**
 * Contextual disambiguation for polysemous kanji based on surrounding tokens.
 */
export function disambiguateContextualKanji(
  surface: string,
  precedingToken?: string,
  followingToken?: string
): string | null {
  // 1. Contextual Disambiguation for '間'
  if (surface === '間') {
    // If preceded by a verb (ending in る, た, ている, ていた) or 'の':
    // Or if followed by 'に' -> MUST be 'あいだ' (e.g. 寝ている間に, 夏休みの間に)
    if (
      followingToken === 'に' ||
      (precedingToken && (
        precedingToken.endsWith('ている') ||
        precedingToken.endsWith('ていた') ||
        precedingToken.endsWith('た') ||
        precedingToken.endsWith('る') ||
        precedingToken.endsWith('の')
      ))
    ) {
      return 'あいだ';
    }

    // If followed by 合う, 合います, 合わない -> 'ま'
    if (followingToken && followingToken.startsWith('合')) {
      return 'ま';
    }

    // If preceded by a number or time unit (e.g. 一, 二, 三, 何, 数, 幾, 週, 年, 時間) -> 'かん'
    if (
      precedingToken &&
      (/[0-9０-９一二三四五六七八九十百千万何数幾週年日]/.test(precedingToken) ||
        precedingToken.endsWith('時') ||
        precedingToken.endsWith('週'))
    ) {
      return 'かん';
    }

    // Default standalone noun '間' is 'あいだ' (interval / between)
    return 'あいだ';
  }

  // 2. Contextual Disambiguation for '今日'
  if (surface === '今日') {
    if (followingToken === '中' || followingToken === '中に') {
      return 'きょう';
    }
    return 'きょう';
  }

  // 3. Contextual Disambiguation for '雨'
  if (surface === '雨') {
    return 'あめ';
  }

  // 4. Contextual Disambiguation for '中'
  if (surface === '中') {
    // After time units: 午前中 -> ちゅう, 今日中 -> じゅう, 一日中 -> じゅう
    if (precedingToken === '今日' || precedingToken === '一日' || precedingToken === '今年') {
      return 'じゅう';
    }
    if (precedingToken === '午前' || precedingToken === '授業' || precedingToken === '会議') {
      return 'ちゅう';
    }
    return 'なか';
  }

  // 5. Contextual Disambiguation for '方'
  if (surface === '方') {
    // After verb stem (e.g. 読み, 食べ, 使い方) -> 'かた'
    if (precedingToken && /[きぎしちにびみりえけせてねべめれ]/.test(precedingToken.slice(-1))) {
      return 'かた';
    }
    return 'ほう';
  }

  // 6. Contextual Disambiguation for '後'
  if (surface === '後') {
    return 'あと';
  }

  return null;
}

/**
 * De-conjugates any Japanese verb or adjective to infer its correct phonetic reading
 * and semantic ruby breakdown without relying on character-by-character on'yomi guessing.
 */
export function deconjugateAndInferReading(surface: string): { reading: string; baseStem?: string } | null {
  if (!surface || surface.length < 2) return null;

  // Check suru-verb inflections (e.g. 勉強します -> 勉強, 練習している -> 練習)
  const suruEndings = ['しています', 'している', 'しました', 'します', 'しない', 'した', 'する'];
  for (const sEnding of suruEndings) {
    if (surface.endsWith(sEnding) && surface.length > sEnding.length) {
      const stem = surface.slice(0, surface.length - sEnding.length);
      if (CONTEXT_LEXICON[stem]) {
        return {
          reading: CONTEXT_LEXICON[stem].reading + sEnding,
          baseStem: stem
        };
      }
    }
  }

  // Verb inflection endings to strip and identify base verb stem
  const inflectionEndings: Array<{ suffix: string; okurigana: string }> = [
    { suffix: '始めました', okurigana: 'りはじめました' },
    { suffix: '始めました', okurigana: 'はじめました' },
    { suffix: '続いている', okurigana: 'りつづいている' },
    { suffix: 'られなかった', okurigana: 'られなかった' },
    { suffix: 'られませんでした', okurigana: 'られませんでした' },
    { suffix: 'られない', okurigana: 'られない' },
    { suffix: 'られません', okurigana: 'られません' },
    { suffix: 'られました', okurigana: 'られました' },
    { suffix: 'られます', okurigana: 'られます' },
    { suffix: 'られる', okurigana: 'られる' },
    { suffix: 'られた', okurigana: 'られた' },
    { suffix: 'れなかった', okurigana: 'れなかった' },
    { suffix: 'れました', okurigana: 'れました' },
    { suffix: 'れません', okurigana: 'れません' },
    { suffix: 'れない', okurigana: 'れない' },
    { suffix: 'れる', okurigana: 'れる' },
    { suffix: 'れた', okurigana: 'れた' },
    { suffix: 'なかった', okurigana: 'なかった' },
    { suffix: 'なかった', okurigana: 'らなかった' },
    { suffix: 'なかった', okurigana: 'かなかった' },
    { suffix: 'なかった', okurigana: 'ぎなかった' },
    { suffix: 'なかった', okurigana: 'さなかった' },
    { suffix: 'なかった', okurigana: 'たなかった' },
    { suffix: 'なかった', okurigana: 'ばなかった' },
    { suffix: 'なかった', okurigana: 'まなかった' },
    { suffix: 'なかった', okurigana: 'わなかった' },
    { suffix: 'ませんでした', okurigana: 'ませんでした' },
    { suffix: 'ませんでした', okurigana: 'りませんでした' },
    { suffix: 'ませんでした', okurigana: 'きませんでした' },
    { suffix: 'ませんでした', okurigana: 'ちませんでした' },
    { suffix: 'ませんでした', okurigana: 'みませんでした' },
    { suffix: 'ませんでした', okurigana: 'びませんでした' },
    { suffix: 'ませんでした', okurigana: 'いませんでした' },
    { suffix: 'ています', okurigana: 'ています' },
    { suffix: 'ています', okurigana: 'っています' },
    { suffix: 'ています', okurigana: 'んでいます' },
    { suffix: 'ていた', okurigana: 'ていた' },
    { suffix: 'ている', okurigana: 'ている' },
    { suffix: 'ている', okurigana: 'っている' },
    { suffix: 'ている', okurigana: 'んでいる' },
    { suffix: 'ました', okurigana: 'ました' },
    { suffix: 'ました', okurigana: 'りました' },
    { suffix: 'ました', okurigana: 'きました' },
    { suffix: 'ました', okurigana: 'ぎました' },
    { suffix: 'ました', okurigana: 'しました' },
    { suffix: 'ました', okurigana: 'ちました' },
    { suffix: 'ました', okurigana: 'にました' },
    { suffix: 'ました', okurigana: 'びました' },
    { suffix: 'ました', okurigana: 'みました' },
    { suffix: 'ました', okurigana: 'いました' },
    { suffix: 'ません', okurigana: 'ません' },
    { suffix: 'ません', okurigana: 'りません' },
    { suffix: 'ません', okurigana: 'きません' },
    { suffix: 'ません', okurigana: 'ぎません' },
    { suffix: 'ません', okurigana: 'しません' },
    { suffix: 'ません', okurigana: 'ちません' },
    { suffix: 'ません', okurigana: 'みません' },
    { suffix: 'ません', okurigana: 'びません' },
    { suffix: 'ません', okurigana: 'いません' },
    { suffix: 'ます', okurigana: 'ます' },
    { suffix: 'ます', okurigana: 'ります' },
    { suffix: 'ます', okurigana: 'きます' },
    { suffix: 'ます', okurigana: 'ぎます' },
    { suffix: 'ます', okurigana: 'します' },
    { suffix: 'ます', okurigana: 'ちます' },
    { suffix: 'ます', okurigana: 'にます' },
    { suffix: 'ます', okurigana: 'びます' },
    { suffix: 'ます', okurigana: 'みます' },
    { suffix: 'ます', okurigana: 'います' },
    { suffix: 'かった', okurigana: 'かった' },
    { suffix: 'くない', okurigana: 'くない' },
    { suffix: 'ない', okurigana: 'ない' },
    { suffix: 'ない', okurigana: 'らない' },
    { suffix: 'ない', okurigana: 'かない' },
    { suffix: 'ない', okurigana: 'がない' },
    { suffix: 'ない', okurigana: 'さない' },
    { suffix: 'ない', okurigana: 'たない' },
    { suffix: 'ない', okurigana: 'ばない' },
    { suffix: 'ない', okurigana: 'まない' },
    { suffix: 'ない', okurigana: 'わない' },
    { suffix: 'たい', okurigana: 'たい' },
    { suffix: 'そう', okurigana: 'そう' },
    { suffix: 'そう', okurigana: 'りそう' },
    { suffix: 'って', okurigana: 'って' },
    { suffix: 'んで', okurigana: 'んで' },
    { suffix: 'いて', okurigana: 'いて' },
    { suffix: 'いで', okurigana: 'いで' },
    { suffix: 'して', okurigana: 'して' },
    { suffix: 'て', okurigana: 'て' },
    { suffix: 'った', okurigana: 'った' },
    { suffix: 'んだ', okurigana: 'んだ' },
    { suffix: 'いた', okurigana: 'いた' },
    { suffix: 'いだ', okurigana: 'いだ' },
    { suffix: 'した', okurigana: 'した' },
    { suffix: 'た', okurigana: 'た' },
    { suffix: 'り', okurigana: 'り' }
  ];

  // Match against known verb stem kun'yomi
  for (const entry of inflectionEndings) {
    if (surface.endsWith(entry.okurigana)) {
      const stemKanji = surface.slice(0, surface.length - entry.okurigana.length);
      if (stemKanji in VERB_STEM_KUNYOMI) {
        const kunReading = VERB_STEM_KUNYOMI[stemKanji];
        return {
          reading: kunReading + entry.okurigana,
          baseStem: stemKanji
        };
      }
    }
  }

  return null;
}
