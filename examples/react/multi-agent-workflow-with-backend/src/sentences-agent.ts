import { withFabric } from "@naylence/runtime";
import { BaseAgent, NODE_CONFIG } from "@naylence/agent-sdk";
import { SENTENCES_AGENT_ADDR, SentencesResult } from "./common.js";

class SentencesAgent extends BaseAgent {
  async runTask(payload: { text: string }): Promise<SentencesResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
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

await withFabric({ rootConfig: NODE_CONFIG }, async () => {
  await new SentencesAgent().aserve(SENTENCES_AGENT_ADDR, { logLevel: "info" });
});
