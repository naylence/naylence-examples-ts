import { withFabric } from "@naylence/runtime";
import { BaseAgent, NODE_CONFIG } from "@naylence/agent-sdk";
import { STATS_AGENT_ADDR, TextStats } from "./common.js";

class StatsAgent extends BaseAgent {
  async runTask(payload: { text: string }): Promise<TextStats> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
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

await withFabric({ rootConfig: NODE_CONFIG }, async () => {
  await new StatsAgent().aserve(STATS_AGENT_ADDR, { logLevel: "info" });
});
