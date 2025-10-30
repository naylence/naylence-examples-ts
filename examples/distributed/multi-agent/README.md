# Multi‑Agent Text Analysis Pipeline

This example demonstrates a **distributed multi‑agent pipeline** using Naylence. Multiple agents work together to analyze text: one agent generates a summary, another evaluates sentiment, and a third orchestrates the workflow by coordinating the other two agents.

> 🔑 **Requirements:** This example requires an **OpenAI API key** as the agents use OpenAI's API for text analysis.

---

Flow:

```
request: client ──▶ sentinel ──▶ analysis-agent ──┬─▶ summarizer-agent
                                                  └─▶ sentiment-agent
reply:   client ◀─ sentinel ◀─────────────────────┴──────── results merged
```

> ⚠️ **Security note:** This demo is intentionally **insecure** (no TLS, no identities, no overlay encryption). Later examples introduce secure admission, envelope signing, and overlay security.

---

> **For curious souls:** Naylence ships with a lightweight HTTP server under the hood but you'll never need to see or configure it. All transport, routing, and addressing are handled by the fabric itself. No boilerplate servers, no route wiring, just `make start` and go.

---

## What you'll learn

- How to run multiple agents on the same fabric, each with its own logical address.
- How one agent (`AnalysisAgent`) can call others in parallel using **`Agent.broadcast`** (scatter–gather pattern).
- How to structure an orchestrator that merges outputs into a combined payload.

---

## Components

- **sentinel.ts** — runs the sentinel (fabric router at `:8000`).
- **summarizer-agent.ts** — uses OpenAI to generate a summary of input text.
- **sentiment-agent.ts** — uses OpenAI to score sentiment 1–5.
- **analysis-agent.ts** — orchestrator; dispatches to summarizer & sentiment agents, collects results, returns combined object.
- **client.ts** — submits text to the analysis agent and prints JSON result.
- **common.ts** — shared addresses and OpenAI client setup.
- **docker-compose.yml** — runs sentinel + three agents; client runs on host.

**Logical addresses**

- `summarizer@fame.fabric`
- `sentiment@fame.fabric`
- `analysis@fame.fabric`

---

## Quick start

> **Prerequisites:**
>
> - Docker + Docker Compose + Node.js 18+ installed
> - **OpenAI API key** (required for text analysis)

**First, set your OpenAI API key:**

```bash
export OPENAI_API_KEY="sk-..."  # ⚠️ REQUIRED - get from https://platform.openai.com/api-keys
```

From this example folder:

```bash
make start       # 🚀 installs deps, builds, and brings up the stack (sentinel + three agents)
```

Run the sample client against the analysis agent:

```bash
make run         # ▶️ executes client
```

Shut down when done:

```bash
make stop        # ⏹ stop containers
```

### See envelope traffic

Use the verbose target to print every **envelope** as it travels through the fabric:

```bash
make run-verbose
```

---

## Alternative: Quick start (Docker Compose)

1. **Build and start services**

```bash
make build           # install deps, build TypeScript, build Docker image
docker compose up -d
```

This launches:

- **sentinel** on `localhost:8000`
- **summarizer-agent**, **sentiment-agent**, and **analysis-agent** connected downstream.

2. **Run the client (host)**

```bash
export OPENAI_API_KEY="sk-..."  # ensure set
FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
node dist/client.mjs
```

Or use the make target:

```bash
make run
```

### Example output

```json
{
  "summary": "The film Galactic Frontier dazzles visually but has a predictable plot and shallow characters.",
  "sentiment": "3"
}
```

3. **Stop services**

```bash
docker compose down --remove-orphans
```

---

## Standalone (no Compose)

Run each component in separate terminals using `npx tsx`:

**Terminal A — sentinel**

```bash
npx tsx src/sentinel.ts
```

**Terminal B — summarizer**

```bash
export OPENAI_API_KEY="sk-..."
FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
npx tsx src/summarizer-agent.ts
```

**Terminal C — sentiment**

```bash
export OPENAI_API_KEY="sk-..."
FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
npx tsx src/sentiment-agent.ts
```

**Terminal D — analysis (orchestrator)**

```bash
FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
npx tsx src/analysis-agent.ts
```

**Terminal E — client**

```bash
export OPENAI_API_KEY="sk-..."
FAME_DIRECT_ADMISSION_URL="ws://localhost:8000/fame/v1/attach/ws/downstream" \
FAME_PLUGINS=@naylence/runtime,@naylence/agent-sdk \
npx tsx src/client.ts
```

---

## Code snippets

### AnalysisAgent orchestration

```typescript
import { BaseAgent, Agent } from "@naylence/agent-sdk";

class AnalysisAgent extends BaseAgent {
  async runTask(payload: any, id: string | null): Promise<any> {
    const result = await Agent.broadcast(
      [SUMMARIZER_AGENT_ADDR, SENTIMENT_AGENT_ADDR],
      payload,
    );
    return {
      summary: result[0][1],
      sentiment: result[1][1],
    };
  }
}
```

### Client call

```typescript
import { withFabric } from "@naylence/runtime";
import { Agent, CLIENT_CONFIG } from "@naylence/agent-sdk";

await withFabric({ rootConfig: CLIENT_CONFIG }, async () => {
  const agent = Agent.remoteByAddress(ANALYSIS_AGENT_ADDR);
  const result = await agent.runTask(textToAnalyze);
  console.log(JSON.stringify(result, null, 2));
});
```

---

## Code comparison: Python vs TypeScript

Key differences in the implementation:

| Python                                   | TypeScript                                        | Notes                       |
| ---------------------------------------- | ------------------------------------------------- | --------------------------- |
| `run_task`                               | `runTask`                                         | CamelCase for method names  |
| `Agent.remote_by_address`                | `Agent.remoteByAddress`                           | Method naming               |
| `async with FameFabric.create():`        | `await withFabric({ ... }, async () => {})`       | Resource management pattern |
| `def run_task(self, payload, id):`       | `async runTask(payload: any, id: string \| null)` | Method signature            |
| `from openai import OpenAI`              | `import OpenAI from "openai"`                     | Import syntax               |
| `json.dumps(result, indent=2)`           | `JSON.stringify(result, null, 2)`                 | JSON formatting             |
| Snake case files (`summarizer_agent.py`) | Kebab case files (`summarizer-agent.ts`)          | File naming conventions     |

---

## Troubleshooting

- **Missing API key** → set `OPENAI_API_KEY` in your shell before starting services.
- **Agents don't connect** → start sentinel first; ensure `FAME_DIRECT_ADMISSION_URL` is set.
- **Results empty** → check OpenAI model availability; override with `MODEL_NAME` env var (default: `gpt-4o-mini`).
- **Build errors** → ensure Node.js 18+ is installed and run `npm install`.
- **OpenAI errors** → verify your API key is valid and has sufficient credits.
- **Port in use** → another process is using `8000`; change the Compose mapping or free the port.

---

## Environment variables

- `OPENAI_API_KEY` — **Required.** Your OpenAI API key for text analysis.
- `MODEL_NAME` — Optional. OpenAI model to use (default: `gpt-4o-mini`). Other options: `gpt-4`, `gpt-3.5-turbo`, etc.
- `FAME_DIRECT_ADMISSION_URL` — Sentinel admission endpoint (set automatically in docker-compose.yml).
- `FAME_SHOW_ENVELOPES` — Set to `true` for verbose envelope logging.

---

## Next steps

- Add more specialized agents (e.g., keyword extractor, entity recognizer) and have the analysis agent orchestrate them.
- Chain agents sequentially (e.g., translation → summarization → sentiment).
- Add resilience (timeouts, retries, degraded results if one agent fails).
- Secure the pipeline with authenticated identities and overlay encryption.
- Try different OpenAI models by setting `MODEL_NAME` environment variable.
- Modify the client to analyze different types of text (reviews, articles, social media posts).

---

This example shows how **multiple agents** can collaborate seamlessly in a distributed fabric, with orchestration logic living inside a higher‑level agent rather than the client.
