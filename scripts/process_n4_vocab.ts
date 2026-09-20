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
  jlptLevel: 'N4';
  category: string;
  exampleSentence?: string;
  exampleReading?: string;
  exampleMongolian?: string;
  createdAt: string;
}

const rawFiles = [
  'scripts/n4_vocab_raw1.txt',
  'scripts/n4_vocab_raw2.txt',
  'scripts/n4_vocab_raw3.txt',
  'scripts/n4_vocab_raw4.txt',
  'scripts/n4_vocab_raw5.txt',
];

let allLines: string[] = [];
for (const file of rawFiles) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    allLines.push(...content.split('\n'));
  }
}

const vocabList: VocabularyItem[] = [];
let count = 0;

for (const line of allLines) {
  const trimmed = line.trim();
  if (!trimmed) continue;
  const parts = trimmed.split('|').map(s => s.trim());
  if (parts.length >= 4) {
    const rawNum = parts[0];
    const japanese = parts[1];
    const reading = parts[2];
    const mongolian = parts[3];
    const partOfSpeech = parts[4] || 'Үг';
    const exampleSentence = parts[5] || `${japanese}を使います。`;
    const exampleReading = parts[6] || `${reading}を つかいます。`;
    const exampleMongolian = parts[7] || `${mongolian}.`;

    count++;
    const pad = String(count).padStart(3, '0');
    
    // determine category based on part of speech or meaning
    let category = 'Өдөр тутмын амьдрал';
    if (partOfSpeech.includes('үйл үг')) {
      category = 'Үйл хөдлөл, Үйл явдал';
    } else if (partOfSpeech.includes('тэмдэг нэр')) {
      category = 'Шинж чанар, Төлөв байдал';
    } else if (partOfSpeech.includes('дайвар') || partOfSpeech.includes('холбох')) {
      category = 'Хэллэг, Холбоос үгс';
    }

    vocabList.push({
      id: `v-n4-add-${pad}`,
      japanese,
      kanji: japanese,
      reading,
      romaji: '',
      mongolian,
      explanation: `${partOfSpeech}. Монгол утга: ${mongolian}`,
      partOfSpeech,
      jlptLevel: 'N4',
      category,
      exampleSentence,
      exampleReading,
      exampleMongolian,
      createdAt: '2026-09-01T08:00:00.000Z'
    });
  }
}

console.log(`Parsed ${vocabList.length} N4 Vocabulary items.`);

// 1. Output src/data/n4VocabAdditions.ts
const tsContent = `import { VocabularyItem } from '../types';

export const n4VocabList: VocabularyItem[] = ${JSON.stringify(vocabList, null, 2)};
`;

fs.writeFileSync(path.join(process.cwd(), 'src/data/n4VocabAdditions.ts'), tsContent, 'utf-8');
console.log('Saved src/data/n4VocabAdditions.ts');

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
