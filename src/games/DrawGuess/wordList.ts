export interface WordEntry {
  draw: string;     // Label shown to kid
  label: string;    // Must match a doodleNet class name exactly (see available_labels.txt)
  emoji: string;    // Shown when no image is set
  vi: string;       // Vietnamese word
  hint: string;     // Drawing hint (English)
  hintVi: string;   // Drawing hint (Vietnamese)
  image: string | null; // Optional: filename in public/assets/words/ e.g. "cat.png"
}

let _wordList: WordEntry[] | null = null;

export async function loadWordList(): Promise<WordEntry[]> {
  if (_wordList) return _wordList;
  const res = await fetch(import.meta.env.BASE_URL + 'config/words.json');
  _wordList = await res.json() as WordEntry[];
  return _wordList;
}

export function getRandomWords(pool: WordEntry[], count: number, exclude: string[] = []): WordEntry[] {
  const filtered = pool.filter(w => !exclude.includes(w.label));
  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }
  return filtered.slice(0, Math.min(count, filtered.length));
}
