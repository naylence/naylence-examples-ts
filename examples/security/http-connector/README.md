# HTTP Connector — Direct HTTP Admission with Overlay Callback

Demonstrates **HTTP connector** for agents instead of the default WebSocket connector. Because HTTP is not full-duplex, the runtime combines **two half-duplex HTTP links** to create a logical full-duplex path between agent and sentinel.

---

## Overview

This example shows how to run a Naylence agent over **HTTP** instead of **WebSocket**. The runtime establishes bidirectional communication using:

1. **Downstream (agent → sentinel)**: Agent initiates HTTP connection to deliver outbound traffic and attach request
2. **Upstream (sentinel → agent)**: Sentinel performs **callback HTTP** connection back to the agent using a JWT grant

**Key Features:**

- **HTTP-only agent**: No WebSocket dependency for the agent
- **Dual half-duplex flows**: Downstream + upstream = logical full-duplex
- **Reverse authorization**: Sentinel authenticates to agent using HMAC-signed JWT
- **Stateless authentication**: Each callback request independently authenticated (no sessions)
- **Custom node config**: Bespoke YAML configuration for HTTP listener

**Architecture:**

```
┌──────────────┐   WebSocket      ┌──────────────────┐
│   Client     │──────────────────▶│   Sentinel       │
│ (WebSocket)  │                   │  (overlay)       │
└──────────────┘                   └────────┬─────────┘
                                            │
                         ┌──────────────────┴──────────────────┐
                         │                                     │
                         │ Downstream (HTTP)                   │ Upstream (HTTP)
                         │ Agent → Sentinel                    │ Sentinel → Agent
                         │ + OAuth2 Bearer Token               │ + HMAC JWT (callback)
                         ▼                                     ▼
                   ┌─────────────────────────────────────────────┐
                   │            Caddy Reverse Proxy              │
                   │  - /fame/v1/attach/ws/* → Sentinel (WS)     │
                   │  - /fame/v1/ingress/downstream → Sentinel   │
                   │  - /fame/v1/ingress/upstream → Agent        │
                   └─────────────────────────────────────────────┘
                                     │
                                     ▼
                             ┌──────────────┐
                             │  Math Agent  │
                             │ (HTTP only)  │
                             │  overlay-    │
                             │  callback    │
                             └──────────────┘
```

**Components:**

- **Caddy**: TLS reverse proxy with dual HTTP routing (downstream + upstream)
- **OAuth2 Server**: Development token issuer for admission
- **Sentinel**: Overlay security profile (accepts HTTP downstream, initiates HTTP upstream)
- **Math Agent**: HTTP listener with overlay-callback security
- **Client**: WebSocket connection to sentinel (can also use HTTP if desired)

**Profiles in use:**

- Sentinel: `FAME_SECURITY_PROFILE=overlay`
- Agent: `FAME_SECURITY_PROFILE=overlay-callback`, `FAME_ADMISSION_PROFILE=direct-http`
- Client: `FAME_ADMISSION_PROFILE=direct` (WebSocket)

---

## Prerequisites

- Node.js 18+ with TypeScript support
- Docker and Docker Compose
- `tsx` installed globally or available in local dependencies
- Basic understanding of HTTP vs WebSocket transports

---

## Setup

### 1. Generate Secrets and Configuration

Run the initialization script to create OAuth2 credentials and HMAC secret:

```bash
make init
```

This generates:

- `config/.env.oauth2-server` – OAuth2 server signing keys and client credentials
- `config/.env.sentinel` – Sentinel overlay security settings
- `config/.env.agent` – Agent HTTP configuration + HMAC secret for reverse auth
- `config/.env.client` – Client WebSocket configuration

**Important:** `FAME_HMAC_SECRET` is generated for HMAC-signed callback JWTs.

### 2. Build the TypeScript Code

Compile the example code to JavaScript:

```bash
make build
```

This runs `npm install` and `tsc`, outputting to the `dist/` directory.

---

## Running the Example

### Start Infrastructure

Start all services (Caddy, OAuth2, sentinel, HTTP math-agent):

```bash
make start
```

This runs:

- **Caddy**: TLS termination with HTTP routing on port 443
- **OAuth2 Server**: Development token issuer (port 8099)
- **Sentinel**: Overlay security, accepts WebSocket + HTTP downstream (internal port 8000)
- **Math Agent**: HTTP listener on port 8001, custom config at `/etc/fame/fame-config.yml`

**Startup sequence:**

1. Caddy waits for OAuth2 server
2. Sentinel starts with overlay security
3. Math Agent starts with HTTP listener and custom config
4. Agent sends downstream HTTP to sentinel
5. Sentinel establishes upstream HTTP callback to agent

### Run the Client

Execute the client to make RPC calls (client uses WebSocket to sentinel):

```bash
make run
```

**Expected Output:**

```
7
42
0 1 1 2 3 5 8 13 21 34
```

This shows:

1. `add(3, 4)` → `7`
2. `multiply(6, 7)` → `42`
3. `fib_stream(10)` → Fibonacci sequence

Client uses WebSocket, but agent uses HTTP bidirectional flow.

### Run with Verbose Logging

For detailed envelope routing logs:

```bash
make run-verbose
```

This shows:

- Downstream HTTP request (agent → sentinel)
- Upstream HTTP callback (sentinel → agent)
- HMAC JWT validation on each callback request
- Envelope routing through HTTP transport

---

## Code Structure

### Python vs TypeScript

| **Aspect**              | **Python**                               | **TypeScript**                           |
| ----------------------- | ---------------------------------------- | ---------------------------------------- |
| **Agent Definition**    | `class MathAgent(BaseAgent)`             | `class MathAgent extends BaseAgent`      |
| **Operation Decorator** | `@operation()`                           | `@operation()`                           |
| **Streaming**           | `@operation(streaming=True)`             | `@operation({ streaming: true })`        |
| **RPC Call**            | `await agent.add(x=3, y=4)`              | `await agent.add({ x: 3, y: 4 })`        |
| **Config**              | Custom YAML                              | Custom YAML                              |
| **Security Profile**    | `FAME_SECURITY_PROFILE=overlay-callback` | `FAME_SECURITY_PROFILE=overlay-callback` |
| **Admission Profile**   | `FAME_ADMISSION_PROFILE=direct-http`     | `FAME_ADMISSION_PROFILE=direct-http`     |

### TypeScript-Specific Details

**Math Agent** (`src/math-agent.ts`):

```typescript
class MathAgent extends BaseAgent {
  @operation()
  async add(params: { x: number; y: number }): Promise<number> {
    return params.x + params.y;
  }

  @operation({ name: "multiply" })
  async multi(params: { x: number; y: number }): Promise<number> {
    return params.x * params.y;
  }

  @operation({ name: "fib_stream", streaming: true })
  async *fib(params: { n: number }): AsyncGenerator<number> {
    let a = 0,
      b = 1;
    for (let i = 0; i < params.n; i++) {
      yield a;
      [a, b] = [b, a + b];
    }
  }
}

// Uses custom config from /etc/fame/fame-config.yml
await new MathAgent().aserve(AGENT_ADDR, { logLevel: "warning" });
```

**Client** (`src/client.ts`):

```typescript
// Client still uses WebSocket (default)
await withFabric({ rootConfig: CLIENT_CONFIG }, async () => {
  const agent = Agent.remoteByAddress(AGENT_ADDR);

  const sum = await agent.add({ x: 3, y: 4 });
  console.log(sum);
});
```

**Sentinel** (`src/sentinel.ts`):

```typescript
await Sentinel.aserve({
  rootConfig: SENTINEL_CONFIG,
  logLevel: "info",
});
```

---

## Configuration

### Agent Configuration (`.env.agent`)

```bash
FAME_PUBLIC_URL=https://math-agent  # URL sentinel uses for callback
FAME_AGENT_PORT=8001                # HTTP listener port
FAME_SECURITY_PROFILE=overlay-callback
FAME_ADMISSION_PROFILE=direct-http
FAME_DIRECT_ADMISSION_URL=https://sentinel/fame/v1/ingress/downstream
FAME_ADMISSION_TOKEN_URL=https://oauth2-server/oauth/token
FAME_ADMISSION_CLIENT_ID=${DEV_CLIENT_ID}
FAME_ADMISSION_CLIENT_SECRET=${DEV_CLIENT_SECRET}

FAME_JWT_REVERSE_AUTH_AUDIENCE=dev.naylence.ai
FAME_HMAC_SECRET=${FAME_HMAC_SECRET}  # For callback JWT signing
```

**Key Settings:**

- `FAME_PUBLIC_URL`: Agent's advertised URL (must be reachable from sentinel)
- `FAME_AGENT_PORT`: HTTP listener port
- `FAME_SECURITY_PROFILE=overlay-callback`: Enables reverse auth + overlay signing
- `FAME_ADMISSION_PROFILE=direct-http`: Direct admission over HTTP
- `FAME_JWT_REVERSE_AUTH_AUDIENCE`: Audience for callback JWT validation
- `FAME_HMAC_SECRET`: Shared secret for HMAC-signed callback JWTs

### Custom Node Config (`config/math-agent-config.yml`)

```yaml
node:
  public_url: ${env:FAME_PUBLIC_URL}
  listeners:
    - type: HttpListener
      port: ${env:FAME_AGENT_PORT}
  security:
    type: SecurityProfile
    profile: ${env:FAME_SECURITY_PROFILE}
  admission:
    type: DirectAdmissionClient
    connection_grants:
      - type: HttpConnectionGrant
        purpose: "node.attach"
        url: ${env:FAME_DIRECT_ADMISSION_URL}
        auth:
          type: BearerTokenHeaderAuth
          token_provider:
            type: OAuth2ClientCredentialsTokenProvider
            token_url: ${env:FAME_ADMISSION_TOKEN_URL}
            client_id: ${env:FAME_ADMISSION_CLIENT_ID}
            client_secret: ${env:FAME_ADMISSION_CLIENT_SECRET}
            scopes: [node.connect]
            audience: ${env:FAME_JWT_AUDIENCE}
```

**Key Components:**

- `HttpListener`: Enables HTTP transport instead of WebSocket
- `HttpConnectionGrant`: Configures downstream HTTP + callback authorization
- `BearerTokenHeaderAuth`: OAuth2 token for initial attach
- `public_url`: Agent's advertised URL for sentinel callbacks

### Sentinel Configuration (`.env.sentinel`)

```bash
FAME_SECURITY_PROFILE=overlay
FAME_JWT_TRUSTED_ISSUER=https://oauth2-server
FAME_JWT_AUDIENCE=fame.fabric
```

**Key Settings:**

- `FAME_SECURITY_PROFILE=overlay`: Standard overlay signing (no callback-specific config)
- Sentinel automatically handles HTTP downstream + upstream callback

### Caddy Routing (`config/Caddyfile`)

```plaintext
localhost:443 sentinel:443 oauth2-server:443 math-agent:443 {
  tls internal
  @sentinel_ws path /fame/v1/attach/ws/*
  @sentinel_http path /fame/v1/ingress/downstream/*
  @math path /fame/v1/ingress/upstream
  reverse_proxy @sentinel_ws sentinel-internal:8000
  reverse_proxy @sentinel_http sentinel-internal:8000
  reverse_proxy @math math-agent-internal:8001
}
```

**Key Routes:**

- `/fame/v1/attach/ws/*`: Client WebSocket attach to sentinel
- `/fame/v1/ingress/downstream/*`: Agent HTTP downstream to sentinel
- `/fame/v1/ingress/upstream`: Sentinel HTTP callback to agent

---

## HTTP Connector Flow

### 1. Agent Boots with HTTP Listener

Agent starts HTTP listener on port 8001 (configured in `math-agent-config.yml`).

### 2. Downstream HTTP (Agent → Sentinel)

Agent sends attach request to sentinel's HTTP ingress:

```
POST https://sentinel/fame/v1/ingress/downstream
Authorization: Bearer ${oauth2_token}
Content-Type: application/json

{
  "node_id": "...",
  "public_url": "https://math-agent",
  "callback_grant": {
    "type": "bearer",
    "token": "${hmac_jwt}",  // HMAC-signed JWT
    "audience": "dev.naylence.ai"
  }
}
```

**Key components:**

- OAuth2 token authenticates agent to sentinel
- `public_url`: Where sentinel should callback
- `callback_grant`: HMAC JWT for sentinel → agent auth

### 3. Upstream HTTP Callback (Sentinel → Agent)

Sentinel establishes callback connection to agent:

```
POST https://math-agent/fame/v1/ingress/upstream
Authorization: Bearer ${hmac_jwt}
Content-Type: application/json

{
  "messages": [...]
}
```

**Key components:**

- HMAC JWT authenticates sentinel to agent
- Each request independently authenticated (stateless)
- No session state maintained

### 4. Stateless Authentication

Every callback request includes a fresh HMAC-signed JWT:

**JWT Claims:**

```json
{
  "iss": "sentinel",
  "aud": "dev.naylence.ai",
  "iat": 1234567890,
  "exp": 1234567950, // Short TTL (e.g., 60 seconds)
  "sub": "agent-callback"
}
```

**Validation:**

- Agent verifies HMAC signature using `FAME_HMAC_SECRET`
- Agent checks `aud` matches `FAME_JWT_REVERSE_AUTH_AUDIENCE`
- Agent validates `exp` (not expired)
- Agent checks `iat` (issued-at time reasonable)

### 5. Bidirectional Message Flow

- **Client → Sentinel**: WebSocket or HTTP
- **Sentinel → Agent**: HTTP downstream (agent-initiated)
- **Agent → Sentinel**: HTTP upstream (sentinel callback)
- **Agent ← → Sentinel**: Logical full-duplex over HTTP

---

## Why `FAME_PUBLIC_URL` Matters

Inside Docker Compose, service names become network-resolvable hostnames:

- `math-agent` → resolves to `math-agent-internal` container
- `sentinel` → resolves to `sentinel-internal` container via Caddy

**Agent must advertise a URL the sentinel can reach:**

```bash
FAME_PUBLIC_URL=https://math-agent  # NOT localhost!
```

If set to `localhost` or host IP, sentinel callback will fail (sentinel is inside Docker network).

---

## Troubleshooting

### Callback Never Arrives

**Issue:** Agent attaches but no upstream traffic

**Check:**

1. `FAME_PUBLIC_URL` is reachable from sentinel
2. Caddy route for `/fame/v1/ingress/upstream` exists
3. Agent's HTTP listener is running on correct port

**Debug:**

```bash
# Check Caddy routing
docker compose exec caddy cat /etc/caddy/Caddyfile

# Test agent HTTP endpoint
curl -k https://localhost/fame/v1/ingress/upstream

# Check sentinel logs for callback attempts
docker compose logs sentinel-internal | grep callback
```

### 401/403 on Callback

**Issue:** Sentinel callback rejected by agent

**Check:**

1. `FAME_HMAC_SECRET` matches between agent config and callback JWT
2. `FAME_JWT_REVERSE_AUTH_AUDIENCE` matches JWT `aud` claim
3. JWT not expired (check clocks via NTP)

**Debug:**

```bash
# Check HMAC secret consistency
docker compose exec math-agent-internal env | grep HMAC
docker compose exec sentinel-internal env | grep HMAC

# View JWT validation logs
make logs | grep "JWT validation"
```

### Mismatched Audience

**Issue:** `Invalid audience` in agent logs

**Fix:** Ensure `FAME_JWT_REVERSE_AUTH_AUDIENCE` in `.env.agent` matches JWT `aud` claim.

```bash
# .env.agent
FAME_JWT_REVERSE_AUTH_AUDIENCE=dev.naylence.ai
```

### Agent Attaches but No Traffic

**Issue:** Downstream works, upstream fails

**Check:**

1. Both `/ingress/downstream` and `/ingress/upstream` routes in Caddy
2. Sentinel has network path to agent's `FAME_PUBLIC_URL`
3. Agent HTTP listener is healthy

**Debug:**

```bash
# Test both routes
curl -k https://localhost/fame/v1/ingress/downstream
curl -k https://localhost/fame/v1/ingress/upstream

# Check agent health
docker compose exec math-agent-internal netstat -tuln | grep 8001
```

### TLS Certificate Errors

**Issue:** `UNABLE_TO_VERIFY_LEAF_SIGNATURE`

**Fix:** Ensure all services trust Caddy internal CA:

```bash
# Check certificate exists
docker compose exec caddy ls -la /data/caddy/pki/authorities/local/root.crt

# Verify SSL_CERT_FILE env var
docker compose exec math-agent-internal env | grep SSL_CERT_FILE
```

---

## Variations to Try

### 1. Client Using HTTP Instead of WebSocket

**Modify** `.env.client` to use HTTP:

```bash
FAME_ADMISSION_PROFILE=direct-http
FAME_DIRECT_ADMISSION_URL=https://sentinel/fame/v1/ingress/downstream
```

**Expected:** Client uses HTTP downstream + upstream callback (same as agent).

### 2. Increase JWT TTL

**Modify** callback JWT expiration in agent config:

```yaml
# In custom config (if supported)
callback_jwt_ttl: 300 # 5 minutes instead of 60 seconds
```

**Expected:** Longer-lived callback tokens (weaker security, more replay risk).

### 3. Switch to WebSocket Agent

**Replace** custom config with standard WebSocket:

```bash
# Remove custom config mount in docker-compose.yml
# Use FAME_ADMISSION_PROFILE=direct in .env.agent
```

**Expected:** Agent uses WebSocket instead of HTTP (bidirectional in one connection).

### 4. Inspect HTTP Traffic

**Enable** verbose logging for HTTP requests:

```bash
# In docker-compose.yml, add to agent environment
FAME_LOG_HTTP_REQUESTS=true
```

**Expected:** See HTTP request/response logs for downstream + upstream.

---

## Cleanup

Stop all services and remove generated files:

```bash
make clean
```

This removes:

- Docker containers and volumes
- Generated `.env` files
- TypeScript build artifacts (`dist/`)

---

## Key Takeaways

1. **HTTP Connector = Downstream + Upstream**: Combines two half-duplex HTTP flows for logical full-duplex
2. **Reverse Authorization**: Sentinel authenticates to agent using HMAC-signed JWTs
3. **Stateless Callbacks**: Each upstream request independently authenticated (no sessions)
4. **Public URL Critical**: Agent must advertise URL reachable from sentinel (Docker network alias)
5. **Custom Config Required**: HTTP listener not in standard presets, needs bespoke YAML
6. **Dual Caddy Routing**: Both `/ingress/downstream` and `/ingress/upstream` routes essential
7. **Mixed Transports**: Client can use WebSocket while agent uses HTTP

---

## When to Use HTTP Connector

**Use HTTP connector when:**

- WebSocket not available (strict corporate firewalls, proxies)
- HTTP-only infrastructure requirements
- Simplified load balancing (standard HTTP load balancers)
- Stateless connection requirements (no WebSocket session state)

**Stick with WebSocket when:**

- Full-duplex communication preferred
- Lower latency required (no callback overhead)
- Simpler configuration (no reverse auth setup)
- Standard deployment (most examples use WebSocket)

---

## Additional Resources

- [HTTP vs WebSocket Transport](https://naylence.io/docs/transports)
- [HMAC-SHA256 Authentication](https://datatracker.ietf.org/doc/html/rfc2104)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Stateless Authentication Patterns](https://www.oauth.com/oauth2-servers/access-tokens/bearer-tokens/)
- [Naylence Security Profiles](../../README.md#security-profiles)
