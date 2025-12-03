# Browser Client — Hello with Sentinel

A browser-based client for the **hello-with-sentinel** example. This demonstrates basic echo communication where a message is sent to an Echo agent and the original message is received back.

## Features

- Simple text input for sending messages
- Real-time echo response display
- Modern, clean UI matching other Naylence examples
- Enter key support for quick message sending

## Quick Start

### Prerequisites

- Docker and Docker Compose (for running sentinel and echo agent)
- Node.js 18+ (for the browser client)

### 1. Start the sentinel and echo agent

From the parent directory (`hello-with-sentinel`):

```bash
make start
```

This starts:
- **Sentinel** on `localhost:8000`
- **Echo agent** connected to the sentinel

### 2. Run the browser client

From this directory (`hello-with-sentinel/browser`):

```bash
npm install
npm run dev
```

The browser client will be available at `http://localhost:5173`

### 3. Use the application

1. Open your browser to `http://localhost:5173`
2. Enter a message in the text input (default: "Hello, World!")
3. Click "Send message" or press Enter
4. Watch the echo response appear below

## How It Works

The browser client:
1. Connects to the fabric through the sentinel at `ws://localhost:8000`
2. Sends your message to the Echo agent using `runTask(message)`
3. Receives the echoed message back
4. Displays the result in the UI

The Echo agent simply returns whatever payload it receives, making this a simple but complete demonstration of browser-to-agent communication over the Naylence fabric.

## Development

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Configuration

The sentinel URL and fabric plugins are configured in `env.js`:

```javascript
window.__ENV__ = {
  FAME_DIRECT_ADMISSION_URL: "ws://localhost:8000/fame/v1/attach/ws/downstream",
  FAME_PLUGINS: "@naylence/runtime,@naylence/agent-sdk",
};
```

Adjust these values if your sentinel is running on a different host/port.

## Troubleshooting

- **Cannot connect**: Ensure the sentinel is running (`make start` from parent directory)
- **Echo agent not responding**: Check that the echo agent container is running (`docker compose ps`)
- **Port already in use**: Change the port in `vite.config.ts` or kill the process using port 5173

## Next Steps

- Try the `distributed/rpc` example to see multiple operations beyond simple echo
- Explore the security examples to add authentication and encryption
- Modify the Echo agent to do something more interesting than just echoing
