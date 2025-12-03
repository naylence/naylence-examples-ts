````markdown
# Browser Client for Naylence Distributed RPC Example

This directory contains a browser client that connects to the math agent over the fabric. It lets you run the `add`, `multiply`, and `fib_stream` RPC operations directly from the browser.

## Prerequisites

- The sentinel and math agent from this example must be running (`make start` from the parent directory)
- Node.js and npm installed locally

## Setup

Like the Node.js client, the browser client depends on the latest local builds of the Naylence packages. Install dependencies:

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

This starts a Vite development server at http://localhost:3000.

## How It Works

The browser client:

1. Connects to the fabric using the same WebSocket admission flow as the Node.js client
2. Uses the browser build of `@naylence/runtime`
3. Invokes the math agent's `add` and `multiply` operations with the provided inputs
4. Streams Fibonacci numbers via the `fib_stream` RPC and renders them incrementally in the UI

## Building for Production

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## File Map

- `index.html` — UI layout and styling
- `src/browser-client.ts` — browser-specific logic for calling the math agent
- `vite.config.ts` — Vite configuration tuned for the Naylence packages

````
