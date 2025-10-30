import { BaseAgent, BaseAgentState, NODE_CONFIG } from "@naylence/agent-sdk";
import { operation } from "@naylence/runtime";
import { AGENT_ADDR } from "./common.js";

/**
 * Custom agent state that extends BaseAgentState
 */
class CustomAgentState extends BaseAgentState {
  value?: string;
}

/**
 * Agent that persists custom state using the configured storage provider
 * Storage provider is automatically resolved from the node context
 */
class PersistentAgent extends BaseAgent<CustomAgentState> {
  constructor() {
    super(null, {
      stateModel: CustomAgentState,
    });
  }

  /**
   * Store a value in the agent's persistent state
   */
  @operation()
  async storeValue(value: string): Promise<CustomAgentState> {
    return await this.withState(async (state) => {
      state.value = value;
      return state;
    });
  }

  /**
   * Retrieve the current state
   */
  @operation()
  async retrieveValue(): Promise<CustomAgentState> {
    return await this.getState();
  }
}

await new PersistentAgent()
  .aserve(AGENT_ADDR, { rootConfig: NODE_CONFIG })
  .catch((error) => {
    console.error("Persistent agent failed:", error);
    process.exit(1);
  });
