````markdown
# Browser Client for the Cancellable Task Example

This directory contains a browser UI that starts a cancellable task on the agent, tracks progress in real time, and lets the user explicitly cancel the work.

## Prerequisites

- The sentinel and cancellable agent from the parent example must be running (`make start` from the parent directory)
- Node.js and npm installed locally

## Setup

The browser client reuses the locally built Naylence packages from this repository. Install dependencies:

```bash
npm install
```

## Running the Browser Client

From the parent directory:

```bash
make run-browser
```

Or run directly from this directory:

```bash
npm run dev
```

Both commands start a Vite development server on http://localhost:3000.

## What You Can Do

1. Connect to the fabric using the browser build of `@naylence/runtime`
2. Start a background task with `startTask(...)`
3. Visualize task progress on a realtime progress bar driven by artifact updates
4. Click **Cancel Task** to invoke `cancelTask(...)` manually and watch the task transition to the `CANCELLED` state

## Production Build

```bash
npm run build
```

Preview the optimized bundle:

```bash
npm run preview
```

## File Overview

- `index.html` — UI layout, styling, and accessibility hooks
- `src/browser-client.ts` — Browser controller logic for start/cancel and progress streaming
- `vite.config.ts` — Vite configuration aligned with Naylence package builds

````
