# Multi-Agent Workflow Example

A browser-only React example demonstrating multi-agent orchestration with the Naylence framework. This example showcases a text analysis workflow where a workflow agent coordinates multiple worker agents to analyze text in parallel.

## Architecture

This example implements a distributed agent topology that runs entirely in the browser:

```
Client Node → Sentinel Node → [Workflow Agent]
                                    ↓
                              [Stats Agent]
                              [Keywords Agent]
                              [Sentences Agent]
```

### Topology Components

- **Client Node**: Browser-based client that sends text to be analyzed and displays results
- **Sentinel Node**: Router that coordinates communication between the client and agent nodes
- **Workflow Agent**: Orchestrates the analysis workflow by fanning out to worker agents using `Agent.broadcast()`
- **Stats Agent**: Computes text statistics (character count, word count, sentence count, reading time)
- **Keywords Agent**: Extracts the top 5 most frequent keywords from the text
- **Sentences Agent**: Provides a preview of the first 3 sentences

### Key Features

1. **Browser-Only Execution**: All nodes run in the browser using `InPageListener` and `BroadcastChannel`
2. **Agent-to-Agent Communication**: The workflow agent uses `Agent.broadcast()` to call worker agents in parallel
3. **Deterministic Analysis**: No LLM or external API calls - pure JavaScript text processing
4. **Visual Topology**: React components with distinct node cards showing the agent hierarchy
5. **Real-time Results**: Immediate feedback with visual result display

## Running the Example

### Install Dependencies

```bash
npm install
```

### Start the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## How It Works

1. **Node Initialization**: The sentinel node starts first, followed by all four agent nodes, and finally the client node
2. **Agent Registration**: Each agent node serves its agent at a specific address (e.g., `workflow@fame.fabric`)
3. **User Input**: The user enters or loads sample text in the client interface
4. **Workflow Execution**: 
   - Client calls `workflowAgent.runTask({ text })`
   - Workflow agent broadcasts to all three worker agents using `Agent.broadcast([STATS_AGENT_ADDR, KEYWORDS_AGENT_ADDR, SENTENCES_AGENT_ADDR], { text })`
   - Each worker agent processes the text independently
   - Workflow agent aggregates the results and returns them to the client
5. **Result Display**: The client displays the combined analysis results

## Agent Implementations

### WorkflowAgent
Orchestrates the analysis by using `Agent.broadcast()` to fan out work to multiple agents in parallel and aggregates their responses.

### StatsAgent
Computes basic text statistics:
- Character count
- Word count (split on whitespace)
- Sentence count (split on `.!?`)
- Estimated reading time (200 words/minute)

### KeywordsAgent
Extracts keywords using frequency analysis:
- Converts text to lowercase
- Removes punctuation
- Filters words shorter than 4 characters
- Returns top 5 most frequent words

### SentencesAgent
Provides a text preview:
- Splits text into sentences
- Returns first 3 sentences
- Includes total sentence count

## Technology Stack

- **React 18**: UI framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **@naylence/react**: Naylence React integration hooks (`useFabric`, `useRemoteAgent`, `useFabricEffect`)
- **@naylence/runtime**: Browser-compatible Naylence runtime
- **@naylence/agent-sdk**: Base agent classes and utilities

## Project Structure

```
src/
  ├── config.ts              # Node configurations and type definitions
  ├── WorkflowAgent.ts       # Workflow orchestration agent
  ├── StatsAgent.ts          # Text statistics agent
  ├── KeywordsAgent.ts       # Keyword extraction agent
  ├── SentencesAgent.ts      # Sentence preview agent
  ├── ClientNode.tsx         # Client node component
  ├── SentinelNode.tsx       # Sentinel node component
  ├── AgentNode.tsx          # Reusable agent node component
  ├── App.tsx                # Main app component with topology layout
  ├── App.css                # Component styles
  ├── index.css              # Global styles
  └── main.tsx               # Application entry point
```

## Learn More

- [Naylence Documentation](https://docs.naylence.io)
- [Agent SDK Guide](https://docs.naylence.io/agent-sdk)
- [React Integration](https://docs.naylence.io/integrations/react)

## License

Apache-2.0
