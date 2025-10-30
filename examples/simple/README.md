# Naylence Agent SDK Basics — Single‑Process Examples

These examples run **agent and client in the same process**. They're meant to teach the **core Agent SDK** concepts without any distributed wiring (no sentinel, no fabric admission URLs, no Docker networking). Each script starts a local fabric, serves an agent, obtains a typed proxy, makes a call, and prints results.

> ⚠️ **Security note:** For clarity, these examples use **no authentication or encryption**. Later examples introduce secure identities, admission, and overlay encryption.

---

## What you'll learn

- Spinning up a local `FameFabric` context
- Serving a `BaseAgent` (or turning a function into an agent)
- Calling methods via a typed client proxy (`Agent.remoteByAddress(...)`)
- Defining RPC operations (including **streaming**)
- Using the **A2A task model** (`startTask`, `getTaskStatus`)
- Simulating **background / long‑running** work

---

## Example catalog

| File                    | Concept                        | What it does                                                                        |
| ----------------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| `echo-agent.ts`         | **Minimal agent**              | Implements `BaseAgent.runTask` and echoes the payload back.                         |
| `function-as-agent.ts`  | **Function → Agent**           | Wraps a plain async function with `Agent.fromHandler` and returns the current time. |
| `rpc-agent.ts`          | **RPC operations & streaming** | Uses `@operation` to expose `add(x, y)` and a streaming Fibonacci generator.        |
| `agent-with-bg-task.ts` | **Background tasks**           | Returns `WORKING` immediately; status transitions to `COMPLETED` after async work.  |
| `a2a-agent.ts`          | **A2A minimal flow**           | Implements `startTask` to instantly return a `COMPLETED` task with a payload.       |
| `agent-ping-pong.ts`    | **Agent‑to‑Agent calls**       | `PingAgent` forwards a task to `PongAgent` and returns the result.                  |
| `hello.ts`              | **Hello World**                | Simplest possible agent example - just prints a greeting.                           |

---

## Prerequisites

- **Node.js 18+** (recommended)
- **make** (for using the convenient `make run` commands)
- Project dependencies installed (run `npm install` from repo root)
- The TypeScript examples use `tsx` for direct execution without compilation

---

## Quick start

### Option 1: Direct execution with npm scripts

Run examples using npm scripts from the repository root:

```bash
npm run example:simple:echo
npm run example:simple:function
npm run example:simple:rpc
npm run example:simple:bg-task
npm run example:simple:a2a
npm run example:simple:ping-pong
npm run example:simple:hello
```

### Option 2: Using Make (from the simple directory)

Use the convenient make command to run any script:

```bash
make run SCRIPT=echo-agent.ts
make run SCRIPT=function-as-agent.ts
make run SCRIPT=rpc-agent.ts
make run SCRIPT=agent-with-bg-task.ts
make run SCRIPT=a2a-agent.ts
make run SCRIPT=agent-ping-pong.ts
make run SCRIPT=hello.ts
```

If no script is specified, `echo-agent.ts` will be used by default:

```bash
make run  # runs echo-agent.ts
```

For verbose output with debug logging:

```bash
make run-verbose SCRIPT=rpc-agent.ts
```

### Option 3: Direct TypeScript execution

Run any script directly using tsx (requires dependencies installed):

```bash
cd /path/to/naylence-examples-ts
npx cross-env FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
  npx tsx --tsconfig examples/simple/tsconfig.json \
  examples/simple/echo-agent.ts
```

### Expected behaviors:

- **echo-agent.ts** → prints `Hello, World!`
- **function-as-agent.ts** → prints an ISO timestamp (UTC)
- **rpc-agent.ts** → prints `7`, then a stream of Fibonacci numbers
- **agent-with-bg-task.ts** → prints WORKING → (after delay) COMPLETED
- **a2a-agent.ts** → prints `Agent address: ...` then `Result: ...` with COMPLETED
- **agent-ping-pong.ts** → prints Pong reply for the forwarded message
- **hello.ts** → prints a simple greeting message

---

## How it works (all scripts)

1. **Create a fabric:** `await FameFabric.using(async (fabric) => { ... })`
2. **Serve an agent:** `const agentAddress = await fabric.serve(new MyAgent(...))`
3. **Get a client proxy:** `const remote = Agent.remoteByAddress(agentAddress)`
4. **Call the agent:**
   - `await remote.runTask({ payload: ... })` **or**
   - `await remote.someRpcMethod(args...)` **or**
   - `await remote.startTask(...)` / `await remote.getTaskStatus(...)`

Because everything runs in one process, the fabric routes calls in‑memory with minimal ceremony.

---

## Code comparison: Python vs TypeScript

Here are the key API differences when porting from Python to TypeScript:

| Python                                      | TypeScript                                          | Notes                        |
| ------------------------------------------- | --------------------------------------------------- | ---------------------------- |
| `run_task`                                  | `runTask`                                           | CamelCase for methods        |
| `start_task`                                | `startTask`                                         |                              |
| `get_task_status`                           | `getTaskStatus`                                     |                              |
| `Agent.from_handler`                        | `Agent.fromHandler`                                 |                              |
| `Agent.remote_by_address`                   | `Agent.remoteByAddress`                             |                              |
| `async with FameFabric.create() as fabric:` | `await FameFabric.using(async (fabric) => { ... })` | Resource management pattern  |
| `@operation`                                | `@operation`                                        | Decorator syntax is the same |

---

## Troubleshooting

- **Import errors** → ensure you ran `npm install` from the repository root.
- **Module not found errors** → make sure you're using the correct tsconfig path (`--tsconfig examples/simple/tsconfig.json`).
- **FAME_PLUGINS errors** → ensure you set `FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk` environment variable.
- **Event loop errors** → make sure you run scripts directly and not from inside another running loop.
- **Nothing prints** → some examples rely on async delays (e.g., background tasks). Give them a moment, or increase the timeout.

---

## Next steps

- Move to the **distributed/hello** example (sentinel + agent + client) to see remote attachment via admission URLs.
- Explore **security‑enabled** examples for identities, envelope signing, and overlay encryption.
- Try adding your own RPC methods with `@operation` or swap `runTask` logic for real work.
- Check out the **llm/** examples to see how to integrate AI models as agents.

---

These single‑process scripts are the fastest way to learn the **shape** of a Naylence agent before deploying it in a distributed, secure topology.
