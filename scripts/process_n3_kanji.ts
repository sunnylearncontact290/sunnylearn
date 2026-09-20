import fs from 'fs';
import path from 'path';

interface KanjiItem {
  id: string;
  kanji: string;
  onyomi: string;
  kunyomi: string;
  mongolian: string;
  jlptLevel: 'N3';
  exampleWords: { word: string; reading: string; mongolian: string }[];
  exampleSentence?: string;
  exampleReading?: string;
  exampleMongolian?: string;
  createdAt: string;
}

const rawPath = path.join(process.cwd(), 'scripts/n3_kanji_raw.txt');
const content = fs.readFileSync(rawPath, 'utf-8');
const lines = content.split('\n');

const kanjiList: KanjiItem[] = [];
let count = 0;

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('№')) continue;
  const parts = trimmed.split('|').map(s => s.trim());
  if (parts.length >= 5) {
    const rawNum = parts[0];
    const kanji = parts[1];
    let onyomi = parts[2] || '';
    let kunyomi = parts[3] || '';
    const mongolian = parts[4] || '';

    // Fix any unintentional cyrillic transliterations in kunyomi/onyomi
    kunyomi = kunyomi
      .replace(/рагу/g, 'らぐ')
      .replace(/ка/g, 'か')
      .replace(/ку/g, 'く')
      .replace(/гу/g, 'ぐ')
      .replace(/ге/g, 'げ');

    count++;
    const pad = String(count).padStart(3, '0');

    kanjiList.push({
      id: `k-n3-add-${pad}`,
      kanji,
      onyomi,
      kunyomi,
      mongolian,
      jlptLevel: 'N3',
      exampleWords: [],
      createdAt: '2026-09-02T00:00:00.000Z'
    });
  }
}

console.log(`Parsed ${kanjiList.length} N3 Kanji items.`);

// 1. Write src/data/n3KanjiAdditions.ts
const tsContent = `import { KanjiItem } from '../types';

export const n3KanjiList: KanjiItem[] = ${JSON.stringify(kanjiList, null, 2)};
`;

fs.writeFileSync(path.join(process.cwd(), 'src/data/n3KanjiAdditions.ts'), tsContent, 'utf-8');
console.log('Saved src/data/n3KanjiAdditions.ts');

// 2. Update data/db.json
const dbPath = path.join(process.cwd(), 'data', 'db.json');
if (fs.existsSync(dbPath)) {
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  if (dbData.kanji) {
    const existingIds = new Set(dbData.kanji.map((k: any) => k.id));
    const newItems = kanjiList.filter(k => !existingIds.has(k.id));
    dbData.kanji.push(...newItems);
    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8');
    console.log(`Updated db.json: Total Kanji count: ${dbData.kanji.length}`);
  }
}
