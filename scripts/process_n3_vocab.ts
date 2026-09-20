import fs from 'fs';
import path from 'path';

interface VocabularyItem {
  id: string;
  japanese: string;
  kanji?: string;
  reading: string;
  romaji?: string;
  mongolian: string;
  explanation?: string;
  partOfSpeech: string;
  jlptLevel: 'N3';
  category: string;
  exampleSentence?: string;
  exampleReading?: string;
  exampleMongolian?: string;
  createdAt: string;
}

const rawFiles = [
  'scripts/n3_vocab_raw1.txt',
  'scripts/n3_vocab_raw2.txt',
  'scripts/n3_vocab_raw3.txt',
  'scripts/n3_vocab_raw4.txt',
];

function getCategory(pos: string, mongolian: string): string {
  const p = pos.toLowerCase();
  const m = mongolian.toLowerCase();
  if (p.includes('үйл үг') || p.includes('үйлдэл')) {
    return 'Үйл хөдлөл, Үйл явдал';
  }
  if (p.includes('тэмдэг нэр')) {
    return 'Сэтгэл хөдлөл, Зан чанар';
  }
  if (p.includes('дайвар үг') || p.includes('холбоос')) {
    return 'Өдөр тутмын амьдрал';
  }
  if (m.includes('эмнэлэг') || m.includes('өвчин') || m.includes('бие') || m.includes('цус') || m.includes('эрүүл') || m.includes('ходоод')) {
    return 'Эрүүл мэнд, Бие эрхтэн';
  }
  if (m.includes('хоол') || m.includes('ундаа') || m.includes('амт') || m.includes('давс') || m.includes('чихэр')) {
    return 'Хоол хүнс, Ундаа';
  }
  if (m.includes('байгаль') || m.includes('цаг агаар') || m.includes('бороо') || m.includes('салхи') || m.includes('аянга')) {
    return 'Байгаль, Цаг агаар';
  }
  if (m.includes('нийгэм') || m.includes('эдийн засаг') || m.includes('сонгууль') || m.includes('хууль') || m.includes('компани')) {
    return 'Нийгэм, Соёл, Эдийн засаг';
  }
  if (m.includes('ажил') || m.includes('сургууль') || m.includes('мэргэжил') || m.includes('даалгавар')) {
    return 'Ажил хэрэг, Сургууль';
  }
  if (m.includes('аялал') || m.includes('галт тэрэг') || m.includes('онгоц') || m.includes('буудал') || m.includes('зам')) {
    return 'Аялал жуулчлал, Тээвэр';
  }
  return 'Өдөр тутмын амьдрал';
}

const vocabList: VocabularyItem[] = [];
let count = 0;

for (const relFile of rawFiles) {
  const filePath = path.join(process.cwd(), relFile);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    continue;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('№')) continue;
    const parts = trimmed.split('|').map(s => s.trim());
    if (parts.length >= 4) {
      count++;
      const rawNum = parts[0];
      const japanese = parts[1];
      const reading = parts[2];
      const mongolian = parts[3];
      const partOfSpeech = parts.length > 4 ? parts[4] : 'нэр үг';
      const exampleSentence = parts.length > 5 ? parts[5] : '';
      const exampleReading = parts.length > 6 ? parts[6] : '';
      const exampleMongolian = parts.length > 7 ? parts[7] : '';

      const pad = String(count).padStart(3, '0');
      const category = getCategory(partOfSpeech, mongolian);

      vocabList.push({
        id: `v-n3-add-${pad}`,
        japanese,
        kanji: japanese,
        reading,
        romaji: '',
        mongolian,
        explanation: `${partOfSpeech}. Монгол утга: ${mongolian}`,
        partOfSpeech,
        jlptLevel: 'N3',
        category,
        exampleSentence: exampleSentence || undefined,
        exampleReading: exampleReading || undefined,
        exampleMongolian: exampleMongolian || undefined,
        createdAt: '2026-09-02T00:00:00.000Z',
      });
    }
  }
}

console.log(`Parsed ${vocabList.length} N3 Vocabulary items.`);

// 1. Write src/data/n3VocabAdditions.ts
const tsContent = `import { VocabularyItem } from '../types';

export const n3VocabList: VocabularyItem[] = ${JSON.stringify(vocabList, null, 2)};
`;

fs.writeFileSync(path.join(process.cwd(), 'src/data/n3VocabAdditions.ts'), tsContent, 'utf-8');
console.log('Saved src/data/n3VocabAdditions.ts');

// 2. Update data/db.json
const dbPath = path.join(process.cwd(), 'data', 'db.json');
if (fs.existsSync(dbPath)) {
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  if (dbData.vocabulary) {
    const existingIds = new Set(dbData.vocabulary.map((v: any) => v.id));
    const newItems = vocabList.filter(v => !existingIds.has(v.id));
    dbData.vocabulary.push(...newItems);
    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8');
    console.log(`Updated db.json: Total Vocabulary count: ${dbData.vocabulary.length}`);
  }
}
