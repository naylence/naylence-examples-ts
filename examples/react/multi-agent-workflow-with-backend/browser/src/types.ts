// Common types shared between frontend and backend
export interface TextStats {
  charCount: number;
  wordCount: number;
  sentenceCount: number;
  readingTimeMinutes: number;
}

export interface KeywordsResult {
  topWords: Array<{ word: string; count: number }>;
}

export interface SentencesResult {
  preview: string[];
  totalSentences: number;
}

export interface WorkflowResult {
  stats: TextStats;
  keywords: KeywordsResult;
  sentences: SentencesResult;
}

export const WORKFLOW_AGENT_ADDR = 'workflow@fame.fabric';
