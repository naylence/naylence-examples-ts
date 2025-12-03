# Advanced Security — Strict Overlay with X.509/SPIFFE Certificates (BSL)

Demonstrates **strict overlay security profile** with **X.509/SPIFFE workload certificates** and **sealed overlay encryption**. This is the **enterprise zero-trust profile** of Naylence, providing cryptographic node identities, federated admission, and end-to-end message confidentiality.

---

## Overview

This example shows Naylence running in its **strictest security mode**:

- **Cryptographic node identities**: Short-lived X.509/SPIFFE certificates
- **Federated admission**: Welcome service issues placement + attach tickets + CA grants
- **Certificate-based trust**: SPIFFE certs encode agent's physical path in the fabric
- **Dual validation**: Parent sentinels validate both attach ticket AND certificate
- **Sealed channels**: Overlay encryption ensures confidentiality across all hops

**Security Layers:**

1. **Admission**: OAuth2 token → Welcome service validates and issues:
   - Placement (which parent to attach to)
   - Attach ticket (short-lived capability JWT)
   - CA grant (authorization to request certificate)
2. **Identity**: CA service issues SPIFFE X.509 cert bound to placement
3. **Attachment**: Agent presents both attach ticket AND certificate to parent
4. **Validation**: Parent sentinel validates ticket, then cert (including path binding)
5. **Encryption**: Sealed channels with authenticated encryption across fabric hops

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
│   Welcome    │◀─────────────────│ Issues:          │
│   Service    │                  │ - Placement      │
└──────┬───────┘                  │ - Attach Ticket  │
       │                          │ - CA Grant       │
       │ Placement +              └──────────────────┘
       │ Attach Ticket                     │
       │ + CA Grant                        │
       ▼                                   ▼
┌──────────────┐   Cert Request   ┌──────────────────┐
│   CA Service │◀─────────────────│ Agent/Client     │
│ (X.509/      │   + CA Grant     │                  │
│  SPIFFE)     │─────────────────▶│ Gets SPIFFE Cert │
└──────────────┘   SPIFFE Cert    └──────────────────┘
       │                                   │
       │                                   │ Attach Ticket
       │                                   │ + SPIFFE Cert
       ▼                                   ▼
┌──────────────┐    TLS (Caddy)    ┌──────────────────┐
│   Sentinel   │◀──────────────────│   Sentinel       │
│ (strict-     │                   │  (internal)      │
│  overlay)    │                   └──────────────────┘
└──────┬───────┘                            │
       │                                    │
       │ Sealed Envelopes                   │
       ▼                                    ▼
┌──────────────┐                    ┌──────────────────┐
│  Math Agent  │                    │ Math Agent       │
│ (strict-     │                    │  (internal)      │
│  overlay)    │                    └──────────────────┘
└──────────────┘
```

**Components:**

- **Caddy**: TLS reverse proxy (terminates HTTPS/WSS)
- **OAuth2 Server**: Development token issuer (admission layer)
- **Welcome Service**: Admission control (placement + attach ticket + CA grant)
- **CA Service**: Issues SPIFFE X.509 certificates bound to placement
- **Sentinel**: Strict overlay security with ticket + cert validation
- **Math Agent**: Connects using full admission + identity flow
- **Client**: Fetches token → admission → certificate → attach → sealed RPC

**Profiles in use:**

- Sentinel: `FAME_SECURITY_PROFILE=strict-overlay`, `FAME_ADMISSION_PROFILE=welcome`
- Agent: `FAME_SECURITY_PROFILE=strict-overlay`, `FAME_ADMISSION_PROFILE=welcome`
- Client: `FAME_SECURITY_PROFILE=strict-overlay`, `FAME_ADMISSION_PROFILE=welcome`

> ⚠️ **Note:** This example requires the `@naylence/advanced-security` package and the corresponding Docker image (`naylence/agent-sdk-adv-node:0.3.3`). These components are licensed under the **BSL** (Business Source License).

---

## Prerequisites

- Node.js 18+ with TypeScript support
- Docker and Docker Compose
- `tsx` installed globally or available in local dependencies
- Basic understanding of X.509 certificates, SPIFFE, and federated admission

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
- `config/.env.oauth2-server` – OAuth2 server signing keys and client credentials
- `config/.env.welcome` – Welcome service JWT issuer keys
- `config/.env.ca` – CA service configuration
- `config/.env.sentinel`, `.env.agent`, `.env.client` – Node configurations

**Important:** These are **development-only** certificates and secrets. Do **not** use in production.

### 2. Build the TypeScript Code

Compile the example code to JavaScript:

```bash
make build
```

This runs `npm install` and `tsc`, outputting to the `dist/` directory.

---

## Running the Example

### Start Infrastructure

Start all services (Caddy, OAuth2, Welcome, CA, sentinel, math-agent):

```bash
make start
```

This runs:

- **Caddy**: TLS termination on port 8443 with internal CA
- **OAuth2 Server**: Development token issuer (port 8099)
- **Welcome Service**: Admission control with static placement (port 8090)
- **CA Service**: SPIFFE X.509 certificate authority (port 8098)
- **Sentinel**: Strict overlay security with ticket + cert validation (internal port 8000)
- **Math Agent**: Connects using full admission + identity flow

**Startup sequence:**

1. Caddy waits for OAuth2, Welcome, and CA services
2. Sentinel obtains admission from Welcome, then certificate from CA
3. Math Agent obtains admission from Welcome, then certificate from CA
4. Both Sentinel and Math Agent attach with ticket + cert validation

### Run the Client

Execute the client to perform the full admission + identity flow and make RPC calls:

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

All messages are cryptographically signed AND encrypted (sealed channels).

### Run with Verbose Logging

For detailed envelope encryption/signing logs:

```bash
make run-verbose
```

This shows:

- OAuth2 token request/response
- Welcome service admission (placement, attach ticket, CA grant)
- CA certificate request/response (SPIFFE cert)
- Sentinel attach with ticket + cert validation
- Sealed envelope encryption/decryption
- Message routing with encrypted envelopes

### Run the Browser Client (PKCE + Strict Overlay)

Interact with the strict overlay fabric directly from the browser using the PKCE flow and trust bundle support:

1. Ensure the stack is running (`make start`) and the development Caddy root certificate is trusted on your system (`https://localhost:8443`).
2. Generate secrets if you have not already. This creates a PKCE client and renders `browser/env.js` from the template:

  ```bash
  make init
  ```

3. Launch the browser client:

  ```bash
  make run-browser
  ```

4. Open <http://localhost:3000>. The runtime will
  - perform OAuth2 PKCE to the development IdP,
  - download the Naylence trust bundle from `/.well-known/naylence/trust-bundle.json` (TOFU enabled),
  - request a SPIFFE certificate from the CA service, and
  - execute sealed math RPCs against the fabric.

The generated `browser/env.js` can be regenerated at any time via `make init` if you need to refresh the PKCE client identifier.

---

## Code Structure

### Python vs TypeScript

| **Aspect**              | **Python**                                 | **TypeScript**                             |
| ----------------------- | ------------------------------------------ | ------------------------------------------ |
| **Agent Definition**    | `class MathAgent(BaseAgent)`               | `class MathAgent extends BaseAgent`        |
| **Operation Decorator** | `@operation()`                             | `@operation()`                             |
| **Streaming**           | `@operation(streaming=True)`               | `@operation({ streaming: true })`          |
| **RPC Call**            | `await agent.add(x=3, y=4)`                | `await agent.add({ x: 3, y: 4 })`          |
| **Config**              | `SENTINEL_CONFIG`, `NODE_CONFIG`           | `SENTINEL_CONFIG`, `NODE_CONFIG`           |
| **Security Profile**    | `FAME_SECURITY_PROFILE=strict-overlay`     | `FAME_SECURITY_PROFILE=strict-overlay`     |
| **Admission Profile**   | `FAME_ADMISSION_PROFILE=welcome`           | `FAME_ADMISSION_PROFILE=welcome`           |
| **Plugins**             | `FAME_PLUGINS=@naylence/advanced-security` | `FAME_PLUGINS=@naylence/advanced-security` |

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
    // Process sealed stream messages
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
FAME_SECURITY_PROFILE=strict-overlay
FAME_DEFAULT_ENCRYPTION_LEVEL=channel

FAME_ROOT=true
FAME_NODE_ID=Cb8WVCC4ML5RsFM  # Pre-defined node ID for static placement

FAME_ADMISSION_PROFILE=welcome
FAME_ADMISSION_SERVICE_URL=https://welcome/fame/v1/welcome/hello
FAME_ADMISSION_TOKEN_URL=https://oauth2-server/oauth/token
FAME_ADMISSION_CLIENT_ID=${DEV_CLIENT_ID}
FAME_ADMISSION_CLIENT_SECRET=${DEV_CLIENT_SECRET}

FAME_JWT_TRUSTED_ISSUER=https://welcome/fame/welcome
FAME_JWKS_URL=https://welcome/fame/welcome/.well-known/jwks.json

FAME_CA_SERVICE_URL=https://ca/fame/v1/ca
FAME_CA_CERTS=/etc/fame/certs/root-ca.crt
```

**Key Settings:**

- `FAME_SECURITY_PROFILE=strict-overlay`: Enables X.509/SPIFFE + sealed channels
- `FAME_DEFAULT_ENCRYPTION_LEVEL=channel`: Encrypted channels (vs `sealed` for per-message encryption)
- `FAME_ADMISSION_PROFILE=welcome`: Use Welcome service for admission
- `FAME_CA_SERVICE_URL`: CA service endpoint for certificate requests
- `FAME_CA_CERTS`: Root CA certificate for SPIFFE validation

### Agent/Client Configuration (`.env.agent`, `.env.client`)

```bash
FAME_SECURITY_PROFILE=strict-overlay
FAME_DEFAULT_ENCRYPTION_LEVEL=channel

FAME_ADMISSION_PROFILE=welcome
FAME_ADMISSION_SERVICE_URL=https://welcome/fame/v1/welcome/hello
FAME_ADMISSION_TOKEN_URL=https://oauth2-server/oauth/token
FAME_ADMISSION_CLIENT_ID=${DEV_CLIENT_ID}
FAME_ADMISSION_CLIENT_SECRET=${DEV_CLIENT_SECRET}

FAME_JWKS_URL=https://welcome/fame/welcome/.well-known/jwks.json

FAME_CA_SERVICE_URL=https://ca/fame/v1/ca
FAME_CA_CERTS=/etc/fame/certs/root-ca.crt
```

**Key Settings:**

- Same security profile and admission settings as sentinel
- CA service URL for certificate requests
- CA certs for SPIFFE validation

### Welcome Service Configuration (`config/welcome.yml`)

```yaml
welcome:
  type: AdvancedWelcomeService

  placement:
    type: StaticNodePlacementStrategy
    target_system_id: Cb8WVCC4ML5RsFM # Sentinel node ID
    target_physical_path: /Cb8WVCC4ML5RsFM

  token_issuer:
    type: JWTTokenIssuer
    issuer: https://welcome/fame/welcome
    audience: fame.fabric

  ca_service_url: https://ca/fame/v1/ca

  authorizer:
    type: OAuth2Authorizer
    issuer: https://oauth2-server
    required_scopes: [node.connect]
```

**Key Settings:**

- `StaticNodePlacementStrategy`: Pre-defined placement (all nodes attach to sentinel)
- `token_issuer`: Issues attach tickets (JWTs)
- `ca_service_url`: CA endpoint for CA grants
- `authorizer`: Validates OAuth2 tokens before issuing admission

### CA Service Configuration (`config/ca.yml`)

```yaml
ca:
  authorizer:
    type: OAuth2Authorizer
    issuer: https://welcome/fame/welcome
    require_scope: false
    audience: ca
```

**Key Settings:**

- `authorizer`: Validates attach tickets from Welcome service
- Issues SPIFFE X.509 certificates bound to placement

---

## Admission + Identity Flow

### 1. OAuth2 Token Request

The client/agent fetches a token from OAuth2 server:

```
POST https://oauth2-server/oauth/token
grant_type=client_credentials
client_id=${DEV_CLIENT_ID}
client_secret=${DEV_CLIENT_SECRET}
scope=node.connect
```

**Response:** `access_token` (OAuth2 bearer token)

### 2. Welcome Service Admission

The client/agent contacts Welcome service with OAuth2 token:

```
POST https://welcome/fame/v1/welcome/hello
Authorization: Bearer ${access_token}
```

**Response:**

```json
{
  "placement": {
    "parent_system_id": "Cb8WVCC4ML5RsFM",
    "physical_path": "/Cb8WVCC4ML5RsFM/9gxwoGeeBBSR3Oh"
  },
  "attach_ticket": "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...",
  "ca_grant": "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9..."
}
```

**Key components:**

- `placement`: Where to attach in the fabric (parent node ID + path)
- `attach_ticket`: Short-lived JWT for attachment authorization
- `ca_grant`: Authorization to request certificate from CA

### 3. CA Certificate Request

The client/agent requests SPIFFE X.509 certificate from CA:

```
POST https://ca/fame/v1/ca
Authorization: Bearer ${ca_grant}
{
  "physical_path": "/Cb8WVCC4ML5RsFM/9gxwoGeeBBSR3Oh",
  "csr": "-----BEGIN CERTIFICATE REQUEST-----..."
}
```

**Response:**

```json
{
  "certificate": "-----BEGIN CERTIFICATE-----...",
  "certificate_chain": ["-----BEGIN CERTIFICATE-----..."]
}
```

**SPIFFE certificate contains:**

- `Subject`: Node's physical path in fabric
- `Issuer`: Intermediate CA
- `SPIFFE ID`: URI encoding fabric path (e.g., `spiffe://fame.fabric/Cb8WVCC4ML5RsFM/9gxwoGeeBBSR3Oh`)
- `Validity`: Short-lived (e.g., 24 hours)

### 4. Sentinel Attachment

The client/agent connects to parent sentinel with:

- **Attach ticket** (JWT): Proves admission was granted
- **SPIFFE certificate**: Proves identity and path binding

**Sentinel validates:**

1. Attach ticket signature (from Welcome service)
2. Attach ticket expiration and claims
3. SPIFFE certificate signature (from CA)
4. SPIFFE certificate expiration
5. SPIFFE certificate path matches ticket placement
6. SPIFFE certificate trust chain to root CA

**On success:** Node is admitted and sealed channels are established.

### 5. Sealed Channel Encryption

All messages are encrypted using:

- **Algorithm**: ChaCha20-Poly1305 (authenticated encryption)
- **Keys**: Derived from node certificates + ephemeral keys
- **SID**: Source node fingerprint for provenance
- **Signature**: EdDSA signature for integrity

---

## Sample Sealed Envelope

A sealed envelope (from `make run-verbose`) looks like:

```json
{
  "version": "1.0",
  "id": "mu2l8LmB6bvJAiL",
  "sid": "6KbaPqxYq8p3hjDaUw3YBH",
  "traceId": "Or9bha2d6tDb2yC",
  "to": "math@fame.fabric",
  "replyTo": "rpc-N7GImNdeVMvRMQo@/Cb8WVCC4ML5RsFM/9gxwoGeeBBSR3Oh",
  "rtype": 2,
  "corrId": "3f1kkiuHVcbiTT3",
  "frame": {
    "type": "Data",
    "codec": "b64",
    "payload": "wOigrL848iSgv8qfUdntQTwMzEVRYBSTQLqY7Vwui7lJMHm2Akuze3gL5jBH0GKqw99canUn1EsrA6vss51OGgFyDTLbwz5rljcATB9TA8X7wERTvtUa8QWsaMfC5LFYJuc/nZsRqX7pZAXC3FWFvgwAUw==",
    "pd": "4Fg9MfgDCY09YqN0ep7Ntx"
  },
  "ts": "2025-08-29T23:56:10.366Z",
  "sec": {
    "sig": {
      "kid": "xAhddeRwu2UvuJr",
      "val": "IyaOG4hMLuafFAv8Sd77HUb1PhKobN0lCOOu7Qpa-y59QFH_3BMO98OPbKalzoKoJEsH9tkJimA9P7c4YQ2LDA"
    },
    "enc": {
      "alg": "chacha20-poly1305-channel",
      "kid": "auto-math@fame.fabric-7snnHCFG1FA5UGV",
      "val": "07d951bb68c86085f50e57b9"
    }
  }
}
```

**Key fields:**

- `sid`: Source node fingerprint (from SPIFFE cert)
- `frame.payload`: **Encrypted** payload (base64-encoded ciphertext)
- `sec.sig`: EdDSA signature (integrity + authenticity)
- `sec.enc`: Encryption metadata (algorithm, key ID, nonce/tag)

**Compare to overlay example:** Overlay has `sig` but NO `enc` (no encryption, only signing).

---

## Troubleshooting

### Certificate Errors

**Issue:** `UNABLE_TO_VERIFY_LEAF_SIGNATURE` or `certificate verification failed`

**Fix:** Ensure Caddy and FAME CA certificates are accessible:

```bash
# Check Caddy TLS CA
docker compose logs caddy
docker compose exec caddy ls -la /data/caddy/pki/authorities/local/

# Check FAME root CA
ls -la config/certs/
```

### Admission Failures

**Issue:** `Welcome service returned 401` or `Invalid OAuth2 token`

**Check:**

1. Verify OAuth2 server is running: `docker compose ps oauth2-server-internal`
2. Check client credentials in `.env` files
3. Verify Welcome service config: `docker compose logs welcome-internal`

**Debug:**

```bash
# Test OAuth2 token endpoint
curl -k -X POST https://localhost:8443/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=...&client_secret=..."
```

### CA Certificate Request Failures

**Issue:** `CA service returned 403` or `Invalid CA grant`

**Check:**

1. Ensure Welcome service issued CA grant
2. Verify CA service is running: `docker compose ps ca-internal`
3. Check CA configuration: `docker compose logs ca-internal`

**Debug:**

```bash
# Check CA service health
curl -k https://localhost:8443/fame/v1/ca/health
```

### SPIFFE Certificate Validation Failures

**Issue:** `Certificate path mismatch` or `Invalid SPIFFE ID`

**Check:**

1. Verify placement matches certificate path
2. Check SPIFFE cert contents:
   ```bash
   openssl x509 -in config/certs/issuing-ca.crt -text -noout
   ```
3. Ensure sentinel has correct `FAME_CA_CERTS` path

### Sealed Channel Encryption Failures

**Issue:** `Decryption failed` or `Invalid encryption key`

**Check:**

1. Ensure all nodes have `FAME_SECURITY_PROFILE=strict-overlay`
2. Verify certificates were issued successfully (check CA logs)
3. Ensure encryption level is compatible: `FAME_DEFAULT_ENCRYPTION_LEVEL=channel`

**Debug:**

```bash
# View envelope encryption details
make run-verbose | grep -A 20 "sec"
```

---

## Variations to Try

### 1. Compare with Overlay Example

**Switch to overlay mode** (disable X.509/SPIFFE, use raw public keys):

```bash
# .env.sentinel, .env.agent, .env.client
FAME_SECURITY_PROFILE=overlay  # Remove X.509/SPIFFE
FAME_ADMISSION_PROFILE=direct  # Remove Welcome service
```

**Expected:** Envelope signing but no encryption, OAuth2-only admission.

### 2. Sealed vs Channel Encryption

**Switch encryption level** to per-message sealing:

```bash
# .env.sentinel, .env.agent, .env.client
FAME_DEFAULT_ENCRYPTION_LEVEL=sealed  # Per-message encryption
```

**Expected:** Each message individually encrypted (vs channel-level encryption).

### 3. Dynamic Placement

**Replace static placement** with dynamic placement strategy in `welcome.yml`:

```yaml
placement:
  type: RoundRobinNodePlacementStrategy # Or custom strategy
  parent_nodes:
    - Cb8WVCC4ML5RsFM
    - AnotherSentinelID
```

**Expected:** Agents distributed across multiple sentinels.

### 4. Certificate Rotation

**Reduce certificate TTL** to test rotation:

```javascript
// scripts/setup-pki.mjs
validity: {
  notBefore: new Date(),
  notAfter: new Date(Date.now() + 60 * 1000)  // 1 minute
}
```

**Expected:** Certificates expire quickly, agents re-request new certs.

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

1. **Strict Overlay = Admission + Identity + Encryption**: Full enterprise security stack
2. **X.509/SPIFFE Certificates**: Cryptographic node identities with fabric path binding
3. **Federated Admission**: Welcome service issues placement + attach ticket + CA grant
4. **Dual Validation**: Sentinels validate both attach ticket AND certificate
5. **Sealed Channels**: Authenticated encryption (ChaCha20-Poly1305) for confidentiality
6. **Short-lived Certificates**: Automatic rotation eliminates long-lived credentials
7. **Zero-trust Architecture**: Cryptographic validation at every layer

---

## Differences from Previous Security Examples

| **Aspect**               | **Gated**        | **Overlay**           | **Strict Overlay (Advanced)**     |
| ------------------------ | ---------------- | --------------------- | --------------------------------- |
| **Admission**            | OAuth2 only      | OAuth2 only           | OAuth2 + Welcome service          |
| **Identity**             | None             | Raw public keys       | X.509/SPIFFE certificates         |
| **Path binding**         | No               | No                    | Yes (SPIFFE cert contains path)   |
| **Envelope signing**     | No               | Yes (EdDSA)           | Yes (EdDSA)                       |
| **Envelope encryption**  | No               | No                    | Yes (ChaCha20-Poly1305)           |
| **Certificate rotation** | N/A              | N/A                   | Short-lived certs (auto-rotation) |
| **License**              | OSS (Apache 2.0) | OSS (Apache 2.0)      | BSL (Business Source License)     |
| **Use case**             | Simple admission | Admission + integrity | Enterprise zero-trust             |

---

## Next Steps

- **Production Deployment**: Replace dev OAuth2/Welcome/CA with Auth0, Keycloak, HashiCorp Vault
- **Multi-Tenant Isolation**: Use SPIFFE IDs for tenant-specific routing and access control
- **Audit Trails**: Log all admission requests, certificate issuances, and sealed envelopes
- **Performance Tuning**: Optimize encryption algorithms and certificate caching
- **Custom Placement**: Implement custom placement strategies for load balancing
- **Certificate Monitoring**: Track certificate expirations and renewal rates

---

## Additional Resources

- [SPIFFE Specification](https://spiffe.io/)
- [X.509 Certificate Standard](https://en.wikipedia.org/wiki/X.509)
- [ChaCha20-Poly1305 AEAD](https://datatracker.ietf.org/doc/html/rfc8439)
- [Zero Trust Architecture](https://www.nist.gov/publications/zero-trust-architecture)
- [Naylence Advanced Security (BSL)](https://naylence.io/docs/advanced-security)
- [Business Source License](https://mariadb.com/bsl-faq-mariadb/)
