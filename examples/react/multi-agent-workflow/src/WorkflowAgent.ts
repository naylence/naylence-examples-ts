import { BaseAgent, Agent } from '@naylence/agent-sdk';
import type { WorkflowResult } from './config';
import { STATS_AGENT_ADDR, KEYWORDS_AGENT_ADDR, SENTENCES_AGENT_ADDR } from './config';

export class WorkflowAgent extends BaseAgent {
  async runTask(payload: { text: string }): Promise<WorkflowResult> {
    const text = payload.text || '';

    // Use the agent's own fabric (set during registration) for outbound calls
    const agentFabric = this.fabric;
    if (!agentFabric) {
      throw new Error('WorkflowAgent fabric not set - agent may not be registered');
    }
    
    // Fan out to all worker agents using broadcast with explicit fabric
    const results = await Agent.broadcast(
      [STATS_AGENT_ADDR, KEYWORDS_AGENT_ADDR, SENTENCES_AGENT_ADDR],
      { text },
      { fabric: agentFabric }
    );
    
    // Return aggregated result
    return {
      stats: results[0][1],
      keywords: results[1][1],
      sentences: results[2][1],
    };
  }
}
