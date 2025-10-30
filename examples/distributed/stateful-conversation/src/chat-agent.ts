import { withFabric } from "@naylence/runtime";
import {
  BaseAgent,
  NODE_CONFIG,
  Task,
  TaskSendParams,
  TaskState,
  makeTask,
  firstDataPart,
} from "@naylence/agent-sdk";
import { AGENT_ADDR, getOpenAIClient, getModelName } from "./common.js";

const client = getOpenAIClient();

interface ConversationState {
  systemPrompt: string;
  history: Array<{ role: string; content: string }>;
  maxHistoryLength: number;
}

class ChatAgent extends BaseAgent {
  private states: Map<string, ConversationState> = new Map();

  async startTask(params: TaskSendParams): Promise<Task> {
    if (this.states.has(params.id)) {
      throw new Error(`Duplicate task: ${params.id}`);
    }

    const data = firstDataPart(params.message) as Record<string, any>;

    this.states.set(params.id, {
      systemPrompt: data?.system_prompt || "You are a helpful assistant",
      history: [],
      maxHistoryLength: data?.max_history_length || 10,
    });

    console.log(`Started conversation: ${params.id}`);

    return makeTask({
      id: params.id,
      state: TaskState.WORKING,
      payload: "",
      sessionId: params.sessionId,
    });
  }

  async runTurn(taskId: string, userMessage: string): Promise<string> {
    const state = this.states.get(taskId);
    if (!state) {
      throw new Error(`Invalid task: ${taskId}`);
    }

    state.history.push({ role: "user", content: userMessage });

    // Keep only the last n turns
    const n = state.maxHistoryLength || 10;
    const messages = [
      { role: "system", content: state.systemPrompt },
      ...state.history.slice(-n),
    ];

    // Call the LLM
    const resp = await client.chat.completions.create({
      model: getModelName(),
      messages: messages as any,
    });

    const answer = resp.choices[0].message.content || "";

    state.history.push({ role: "assistant", content: answer });
    // Trim to prevent unbounded growth
    state.history = state.history.slice(-(n * 2));

    return answer;
  }

  async endConversation(taskId: string): Promise<void> {
    this.states.delete(taskId);
    console.log(`Ended conversation: ${taskId}`);
  }
}

// Register custom RPC methods
const ChatAgentClass = ChatAgent as any;
if (!ChatAgentClass.rpcRegistry) {
  ChatAgentClass.rpcRegistry = new Map();
}
ChatAgentClass.rpcRegistry.set("run_turn", {
  propertyKey: "runTurn",
  streaming: false,
});
ChatAgentClass.rpcRegistry.set("end_conversation", {
  propertyKey: "endConversation",
  streaming: false,
});

await withFabric({ rootConfig: NODE_CONFIG }, async () => {
  await new ChatAgent().aserve(AGENT_ADDR, { logLevel: "info" });
});
