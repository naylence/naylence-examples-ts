import { BaseAgent } from '@naylence/agent-sdk';
import type { TextStats } from './config';

export class StatsAgent extends BaseAgent {
  async runTask(payload: { text: string }): Promise<TextStats> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 250));
    
    const text = payload.text || '';
    
    // Character count
    const charCount = text.length;
    
    // Word count
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    
    // Sentence count (simple heuristic: split on . ! ?)
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    const sentenceCount = sentences.length;
    
    // Reading time (average 200 words per minute)
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
    
    return {
      charCount,
      wordCount,
      sentenceCount,
      readingTimeMinutes,
    };
  }
}
