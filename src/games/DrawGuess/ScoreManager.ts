import * as Phaser from 'phaser';
import { WordEntry, getRandomWords } from './wordList';
import type { Ml5Result } from './AIGuesser';

export interface EvaluateResult {
  correct: boolean;
  matchedLabel: string;
  confidence: number;
  rank: number;
  points: number;
  topGuess: string;
}

export class ScoreManager extends Phaser.Events.EventEmitter {
  private score = 0;
  private wordQueue: WordEntry[] = [];
  private currentWord: WordEntry | null = null;
  private wordsPerRound: number;
  private wordsCompleted = 0;
  private allWords: WordEntry[] = [];

  constructor(wordsPerRound = 5) {
    super();
    this.wordsPerRound = wordsPerRound;
  }

  init(allWords: WordEntry[]) {
    this.allWords = allWords;
    this.reset();
  }

  getScore() { return this.score; }
  getCurrentWord() { return this.currentWord; }
  getWordsCompleted() { return this.wordsCompleted; }
  getWordsPerRound() { return this.wordsPerRound; }

  nextWord(): WordEntry | null {
    if (this.wordQueue.length === 0) {
      this.emit('roundEnd', { score: this.score });
      return null;
    }
    this.currentWord = this.wordQueue.shift()!;
    this.emit('newWord', this.currentWord);
    return this.currentWord;
  }

  evaluate(results: Ml5Result[]): EvaluateResult {
    const target = this.currentWord?.label.toLowerCase() ?? '';
    let matchedLabel = '', confidence = 0, rank = -1;

    for (let i = 0; i < results.length; i++) {
      const labelNorm  = results[i].label.toLowerCase().replace(/_/g, ' ');
      const targetNorm = target.replace(/_/g, ' ');
      const labelWords = labelNorm.split(/\s+/);
      if (labelNorm === targetNorm || labelWords.includes(targetNorm)) {
        matchedLabel = results[i].label;
        confidence = results[i].confidence;
        rank = i;
        break;
      }
    }

    const correct = rank !== -1;
    const points = correct ? Math.max(30 - rank * 10, 10) : 0;
    if (correct) { this.score += points; this.wordsCompleted++; }

    const evalResult: EvaluateResult = { correct, matchedLabel, confidence, rank, points, topGuess: results[0]?.label ?? '???' };
    this.emit('result', evalResult);
    return evalResult;
  }

  reset() {
    this.score = 0;
    this.wordsCompleted = 0;
    this.wordQueue = getRandomWords(this.allWords, this.wordsPerRound);
    this.currentWord = null;
  }
}
