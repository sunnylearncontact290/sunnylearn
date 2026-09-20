import fs from 'fs';
import path from 'path';

interface GrammarItem {
  id: string;
  pattern: string;
  mongolian: string;
  explanation: string;
  usage?: string;
  structure?: string;
  examples: { japanese: string; reading?: string; mongolian: string }[];
  jlptLevel: 'N3';
  createdAt: string;
}

const rawPath = path.join(process.cwd(), 'scripts/n3_grammar_raw.txt');
const content = fs.readFileSync(rawPath, 'utf-8');
const lines = content.split('\n');

const grammarList: GrammarItem[] = [];
let count = 0;

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('№')) continue;
  const parts = trimmed.split('|').map(s => s.trim());
  if (parts.length >= 6) {
    const rawNum = parts[0];
    const pattern = parts[1];
    const mongolian = parts[2];
    const exampleJapanese = parts[3];
    const exampleReading = parts[4];
    const exampleMongolian = parts[5];

    count++;
    const pad = String(count).padStart(3, '0');

    // Build meaningful structure and usage from pattern
    let structure = pattern;
    let usage = `[${pattern}] хэлбэрийг өгүүлбэрт ашиглах нь: ${mongolian}`;
    let explanation = `Энэхүү N3 түвшний дүрэм нь "${mongolian}" гэсэн утгыг илэрхийлнэ.`;

    grammarList.push({
      id: `g-n3-add-${pad}`,
      pattern,
      mongolian,
      explanation,
      usage,
      structure,
      examples: [
        {
          japanese: exampleJapanese,
          reading: exampleReading,
          mongolian: exampleMongolian
        }
      ],
      jlptLevel: 'N3',
      createdAt: '2026-09-02T00:00:00.000Z'
    });
  }
}

console.log(`Parsed ${grammarList.length} N3 Grammar points.`);

// 1. Write src/data/n3GrammarAdditions.ts
const tsContent = `import { GrammarItem } from '../types';

export const n3GrammarList: GrammarItem[] = ${JSON.stringify(grammarList, null, 2)};
`;

fs.writeFileSync(path.join(process.cwd(), 'src/data/n3GrammarAdditions.ts'), tsContent, 'utf-8');
console.log('Saved src/data/n3GrammarAdditions.ts');

// 2. Update data/db.json
const dbPath = path.join(process.cwd(), 'data', 'db.json');
if (fs.existsSync(dbPath)) {
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  if (dbData.grammar) {
    const existingIds = new Set(dbData.grammar.map((g: any) => g.id));
    const newItems = grammarList.filter(g => !existingIds.has(g.id));
    dbData.grammar.push(...newItems);
    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8');
    console.log(`Updated db.json: Total Grammar count: ${dbData.grammar.length}`);
  }
}
