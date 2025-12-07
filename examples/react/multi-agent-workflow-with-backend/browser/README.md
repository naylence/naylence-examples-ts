# Browser Frontend

This is the React frontend for the Multi-Agent Workflow with Backend example.

## Features

- Connects to backend sentinel via WebSocket
- Uses `@naylence/react` hooks (`useFabric`, `useRemoteAgent`)
- Simple, clean UI for text analysis
- Displays results from distributed agent workflow

## Configuration

The WebSocket URL is configured in `public/env.js` and defaults to `ws://localhost:8000/fame/v1/attach/ws/downstream`.

## Development

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

## Build

```bash
npm run build
```

The build output will be in the `dist/` directory.
