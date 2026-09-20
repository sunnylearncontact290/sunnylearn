import fs from 'fs';
import path from 'path';

interface KanjiItem {
  id: string;
  kanji: string;
  onyomi: string;
  kunyomi: string;
  mongolian: string;
  jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  exampleWords?: { word: string; reading: string; mongolian: string }[];
  exampleSentence?: string;
  exampleReading?: string;
  exampleMongolian?: string;
  createdAt: string;
}

const rawPath = path.join(process.cwd(), 'scripts', 'n2_kanji_raw.txt');
const rawText = fs.readFileSync(rawPath, 'utf-8');

const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
const kanjiList: KanjiItem[] = [];

for (const line of lines) {
  // Format: "1 | 党 | トウ | なかま、むら | нам, бүлэг, фракц"
  const parts = line.split('|').map(p => p.trim());
  if (parts.length >= 5) {
    const num = parseInt(parts[0], 10);
    const kanji = parts[1];
    const onyomi = parts[2];
    const kunyomi = parts[3];
    const mongolian = parts[4];

    if (!isNaN(num) && kanji) {
      const id = `k-n2-add-${String(num).padStart(3, '0')}`;
      kanjiList.push({
        id,
        kanji,
        onyomi: onyomi || '',
        kunyomi: kunyomi || '',
        mongolian: mongolian || '',
        jlptLevel: 'N2',
        exampleWords: [],
        createdAt: '2026-09-02T00:00:00.000Z'
      });
    }
  }
}

console.log(`Parsed ${kanjiList.length} N2 kanji items.`);

// 1. Write src/data/n2KanjiAdditions.ts
const tsContent = `import { KanjiItem } from '../types';

export const n2KanjiList: KanjiItem[] = ${JSON.stringify(kanjiList, null, 2)};
`;

fs.writeFileSync(path.join(process.cwd(), 'src', 'data', 'n2KanjiAdditions.ts'), tsContent, 'utf-8');
console.log('Successfully wrote src/data/n2KanjiAdditions.ts');

// 2. Update data/db.json if it exists
const dbPath = path.join(process.cwd(), 'data', 'db.json');
if (fs.existsSync(dbPath)) {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  if (Array.isArray(db.kanji)) {
    const existingIds = new Set(db.kanji.map((k: any) => k.id));
    let addedCount = 0;
    for (const item of kanjiList) {
      if (!existingIds.has(item.id)) {
        db.kanji.push(item);
        existingIds.add(item.id);
        addedCount++;
      }
    }
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
    console.log(`Updated data/db.json with ${addedCount} new N2 kanji (total kanji: ${db.kanji.length})`);
  }
}
