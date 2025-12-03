# Multi-Agent Browser Client

Interactive web interface for the Naylence Multi-Agent text analysis pipeline.

## Features

- **Live text analysis** — Analyze any text with AI-powered summarization and sentiment scoring
- **Multi-agent orchestration** — Watch as the analysis agent coordinates summarizer and sentiment agents
- **Envelope inspector** — Real-time visibility into message routing and agent communication
- **Sample text loader** — Quick start with pre-loaded example text

## Quick Start

From the parent directory:

```bash
make start          # Start sentinel and agents
make run-browser    # Launch browser client at http://localhost:3000
```

Or from this directory:

```bash
npm install
npm run dev
```

## Requirements

- Node.js 18+
- Docker Compose (for backend services)
- **OpenAI API key** (set in parent docker-compose.yml)

## Architecture

```
Browser Client ──▶ Sentinel ──▶ Analysis Agent ──┬─▶ Summarizer Agent
                                                  └─▶ Sentiment Agent
```

The analysis agent uses `Agent.broadcast` to dispatch requests to both the summarizer and sentiment agents in parallel, then merges their responses into a single result.

## Usage

1. **Start services** (from parent directory): `make start`
2. **Open browser**: Navigate to http://localhost:3000
3. **Load sample or enter text**: Click "Load Sample" or type your own text
4. **Analyze**: Click "Analyze" button
5. **View results**: Summary and sentiment score (1-5) appear below
6. **Inspect envelopes**: Toggle envelope inspector to see agent communication

## Development

```bash
npm run dev      # Start dev server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build
```

## Environment Configuration

Edit `env.js` to customize:

- `FAME_DIRECT_ADMISSION_URL` — Sentinel WebSocket endpoint
- `FAME_LOG_LEVEL` — Logging verbosity
- `FAME_SHOW_ENVELOPES` — Enable/disable envelope logging

## Troubleshooting

- **Connection refused** → Ensure sentinel is running (`docker compose ps`)
- **No results** → Check OpenAI API key is set in parent `docker-compose.yml`
- **Agents not responding** → Verify all three agents are running
