import { BaseAgent, Agent } from '@naylence/agent-sdk';
import type { WorkflowResult, TextStats, KeywordsResult, SentencesResult } from './config';
import { STATS_AGENT_ADDR, KEYWORDS_AGENT_ADDR, SENTENCES_AGENT_ADDR } from './config';

export class WorkflowAgent extends BaseAgent {
  async runTask(payload: { text: string }): Promise<WorkflowResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const text = payload.text || '';
    
    // Fan out to all worker agents in parallel using Agent.broadcast
    const results = await Agent.broadcast(
      [STATS_AGENT_ADDR, KEYWORDS_AGENT_ADDR, SENTENCES_AGENT_ADDR],
      { text }
    );
    
    // Extract results from broadcast response
    // broadcast returns [[address, result], ...]
    const stats = results[0][1] as TextStats;
    const keywords = results[1][1] as KeywordsResult;
    const sentences = results[2][1] as SentencesResult;
    
    // Return aggregated result
    return {
      stats,
      keywords,
      sentences,
    };
  }
}
