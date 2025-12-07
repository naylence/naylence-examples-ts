# Multi-Agent Workflow with Backend

This example demonstrates a **distributed multi-agent workflow** where:
- The **client runs in a React browser application**
- The **sentinel and all agents run as separate Docker containers** in the backend

The client connects to the backend sentinel via WebSocket and sends text for analysis. The workflow agent orchestrates three worker agents (stats, keywords, sentences) and returns aggregated results.

## Architecture

```
┌─────────────────┐         WebSocket          ┌─────────────────┐
│  React Client   │ ◄──────────────────────► │   Sentinel      │
│   (Browser)     │                            │   (Docker)      │
└─────────────────┘                            └────────┬────────┘
                                                        │
                                        ┌───────────────┼───────────────┐
                                        │               │               │
                                   ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
                                   │Workflow │    │ Stats   │    │Keywords │
                                   │ Agent   │    │ Agent   │    │ Agent   │
                                   └─────────┘    └─────────┘    └─────────┘
                                        │               │               │
                                        └───────────────┼───────────────┘
                                                        │
                                                   ┌────▼────┐
                                                   │Sentences│
                                                   │ Agent   │
                                                   └─────────┘
```

## Running the Example

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for building)

### Start Backend Services

```bash
make build    # Build backend and Docker images
make start    # Start all backend services
```

The sentinel will be available at `ws://localhost:8000`.

### Start Frontend

In a separate terminal:

```bash
make run-browser
```

The React app will be available at `http://localhost:3000`.

### Stop All Services

```bash
make stop
```

## How It Works

1. **Sentinel**: Central coordinator running on port 8000, accepting WebSocket connections
2. **Workflow Agent**: Orchestrates the analysis workflow by fanning out to worker agents
3. **Stats Agent**: Computes text statistics (character count, word count, reading time)
4. **Keywords Agent**: Extracts top keywords from the text
5. **Sentences Agent**: Provides a sentence preview
6. **React Client**: User interface for submitting text and viewing results

The React client connects to the sentinel via WebSocket and uses the `useRemoteAgent` hook to communicate with the workflow agent transparently.

## Development

- Backend source: `src/`
- Frontend source: `browser/src/`
- Build output: `dist/` (backend), `browser/dist/` (frontend)

## License

Apache-2.0
