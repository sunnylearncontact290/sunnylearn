import { DatabaseSchema } from '../types';
import { n5VocabList } from './n5VocabAdditions';
import { n4VocabList } from './n4VocabAdditions';
import { n3VocabList } from './n3VocabAdditions';
import { n2VocabList } from './n2VocabAdditions';
import { n1VocabList } from './n1VocabAdditions';
import { n1VocabBatch2 } from './n1VocabBatch2';
import { n5KanjiList } from './n5KanjiAdditions';
import { n4KanjiList } from './n4KanjiAdditions';
import { n3KanjiList } from './n3KanjiAdditions';
import { n2KanjiList } from './n2KanjiAdditions';
import { n1KanjiList } from './n1KanjiAdditions';
import { n5GrammarList } from './n5GrammarAdditions';
import { n4GrammarList } from './n4GrammarAdditions';
import { n3GrammarList } from './n3GrammarAdditions';
import { n2GrammarList } from './n2GrammarAdditions';
import { n1GrammarList } from './n1GrammarAdditions';

export const initialSeedData: DatabaseSchema = {
  categories: [
    { id: 'cat-daily', name: 'Өдөр тутмын амьдрал', japaneseName: '日常生活', icon: 'Sun', description: 'Өдөр тутмын мэндчилгээ, гэр ахуй, цаг хугацаа' },
    { id: 'cat-food', name: 'Хоол хүнс, Ундаа', japaneseName: '食べ物・飲み物', icon: 'Utensils', description: 'Япон хоол, ногоо, жимс, ресторан' },
    { id: 'cat-work', name: 'Ажил хэрэг, Сургууль', japaneseName: '仕事・学校', icon: 'Briefcase', description: 'Оффис, бизнесийн харилцаа, их сургууль' },
    { id: 'cat-travel', name: 'Аялал жуулчлал, Тээвэр', japaneseName: '旅行・交通', icon: 'Plane', description: 'Буудал, галт тэрэг, зочид буудал' },
    { id: 'cat-nature', name: 'Байгаль, Цаг агаар', japaneseName: '自然・天気', icon: 'CloudRain', description: 'Улирал, уур амьсгал, амьтан ургамал' },
    { id: 'cat-health', name: 'Эрүүл мэнд, Бие эрхтэн', japaneseName: '健康・身体', icon: 'HeartPulse', description: 'Эмнэлэг, биеийн байдал, шинж тэмдэг' },
    { id: 'cat-society', name: 'Нийгэм, Соёл, Эдийн засаг', japaneseName: '社会・文化・経済', icon: 'Building2', description: 'Японы соёл, ёс заншил, нийгмийн харилцаа' },
    { id: 'cat-feelings', name: 'Сэтгэл хөдлөл, Зан чанар', japaneseName: '感情・性格', icon: 'Smile', description: 'Сэтгэгдэл, мэдрэмж, хүний зан төлөв' }
  ],
  vocabulary: [
    // N5
    ...n5VocabList,
    {
      id: 'v-n5-01',
      japanese: '食べる',
      kanji: '食べる',
      reading: 'たべる',
      romaji: 'taberu',
      mongolian: 'Идэх',
      explanation: 'Хоол хүнс идэх үйлийг илэрхийлнэ. (2-р бүлгийн үйл үг: 食べます, 食べて, 食べた)',
      partOfSpeech: 'Үйл үг (2-р бүлэг)',
      jlptLevel: 'N5',
      category: 'Хоол хүнс, Ундаа',
      exampleSentence: '毎朝、パンと卵を食べます。',
      exampleReading: 'まいあさ、パンとたまごをたべます。',
      exampleMongolian: 'Би өглөө бүр талх, өндөг иддэг.',
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'v-n5-02',
      japanese: '飲む',
      kanji: '飲む',
      reading: 'のむ',
      romaji: 'nomu',
      mongolian: 'Уух',
      explanation: 'Ус, ундаа, эм уух үйлд хэрэглэнэ. (1-р бүлгийн үйл үг: 飲みます, 飲んで, 飲んだ)',
      partOfSpeech: 'Үйл үг (1-р бүлэг)',
      jlptLevel: 'N5',
      category: 'Хоол хүнс, Ундаа',
      exampleSentence: '水をたくさん飲みましょう。',
      exampleReading: 'みずをたくさんの みましょう。',
      exampleMongolian: 'Их ус ууцгаая.',
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'v-n5-03',
      japanese: '行く',
      kanji: '行く',
      reading: 'いく',
      romaji: 'iku',
      mongolian: 'Явах, очих',
      explanation: 'Хаа нэгтээ зорчих хөдөлгөөнийг заана. (Онцгой хувирал: いって)',
      partOfSpeech: 'Үйл үг (1-р бүлэг)',
      jlptLevel: 'N5',
      category: 'Аялал жуулчлал, Тээвэр',
      exampleSentence: '明日、友達と東京へ行きます。',
      exampleReading: 'あした、ともだちととうきょうへいきます。',
      exampleMongolian: 'Маргааш найзтайгаа хамт Токио явна.',
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'v-n5-04',
      japanese: '勉強する',
      kanji: '勉強する',
      reading: 'べんきょうする',
      romaji: 'benkyou suru',
      mongolian: 'Хичээл хийх, суралцах',
      explanation: 'Сурч боловсрох, хичээл давтах үйлийг илэрхийлнэ. (3-р бүлгийн үйл үг)',
      partOfSpeech: 'Үйл үг (3-р бүлэг)',
      jlptLevel: 'N5',
      category: 'Ажил хэрэг, Сургууль',
      exampleSentence: '図書館で日本語を勉強します。',
      exampleReading: 'としょかんでにほんごをべんきょうします。',
      exampleMongolian: 'Номын санд япон хэл сурдаг/хичээлээ хийдэг.',
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'v-n5-05',
      japanese: '新しい',
      kanji: '新しい',
      reading: 'あたらしい',
      romaji: 'atarashii',
      mongolian: 'Шинэ',
      explanation: 'Цоо шинэ зүйл, шинэлэг байдлыг илэрхийлэх И-тэмдэг нэр.',
      partOfSpeech: 'Тэмдэг нэр (И)',
      jlptLevel: 'N5',
      category: 'Өдөр тутмын амьдрал',
      exampleSentence: '新しいスマホを買いました。',
      exampleReading: 'あたらしいスマホをかいました。',
      exampleMongolian: 'Шинэ ухаалаг утас худалдаж авсан.',
      createdAt: '2026-01-01T00:00:00Z'
    },

    // N4
    ...n4VocabList,
    {
      id: 'v-n4-01',
      japanese: '案内する',
      kanji: '案内する',
      reading: 'あんないする',
      romaji: 'annai suru',
      mongolian: 'Хөтөч хийх, газарчлах, танилцуулах',
      explanation: 'Хүнд газар орон, үзвэр үйлчилгээг зааж өгөх, хөтлөх.',
      partOfSpeech: 'Үйл үг (3-р бүлэг)',
      jlptLevel: 'N4',
      category: 'Аялал жуулчлал, Тээвэр',
      exampleSentence: '私が市内をご案内します。',
      exampleReading: 'わたしがしないをごあんないします。',
      exampleMongolian: 'Би танд хотоор хөтөч хийж танилцуулъя.',
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'v-n4-02',
      japanese: '手伝う',
      kanji: '手伝う',
      reading: 'てつだう',
      romaji: 'tetsudau',
      mongolian: 'Туслах, гар сунгах',
      explanation: 'Бусдын ажил хэрэгт гар бие оролцож туслах.',
      partOfSpeech: 'Үйл үг (1-р бүлэг)',
      jlptLevel: 'N4',
      category: 'Өдөр тутмын амьдрал',
      exampleSentence: '母の料理を手伝いました。',
      exampleReading: 'ははのりょうりをつだいました。',
      exampleMongolian: 'Ээжийнхээ хоол хийхэд тусалсан.',
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'v-n4-03',
      japanese: '故障',
      kanji: '故障',
      reading: 'こしょう',
      romaji: 'koshou',
      mongolian: 'Эвдрэл, саатал',
      explanation: 'Машин, техник хэрэгсэл эвдрэх, ажиллагаагүй болох.',
      partOfSpeech: 'Нэр үг',
      jlptLevel: 'N4',
      category: 'Өдөр тутмын амьдрал',
      exampleSentence: 'パソコンが故障してしまいました。',
      exampleReading: 'パソコンがこしょうしてしまいました。',
      exampleMongolian: 'Компьютер маань эвдэрчихлээ.',
      createdAt: '2026-01-01T00:00:00Z'
    },

    // N3
    ...n3VocabList,
    {
      id: 'v-n3-01',
      japanese: '遠慮する',
      kanji: '遠慮する',
      reading: 'えんりょする',
      romaji: 'enryo suru',
      mongolian: 'Биеэ барих, эмээх, цааргалах, түдгэлзэх',
      explanation: 'Японы соёлд маш чухал ойлголт. Хүнд төвөг удахаас болгоомжлох, эсвэл биеэ барих.',
      partOfSpeech: 'Үйл үг (3-р бүлэг)',
      jlptLevel: 'N3',
      category: 'Сэтгэл хөдлөл, Зан чанар',
      exampleSentence: 'どうぞ遠慮しないで食べてください。',
      exampleReading: 'どうぞえんりょしないでたべてください。',
      exampleMongolian: 'Бүү нэрэлхээрэй, тавтай зооглоорой.',
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'v-n3-02',
      japanese: '手続き',
      kanji: '手続き',
      reading: 'てつづき',
      romaji: 'tetsuzuki',
      mongolian: 'Бичиг баримт бүрдүүлэх, бүртгэлийн процедур',
      explanation: 'Виз, банк, сургууль, захиргааны албан ёсны бичиг хэргийн үйл явц.',
      partOfSpeech: 'Нэр үг',
      jlptLevel: 'N3',
      category: 'Ажил хэрэг, Сургууль',
      exampleSentence: 'ビザの更新手続きをしなければなりません。',
      exampleReading: 'ビザのこうしんてつづきをしなければなりません。',
      exampleMongolian: 'Виз сунгуулах бичиг баримтын бүрдүүлэлт хийх шаардлагатай.',
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'v-n3-03',
      japanese: '効果的',
      kanji: '効果的',
      reading: 'こうかてき',
      romaji: 'koukateki',
      mongolian: 'Үр дүнтэй, өгөөжтэй',
      explanation: 'Ажил хэрэг эсвэл сургалтын арга барил өндөр үр өгөөжтэй байх.',
      partOfSpeech: 'Тэмдэг нэр (На)',
      jlptLevel: 'N3',
      category: 'Ажил хэрэг, Сургууль',
      exampleSentence: '毎日少しずつ復習するのが効果的です。',
      exampleReading: 'まいにちすこしずつふくしゅうするのがこうかてきです。',
      exampleMongolian: 'Өдөр бүр бага багаар давтах нь хамгийн үр дүнтэй арга юм.',
      createdAt: '2026-01-01T00:00:00Z'
    },

    // N2
    ...n2VocabList,
    {
      id: 'v-n2-01',
      japanese: '把握する',
      kanji: '把握する',
      reading: 'はあくする',
      romaji: 'haaku suru',
      mongolian: 'Бүрэн ойлгох, нөхцөл байдлыг гартаа авах, нарийн ухаарах',
      explanation: 'Нөхцөл байдал, тоо баримт, учир шалтгааныг бүрэн хянаж мэдэх.',
      partOfSpeech: 'Үйл үг (3-р бүлэг)',
      jlptLevel: 'N2',
      category: 'Ажил хэрэг, Сургууль',
      exampleSentence: '現状を正確に把握することが重要です。',
      exampleReading: 'げんじょうをせいかくにはあくすることがじゅうようです。',
      exampleMongolian: 'Одоогийн нөхцөл байдлыг бодитоор бүрэн ойлгож мэдэх нь чухал.',
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'v-n2-02',
      japanese: '柔軟',
      kanji: '柔軟',
      reading: 'じゅうなん',
      romaji: 'juunan',
      mongolian: 'Уян хатан, хувирамтгай, нөхцөлд дасан зохицох',
      explanation: 'Биеийн уян налархай байдал эсвэл сэтгэлгээ, шийдвэрийн уян хатан байдал.',
      partOfSpeech: 'Тэмдэг нэр (На)',
      jlptLevel: 'N2',
      category: 'Сэтгэл хөдлөл, Зан чанар',
      exampleSentence: '状況の変化に合わせて柔軟に対応しましょう。',
      exampleReading: 'じょうきょうのへんかにあわせてじゅうなんにたいおうしましょう。',
      exampleMongolian: 'Нөхцөл байдлын өөрчлөлтөд нийцүүлэн уян хатан хариу үйлдэл үзүүлцгээе.',
      createdAt: '2026-01-01T00:00:00Z'
    },

    // N1
    ...n1VocabList,
    ...n1VocabBatch2,
    {
      id: 'v-n1-01',
      japanese: '克己',
      kanji: '克己',
      reading: 'こっき',
      romaji: 'kokki',
      mongolian: 'Өөрийгөө ялах, хүсэл тачаалаа хянах, биеэ захирах',
      explanation: 'Өөрийн сул тал, залхуурал, сөрөг сэтгэл хөдлөлөө ялан дийлэх эр зориг.',
      partOfSpeech: 'Нэр үг',
      jlptLevel: 'N1',
      category: 'Сэтгэл хөдлөл, Зан чанар',
      exampleSentence: '克己心を養うことが成功への第一歩だ。',
      exampleReading: 'こっきしんをやしなうことがせいこうへのだいいっぽだ。',
      exampleMongolian: 'Өөрийгөө захирах сэтгэлийн тэнхээг хөгжүүлэх нь амжилтад хүрэх анхны алхам юм.',
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'v-n1-02',
      japanese: '俯瞰する',
      kanji: '俯瞰する',
      reading: 'ふかんする',
      romaji: 'fukan suru',
      mongolian: 'Дээрээс тольдон харах, ерөнхий зургаар нь цогцоор дүгнэх',
      explanation: 'Асуудлыг хэсэгчлэн биш, өндрөөс бүхэлд нь цогцоор харах чадвар.',
      partOfSpeech: 'Үйл үг (3-р бүлэг)',
      jlptLevel: 'N1',
      category: 'Нийгэм, Соёл, Эдийн засаг',
      exampleSentence: '全体を俯瞰して最適な解決策を見出そう。',
      exampleReading: 'ぜんたいをふかんしてさいてきなかいけつさくをみいだそう。',
      exampleMongolian: 'Бүхэл бүтэн нөхцөл байдлыг ерөнхий зургаар нь цогцоор харж оновчтой шийдлийг олцгооё.',
      createdAt: '2026-01-01T00:00:00Z'
    }
  ],
  kanji: [
    // N5
    ...n5KanjiList,
    // N4
    ...n4KanjiList,
    {
      id: 'k-n4-01',
      kanji: '旅',
      onyomi: 'リョ',
      kunyomi: 'たび',
      mongolian: 'Аялал, жуулчлал, зам',
      jlptLevel: 'N4',
      exampleWords: [
        { word: '旅行', reading: 'りょこう', mongolian: 'Аялал, жуулчлал' },
        { word: '旅費', reading: 'りょひ', mongolian: 'Аяллын зардал' },
        { word: '一人旅', reading: 'ひとりたび', mongolian: 'Ганцаараа аялах' }
      ],
      exampleSentence: '来月、北海道へ旅行します。',
      exampleReading: 'らいげつ、ほっかいどうへ りょこうします。',
      exampleMongolian: 'Ирэх сард Хоккайдо руу аялна.',
      createdAt: '2026-01-01T00:00:00Z'
    },
    // N3
    ...n3KanjiList,
    {
      id: 'k-n3-01',
      kanji: '配',
      onyomi: 'ハイ',
      kunyomi: 'くば・る',
      mongolian: 'Түгээх, хуваарилах, санаа зовох',
      jlptLevel: 'N3',
      exampleWords: [
        { word: '心配', reading: 'しんぱい', mongolian: 'Сэтгэл түгших, санаа зовох' },
        { word: '配達', reading: 'はいたつ', mongolian: 'Хүргэлт, түгээлт' },
        { word: '気配り', reading: 'きくばり', mongolian: 'Бусдыг анхаарах сэтгэл' }
      ],
      exampleSentence: 'プリントを全員に配ってください。',
      exampleReading: 'プリントを ぜんいんに くばってください。',
      exampleMongolian: 'Материалыг бүх хүнд тарааж өгөөрэй.',
      createdAt: '2026-01-01T00:00:00Z'
    },
    // N2
    ...n2KanjiList,
    {
      id: 'k-n2-01',
      kanji: '幅',
      onyomi: 'フク',
      kunyomi: 'はば',
      mongolian: 'Өргөн, хүрээ хэмжээ, хязгаар',
      jlptLevel: 'N2',
      exampleWords: [
        { word: '幅', reading: 'はば', mongolian: 'Өргөн, зай' },
        { word: '大幅', reading: 'おおはば', mongolian: 'Үлэмж их хэмжээгээр' },
        { word: '振幅', reading: 'しんぷく', mongolian: 'Далайц, хэлбэлзэл' }
      ],
      exampleSentence: '知識の幅を広げるために読書をしています。',
      exampleReading: 'ちしきのはばをひろげるためにどくしょをしています。',
      exampleMongolian: 'Мэдлэгийнхээ цар хүрээг тэлэхийн тулд ном уншиж байна.',
      createdAt: '2026-01-01T00:00:00Z'
    },
    // N1
    ...n1KanjiList,
    {
      id: 'k-n1-01',
      kanji: '鑑',
      onyomi: 'カン',
      kunyomi: 'かがみ, かんが・みる',
      mongolian: 'Толь, үлгэр жишээ, шинжих, урлаг үзэх',
      jlptLevel: 'N1',
      exampleWords: [
        { word: '鑑賞', reading: 'かんしょう', mongolian: 'Урлаг шимтэн үзэж таашаах' },
        { word: '鑑定', reading: 'かんてい', mongolian: 'Үнэлгээ, шинжээчийн дүгнэлт' },
        { word: '図鑑', reading: 'ずかん', mongolian: 'Зурагт лавлах толь' }
      ],
      exampleSentence: '休日は美術館で絵画を鑑賞します。',
      exampleReading: 'きゅうじつは びじゅつかんで かいがを かんしょうします。',
      exampleMongolian: 'Амралтын өдрөөр урлагийн музейд уран зураг үзэж таашаал авдаг.',
      createdAt: '2026-01-01T00:00:00Z'
    }
  ],
  grammar: [
    // N5
    ...n5GrammarList,
    {
      id: 'g-n5-01',
      pattern: '〜てはいけません',
      mongolian: '...ж/ч болохгүй (Хориглох утга)',
      explanation: 'Хийхийг хориглосон, хууль дүрэм болон нийгмийн хэм хэмжээгээр зөвшөөрөгдөхгүй үйлийг заана.',
      usage: 'Үйл үгийн [Тэ хэлбэр (て形)] + はいけません',
      structure: 'V-て + はいけません',
      examples: [
        { japanese: 'ここで写真を撮ってはいけません。', reading: 'ここでしゃしんをとってはいけません。', mongolian: 'Энд зураг авч болохгүй.' },
        { japanese: 'テスト中に話してはいけません。', reading: 'テストちゅうにはなしてはいけません。', mongolian: 'Шалгалтын үеэр ярьж болохгүй.' }
      ],
      similarGrammar: '〜てはだめです (Арай илүү энгийн/найрсаг ярианы хэлбэр)',
      differences: '〜てはいけません нь албан ёсны дүрэм журамд түлхүү ашиглагддаг.',
      commonMistakes: 'Үйл үгийн мас хэлбэрт залгаж болохгүй, заавал Тэ хэлбэрт хувиргана.',
      practiceQuestions: [
        {
          id: 'gq-1',
          question: '図書館の中で大声で _____ はいけません。',
          options: ['話し', '話して', '話す', '話した'],
          answer: 1,
          explanation: 'Дүрмийн бүтцээр V-て хэлбэр шаардагдах тул "話して" зөв.'
        }
      ],
      jlptLevel: 'N5',
      category: 'Өдөр тутмын амьдрал',
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'g-n5-02',
      pattern: '〜たことがあります',
      mongolian: '...ж/ч үзсэн, ...сон/сөн туршлагатай',
      explanation: 'Өнгөрсөнд тохиолдож байсан туршлага, үзэж туулсан үйлийг илэрхийлнэ.',
      usage: 'Үйл үгийн [Та хэлбэр (た形)] + ことがあります',
      structure: 'V-た + ことがあります',
      examples: [
        { japanese: '富士山に登ったことがあります。', reading: 'ふじさんにのぼったことがあります。', mongolian: 'Фүжи ууланд авирч үзсэн.' },
        { japanese: '納豆を食べたことがありますか。', reading: 'なっとうをたべたことがありますか。', mongolian: 'Та натто (исгэсэн буурцаг) идэж үзсэн үү?' }
      ],
      similarGrammar: '〜たことがない (Үзээгүй, туршлагагүй)',
      differences: 'Ердийн өнгөрсөн цаг (〜ました)-аас ялгаатай нь амьдралын туршлага заана.',
      jlptLevel: 'N5',
      createdAt: '2026-01-01T00:00:00Z'
    },
    // N4
    ...n4GrammarList,
    {
      id: 'g-n4-01',
      pattern: '〜ようにする',
      mongolian: '...хыг хичээх, ...дэг/дэггүй байх дадал зуршил болгох',
      explanation: 'Өөрийн хүчин чармайлтаар шинэ зуршил бий болгох, тодорхой үйлийг байнга хийхийг хичээхэд хэрэглэнэ.',
      usage: 'Үйл үгийн Толь бичгийн хэлбэр (辞書形) / Най хэлбэр (ない形) + ようにする',
      structure: 'V-dictionary / V-ない + ようにする',
      examples: [
        { japanese: '毎日野菜をたくさん食べるようにしています。', reading: 'まいにちやさいをたくさんたべるようにしています。', mongolian: 'Өдөр бүр их ногоо идэхийг хичээж байна.' },
        { japanese: '夜遅くにスマホを見ないようにしてください。', reading: 'よるおそくにスマホをみないようにしてください。', mongolian: 'Орой орондоо ухаалаг утас харахгүй байхыг хичээгээрэй.' }
      ],
      similarGrammar: '〜ようとする (Дөнгөж хийх гэж завдах)',
      jlptLevel: 'N4',
      createdAt: '2026-01-01T00:00:00Z'
    },
    // N3
    ...n3GrammarList,
    {
      id: 'g-n3-01',
      pattern: '〜わけにはいかない',
      mongolian: '...х аргагүй, ...ж болохгүй (Ёс зүй, нөхцөл байдлаас шалтгаалан)',
      explanation: 'Сэтгэл санаа эсвэл нийгмийн хариуцлагын хувьд тэгэх боломжгүй, тийм үйлдэл гаргаж болохгүй үед хэрэглэнэ.',
      usage: 'Үйл үгийн Толь бичгийн хэлбэр + わけにはいかない',
      structure: 'V-dict + わけにはいかない',
      examples: [
        { japanese: '大事な会議があるので、休むわけにはいかない。', reading: 'だいじなかいぎがあるので、やすむわけにはいかない。', mongolian: 'Чухал хурал байгаа тул чөлөө авах аргагүй.' }
      ],
      jlptLevel: 'N3',
      createdAt: '2026-01-01T00:00:00Z'
    },
    // N2
    ...n2GrammarList,
    {
      id: 'g-n2-01',
      pattern: '〜に際して / 〜に際し',
      mongolian: '...х үед, ...х тохиолдолд, ...х босгон дээр (Албан ёсны)',
      explanation: 'Чухал үйл явдал, эхлэл, арга хэмжээ болох үе шатыг албан ёсоор илэрхийлнэ.',
      usage: 'Нэр үг + に際して / Үйл үгийн толь бичгийн хэлбэр + に際して',
      structure: 'N / V-dict + に際して',
      examples: [
        { japanese: '留学に際して、多くの人に支えていただきました。', reading: 'りゅうがくにさいして、おおくのひとにささえていただきました。', mongolian: 'Гадаадад суралцах босгон дээр олон хүн намайг дэмжиж тусалсан.' }
      ],
      jlptLevel: 'N2',
      createdAt: '2026-01-01T00:00:00Z'
    },
    // N1
    ...n1GrammarList
  ],
  exampleSentences: [
    {
      id: 'ex-01',
      japanese: '日本語の勉強はとても面白いです。',
      reading: 'にほんごの べんきょうは とても おもしろいです。',
      mongolian: 'Япон хэлний хичээл маш сонирхолтой.',
      notes: 'Өдөр тутмын яриа',
      jlptLevel: 'N5',
      category: 'Ажил хэрэг, Сургууль',
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'ex-02',
      japanese: '東京タワーに行ったことがありますか。',
      reading: 'とうきょうタワーに いったことが ありますか。',
      mongolian: 'Та Токио цамхаг руу очиж үзсэн үү?',
      notes: 'Туршлага асуух',
      jlptLevel: 'N5',
      category: 'Аялал жуулчлал, Тээвэр',
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'ex-03',
      japanese: '約束の時間に遅れないようにしてください。',
      reading: 'やくそくのじかんに おくれないように してください。',
      mongolian: 'Товлосон цагаасаа хоцрохгүй байхыг хичээгээрэй.',
      notes: 'Зөвлөгөө, хүсэлт',
      jlptLevel: 'N4',
      category: 'Өдөр тутмын амьдрал',
      createdAt: '2026-01-01T00:00:00Z'
    }
  ],
  lessons: [
    {
      id: 'les-n5-01',
      title: '1-р хичээл: Өөрийгөө танилцуулах ба Мэндчилгээ',
      description: 'Япон хэлний суурь мэндчилгээнүүд болон нэр, мэргэжил, улс орноо танилцуулах анхан шатны загвар өгүүлбэрүүд.',
      jlptLevel: 'N5',
      category: 'Өдөр тутмын амьдрал',
      order: 1,
      content: `## Хичээлийн зорилго
Энэ хичээлээр та өөрийгөө япон хэлээр зөв боловсон танилцуулж, өдөр тутмын үндсэн мэндчилгээнүүдийг ашиглаж сурна.

### 1. Үндсэн мэндчилгээ
- **おはようございます** (Ohayou gozaimasu) — Өглөөний мэнд
- **こんにちは** (Konnichiwa) — Өдрийн мэнд
- **こんばんは** (Konbanwa) — Оройн мэнд
- **はじめまして** (Hajimemashite) — Танилцъя (Анх уулзах үед хэлнэ)
- **どうぞよろしくお願いします** (Douzo yoroshiku onegaishimasu) — Танилцсандаа таатай байна / Та бүхэнтэй хамтран ажиллахдаа баяртай байх болно.

### 2. Өөрийгөө танилцуулах загвар:
> **初めまして。私は [Нэр] です。[Улс] から来ました。どうぞよろしくお願いします。**
> *Hajimemashite. Watashi wa [Нэр] desu. [Улс] kara kimashita. Douzo yoroshiku onegaishimasu.*
> (Сайн байна уу, анх удаа уулзаж байна. Намайг [Нэр] гэдэг. Би [Улс]-аас ирсэн. Танилцсандаа таатай байна.)`,
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'les-n5-02',
      title: '2-р хичээл: Энэ, тэр, тэрхүү заах төлөөний үгс (これ・それ・あれ)',
      description: 'Эд зүйлсийг заах төлөөний үгс, тэдгээрийн хэрэглээний зай болон онцлог.',
      jlptLevel: 'N5',
      category: 'Өдөр тутмын амьдрал',
      order: 2,
      content: `## Заах төлөөний үгс (Ko-So-A-Do систем)
- **これ (Kore)**: Энэ (Ярьж буй хүнд ойрхон зүйл)
- **それ (Sore)**: Тэр (Сонсож буй хүнд ойрхон зүйл)
- **あれ (Are)**: Тэр тэнд байгаа (Хоёулангаас хол байгаа зүйл)
- **どれ (Dore)**: Аль нь? (Асуух үг)`,
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'les-n4-01',
      title: 'N4-1: Хүсэлт ба Зөвшөөрөл авах хэлбэрүүд',
      description: 'Бусдаас эелдэгээр зөвшөөрөл хүсэх ба даалгавар өгөх хэлбэрүүд.',
      jlptLevel: 'N4',
      category: 'Өдөр тутмын амьдрал',
      order: 1,
      content: `## Зөвшөөрөл авах: 〜てもいいですか
- **窓を開けてもいいですか。** (Цонх нээж болох уу?)
- **ここに座ってもいいですか。** (Энд сууж болох уу?)`,
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'les-n3-01',
      title: 'N3-1: Ажил хэргийн харилцаа ба Сонгодог илэрхийлэл',
      description: 'Ажлын байранд хэрэглэгдэх харилцааны соёл, зөөлөн харилцааны дүрмүүд.',
      jlptLevel: 'N3',
      category: 'Ажил хэрэг, Сургууль',
      order: 1,
      content: `## Ажил хэргийн чухал үг хэллэг:
- **お疲れ様です** (Otsukaresama desu) — Ажилдаа сайн уу? / Баярлалаа
- **失礼します** (Shitsurei shimasu) — Өршөөгөөрэй / Хөдөлгөөн үйлдэхэд хэлнэ`,
      createdAt: '2026-01-01T00:00:00Z'
    }
  ],
  reading: [
    {
      id: 'read-n5-01',
      title: '私の家族 (Миний гэр бүл)',
      japaneseText: '私の家族は四人です。父と母と姉と私です。父は会社員で、母は高校の先生です。姉は大学生です。私たちは東京の静かな町に住んでいます。毎週末、家族みんなで公園へ散歩に行きます。',
      furiganaText: 'わたしの かぞくは よにんです。ちちと ははと あねと わたしです。ちちは かいしゃいんで、ははは こうこうの せんせいです。あねは だいがくせいです。わたしたちは とうきょうの しずかな まちに すんでいます。まいしゅうまつ、かぞく みんなで こうえんへ さんぽに いきます。',
      mongolianTranslation: 'Миний гэр бүл дөрвүүлээ. Аав, ээж, эгч, би дөрөв. Аав маань компанийн ажилтан бөгөөд ээж ахлах сургуулийн багш. Эгч их сургуулийн оюутан. Бид Токиогийн нам гүм хотод амьдардаг. Амралтын өдөр бүр гэр бүлээрээ цэцэрлэгт хүрээлэн рүү зугаалахаар явдаг.',
      vocabularyNotes: [
        { word: '家族 (かぞく)', reading: 'kazoku', mongolian: 'Гэр бүл' },
        { word: '会社員 (かいしゃいん)', reading: 'kaishain', mongolian: 'Компанийн ажилтан' },
        { word: '散歩 (さんぽ)', reading: 'sanpo', mongolian: 'Салхилах, зугаалах' }
      ],
      questions: [
        {
          id: 'rq-1',
          question: '家族は何人ですか。 (Гэр бүл нь хэдүүлээ вэ?)',
          options: ['三人 (3)', '四人 (4)', '五人 (5)', '六人 (6)'],
          answer: 1,
          explanation: 'Эхний өгүүлбэрт "四人です" (дөрвүүлээ) гэж тодорхой дурдсан тул зөв.'
        },
        {
          id: 'rq-2',
          question: 'お母さんの仕事は何ですか。 (Ээжийнх нь ажил юу вэ?)',
          options: ['会社員 (Компанийн ажилтан)', '大学生 (Оюутан)', '先生 (Багш)', '医者 (Эмч)'],
          answer: 2,
          explanation: '"母は高校の先生です" (Ээж ахлах сургуулийн багш) гэж өгүүлсэн.'
        }
      ],
      jlptLevel: 'N5',
      createdAt: '2026-01-01T00:00:00Z'
    }
  ],
  listening: [
    {
      id: 'list-n5-01',
      title: '駅での案内と道案内 (Галт тэрэгний буудал дээрх харилцаа яриа)',
      dialogue: [
        { speaker: 'タナカ (Tanaka)', japanese: 'すみません、東京駅行きの電車は何番線ですか。', reading: 'すみません、とうきょうえきゆきのでんしゃは なんばんせんですか。', mongolian: 'Өршөөгөөрэй, Токио буудал руу явах галт тэрэг хэддүгээр тавцангаас хөдлөх вэ?' },
        { speaker: '駅員 (Station Staff)', japanese: '2番線ですよ。もうすぐ来ます。', reading: 'にばんせんですよ。もうすぐきます。', mongolian: '2-р тавцан шүү. Тун удахгүй ирнэ.' },
        { speaker: 'タナカ (Tanaka)', japanese: 'ありがとうございます！', reading: 'ありがとうございます！', mongolian: 'Маш их баярлалаа!' }
      ],
      questions: [
        {
          id: 'lq-1',
          question: '東京駅行きの電車は何番線から出ますか。 (Токио явах галт тэрэг хэддүгээр тавцангаас хөдлөх вэ?)',
          options: ['1番線 (1-р тавцан)', '2番線 (2-р тавцан)', '3番線 (3-р тавцан)', '4番線 (4-р тавцан)'],
          answer: 1,
          explanation: 'Буудлын ажилтан "2番線ですよ" (2-р тавцан шүү) гэж хариулсан.'
        }
      ],
      jlptLevel: 'N5',
      createdAt: '2026-01-01T00:00:00Z'
    }
  ],
  quizzes: [
    {
      id: 'quiz-n5-vocab',
      title: 'N5 Үгийн сангийн шалгалт (Сорил 1)',
      type: 'vocab',
      jlptLevel: 'N5',
      questions: [
        {
          id: 'qv-1',
          question: '「食べる」-ийн Монгол утга аль нь вэ?',
          options: ['Уух', 'Идэх', 'Унтах', 'Явах'],
          answer: 1,
          explanation: '食べる (табэрү) нь "Идэх" гэсэн утгатай 2-р бүлгийн үйл үг юм.'
        },
        {
          id: 'qv-2',
          question: '「新しい」-ийн уншлага аль нь вэ?',
          options: ['ふるい', 'あたらしい', 'たかい', 'やすい'],
          answer: 1,
          explanation: '新しい нь "あたらしい (atarashii - шинэ)" гэж уншигдана.'
        }
      ],
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'quiz-n5-kanji',
      title: 'N5 Канжи шалгалт',
      type: 'kanji',
      jlptLevel: 'N5',
      questions: [
        {
          id: 'qk-1',
          question: '「日」 ханзны Онь-уншлага (Onyomi) аль нь вэ?',
          options: ['ひ', 'ニチ・ジツ', 'つき', 'みず'],
          answer: 1,
          explanation: '「日」 ханзны Онь-уншлага нь ニチ (Nichi) болон ジツ (Jitsu) юм.'
        }
      ],
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'quiz-n4-mixed',
      title: 'N4 Цогц сорил шалгалт',
      type: 'mixed',
      jlptLevel: 'N4',
      questions: [
        {
          id: 'qm-1',
          question: '毎日野菜をたくさん食べる _____ にしています。',
          options: ['よう', 'そう', 'ため', 'こと'],
          answer: 0,
          explanation: '〜ようにする дүрэм нь "ингэхийг хичээх / дадал болгох" утгыг илэрхийлдэг.'
        }
      ],
      createdAt: '2026-01-01T00:00:00Z'
    }
  ],
  feedback: [
    {
      id: 'fb-demo-1',
      name: 'Батболд',
      email: 'batbold@example.com',
      type: 'feedback',
      message: 'Япон хэлний N5 дүрмийн тайлбарууд үнэхээр ойлгомжтой сайн болсон байна. Баярлалаа!',
      status: 'read',
      createdAt: '2026-01-15T10:30:00Z'
    }
  ]
};
