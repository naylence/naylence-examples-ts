import {
  withFabric,
  enableLogging,
  LogLevel,
  operation,
} from "@naylence/runtime";
import { Agent, BaseAgent, AgentProxy } from "@naylence/agent-sdk";

enableLogging(LogLevel.WARNING);

class SimpleAgent extends BaseAgent {
  @operation()
  async add(x: number, y: number): Promise<number> {
    return x + y;
  }

  @operation({ name: "fib_stream", streaming: true })
  async *fib(n: number): AsyncGenerator<number, void, void> {
    let a = 0;
    let b = 1;
    for (let i = 0; i < n; i += 1) {
      yield a;
      const next = a + b;
      a = b;
      b = next;
    }
  }
}

async function main(): Promise<void> {
  await withFabric(async (fabric) => {
    const agent = new SimpleAgent();
    const agentAddress = await fabric.serve(agent);

    const remote = Agent.remoteByAddress(agentAddress);

    const result = await remote.add(3, 4);
    console.log(result);

    const fibStream = await remote.fib_stream(10, { _stream: true });
    const values: number[] = [];
    for await (const value of fibStream) {
      values.push(value);
    }
    console.log(values.join(" "));
  });
}

void main().catch((error) => {
  console.error("rpc-agent example failed", error);
});
