import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface VocabEntry {
  id: string;
  japanese: string;
  kanji?: string;
  reading: string;
  romaji?: string;
  mongolian: string;
  explanation?: string;
  partOfSpeech: string;
  jlptLevel: 'N2';
  category: string;
  exampleSentence?: string;
  exampleReading?: string;
  exampleMongolian?: string;
  createdAt: string;
}

function determineCategory(word: string, meaning: string, pos: string): string {
  const m = meaning.toLowerCase();
  const w = word;

  if (m.includes('компани') || m.includes('ажил') || m.includes('бизнес') || m.includes('эдийн засаг') || m.includes('гэрээ') || m.includes('татвар') || m.includes('цалин') || m.includes('хурал') || m.includes('тайлан')) {
    return 'Бизнес, Ажил';
  }
  if (m.includes('сэтгэл') || m.includes('айдас') || m.includes('баяр') || m.includes('уур') || m.includes('хайр') || m.includes('гуниг') || m.includes('мэдрэмж')) {
    return 'Сэтгэл хөдлөл, Харилцаа';
  }
  if (m.includes('байгаль') || m.includes('цаг агаар') || m.includes('салхи') || m.includes('бороо') || m.includes('нийгэм') || m.includes('хууль') || m.includes('гамшиг')) {
    return 'Нийгэм, Байгаль';
  }
  if (pos.includes('үйл үг') || pos.includes('хэлц')) {
    return 'Үйл хөдлөл, Үйл явдал';
  }
  if (pos.includes('тэмдэг нэр')) {
    return 'Шинж чанар, Төлөв байдал';
  }
  if (pos.includes('дайвар')) {
    return 'Дайвар үг, Баймж';
  }
  return 'Өдөр тутмын амьдрал';
}

function determinePosFromWord(word: string, meaning: string): string {
  if (word.includes(' ') || word.includes('を') || word.includes('に') || word.includes('が')) {
    return 'хэлц үг';
  }
  if (word.endsWith('い') && !word.endsWith('使い') && !word.endsWith('払い')) {
    return 'и-тэмдэг нэр';
  }
  if (meaning.includes('хийх') || meaning.includes('болох') || meaning.includes('авах') || meaning.includes('өгөх') || meaning.includes('хэлэх') || meaning.includes('үзэх') || meaning.includes('явах') || meaning.includes('ирэх')) {
    return 'үйл үг';
  }
  if (meaning.includes('байдал') || meaning.includes('шинж')) {
    return 'на-тэмдэг нэр';
  }
  return 'нэр үг';
}

const entries: VocabEntry[] = [];
let currentIndex = 1;

function parseGenericLine(trimmed: string, filePath: string) {
  const parts = trimmed.split('|').map(s => s.trim());
  if (parts.length < 4) {
    console.warn(`Line in ${filePath} has fewer than 4 parts: ${trimmed}`);
    return;
  }

  let num = parts[0];
  let japanese = parts[1];
  let reading = parts[2];
  let mongolian = parts[3];
  let pos = 'нэр үг';
  let exampleSentence: string | undefined = undefined;
  let exampleReading: string | undefined = undefined;
  let exampleMongolian: string | undefined = undefined;

  if (parts.length === 8) {
    // 8 parts: num | japanese | reading | mongolian | pos | exampleSentence | exampleReading | exampleMongolian
    pos = parts[4] || 'нэр үг';
    exampleSentence = parts[5] || undefined;
    exampleReading = parts[6] || undefined;
    exampleMongolian = parts[7] || undefined;
  } else if (parts.length === 7) {
    // Check if parts[4] is part of speech or example sentence
    const p4 = parts[4];
    if (p4.includes('үг') || p4.includes('тэмдэг') || p4.includes('дагавар') || p4.includes('угтвар') || p4.includes('хэлбэр') || p4.includes('хэллэг')) {
      pos = p4;
      exampleSentence = parts[5] || undefined;
      exampleMongolian = parts[6] || undefined;
    } else {
      // 7 parts: num | japanese | reading | mongolian | exampleSentence | exampleReading | exampleMongolian
      pos = determinePosFromWord(japanese, mongolian);
      exampleSentence = parts[4] || undefined;
      exampleReading = parts[5] || undefined;
      exampleMongolian = parts[6] || undefined;
    }
  } else if (parts.length === 6) {
    // 6 parts: num | japanese | reading | mongolian | exampleSentence | exampleMongolian
    pos = determinePosFromWord(japanese, mongolian);
    exampleSentence = parts[4] || undefined;
    exampleMongolian = parts[5] || undefined;
  } else if (parts.length === 5) {
    // 5 parts: num | japanese | reading | mongolian | pos
    pos = parts[4] || determinePosFromWord(japanese, mongolian);
  }

  const category = determineCategory(japanese, mongolian, pos);
  const id = `v-n2-add-${String(currentIndex).padStart(4, '0')}`;
  currentIndex++;

  entries.push({
    id,
    japanese,
    kanji: japanese,
    reading,
    romaji: '',
    mongolian,
    explanation: `${pos}. Монгол утга: ${mongolian}`,
    partOfSpeech: pos,
    jlptLevel: 'N2',
    category,
    exampleSentence,
    exampleReading,
    exampleMongolian,
    createdAt: '2026-09-02T00:00:00.000Z'
  });
}

function parseFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    parseGenericLine(trimmed, filePath);
  }
}

console.log('Parsing raw1...');
parseFile(path.join(__dirname, 'n2_vocab_raw1.txt'));
console.log(`Parsed raw1, total entries: ${entries.length}`);

console.log('Parsing raw2...');
parseFile(path.join(__dirname, 'n2_vocab_raw2.txt'));
console.log(`Parsed raw2, total entries: ${entries.length}`);

console.log('Parsing raw3...');
parseFile(path.join(__dirname, 'n2_vocab_raw3.txt'));
console.log(`Parsed raw3, total entries: ${entries.length}`);

console.log('Parsing raw4...');
parseFile(path.join(__dirname, 'n2_vocab_raw4.txt'));
console.log(`Parsed raw4, total entries: ${entries.length}`);

const outputFile = path.join(__dirname, '../src/data/n2VocabAdditions.ts');
const tsContent = `import { VocabularyItem } from '../types';

export const n2VocabList: VocabularyItem[] = ${JSON.stringify(entries, null, 2)};
`;

fs.writeFileSync(outputFile, tsContent, 'utf-8');
console.log(`Successfully written ${entries.length} items to ${outputFile}`);
