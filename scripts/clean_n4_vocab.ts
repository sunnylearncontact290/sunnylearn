import fs from 'fs';
import path from 'path';

const tsPath = path.join(process.cwd(), 'src/data/n4VocabAdditions.ts');
let content = fs.readFileSync(tsPath, 'utf-8');

// Also load the data directly
import { n4VocabList } from '../src/data/n4VocabAdditions';

for (const item of n4VocabList) {
  // Clean sentence if broken
  if (item.exampleSentence && (item.exampleSentence.includes('project') || item.exampleSentence.endsWith('「' + item.japanese + '」') || item.exampleSentence.startsWith('今日は「' + item.japanese + '」 project') || item.exampleSentence === `「${item.japanese}」 project`)) {
    if (item.partOfSpeech.includes('үйл үг')) {
      item.exampleSentence = `今日は「${item.japanese}」という動詞を使いました。`;
    } else if (item.partOfSpeech.includes('тэмдэг нэр')) {
      item.exampleSentence = `「${item.japanese}」という表現を覚えました。`;
    } else if (item.partOfSpeech.includes('дайвар')) {
      item.exampleSentence = `「${item.japanese}」という言葉を使って文を作りました。`;
    } else {
      item.exampleSentence = `「${item.japanese}」という言葉を覚えました。`;
    }
  }

  // Clean reading if broken
  if (item.exampleReading && (item.exampleReading.includes('project') || item.exampleReading.includes('라는') || item.exampleReading === `「${item.reading}」 project`)) {
    if (item.partOfSpeech.includes('үйл үг')) {
      item.exampleReading = `きょうは「${item.reading}」という どうしを つかいました。`;
    } else if (item.partOfSpeech.includes('тэмдэг нэр')) {
      item.exampleReading = `「${item.reading}」という ひょうげんを おぼえました。`;
    } else if (item.partOfSpeech.includes('дайвар')) {
      item.exampleReading = `「${item.reading}」という ことばを つかって ぶんを つくりました。`;
    } else {
      item.exampleReading = `「${item.reading}」という ことばを おぼえました。`;
    }
  }

  // Ensure mongolian example is clean
  if (!item.exampleMongolian || item.exampleMongolian.includes('project')) {
    if (item.partOfSpeech.includes('үйл үг')) {
      item.exampleMongolian = `Өнөөдөр “${item.mongolian}” гэсэн утгатай үйл үгийг хэрэглэсэн.`;
    } else if (item.partOfSpeech.includes('тэмдэг нэр')) {
      item.exampleMongolian = `“${item.mongolian}” гэсэн илэрхийллийг цээжилсэн.`;
    } else if (item.partOfSpeech.includes('дайвар')) {
      item.exampleMongolian = `“${item.mongolian}” гэсэн үгийг ашиглан өгүүлбэр зохиосон.`;
    } else {
      item.exampleMongolian = `“${item.mongolian}” гэсэн үгийг цээжилсэн.`;
    }
  }
}

const updatedTs = `import { VocabularyItem } from '../types';

export const n4VocabList: VocabularyItem[] = ${JSON.stringify(n4VocabList, null, 2)};
`;

fs.writeFileSync(tsPath, updatedTs, 'utf-8');
console.log('Cleaned and saved src/data/n4VocabAdditions.ts');

// Also update data/db.json
const dbPath = path.join(process.cwd(), 'data', 'db.json');
if (fs.existsSync(dbPath)) {
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  if (dbData.vocabulary) {
    const vocabMap = new Map<string, any>(n4VocabList.map(v => [v.id, v]));
    for (let i = 0; i < dbData.vocabulary.length; i++) {
      if (vocabMap.has(dbData.vocabulary[i].id)) {
        dbData.vocabulary[i] = vocabMap.get(dbData.vocabulary[i].id);
      }
    }
    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8');
    console.log('Updated db.json with cleaned vocabulary items');
  }
}
