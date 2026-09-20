import fs from 'fs';
import path from 'path';

interface GrammarExample {
  japanese: string;
  reading: string;
  mongolian: string;
}

interface GrammarItem {
  id: string;
  pattern: string;
  mongolian: string;
  explanation: string;
  usage: string;
  structure: string;
  examples: GrammarExample[];
  jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  createdAt: string;
}

const rawPath = path.join(process.cwd(), 'scripts', 'n2_grammar_raw.txt');
const rawText = fs.readFileSync(rawPath, 'utf-8');

const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
const grammarList: GrammarItem[] = [];

for (const line of lines) {
  // Format: "1 | あげく | олон зүйл хийсний эцэст; ихэвчлэн таагүй үр дүн | 長い間悩んだあげく、会社を辞めることにしました。 | ながい あいだ なやんだ あげく、かいしゃを やめる ことに しました。 | Удаан бодсоны эцэст ажлаасаа гарахаар шийдлээ."
  const parts = line.split('|').map(p => p.trim());
  if (parts.length >= 6) {
    const num = parseInt(parts[0], 10);
    const pattern = parts[1];
    const mongolian = parts[2];
    const jExample = parts[3];
    const rExample = parts[4];
    const mExample = parts[5];

    if (!isNaN(num) && pattern) {
      const id = `g-n2-add-${String(num).padStart(3, '0')}`;
      grammarList.push({
        id,
        pattern,
        mongolian,
        explanation: `Энэхүү N2 түвшний дүрэм нь "${mongolian}" гэсэн утгыг илэрхийлнэ.`,
        usage: `[${pattern}] хэлбэрийн хэрэглээ: ${mongolian}`,
        structure: pattern,
        examples: [
          {
            japanese: jExample,
            reading: rExample,
            mongolian: mExample
          }
        ],
        jlptLevel: 'N2',
        createdAt: '2026-09-02T00:00:00.000Z'
      });
    }
  }
}

console.log(`Parsed ${grammarList.length} N2 grammar items.`);

// 1. Write src/data/n2GrammarAdditions.ts
const tsContent = `import { GrammarItem } from '../types';

export const n2GrammarList: GrammarItem[] = ${JSON.stringify(grammarList, null, 2)};
`;

fs.writeFileSync(path.join(process.cwd(), 'src', 'data', 'n2GrammarAdditions.ts'), tsContent, 'utf-8');
console.log('Successfully wrote src/data/n2GrammarAdditions.ts');

// 2. Update data/db.json if it exists
const dbPath = path.join(process.cwd(), 'data', 'db.json');
if (fs.existsSync(dbPath)) {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  if (Array.isArray(db.grammar)) {
    const existingIds = new Set(db.grammar.map((g: any) => g.id));
    let addedCount = 0;
    for (const item of grammarList) {
      if (!existingIds.has(item.id)) {
        db.grammar.push(item);
        existingIds.add(item.id);
        addedCount++;
      }
    }
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
    console.log(`Updated data/db.json with ${addedCount} new N2 grammar (total grammar: ${db.grammar.length})`);
  }
}
