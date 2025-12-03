# Browser Client for Naylence Hello Example

This directory contains a browser-based client that connects to the echo agent via WebSocket.

## Prerequisites

- The echo agent must be running (start it with `make start` from the parent directory)
- Node.js and npm installed

## Setup

The browser client uses local file links to `@naylence/runtime` and `@naylence/agent-sdk` to ensure it uses the latest builds with proper browser support. Install dependencies:

```bash
npm install
```

## Running the Browser Client

From the parent directory:

```bash
make run-browser
```

Or from this directory:

```bash
npm run dev
```

This will start a Vite development server at http://localhost:3000

## How It Works

The browser client:
1. Connects to the fabric using WebSocket (same as the Node.js client)
2. Uses the `@naylence/runtime` browser build
3. Sends a "Hello, World!" message to the echo agent
4. Displays the response in the browser

## Building for Production

To build the browser client for production:

```bash
npm run browser:build
```

To preview the production build:

```bash
npm run browser:preview
```

## Architecture

- `index.html` - Main HTML page with basic styling
- `src/browser-client.ts` - Browser-specific TypeScript client
- `vite.config.ts` - Vite configuration for development and bundling
