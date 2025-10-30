# Naylence Agent SDK — LLM Examples (Single‑Process)

This set of examples demonstrates how to use the Naylence Agent SDK to wrap **LLMs and multimodal APIs** as agents, while still running agent and client in the same process (no sentinel required). They highlight text chat and Q&A with OpenAI APIs.

> ⚠️ **Security note:** These examples are intentionally **insecure and non‑distributed**. They are for learning purposes only. Later distributed examples introduce admission via sentinels, and later still add authentication, identities, and overlay security.

---

## What you'll learn

- How to wrap an **async function** into an agent (`Agent.fromHandler`).
- How to implement an agent class that maintains **conversation state** across sessions.
- How to integrate with the **OpenAI Chat** API.
- How to handle task payloads and maintain conversation history.
- How to build interactive REPL interfaces for chat agents.

---

## Example catalog

| File            | Concept                     | What it does                                                                                                   |
| --------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `llm-agent.ts`  | **Function as Agent (Q&A)** | Wraps an async function using `Agent.fromHandler`; asks "What year did the first moon landing occur?" via GPT. |
| `chat-agent.ts` | **Chat Agent with Memory**  | A `BaseAgent` subclass that maintains per‑session history; supports multi‑turn conversations with GPT.         |

---

## Prerequisites

- **Node.js 24+**
- **npm** (for installing dependencies)
- **make** (for building and running examples)
- **Docker** (for containerized execution)
- **OpenAI API key** - Set your OpenAI API key:

  ```bash
  export OPENAI_API_KEY="sk-…"
  ```

---

## Running the examples

### Option 1: Using Make (Recommended)

Build the TypeScript sources and Docker image:

```bash
make build
```

This will:

1. Install npm dependencies
2. Compile TypeScript to JavaScript (`.mjs` files)
3. Build the Docker image with OpenAI client

Then run any script:

```bash
make run SCRIPT=llm-agent.mjs      # runs llm-agent.ts (Q&A)
make run SCRIPT=chat-agent.mjs     # runs chat-agent.ts (interactive)
```

For CI/non-interactive mode:

```bash
make run-ci SCRIPT=llm-agent.mjs
```

### Option 2: Direct npm execution

Build the TypeScript sources:

```bash
npm install
npm run build
```

Run the compiled scripts directly:

```bash
export OPENAI_API_KEY="sk-..."
export FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk
node dist/llm-agent.mjs
node dist/chat-agent.mjs
```

### Expected behaviors

- **llm-agent.mjs** → prints a fixed Q&A (moon landing year).
- **chat-agent.mjs** → starts a REPL; type questions, get GPT responses; type `exit` to quit.

---

## Build Process

The build process follows these steps:

1. **Install dependencies:** `npm install` adds OpenAI client and TypeScript compiler
2. **Compile TypeScript:** `tsc` compiles `.ts` files to `.js` in the `dist/` directory
3. **Rename to .mjs:** All `.js` files are renamed to `.mjs` for proper ESM support
4. **Fix imports:** Import statements are updated to use `.mjs` extensions
5. **Build Docker image:** Creates container with Naylence SDK and OpenAI client

The Docker image mounts the compiled `dist/` directory and runs the `.mjs` files directly.

---

## Docker Details

The custom Docker image (built with `make build`) includes:

- Base Naylence Agent SDK (`naylence/agent-sdk-node:0.3.3`)
- OpenAI TypeScript client (installed globally with symlink for ESM resolution)
- Node.js 24 runtime

The image mounts your local `dist/` directory, so you can rebuild TypeScript without rebuilding the Docker image.

---

## How it works

### llm-agent.ts (Function as Agent)

```typescript
const handler = await Agent.fromHandler(async (payload) => {
  const question = typeof payload === "string" ? payload : String(payload);

  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: question || "Please ask a question." },
  ];

  const response = await client.chat.completions.create({
    model: "gpt-5-mini",
    messages,
  });

  return (
    response.choices?.[0]?.message?.content ??
    "OpenAI returned an empty response."
  );
});

const agentAddress = await fabric.serve(handler);
const remote = Agent.remoteByAddress(agentAddress);
const answer = await remote.runTask(
  "What year did the first moon landing occur?",
  null,
);
```

### chat-agent.ts (Stateful Chat Agent)

```typescript
class ChatAgent extends BaseAgent {
  private readonly histories = new Map<string, ChatHistoryEntry[]>();

  async startTask(params: TaskSendParams): Promise<Task> {
    const sessionId = params.sessionId ?? params.id;
    const prompt = firstTextPart(params.message) ?? "";

    // Retrieve or create history
    const history = this.histories.get(sessionId) ?? [];
    const updatedHistory = history.concat({ role: "user", content: prompt });

    // Trim to max length
    const historyLength = params.historyLength ?? 10;
    const trimmedHistory = updatedHistory.slice(-historyLength * 2);

    // Call OpenAI
    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      ...trimmedHistory,
    ];

    const response = await client.chat.completions.create({
      model: "gpt-5-mini",
      messages,
    });

    const answer =
      response.choices?.[0]?.message?.content ??
      "I could not generate a reply.";

    // Store updated history
    const finalHistory = trimmedHistory.concat({
      role: "assistant",
      content: answer,
    });
    this.histories.set(sessionId, finalHistory);

    return makeTask({
      id: params.id,
      sessionId,
      state: TaskState.COMPLETED,
      payload: answer,
    });
  }
}
```

**Key concepts:**

- **Agents** wrap OpenAI calls (`OpenAI` client for chat).
- **Fabric** is created locally: `await withFabric(async (fabric) => { ... })`
- **Serving:** `agentAddress = await fabric.serve(myAgent)`
- **Client proxy:** `remote = Agent.remoteByAddress(agentAddress)`
- **Calling:** `await remote.runTask(payload, null)` or `await remote.startTask({ ... })`

Everything runs in one process, so the fabric routes requests in‑memory.

---

## Code comparison: Python vs TypeScript

Key differences in the implementation:

| Python                                | TypeScript                                            | Notes                   |
| ------------------------------------- | ----------------------------------------------------- | ----------------------- |
| `llm_agent.py`                        | `llm-agent.ts`                                        | File naming conventions |
| `chat_agent.py`                       | `chat-agent.ts`                                       | File naming conventions |
| `Agent.from_handler(handler)`         | `await Agent.fromHandler(handler)`                    | Async factory method    |
| `async with FameFabric.create(): ...` | `await withFabric(async (fabric) => { ... })`         | Context management      |
| `await fabric.serve(agent)`           | `await fabric.serve(agent as unknown as FameService)` | Type casting needed     |
| `Agent.remote_by_address(addr)`       | `Agent.remoteByAddress(addr)`                         | Method naming           |
| `await remote.run_task(payload=...)`  | `await remote.runTask(payload, null)`                 | Parameter order         |
| `first_text_part(message)`            | `firstTextPart(message)`                              | Function naming         |
| `dict[str, list[ChatHistoryEntry]]`   | `Map<string, ChatHistoryEntry[]>`                     | Data structures         |
| `input("Q> ")`                        | `await rl.question("Q> ")`                            | I/O handling            |
| `@dataclass`                          | `type ChatHistoryEntry = { ... }`                     | Type definitions        |

---

## Troubleshooting

- **Missing API key**
  - Set `OPENAI_API_KEY` in your shell: `export OPENAI_API_KEY="sk-..."`
  - Verify it's set: `echo $OPENAI_API_KEY`

- **Build errors**
  - Ensure Node.js 24+ is installed: `node --version`
  - Clean and rebuild: `make clean && make build`
  - Check npm installation: `npm --version`

- **Docker image fails to build**
  - Ensure Docker is running: `docker ps`
  - Free up disk space: `docker system prune`
  - Pull base image manually: `docker pull naylence/agent-sdk-node:0.3.3`

- **Runtime errors with modules**
  - Ensure build completed successfully (check for `dist/` directory)
  - Verify `.mjs` files exist: `ls dist/`
  - Rebuild if files are missing: `npm run build`

- **Interactive mode hangs in Docker**
  - Use `-it` flags for interactive mode (already included in Makefile)
  - For CI/automated testing, use `make run-ci SCRIPT=llm-agent.mjs`

- **OpenAI API errors**
  - Verify your API key is valid and has credits
  - Check for rate limits in OpenAI dashboard
  - Review OpenAI API error messages for permissions issues

- **"Cannot find module" errors**
  - Run `npm install` to ensure dependencies are installed
  - Check that `node_modules` exists
  - Rebuild the Docker image: `make build`

---

## Variations to try

- **Different models:** change the `model` parameter to use `gpt-4o`, `gpt-4-turbo`, or other OpenAI models
- **Streaming responses:** modify `chat-agent.ts` to stream tokens in real-time
- **System prompts:** customize the system message to change agent personality/behavior
- **Function calling:** add OpenAI function calling to let agents use tools
- **Multi-modal:** extend with image understanding using GPT-4 Vision
- **Custom handlers:** create specialized agents for specific domains (code, math, translation)
- **Conversation branching:** implement multiple conversation threads per session
- **Persistence:** save conversation history to disk or database
- **Temperature control:** adjust creativity/randomness of responses
- **Max tokens:** limit response length for cost control

---

## Next steps

- Run the **distributed/stateful-conversation** example to see multi-process chat with sentinels
- Explore **security-enabled** examples with signed envelopes, overlay encryption, and SPIFFE-style identities
- Extend `chat-agent.ts` with your own conversation logic or tool integrations
- Add monitoring to track token usage and conversation metrics
- Implement rate limiting and cost controls for OpenAI API calls
- Build a web UI for the chat agent using WebSockets

---

These LLM examples show how Naylence agents can encapsulate external model APIs. They're designed as a bridge from **local prototyping** to **distributed and secure multi-agent systems**.
