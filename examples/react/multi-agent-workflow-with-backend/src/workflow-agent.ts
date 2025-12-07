import { withFabric } from "@naylence/runtime";
import { BaseAgent, Agent, NODE_CONFIG } from "@naylence/agent-sdk";
import {
  WORKFLOW_AGENT_ADDR,
  STATS_AGENT_ADDR,
  KEYWORDS_AGENT_ADDR,
  SENTENCES_AGENT_ADDR,
  WorkflowResult,
} from "./common.js";

class WorkflowAgent extends BaseAgent {
  async runTask(payload: { text: string }): Promise<WorkflowResult> {
    const text = payload.text || '';
    
    // Fan out to all worker agents using broadcast
    const results = await Agent.broadcast(
      [STATS_AGENT_ADDR, KEYWORDS_AGENT_ADDR, SENTENCES_AGENT_ADDR],
      { text },
    );
    
    // Return aggregated result
    return {
      stats: results[0][1],
      keywords: results[1][1],
      sentences: results[2][1],
    };
  }
}

await withFabric({ rootConfig: NODE_CONFIG }, async () => {
  await new WorkflowAgent().aserve(WORKFLOW_AGENT_ADDR, { logLevel: "info" });
});
