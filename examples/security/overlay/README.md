# Overlay Security — Envelope Signing with Public Key Exchange

Demonstrates **overlay security profile** with **envelope signing** for message integrity and authenticity. Unlike the _gated_ example, overlay security establishes cryptographic trust between nodes through **public key exchange**, not just admission tokens.

---

## Overview

This example shows how to enable **envelope-level security** using the **overlay security profile**. When a node attaches to a parent node, they **exchange raw public keys** during the handshake. These keys are then used to:

- **Sign envelopes**: Each message is cryptographically signed by the sender
- **Verify envelopes**: Each receiver verifies the signature before processing
- **Ensure provenance**: SIDs (source node fingerprints) provide message origin tracking
- **Tamper-evidence**: Any modification to envelopes is detected
- **Non-repudiation**: Signed messages provide audit trails

**Security Layers:**

- **Admission**: OAuth2 client credentials (same as gated example)
- **Overlay**: Envelope signing with exchanged public keys (adds message integrity)

**Architecture:**

```
┌──────────────┐     OAuth2 Token      ┌──────────────────┐
│   Client     │────────────────────────▶│ OAuth2 Server    │
│  (overlay)   │                        └──────────────────┘
└──────┬───────┘                                 │
       │                                         │ JWKS
       │ Token + PubKey Exchange                 ▼
       ▼                                   ┌──────────────┐
┌──────────────┐    TLS (Caddy)           │   Sentinel   │
│   Sentinel   │◀─────────────────────────│  (overlay)   │
│  (overlay)   │                          └──────────────┘
└──────┬───────┘                                 │
       │                                         │
       │ Signed Envelopes                        │
       ▼                                         ▼
┌──────────────┐                          ┌──────────────┐
│  Math Agent  │                          │ Math Agent   │
│  (overlay)   │                          │  (internal)  │
└──────────────┘                          └──────────────┘
```

**Components:**

- **Caddy**: TLS reverse proxy (terminates HTTPS/WSS)
- **OAuth2 Server**: Development-only token issuer (admission layer)
- **Sentinel**: Overlay security with envelope signing
- **Math Agent**: Connects using OAuth2 + envelope signing
- **Client**: Fetches token, exchanges keys, signs all messages

**Profiles in use:**

- Sentinel: `FAME_SECURITY_PROFILE=overlay`
- Agent: `FAME_SECURITY_PROFILE=overlay`, `FAME_ADMISSION_PROFILE=direct`
- Client: `FAME_SECURITY_PROFILE=overlay`, `FAME_ADMISSION_PROFILE=direct`

> ⚠️ **Note:** Public key exchange in this example does **not** use X.509 certificates. Certificates are supported only in the **advanced security package**.

---

## Prerequisites

- Node.js 18+ with TypeScript support
- Docker and Docker Compose
- `tsx` installed globally or available in local dependencies
- Basic understanding of public key cryptography and envelope signing

---

## Setup

### 1. Generate Secrets and Configuration

Run the initialization script to create OAuth2 client credentials and `.env` files:

```bash
make init
```

This generates:

- `config/.env.oauth2-server` – OAuth2 server signing keys and client credentials
- `config/.env.sentinel` – Sentinel overlay security settings
- `config/.env.agent` – Agent overlay security + OAuth2 credentials
- `config/.env.client` – Client overlay security + OAuth2 credentials

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
- **Sentinel**: Overlay security with envelope signing (internal port 8000)
- **Math Agent**: Connects using OAuth2 + envelope signing

### Run the Client

Execute the client to fetch a token, exchange keys, and make RPC calls:

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

All messages are cryptographically signed and verified.

### Run the Browser Client (PKCE)

Prefer a front-end walkthrough that handles OAuth2 PKCE in the browser?

```bash
make run-browser
```

This command installs the Vite dependencies (if needed) and launches a browser client at `http://localhost:3000`. The browser sample:

- Uses `direct-pkce` admission (no client secret required)
- Performs the OAuth2 authorization redirect and token exchange in the browser
- Connects to the sentinel with overlay security and shows signed Fibonacci stream updates live

Before launching, export and trust the Caddy root certificate so that the browser accepts requests to `https://localhost`. Step-by-step instructions are in `browser/README.md`.

### Run with Verbose Logging

For detailed envelope signing/verification logs:

```bash
make run-verbose
```

This shows:

- Public key exchange during node attach
- Envelope signing (SID generation, signature creation)
- Envelope verification (signature validation, SID checks)
- Message routing with signed envelopes

---

## Code Structure

### Python vs TypeScript

| **Aspect**              | **Python**                       | **TypeScript**                      |
| ----------------------- | -------------------------------- | ----------------------------------- |
| **Agent Definition**    | `class MathAgent(BaseAgent)`     | `class MathAgent extends BaseAgent` |
| **Operation Decorator** | `@operation()`                   | `@operation()`                      |
| **Streaming**           | `@operation(streaming=True)`     | `@operation({ streaming: true })`   |
| **RPC Call**            | `await agent.add(x=3, y=4)`      | `await agent.add({ x: 3, y: 4 })`   |
| **Config**              | `SENTINEL_CONFIG`, `NODE_CONFIG` | `SENTINEL_CONFIG`, `NODE_CONFIG`    |
| **Security Profile**    | `FAME_SECURITY_PROFILE=overlay`  | `FAME_SECURITY_PROFILE=overlay`     |
| **Admission Profile**   | `FAME_ADMISSION_PROFILE=direct`  | `FAME_ADMISSION_PROFILE=direct`     |

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
    // Process signed stream messages
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
FAME_SECURITY_PROFILE=overlay
FAME_JWT_TRUSTED_ISSUER=https://oauth2-server
FAME_JWT_AUDIENCE=fame.fabric
FAME_JWT_ALGORITHM=EdDSA
```

**Key Settings:**

- `FAME_SECURITY_PROFILE=overlay`: Enables envelope signing/verification
- Public keys are exchanged during node attach (automatic)
- JWT settings same as gated example (admission layer)

### Agent/Client Configuration (`.env.agent`, `.env.client`)

```bash
FAME_SECURITY_PROFILE=overlay
FAME_ADMISSION_PROFILE=direct
FAME_DIRECT_ADMISSION_URL=wss://sentinel/fame/v1/attach/ws/downstream
FAME_ADMISSION_TOKEN_URL=https://oauth2-server/oauth/token
FAME_ADMISSION_CLIENT_ID=${DEV_CLIENT_ID}
FAME_ADMISSION_CLIENT_SECRET=${DEV_CLIENT_SECRET}
```

**Key Settings:**

- `FAME_SECURITY_PROFILE=overlay`: Enables envelope signing/verification
- `FAME_ADMISSION_PROFILE=direct`: OAuth2 client credentials for admission
- Public key exchange happens automatically during attach

---

## Envelope Signing Flow

### 1. Node Attach with Key Exchange

When a node (agent or client) attaches to the sentinel:

```
1. Node sends admission request with OAuth2 token
2. Sentinel validates token (same as gated example)
3. Node and sentinel exchange raw public keys
4. Keys are stored for envelope signing/verification
```

### 2. Envelope Signing

When sending a message:

```
1. Create envelope with payload
2. Generate SID (source node fingerprint)
3. Sign envelope with sender's private key
4. Attach signature to envelope
5. Send signed envelope
```

### 3. Envelope Verification

When receiving a message:

```
1. Extract signature from envelope
2. Verify SID (source node fingerprint)
3. Validate signature using sender's public key
4. Reject if signature invalid or SID mismatch
5. Process payload if verification succeeds
```

### 4. Tamper Detection

Any modification to the envelope (payload, headers, SID) invalidates the signature:

```
Signed Envelope: { payload, headers, SID, signature }
↓
Tampered Envelope: { payload (modified), headers, SID, signature }
↓
Verification: FAIL (signature doesn't match modified payload)
```

---

## Troubleshooting

### Certificate Errors

**Issue:** `UNABLE_TO_VERIFY_LEAF_SIGNATURE` or `DEPTH_ZERO_SELF_SIGNED_CERT`

**Fix:** Ensure Caddy is healthy and certificates are accessible:

```bash
docker compose logs caddy
docker compose exec caddy ls -la /data/caddy/pki/authorities/local/
```

### Signature Verification Failures

**Issue:** `Invalid envelope signature` or `SID mismatch`

**Check:**

1. Ensure all nodes have `FAME_SECURITY_PROFILE=overlay`
2. Verify public keys were exchanged during attach (check sentinel logs)
3. Ensure envelopes are not being tampered with (check TLS termination)

**Debug:**

```bash
# View envelope signing/verification logs
make run-verbose
```

### Public Key Exchange Failures

**Issue:** Node attaches but messages fail verification

**Check:**

1. Verify sentinel has `FAME_SECURITY_PROFILE=overlay` in `.env.sentinel`
2. Check agent/client have `FAME_SECURITY_PROFILE=overlay` in their configs
3. Ensure OAuth2 admission succeeded before key exchange

**Debug:**

```bash
# Check sentinel logs for key exchange
docker compose logs sentinel-internal | grep -i "key exchange"
```

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

---

## Variations to Try

### 1. Compare with Gated Example

**Switch sentinel to gated mode** (disable envelope signing):

```bash
# .env.sentinel
FAME_SECURITY_PROFILE=gated  # Remove envelope signing
```

**Expected:** Messages are not signed/verified, only admission is secured.

### 2. Simulate Envelope Tampering

**Modify envelope payload** in transit (requires custom proxy):

```javascript
// Intercept and modify envelope
envelope.payload.x = 999; // Tamper with value
```

**Expected:** Signature verification fails, message is rejected.

### 3. Multi-Agent with Signed Messages

**Add another agent** with overlay security:

```bash
# Copy agent config
cp config/.env.agent config/.env.agent2
```

**Expected:** All agents exchange keys with sentinel, all messages are signed.

### 4. Inspect Signed Envelopes

**Enable envelope logging** to see signature details:

```bash
FAME_SHOW_ENVELOPES=true make run-verbose
```

**Expected:** See envelope structure with SID, signature, and payload.

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

1. **Overlay Security = Admission + Envelope Signing**: Combines OAuth2 admission with message-level integrity
2. **Public Key Exchange**: Nodes exchange raw public keys during attach (no X.509 certificates)
3. **Envelope Signing**: Every message is signed with sender's private key
4. **Envelope Verification**: Every message is verified with sender's public key
5. **Tamper-Evidence**: Any modification to envelopes is detected and rejected
6. **SID Provenance**: Source node fingerprints provide message origin tracking
7. **Beyond TLS**: Security at message level, independent of transport encryption

---

## Differences from Gated Example

| **Aspect**                | **Gated**                        | **Overlay**                            |
| ------------------------- | -------------------------------- | -------------------------------------- |
| **Security Scope**        | Admission only                   | Admission + Message integrity          |
| **Public Keys**           | Not used                         | Exchanged during attach                |
| **Envelope Signing**      | No                               | Yes (all messages)                     |
| **Envelope Verification** | No                               | Yes (all messages)                     |
| **Tamper Detection**      | Relies on TLS only               | Envelope-level signature validation    |
| **Provenance**            | None                             | SID (source node fingerprint)          |
| **Performance**           | Faster (no signing/verification) | Slower (signing/verification overhead) |
| **Use Case**              | Simple admission control         | Admission + message integrity          |

---

## Next Steps

- **Add X.509 Certificates**: See `../advanced/` for certificate-based trust (advanced security package)
- **Strict Overlay**: See `strict-overlay` profile for mandatory envelope encryption
- **Custom SID Validation**: Implement custom SID validation rules for multi-tenant isolation
- **Audit Trails**: Log all signed envelopes for compliance and forensics
- **Performance Tuning**: Optimize signature algorithms (EdDSA vs RSA vs ECDSA)

---

## Additional Resources

- [Digital Signatures Overview](https://en.wikipedia.org/wiki/Digital_signature)
- [Public Key Cryptography](https://en.wikipedia.org/wiki/Public-key_cryptography)
- [EdDSA (Ed25519) Algorithm](https://en.wikipedia.org/wiki/EdDSA)
- [Naylence Security Profiles](../../README.md#security-profiles)
