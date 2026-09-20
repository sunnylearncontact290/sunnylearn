import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface KanjiItem {
  id: string;
  kanji: string;
  onyomi: string;
  kunyomi: string;
  mongolian: string;
  jlptLevel: 'N1';
  exampleWords: { word: string; reading: string; mongolian: string }[];
  exampleSentence?: string;
  exampleReading?: string;
  exampleMongolian?: string;
  createdAt: string;
}

const entries: KanjiItem[] = [];
let currentIndex = 1;

function parseKanjiFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split('|').map(s => s.trim());
    if (parts.length < 5) {
      console.warn(`Line in ${filePath} has fewer than 5 parts: ${trimmed}`);
      continue;
    }

    const [num, kanji, onyomi, kunyomi, mongolian] = parts;

    const id = `k-n1-add-${String(currentIndex).padStart(4, '0')}`;
    currentIndex++;

    entries.push({
      id,
      kanji,
      onyomi: onyomi || '',
      kunyomi: kunyomi || '',
      mongolian: mongolian || '',
      jlptLevel: 'N1',
      exampleWords: [],
      createdAt: '2026-09-02T00:00:00.000Z'
    });
  }
}

console.log('Parsing n1_kanji_raw1.txt...');
parseKanjiFile(path.join(__dirname, 'n1_kanji_raw1.txt'));
console.log(`Parsed raw1, total entries: ${entries.length}`);

console.log('Parsing n1_kanji_raw2.txt...');
parseKanjiFile(path.join(__dirname, 'n1_kanji_raw2.txt'));
console.log(`Parsed raw2, total entries: ${entries.length}`);

console.log('Parsing n1_kanji_raw3.txt...');
parseKanjiFile(path.join(__dirname, 'n1_kanji_raw3.txt'));
console.log(`Parsed raw3, total entries: ${entries.length}`);

const outputFile = path.join(__dirname, '../src/data/n1KanjiAdditions.ts');
const tsContent = `import { KanjiItem } from '../types';

export const n1KanjiList: KanjiItem[] = ${JSON.stringify(entries, null, 2)};
`;

fs.writeFileSync(outputFile, tsContent, 'utf-8');
console.log(`Successfully written ${entries.length} items to ${outputFile}`);
