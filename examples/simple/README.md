# Simple Examples (TypeScript)

Single-process introductions to the Naylence Agent SDK. Each script spins up an in-process fabric, serves an agent, and exercises the matching Python behavior.

| Python Source           | TypeScript Port         | Status | Notes                                                                  |
| ----------------------- | ----------------------- | ------ | ---------------------------------------------------------------------- |
| `hello.py`              | `hello.ts`              | ✅     | Simplest agent that receives and logs a message.                       |
| `function_as_agent.py`  | `function-as-agent.ts`  | ✅     | Wraps a function with `Agent.fromHandler` and prints an ISO timestamp. |
| `echo_agent.py`         | `echo-agent.ts`         | ✅     | Minimal `BaseAgent` that echoes payloads.                              |
| `agent_with_bg_task.py` | `agent-with-bg-task.ts` | ✅     | Simulates background work and polls status transitions.                |
| `rpc_agent.py`          | `rpc-agent.ts`          | ✅     | Demonstrates `@operation` RPCs plus streaming Fibonacci.               |
| `agent_ping_pong.py`    | `agent-ping-pong.ts`    | ✅     | Two agents forwarding tasks ping → pong → caller.                      |
| `a2a_agent.py`          | `a2a-agent.ts`          | ✅     | Minimal A2A flow returning a completed task immediately.               |

> All scripts assume `FAME_PLUGINS=naylence-runtime`. The npm scripts set this automatically via `cross-env`.
