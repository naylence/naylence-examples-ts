import { BaseAgent } from '@naylence/agent-sdk';
import type { SentencesResult } from './config';

export class SentencesAgent extends BaseAgent {
  async runTask(payload: { text: string }): Promise<SentencesResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const text = payload.text || '';
    
    // Split into sentences (simple heuristic: split on . ! ?)
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // Take first 3 sentences as preview
    const preview = sentences.slice(0, 3);
    
    return {
      preview,
      totalSentences: sentences.length,
    };
  }
}
