# Advanced Secure Stickiness — Load-Balanced Replicas with Strict Overlay (BSL)

Demonstrates **secure load balancing with stickiness** using **Naylence Advanced Security** (BSL-licensed). This example launches **two math-agent replicas**, enables **channel-level overlay encryption**, and configures the **sentinel** with **AFTLoadBalancerStickinessManager** to pin a client's encrypted flow to **one specific replica** throughout the session.

---

## Overview

This example shows how to implement **secure stickiness** for load-balanced agent replicas using the **strict overlay security profile**. The sentinel's advanced stickiness manager ensures that once a **secure channel** is established with a replica, all subsequent requests remain **pinned to that same replica**.

**Why Channel Encryption Requires Stickiness:**

Channel encryption is a **multi-message interaction**:

1. Client requests channel setup
2. Replica generates and sends keys
3. Secure channel is opened
4. Data flows over encrypted channel

For cryptographic continuity, **every message must reach the same replica**. If requests bounced between replicas, the channel context (keys/state) would be missing and the flow would fail. The **AFTLoadBalancerStickinessManager** enforces this by routing the channel setup and all subsequent frames to the **same replica**.

**Architecture:**

```
┌──────────────┐   OAuth2 Token    ┌──────────────────┐
│   Client     │──────────────────▶│ OAuth2 Server    │
│ (strict-     │                   └──────────────────┘
│  overlay)    │                            │
└──────┬───────┘                            │
       │                                    ▼
       │ Token                    ┌──────────────────┐
       ▼                          │ Welcome Service  │
┌──────────────┐                  │ (Admission)      │
│   Welcome    │◀─────────────────│                  │
│   Service    │                  └──────────────────┘
└──────┬───────┘                           │
       │ Placement                         │
       │ + Ticket                          ▼
       │ + CA Grant              ┌──────────────────┐
       ▼                         │   CA Service     │
┌──────────────┐                 │ (X.509/SPIFFE)   │
│ CA Service   │◀────────────────│                  │
└──────┬───────┘                 └──────────────────┘
       │ SPIFFE Cert                      │
       ▼                                  ▼
┌──────────────────────────────────────────────────┐
│              Sentinel (strict-overlay)           │
│     AFTLoadBalancerStickinessManager             │
│     - Channel setup → picks replica              │
│     - All subsequent → same replica (sticky)     │
└──────┬───────────────────────────┬────────────────┘
       │                           │
       │ Sticky Channel            │ Sticky Channel
       ▼                           ▼
┌────────────────┐          ┌────────────────┐
│ Math Agent     │          │ Math Agent     │
│ Replica 1      │          │ Replica 2      │
│ (strict-       │          │ (strict-       │
│  overlay)      │          │  overlay)      │
│ *.fame.fabric  │          │ *.fame.fabric  │
└────────────────┘          └────────────────┘
```

**Components:**

- **Caddy**: TLS reverse proxy
- **OAuth2 Server**: Development token issuer
- **Welcome Service**: Admission control (placement + attach tickets)
- **CA Service**: Issues SPIFFE X.509 certificates
- **Sentinel**: Strict overlay + AFTLoadBalancerStickinessManager
- **Math Agent Replicas (2)**: Both serve `math@fame.fabric` via wildcard `*.fame.fabric`
- **Client**: Connects with strict overlay, pinned to one replica

**Profiles in use:**

- Sentinel: `FAME_SECURITY_PROFILE=strict-overlay`, `stickiness: AFTLoadBalancerStickinessManager`
- Agents: `FAME_SECURITY_PROFILE=strict-overlay`, `requested_logicals: ["*.fame.fabric"]`
- Client: `FAME_SECURITY_PROFILE=strict-overlay`

> ⚠️ **Note:** This example requires the `@naylence/advanced-security` package and the corresponding Docker image (`naylence/agent-sdk-adv-node:0.3.3`). These components are licensed under the **BSL** (Business Source License).

---

## Prerequisites

- Node.js 18+ with TypeScript support
- Docker and Docker Compose
- `tsx` installed globally or available in local dependencies
- Basic understanding of load balancing, stickiness, and channel encryption

---

## Setup

### 1. Generate PKI and Secrets

Run the initialization script to create X.509 root CA, intermediate CA, and OAuth2 secrets:

```bash
make init
```

This generates:

- `config/certs/root-ca.crt`, `config/certs/root-ca.key` – Root CA for SPIFFE certificates
- `config/certs/issuing-ca.crt`, `config/certs/issuing-ca.key` – Intermediate CA
- `config/.env.*` – Configuration files for all services

### 2. Build the TypeScript Code

Compile the example code to JavaScript:

```bash
make build
```

This runs `npm install` and `tsc`, outputting to the `dist/` directory.

---

## Running the Example

### Start Infrastructure

Start all services (Caddy, OAuth2, Welcome, CA, sentinel, 2 agent replicas):

```bash
make start
```

This runs:

- **Caddy**: TLS termination on port 443
- **OAuth2 Server**: Development token issuer
- **Welcome Service**: Admission control with static placement
- **CA Service**: SPIFFE X.509 certificate authority
- **Sentinel**: Strict overlay with AFTLoadBalancerStickinessManager
- **Math Agent Replica 1**: First replica serving `math@fame.fabric`
- **Math Agent Replica 2**: Second replica serving `math@fame.fabric`

**Startup sequence:**

1. Caddy waits for OAuth2, Welcome, and CA services
2. Sentinel obtains admission + certificate
3. Both agent replicas obtain admission + certificates
4. All agents request wildcard `*.fame.fabric` logical

### Run the Client

Execute the client to establish a sticky channel and make RPC calls:

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

1. Client establishes encrypted channel with **one replica**
2. All subsequent requests (add, multiply, fib_stream) go to **same replica**
3. Stickiness maintained throughout session

### Run with Verbose Logging

For detailed stickiness and encryption logs:

```bash
make run-verbose
```

This shows:

- Channel setup request → replica selection
- Encrypted envelope metadata
- Stickiness manager routing decisions
- All requests pinned to same replica

---

## Verifying Stickiness

### Watch Replica Logs

In separate terminals:

```bash
# Terminal 1: Watch replica 1
docker compose logs -f math-agent-replica1

# Terminal 2: Watch replica 2
docker compose logs -f math-agent-replica2
```

**Run client multiple times:**

```bash
make run
make run
make run
```

**Expected:** Only **one replica** serves all requests in each client session. Different client sessions may use different replicas, but within a session, requests stick.

### Test Failover

**Stop the active replica:**

```bash
# If replica1 was serving
docker compose stop math-agent-replica1

# Run client again
make run
```

**Expected:** Client fails over to replica2, establishes new channel there, and subsequent requests stick to replica2.

**Restart replica1:**

```bash
docker compose start math-agent-replica1
```

**New client sessions** may now use either replica.

---

## Code Structure

### Python vs TypeScript

| **Aspect**              | **Python**                              | **TypeScript**                          |
| ----------------------- | --------------------------------------- | --------------------------------------- |
| **Agent Definition**    | `class MathAgent(BaseAgent)`            | `class MathAgent extends BaseAgent`     |
| **Operation Decorator** | `@operation()`                          | `@operation()`                          |
| **Streaming**           | `@operation(streaming=True)`            | `@operation({ streaming: true })`       |
| **RPC Call**            | `await agent.add(x=3, y=4)`             | `await agent.add({ x: 3, y: 4 })`       |
| **Config**              | Custom YAML or code                     | TypeScript config object                |
| **Wildcard Logical**    | `requested_logicals: ["*.fame.fabric"]` | `requested_logicals: ["*.fame.fabric"]` |
| **Stickiness Manager**  | `AFTLoadBalancerStickinessManager`      | `AFTLoadBalancerStickinessManager`      |

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

// Uses custom config with wildcard logical
await new MathAgent().aserve(AGENT_ADDR, {
  rootConfig: STICKINESS_AGENT_CONFIG,
});
```

**Agent Config** (`src/config.ts`):

```typescript
export const STICKINESS_AGENT_CONFIG = {
  plugins: ["@naylence/runtime", "@naylence/advanced-security"],
  node: {
    type: "Node",
    requested_logicals: ["*.fame.fabric"], // WILDCARD!
    security: {
      type: "SecurityProfile",
      profile: "${env:FAME_SECURITY_PROFILE:open}",
    },
    // ...
  },
};
```

**Sentinel Config** (`src/config.ts`):

```typescript
export const STICKINESS_SENTINEL_CONFIG = {
  plugins: ["@naylence/runtime", "@naylence/advanced-security"],
  node: {
    type: "Sentinel",
    // ...
    stickiness: {
      type: "AFTLoadBalancerStickinessManager",
      security_level: "strict", // Enforce identity-aware stickiness
    },
  },
};
```

**Client** (`src/client.ts`):

```typescript
await withFabric({ rootConfig: CLIENT_CONFIG }, async () => {
  const agent = Agent.remoteByAddress(AGENT_ADDR);

  // All calls pinned to same replica via stickiness
  const sum = await agent.add({ x: 3, y: 4 });
  const product = await agent.multiply({ x: 6, y: 7 });
  const fibStream = await agent.fib_stream({ _stream: true, n: 10 });
});
```

---

## Configuration

### Agent Configuration (`.env.agent`)

```bash
FAME_SECURITY_PROFILE=strict-overlay
FAME_DEFAULT_ENCRYPTION_LEVEL=channel

FAME_ADMISSION_PROFILE=welcome
FAME_ADMISSION_SERVICE_URL=https://welcome/fame/v1/welcome/hello
FAME_ADMISSION_TOKEN_URL=https://oauth2-server/oauth/token
FAME_ADMISSION_CLIENT_ID=${DEV_CLIENT_ID}
FAME_ADMISSION_CLIENT_SECRET=${DEV_CLIENT_SECRET}

FAME_CA_SERVICE_URL=https://ca/fame/v1/ca
FAME_CA_CERTS=/etc/fame/certs/root-ca.crt

FAME_PLUGINS=@naylence/runtime,@naylence/advanced-security
```

**Key Settings:**

- `FAME_SECURITY_PROFILE=strict-overlay`: Enables X.509/SPIFFE + channel encryption
- `FAME_DEFAULT_ENCRYPTION_LEVEL=channel`: Channel-level encryption (requires stickiness)
- Wildcard logical configured in code: `requested_logicals: ["*.fame.fabric"]`

### Sentinel Configuration (`.env.sentinel`)

```bash
FAME_SECURITY_PROFILE=strict-overlay
FAME_DEFAULT_ENCRYPTION_LEVEL=channel

FAME_ROOT=true
FAME_NODE_ID=Cb8WVCC4ML5RsFM

FAME_ADMISSION_PROFILE=welcome
FAME_ADMISSION_SERVICE_URL=https://welcome/fame/v1/welcome/hello
FAME_ADMISSION_TOKEN_URL=https://oauth2-server/oauth/token
FAME_ADMISSION_CLIENT_ID=${DEV_CLIENT_ID}
FAME_ADMISSION_CLIENT_SECRET=${DEV_CLIENT_SECRET}

FAME_CA_SERVICE_URL=https://ca/fame/v1/ca
FAME_CA_CERTS=/etc/fame/certs/root-ca.crt

FAME_PLUGINS=@naylence/runtime,@naylence/advanced-security
```

**Key Settings:**

- Stickiness manager configured in code: `stickiness: { type: "AFTLoadBalancerStickinessManager", security_level: "strict" }`
- `security_level: "strict"`: Enforces identity-aware stickiness based on client identity + channel context

---

## How Stickiness Works

### 1. Replica Registration

Both agent replicas request wildcard logical `*.fame.fabric`:

```typescript
requested_logicals: ["*.fame.fabric"];
```

This tells the sentinel:

- Multiple nodes may serve addresses under `fame.fabric`
- Enable load balancing for `math@fame.fabric`

### 2. Initial Channel Setup

When client first calls `math@fame.fabric`:

```
1. Client sends channel setup request
2. Sentinel's AFTLoadBalancerStickinessManager picks a replica (e.g., replica1)
3. Sentinel routes request to replica1
4. Replica1 generates channel keys
5. Encrypted channel established
6. Stickiness manager records: client → replica1
```

### 3. Subsequent Requests

For all subsequent requests in the session:

```
1. Client sends request over encrypted channel
2. Sentinel's stickiness manager checks client identity
3. Manager finds existing mapping: client → replica1
4. Sentinel routes request to replica1 (sticky!)
5. Replica1 processes request using existing channel
```

### 4. Stickiness Metadata

Stickiness manager tracks:

- **Client identity**: From SPIFFE certificate
- **Channel context**: Encryption keys, session state
- **Replica mapping**: Which replica owns this channel
- **Security level**: Strict (identity-aware) vs relaxed

### 5. Failover Handling

If the sticky replica becomes unavailable:

```
1. Client sends request
2. Stickiness manager detects replica1 down
3. Manager removes client → replica1 mapping
4. Sentinel picks new replica (e.g., replica2)
5. New channel established with replica2
6. New stickiness mapping: client → replica2
```

---

## Troubleshooting

### Requests Bounce Between Replicas

**Issue:** Logs show both replicas serving requests for same client

**Check:**

1. Agent config includes wildcard: `requested_logicals: ["*.fame.fabric"]`
2. Sentinel config has stickiness manager:
   ```typescript
   stickiness: {
     type: "AFTLoadBalancerStickinessManager",
     security_level: "strict"
   }
   ```
3. Both replicas serve same address: `math@fame.fabric`
4. Channel encryption enabled: `FAME_DEFAULT_ENCRYPTION_LEVEL=channel`

**Debug:**

```bash
# Check agent config
docker compose exec math-agent-replica1 env | grep FAME

# Check sentinel logs for stickiness decisions
docker compose logs sentinel-internal | grep stickiness
```

### No Encryption Visible

**Issue:** Envelopes show no encryption metadata

**Check:**

1. `FAME_SECURITY_PROFILE=strict-overlay` in all nodes
2. `FAME_DEFAULT_ENCRYPTION_LEVEL=channel` set
3. Advanced security plugin loaded: `FAME_PLUGINS=@naylence/advanced-security`
4. Using BSL image: `naylence/agent-sdk-adv-node:0.3.3`

**Debug:**

```bash
make run-verbose | grep -A 10 "sec"
```

### Agents Fail to Attach

**Issue:** Replicas not connecting to sentinel

**Check:**

1. Sentinel healthy before agents start
2. Welcome and CA services running
3. Certificate trust: `FAME_CA_CERTS=/etc/fame/certs/root-ca.crt`
4. OAuth2 credentials valid

**Debug:**

```bash
# Check startup order
docker compose ps

# Check agent logs
docker compose logs math-agent-replica1 | grep -i error
```

### Channel Encryption Fails

**Issue:** `Decryption failed` or `Invalid encryption key`

**Check:**

1. Stickiness enforcing same replica for channel setup + data
2. Both replicas have same security profile configuration
3. Certificates issued correctly from CA

**Debug:**

```bash
# Test with single replica
docker compose stop math-agent-replica2
make run
```

### Certificate Errors

**Issue:** `UNABLE_TO_VERIFY_LEAF_SIGNATURE`

**Fix:** Ensure all services trust Caddy + FAME CAs:

```bash
# Check Caddy TLS CA
docker compose exec caddy ls -la /data/caddy/pki/authorities/local/

# Check FAME root CA
ls -la config/certs/
```

---

## Variations to Try

### 1. Add More Replicas

**Modify** `docker-compose.yml`:

```yaml
math-agent-replica3:
  <<: *common-base
  command: ["node", "math-agent.mjs"]
  volumes:
    - ./dist:/app
    - /app/node_modules
    - caddy-data:/data
    - ./config/certs:/etc/fame/certs:ro
  depends_on:
    sentinel-internal:
      condition: service_healthy
  env_file:
    - config/.env.agent
```

**Expected:** Client sessions distributed across 3 replicas, each session sticky to one.

### 2. Switch to Sealed Encryption

**Modify** `.env.*` files:

```bash
FAME_DEFAULT_ENCRYPTION_LEVEL=sealed  # Per-message encryption
```

**Expected:** More overhead (each message encrypted), but works without stickiness.

### 3. Disable Stickiness

**Remove** stickiness config from sentinel:

```typescript
// In src/config.ts, remove:
stickiness: {
  type: "AFTLoadBalancerStickinessManager",
  security_level: "strict"
}
```

**Expected:** Channel encryption fails (requests bounce between replicas, no channel context).

### 4. Test Load Distribution

**Run multiple clients concurrently:**

```bash
make run & make run & make run &
```

**Expected:** Each client session sticks to one replica, but different sessions may use different replicas.

---

## Cleanup

Stop all services and remove generated files:

```bash
make clean
```

This removes:

- Docker containers and volumes
- Generated `.env` files
- PKI certificates (`config/certs/`)
- TypeScript build artifacts (`dist/`)

---

## Key Takeaways

1. **Stickiness Required for Channel Encryption**: Multi-message channel setup requires all messages reach same replica
2. **Wildcard Logicals Enable Load Balancing**: `*.fame.fabric` allows multiple replicas to serve same address
3. **AFTLoadBalancerStickinessManager**: Advanced stickiness with identity-aware routing
4. **Strict Security Level**: Uses client identity + channel context for sticky routing
5. **Failover Support**: Stickiness manager detects replica failure and re-maps to new replica
6. **Channel vs Sealed Encryption**: Channel requires stickiness, sealed works without
7. **BSL-Licensed Feature**: Advanced stickiness requires `@naylence/advanced-security` package

---

## When to Use Stickiness

**Use stickiness when:**

- Channel-level encryption required (multi-message setup)
- Stateful agent operations (session state, caching)
- Performance optimization (avoid replica state sync)
- Consistent routing for debugging/tracing

**Skip stickiness when:**

- Using sealed (per-message) encryption
- Stateless agents (no session state)
- Prefer round-robin distribution
- Simplify replica management

---

## Additional Resources

- [Load Balancing Patterns](https://martinfowler.com/articles/patterns-of-distributed-systems/load-balancer.html)
- [Session Affinity in Distributed Systems](https://www.nginx.com/blog/session-persistence-load-balancing/)
- [Channel Encryption vs Message Encryption](https://naylence.io/docs/encryption-levels)
- [SPIFFE Workload Identity](https://spiffe.io/docs/latest/spiffe-about/overview/)
- [Naylence Advanced Security (BSL)](https://naylence.io/docs/advanced-security)
