# Chat Agent (LLM) Example — Stateful Conversations over the Fabric

This example builds a small **chat agent** that maintains per‑conversation history and talks to an LLM via the OpenAI API. A local **dev‑mode sentinel** coordinates routing; the client attaches to it and drives an interactive REPL.

```
client  →  sentinel  →  chat@fame.fabric (ChatAgent)
```

---

## What this shows

- **Per‑conversation state** using `startTask` / `runTurn` / `endConversation`.
- **In‑process dev fabric** with sentinel and an agent connected over WebSocket.
- **LLM callout** via the OpenAI Chat Completions API (model configurable).
- **Clean message loop**: user input → agent turn → assistant reply, with a bounded history window.
- **Docker-based deployment** for the chat agent with environment configuration.

---

> ⚠️ **Security note:** This demo is intentionally insecure for clarity. There is **no auth, TLS, or overlay security** enabled here. Later examples will layer in secure admission, identities, and sealed channels.

---

> **For curious souls:** Naylence ships with a lightweight HTTP server under the hood but you'll never need to see or configure it. All transport, routing, and addressing are handled by the fabric itself. No boilerplate servers, no route wiring, just `make start` and go.

---

## Files

- **`docker-compose.yml`** — starts a sentinel on **8000** and the chat agent container.
- **`src/sentinel.ts`** — runs a dev‑mode sentinel.
- **`src/chat-agent.ts`** — the `ChatAgent` implementation with conversation memory.
- **`src/client.ts`** — attaches to the sentinel, starts a conversation, and runs a REPL.
- **`src/test-client.ts`** — automated test client for CI/CD validation.
- **`src/common.ts`** — shared bits: `AGENT_ADDR = "chat@fame.fabric"`, OpenAI helper, model name.
- **`Dockerfile`** — extends the SDK image and installs the `openai` package.
- **`Makefile`** — `start`, `run`, `test`, `run-verbose`, `stop` targets.

---

## How it works (flow)

1. **Sentinel** starts and listens on `ws://localhost:8000`.
2. **ChatAgent** attaches to the sentinel using `FAME_DIRECT_ADMISSION_URL=ws://sentinel:8000/fame/v1/attach/ws/downstream`.
3. **Client** attaches to the sentinel and creates a **conversation** (task):
   - Calls `startTask({ id: <conversation_id>, payload: { system_prompt: ... } })`.
   - The agent stores a `ConversationState` (system prompt, history, `maxHistoryLength`).

4. **Turns**: the client calls `run_turn(conversation_id, user_message)` repeatedly.
   - The agent builds the OpenAI **messages**: `[system] + recent history` (bounded window) and calls the LLM.
   - The agent appends the assistant reply to history and returns the text.

5. **End**: the client sends `end_conversation(conversation_id)` to clear state.

---

## Agent details

- `ConversationState` holds a `systemPrompt`, `history`, and `maxHistoryLength` (default **10**).
- On each turn, the agent trims history to keep the last `2 * maxHistoryLength` messages (user+assistant pairs).
- LLM calls use `model = process.env.MODEL_NAME || "gpt-4o-mini"` and require `OPENAI_API_KEY`.
- Custom RPC methods (`run_turn`, `end_conversation`) are registered manually to match Python API.

---

## Environment variables

**Agent container**

```ini
FAME_DIRECT_ADMISSION_URL=ws://sentinel:8000/fame/v1/attach/ws/downstream
OPENAI_API_KEY=...            # required
MODEL_NAME=gpt-4o-mini        # optional override
```

**Client (host)**

```ini
FAME_DIRECT_ADMISSION_URL=ws://localhost:8000/fame/v1/attach/ws/downstream
OPENAI_API_KEY=...            # required for client-side test
```

> The `run-verbose` target sets `FAME_SHOW_ENVELOPES=true` to print envelope metadata for learning/debugging.

---

## Prerequisites

- **Node.js 18+**
- **Docker + Docker Compose**
- **OpenAI API Key** — set via `export OPENAI_API_KEY='sk-...'`

---

## Run it

```bash
# Set your OpenAI API key first
export OPENAI_API_KEY='sk-...'

make start       # start the sentinel and chat agent
make run         # launch the interactive REPL client
make test        # run automated test client
make run-verbose # same as run, but prints envelope metadata
make stop        # tear down containers
```

When prompted, type your question at `Q> `. The agent replies as `A> ...`. Type `exit` to end the conversation.

### Example session

```
🔹 Chat (type 'exit' to quit)
A> Ahoy there, matey! What be ye needin' help with today?

Q> What is the capital of France?
A> Arrr, the capital of France be Paris, it is! A fine port city, though not quite as salty as the seven seas!

Q> Tell me a joke
A> Why don't pirates shower before they walk the plank?
   Because they'll just wash up on shore anyway! Har har har!

Q> exit

Ended conversation: <conversation-id>
Goodbye!
```

---

## Code comparison: Python vs TypeScript

Key differences in the implementation:

| Python                                 | TypeScript                                   | Notes                   |
| -------------------------------------- | -------------------------------------------- | ----------------------- |
| `chat_agent.py`                        | `chat-agent.ts`                              | File naming conventions |
| `def start_task(self, params):`        | `async startTask(params: TaskSendParams)`    | Method naming           |
| `def run_turn(self, task_id, msg):`    | `async runTurn(taskId: string, msg: string)` | Method naming + types   |
| `def end_conversation(self, task_id):` | `async endConversation(taskId: string)`      | Method naming           |
| `states: dict[str, ConversationState]` | `states: Map<string, ConversationState>`     | Data structures         |
| `messages = [{"role": ...}, ...]`      | `messages = [{ role: ..., content: ... }]`   | Object syntax           |
| `client.chat.completions.create(...)`  | `await client.chat.completions.create(...)`  | Async/await             |
| `Agent.remote_by_address(...)`         | `Agent.remoteByAddress(...)`                 | Method naming           |
| `await agent.run_turn(id, msg)`        | `await agent.run_turn(conversationId, msg)`  | Custom RPC calls        |
| `input("Q> ")`                         | `readline.question("Q> ")`                   | I/O handling            |

---

## Troubleshooting

- **OpenAI auth error**
  - Set `OPENAI_API_KEY`: `export OPENAI_API_KEY='sk-...'`
  - Check org/project permissions if applicable
  - Verify your OpenAI account has API access

- **Model not found**
  - Set `MODEL_NAME` to a model available to your key (e.g., `gpt-4`, `gpt-3.5-turbo`)
  - Check OpenAI's model availability for your account

- **Client can't connect**
  - Ensure the sentinel is healthy on port **8000**: `docker compose ps`
  - Verify client's `FAME_DIRECT_ADMISSION_URL` points to `ws://localhost:8000/fame/v1/attach/ws/downstream`
  - Check sentinel logs: `docker compose logs sentinel`

- **No replies**
  - Confirm the agent attached to the sentinel: `docker compose logs chat-agent`
  - Try `make run-verbose` to see message traffic
  - Check for OpenAI API errors in agent logs

- **Build errors**
  - Ensure Node.js 18+ is installed: `node --version`
  - Clean and rebuild: `make clean && make build`

- **Docker issues**
  - Rebuild the image: `docker compose build --no-cache`
  - Check container health: `docker compose ps`

---

## Variations to try

- **Change the system prompt:** modify the `system_prompt` parameter in `client.ts` (e.g., "You are a concise technical assistant")
- **Swap the model:** set `MODEL_NAME` environment variable to use different OpenAI models
- **Streaming responses:** extend `ChatAgent` to stream partial tokens back to the client using `@operation({ streaming: true })`
- **Multi-turn memory:** adjust `maxHistoryLength` to control context window size
- **Function calling:** add OpenAI function calling to let the agent use tools
- **Conversation persistence:** store conversation state in a database for recovery
- **Multiple conversations:** run multiple concurrent conversations with different IDs
- **Custom agents:** create specialized agents with different personas or capabilities
- **Security:** add authentication and authorization to protect conversation endpoints

---

## Next steps

- Explore `llm/` examples for more advanced LLM integration patterns
- Add conversation persistence using `persistence/` examples
- Implement streaming responses for real-time interaction
- Add monitoring to track conversation metrics and LLM usage
- Extend with function calling for tool use
- Implement conversation branching and history navigation
- Add rate limiting and cost tracking for OpenAI API calls

---

This example demonstrates **stateful agent conversations** where the agent maintains per-conversation context across multiple turns, enabling natural multi-turn dialogues with LLMs while keeping the client simple and the state management centralized in the agent.
