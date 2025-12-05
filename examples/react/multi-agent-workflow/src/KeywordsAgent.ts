import { BaseAgent } from '@naylence/agent-sdk';
import type { KeywordsResult } from './config';

export class KeywordsAgent extends BaseAgent {
  async runTask(payload: { text: string }): Promise<KeywordsResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 250));
    
    const text = payload.text || '';
    
    // Simple keyword extraction: count word frequencies
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(w => w.length > 3); // Filter short words
    
    // Count frequencies
    const freqMap = new Map<string, number>();
    for (const word of words) {
      freqMap.set(word, (freqMap.get(word) || 0) + 1);
    }
    
    // Sort by frequency and take top 5
    const topWords = Array.from(freqMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, count]) => ({ word, count }));
    
    return { topWords };
  }
}
