````markdown
# Browser Client for the Status Subscription Example

This directory hosts a browser UI that starts a background task on the status agent and streams live task updates over the fabric with a realtime progress bar.

## Prerequisites

- The sentinel and status agent from the parent example must be running (`make start` from the parent directory)
- Node.js and npm available locally

## Setup

The browser client consumes the local Naylence package builds published in the repository. Install dependencies:

```bash
npm install
```

## Running the Browser Client

From the parent directory:

```bash
make run-browser
```

Or run directly from this folder:

```bash
npm run dev
```

Either command serves a Vite dev server on http://localhost:3000.

## What the UI Does

1. Connects to the fabric using the browser build of `@naylence/runtime`
2. Generates a task identifier and invokes `startTask(...)` on the status agent
3. Subscribes to the task's update stream with `subscribeToTaskUpdates(...)`
4. Renders status transitions and uses the artifact updates to drive a realtime progress bar

## Production Build

```bash
npm run build
```

Preview the production bundle:

```bash
npm run preview
```

## File Overview

- `index.html` — layout and styling for the dashboard
- `src/browser-client.ts` — browser-specific code for kicking off the task and handling the update stream
- `vite.config.ts` — Vite configuration tuned for the Naylence packages and shared source files

````
