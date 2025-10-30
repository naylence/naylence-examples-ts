# Gated Admission with OAuth2

Demonstrates **gated admission** using **OAuth2 client credentials flow** to control access to the Naylence fabric. The sentinel validates bearer tokens before allowing agents and clients to attach.

---

## Overview

This example shows how to implement **admission-level security** using OAuth2. The sentinel runs in **gated** security profile and validates JWT bearer tokens issued by an OAuth2 authorization server before granting access to the fabric.

**Security Scope:**

- **Admission/Authentication**: OAuth2 client credentials for fabric access
- **No Overlay Encryption**: Communication within the fabric is not encrypted (see `overlay` or `strict-overlay` examples for that)

**Architecture:**

```
┌──────────────┐     OAuth2 Token      ┌──────────────────┐
│   Client     │────────────────────────▶│ OAuth2 Server    │
└──────┬───────┘                        └──────────────────┘
       │                                         │
       │ Token                                   │ JWKS
       ▼                                         ▼
┌──────────────┐       TLS Termination    ┌──────────────┐
│   Sentinel   │◀────────(Caddy)──────────│ Sentinel     │
│   (gated)    │                          │  (internal)  │
└──────┬───────┘                          └──────────────┘
       │                                         │
       │ Authenticated                           │
       ▼                                         ▼
┌──────────────┐                          ┌──────────────┐
│  Math Agent  │                          │ Math Agent   │
│  (direct)    │                          │  (internal)  │
└──────────────┘                          └──────────────┘
```

**Components:**

- **Caddy**: TLS reverse proxy (terminates HTTPS/WSS)
- **OAuth2 Server**: Development-only token issuer (do NOT use in production)
- **Sentinel**: Gated admission with JWT validation
- **Math Agent**: Connects using OAuth2 client credentials (direct admission profile)
- **Client**: Fetches token and calls agent via sentinel

---

## Prerequisites

- Node.js 18+ with TypeScript support
- Docker and Docker Compose
- `tsx` installed globally (`npm install -g tsx`) or available in local dependencies
- Basic understanding of OAuth2 client credentials flow

---

## Setup

### 1. Generate Secrets and Configuration

Run the initialization script to create OAuth2 client credentials and `.env` files:

```bash
make init
```

This generates:

- `config/.env.oauth2-server` – OAuth2 server signing keys and client credentials
- `config/.env.sentinel` – Sentinel JWT validation settings
- `config/.env.agent` – Agent OAuth2 client credentials (injected from `DEV_CLIENT_*`)
- `config/.env.client` – Client OAuth2 client credentials (injected from `DEV_CLIENT_*`)

**Note:** The generated client ID/secret are for **development only** and should never be used in production.

### 2. Build the TypeScript Code

Compile the example code to JavaScript:

```bash
make build
```

This runs `tsc` and outputs to the `dist/` directory.

---

## Running the Example

### Start Infrastructure

Start all services (Caddy, OAuth2 server, sentinel, math-agent):

```bash
make start
```

This runs:

- **Caddy**: TLS termination on port 443 with internal CA
- **OAuth2 Server**: Development token issuer with JWKS endpoint
- **Sentinel**: Gated admission with JWT validation (internal port 8000)
- **Math Agent**: Connects using OAuth2 credentials

**Health Checks:**

- Caddy waits for certificates to be generated and accessible
- Sentinel waits for Caddy to be healthy
- Math Agent waits for both Caddy and Sentinel to be healthy

### Run the Client

Execute the client to fetch a token and make RPC calls:

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

### Run with Verbose Logging

For detailed admission and JWT validation logs:

```bash
make run-verbose
```

This shows:

- OAuth2 token request/response
- JWT validation (signature, issuer, audience, expiration)
- Envelope routing through the fabric

---

## Code Structure

### Python vs TypeScript

| **Aspect**              | **Python**                                     | **TypeScript**                                 |
| ----------------------- | ---------------------------------------------- | ---------------------------------------------- |
| **Agent Definition**    | `class MathAgent(BaseAgent)`                   | `class MathAgent extends BaseAgent`            |
| **Operation Decorator** | `@operation()`                                 | `@operation()`                                 |
| **Streaming**           | `@operation(streaming=True)`                   | `@operation({ streaming: true })`              |
| **RPC Call**            | `await agent.add(x=3, y=4)`                    | `await agent.add({ x: 3, y: 4 })`              |
| **Config**              | `SENTINEL_CONFIG`, `NODE_CONFIG`               | `SENTINEL_CONFIG`, `NODE_CONFIG`               |
| **Admission Profile**   | `FAME_ADMISSION_PROFILE=direct`                | `FAME_ADMISSION_PROFILE=direct`                |
| **JWT Validation**      | `FAME_JWT_TRUSTED_ISSUER`, `FAME_JWT_AUDIENCE` | `FAME_JWT_TRUSTED_ISSUER`, `FAME_JWT_AUDIENCE` |

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

await new MathAgent().aserve(AGENT_ADDR, { rootConfig: NODE_CONFIG });
```

**Client** (`src/client.ts`):

```typescript
await withFabric({ rootConfig: CLIENT_CONFIG }, async () => {
  const agent = Agent.remoteByAddress(AGENT_ADDR);

  const sum = await agent.add({ x: 3, y: 4 });
  console.log(sum);

  const fibStream = await agent.fib_stream({ _stream: true, n: 10 });
  for await (const num of fibStream) {
    // Process stream
  }
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

## Security Configuration

### Sentinel Configuration (`.env.sentinel`)

```bash
FAME_SECURITY_PROFILE=gated
FAME_JWT_TRUSTED_ISSUER=https://oauth2-server
FAME_JWT_AUDIENCE=fame.fabric
FAME_JWT_ALGORITHM=EdDSA
```

**Key Settings:**

- `FAME_SECURITY_PROFILE=gated`: Requires valid JWT for admission
- `FAME_JWT_TRUSTED_ISSUER`: OAuth2 server URL (must match token `iss` claim)
- `FAME_JWT_AUDIENCE`: Required audience in token (`aud` claim)
- `FAME_JWT_ALGORITHM=EdDSA`: Token signing algorithm (Ed25519)

### Agent/Client Configuration (`.env.agent`, `.env.client`)

```bash
FAME_ADMISSION_PROFILE=direct
FAME_DIRECT_ADMISSION_URL=wss://sentinel/fame/v1/attach/ws/downstream
FAME_ADMISSION_TOKEN_URL=https://oauth2-server/oauth/token
FAME_ADMISSION_CLIENT_ID=${DEV_CLIENT_ID}
FAME_ADMISSION_CLIENT_SECRET=${DEV_CLIENT_SECRET}
```

**Key Settings:**

- `FAME_ADMISSION_PROFILE=direct`: Connect directly to sentinel with OAuth2
- `FAME_DIRECT_ADMISSION_URL`: Sentinel WebSocket endpoint (via Caddy TLS)
- `FAME_ADMISSION_TOKEN_URL`: OAuth2 token endpoint
- `FAME_ADMISSION_CLIENT_ID`/`FAME_ADMISSION_CLIENT_SECRET`: Injected from generated secrets

### TLS Certificate Handling

**Node.js requires explicit CA certificate configuration:**

```bash
NODE_EXTRA_CA_CERTS=/data/caddy/pki/authorities/local/root.crt
SSL_CERT_FILE=/data/caddy/pki/authorities/local/root.crt
```

**Why both variables?**

- `NODE_EXTRA_CA_CERTS`: Node.js native TLS/HTTPS
- `SSL_CERT_FILE`: Some libraries (e.g., `node-fetch`, certificate utilities)

---

## OAuth2 Flow

### 1. Client Credentials Grant

The agent/client automatically fetches a token before connecting:

```
POST https://oauth2-server/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=${DEV_CLIENT_ID}
&client_secret=${DEV_CLIENT_SECRET}
&scope=fame.fabric
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### 2. JWT Validation

The sentinel validates the token:

**Claims Checked:**

- `iss`: Must match `FAME_JWT_TRUSTED_ISSUER`
- `aud`: Must match `FAME_JWT_AUDIENCE`
- `exp`: Token must not be expired
- **Signature**: Verified using JWKS from `https://oauth2-server/.well-known/jwks.json`

### 3. Fabric Admission

Once validated, the agent/client is admitted to the fabric and can communicate with other agents.

---

## Troubleshooting

### Certificate Errors

**Issue:** `UNABLE_TO_VERIFY_LEAF_SIGNATURE` or `DEPTH_ZERO_SELF_SIGNED_CERT`

**Fix:** Ensure Caddy is healthy and certificates are accessible:

```bash
docker compose logs caddy
docker compose exec caddy ls -la /data/caddy/pki/authorities/local/
```

The `caddy` service healthcheck ensures certificates exist and have proper permissions before other services start.

### Token Validation Failures

**Issue:** `Invalid issuer` or `Invalid audience`

**Check:**

1. Ensure `.env.sentinel` has correct `FAME_JWT_TRUSTED_ISSUER` (must match token `iss`)
2. Verify `.env.agent`/`.env.client` use `FAME_JWT_AUDIENCE=fame.fabric`
3. Check OAuth2 server logs: `docker compose logs oauth2-server-internal`

### Connection Refused

**Issue:** Client cannot connect to sentinel

**Debug:**

```bash
# Check sentinel health
docker compose ps

# Verify sentinel is listening
docker compose exec sentinel-internal netstat -tuln | grep 8000

# Test Caddy routing
curl -k https://localhost/.well-known/jwks.json
```

### Missing Environment Variables

**Issue:** `DEV_CLIENT_ID` or `DEV_CLIENT_SECRET` not injected

**Fix:** Re-run initialization:

```bash
make clean
make init
```

This regenerates all secrets and `.env` files.

---

## Variations to Try

### 1. Invalid Token

**Modify** `.env.agent` to use an incorrect client secret:

```bash
FAME_ADMISSION_CLIENT_SECRET=invalid-secret
```

**Expected:** Sentinel rejects the connection with a 401 Unauthorized error.

### 2. Expired Token

**Modify** `generate-secrets.mjs` to create tokens with short expiration:

```javascript
expiresIn: "1s"; // Token expires in 1 second
```

**Expected:** Connection fails after token expires during active session.

### 3. Multiple Clients

**Create** additional client configurations with different credentials:

```bash
cp config/.env.client config/.env.client2
# Edit .env.client2 with new DEV_CLIENT_ID/SECRET
```

**Expected:** Each client gets independent authentication and access.

### 4. Switch to Overlay Encryption

**Upgrade** security to add message encryption (see `../overlay/` example):

```bash
# .env.sentinel
FAME_SECURITY_PROFILE=overlay  # Adds encryption layer
```

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

1. **OAuth2 Client Credentials**: Simple machine-to-machine authentication
2. **Gated Admission**: Sentinel validates JWT before granting fabric access
3. **Development OAuth2 Server**: For testing only – use a real OAuth2 provider in production
4. **JWT Validation**: Signature, issuer, audience, and expiration checks
5. **TLS Termination**: Caddy handles HTTPS/WSS with internal CA certificates
6. **No Overlay Encryption**: This example only controls admission, not message encryption

---

## Next Steps

- **Add Message Encryption**: See `../overlay/` for overlay encryption
- **Use Production OAuth2**: Replace dev OAuth2 server with Auth0, Keycloak, or Okta
- **Add Authorization**: Extend JWT claims to include roles/permissions
- **Multi-Tenant Isolation**: Use JWT claims to route messages to tenant-specific agents
- **Token Refresh**: Implement refresh token flow for long-lived sessions

---

## Additional Resources

- [OAuth2 Client Credentials Flow](https://oauth.net/2/grant-types/client-credentials/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Caddy TLS Documentation](https://caddyserver.com/docs/automatic-https)
- [Naylence Security Profiles](../../README.md#security-profiles)
