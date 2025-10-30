# Security Examples with Naylence

This folder contains **distributed security setups** demonstrating different **security models** in the Naylence fabric. All examples run with **Docker Compose** and focus specifically on **admission, authentication, and encryption profiles**.

Unlike the [distributed examples](../distributed), these examples emphasize **security-specific configurations** rather than general multi-agent patterns.

---

## Security Profiles Demonstrated

### [gated/](./gated/)

**Sentinel** runs in **gated** profile with OAuth2 admission control.

- **Admission**: OAuth2 client credentials flow
- **Security**: JWT validation before fabric access
- **Encryption**: TLS only (via Caddy), no overlay encryption
- **Use case**: Simple admission control

### [overlay/](./overlay/)

**Sentinel** runs in **overlay** profile with envelope signing.

- **Admission**: OAuth2 client credentials flow
- **Security**: Envelope signing with public key exchange
- **Encryption**: TLS + envelope signatures (tamper-evidence, non-repudiation)
- **Use case**: Admission + message integrity

### [advanced/](./advanced/)

**Sentinel + agents** run in **strict-overlay** profile with X.509/SPIFFE certificates.

- **Admission**: Welcome service (placement + attach tickets + CA grants)
- **Security**: SPIFFE X.509 certificates + envelope signing + sealed channels
- **Encryption**: TLS + envelope signatures + ChaCha20-Poly1305 encryption
- **Use case**: Enterprise zero-trust (BSL-licensed)

### [stickiness/](./stickiness/)

**Load-balanced replicas** with **channel encryption** and **sticky routing**.

- **Admission**: Welcome service with X.509/SPIFFE
- **Security**: Strict-overlay + AFTLoadBalancerStickinessManager
- **Encryption**: Channel-level encryption (requires stickiness for multi-message setup)
- **Use case**: Secure load balancing with stateful channels (BSL-licensed)

### [http-connector/](./http-connector/)

**HTTP connector** replacing default WebSocket transport.

- **Admission**: OAuth2 with direct-http profile
- **Security**: Overlay-callback with HMAC-signed reverse authentication
- **Transport**: Dual half-duplex HTTP (downstream + upstream callback)
- **Use case**: Constrained networks without WebSocket support

---

## What "Security" Means Here

### Admission Control

How a node is authorized to join the fabric:

- **Open**: No authentication (dev/testing only)
- **Gated**: OAuth2 bearer tokens required
- **Welcome**: Federated admission service (placement + tickets)
- **Direct**: Direct connection to sentinel with credentials
- **Direct-HTTP**: HTTP-based admission with OAuth2

### Identity

How nodes prove who they are:

- **OAuth2 bearer tokens**: Simple client credentials flow
- **Public keys**: Raw key exchange during node attach
- **SPIFFE/X.509 certificates**: Cryptographic workload identity with path binding

### Encryption

How messages are protected:

- **Transport TLS**: Via Caddy reverse proxy (all examples)
- **Envelope signing**: Overlay profile (EdDSA signatures)
- **Channel encryption**: Strict-overlay (ChaCha20-Poly1305 for channels)
- **Sealed encryption**: Strict-overlay (per-message encryption)

### Configuration

Security behavior controlled via environment variables:

- `FAME_SECURITY_PROFILE`: `open`, `gated`, `overlay`, `strict-overlay`, `overlay-callback`
- `FAME_ADMISSION_PROFILE`: `none`, `direct`, `direct-http`, `welcome`
- `FAME_DEFAULT_ENCRYPTION_LEVEL`: `plaintext`, `channel`, `sealed`

---

## Running the Examples

Each directory contains its own `Makefile` with common targets:

```bash
make init        # Generate secrets and certificates (if needed)
make build       # Build TypeScript sources
make start       # Initialize, build, and start all services
make run         # Run the TypeScript client (communicates with math agent)
make run-verbose # Run client with FAME_SHOW_ENVELOPES=true to inspect envelopes
make stop        # Stop all services
make clean       # Remove generated .env files, secrets, certificates, build artifacts
```

All examples typically include:

- **caddy**: Reverse proxy with TLS termination
- **oauth2-server**: Development OAuth2 provider (for admission tokens)
- **sentinel**: Naylence sentinel node with configured security profile
- **math-agent**: Sample RPC agent (some examples have multiple replicas)
- **welcome** (advanced/stickiness): Admission service with placement
- **ca** (advanced/stickiness): Certificate authority for SPIFFE certs

---

## Quick Comparison

| Example            | Admission   | Security         | Identity      | Encryption              | License |
| ------------------ | ----------- | ---------------- | ------------- | ----------------------- | ------- |
| **gated**          | direct      | gated            | OAuth2 JWT    | TLS only                | OSS     |
| **overlay**        | direct      | overlay          | Public keys   | TLS + signing           | OSS     |
| **advanced**       | welcome     | strict-overlay   | X.509/SPIFFE  | TLS + signing + sealed  | BSL     |
| **stickiness**     | welcome     | strict-overlay   | X.509/SPIFFE  | TLS + signing + channel | BSL     |
| **http-connector** | direct-http | overlay-callback | OAuth2 + HMAC | TLS + signing           | OSS     |

---

## Security Profile Progression

### Level 1: Gated (Admission Only)

```
OAuth2 Token → Sentinel validates → Access granted
```

- **What it provides**: Basic admission control
- **What it lacks**: No message integrity, no encryption beyond TLS
- **When to use**: Simple authentication requirements

### Level 2: Overlay (Admission + Integrity)

```
OAuth2 Token → Admission
Public Keys → Exchange during attach
Envelopes → Signed with EdDSA
```

- **What it provides**: Message integrity, tamper-evidence, provenance (SID)
- **What it lacks**: Message confidentiality (no encryption beyond TLS)
- **When to use**: Need to verify message origin and detect tampering

### Level 3: Strict Overlay (Admission + Identity + Encryption)

```
OAuth2 Token → Welcome service → Placement + Attach Ticket + CA Grant
CA Service → Issues X.509/SPIFFE certificate
Sentinel → Validates ticket + certificate
Envelopes → Signed + Encrypted (ChaCha20-Poly1305)
```

- **What it provides**: Full enterprise security stack
- **What it requires**: BSL-licensed advanced security package
- **When to use**: Zero-trust deployments, regulated industries

### Level 4: Stickiness (Strict Overlay + Stateful Channels)

```
Strict Overlay + Channel Encryption + AFTLoadBalancerStickinessManager
```

- **What it provides**: Secure load balancing with channel-level encryption
- **Why it matters**: Channel encryption requires multi-message setup → same replica
- **When to use**: Load-balanced agents with encrypted channels

### Level 5: HTTP Connector (Alternative Transport)

```
Overlay + HTTP instead of WebSocket
Downstream: Agent → Sentinel (OAuth2)
Upstream: Sentinel → Agent (HMAC JWT callback)
```

- **What it provides**: HTTP-based transport for restricted networks
- **Trade-offs**: More complex (dual links), stateless auth (per-request JWT)
- **When to use**: WebSocket blocked, HTTP-only infrastructure

---

## Special Notes

### Development vs Production

**These examples use development-only components:**

- OAuth2 server: Simple dev token issuer (NOT production-ready)
- Welcome service: Static placement strategy (use dynamic in production)
- CA service: Development certificate authority (use HashiCorp Vault, etc.)
- Caddy: Internal CA (use Let's Encrypt or corporate CA in production)

**For production:**

- Replace OAuth2 server with Auth0, Keycloak, Okta, or Azure AD
- Use production-grade CA (HashiCorp Vault, AWS Private CA, cert-manager)
- Implement dynamic placement strategies for multi-tenant isolation
- Use real TLS certificates (not Caddy internal CA)
- Pin exact Docker image versions (not `:latest`)
- Never reuse development secrets

### TLS vs Overlay Encryption

**Transport TLS (Caddy):**

- Encrypts HTTP/WebSocket connections
- Protects data in transit between services
- Terminates at reverse proxy

**Overlay Encryption (Strict Overlay):**

- Encrypts envelopes at application layer
- End-to-end protection (sentinel → agent)
- Independent of transport layer
- Survives TLS termination/inspection

**Both are complementary, not exclusive.**

### BSL-Licensed Features

**Advanced** and **Stickiness** examples require:

- `@naylence/advanced-security` package (BSL-licensed)
- `naylence/agent-sdk-adv-node:0.3.3` Docker image
- Business Source License compliance

**BSL means:**

- Free for development, testing, evaluation
- Requires commercial license for production use
- Converts to open source after 4 years

### HTTP Connector Special Considerations

**HTTP connector is unique:**

- Only example not using WebSocket by default
- Requires custom node configuration (not standard presets)
- Two separate HTTP links (downstream + upstream callback)
- Stateless authentication (no session state)
- HMAC-signed JWTs for reverse authentication
- `FAME_PUBLIC_URL` critical for callback routing

---

## Inspecting Security in Action

Run any example with verbose logging to see security metadata:

```bash
make run-verbose
```

**Look for envelope fields:**

```json
{
  "sec": {
    "sig": {
      "kid": "xAhddeRwu2UvuJr",
      "val": "IyaOG4hMLuafFAv8Sd77HUb1PhKobN0lCOOu7Qpa-y59..."
    },
    "enc": {
      "alg": "chacha20-poly1305-channel",
      "kid": "auto-math@fame.fabric-7snnHCFG1FA5UGV",
      "val": "07d951bb68c86085f50e57b9"
    }
  }
}
```

**Security field breakdown:**

- `sec.sig`: Envelope signature (present in overlay, strict-overlay)
  - `kid`: Key ID used for signing
  - `val`: EdDSA signature value
- `sec.enc`: Encryption metadata (present in strict-overlay with channel/sealed)
  - `alg`: Encryption algorithm (ChaCha20-Poly1305)
  - `kid`: Encryption key ID
  - `val`: Nonce/authentication tag

**Missing `sec` field?** → Open security profile (no signing/encryption)

---

## Common Troubleshooting

### Certificate Errors

**Symptoms:** `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, `DEPTH_ZERO_SELF_SIGNED_CERT`

**Causes:**

- Caddy certificates not accessible
- Missing `NODE_EXTRA_CA_CERTS` / `SSL_CERT_FILE` env vars
- Services started before Caddy healthy

**Solutions:**

```bash
# Check Caddy health
docker compose ps caddy

# Verify certificates exist
docker compose exec caddy ls -la /data/caddy/pki/authorities/local/

# Ensure healthcheck passes before dependent services start
```

### OAuth2 Token Failures

**Symptoms:** `401 Unauthorized`, `Invalid token`, `Invalid issuer`

**Causes:**

- Client credentials mismatch
- Issuer URL mismatch between `.env` files
- Audience mismatch

**Solutions:**

```bash
# Re-generate secrets
make clean && make init

# Verify credentials consistency
grep DEV_CLIENT_ID config/.env.*

# Check issuer/audience alignment
grep FAME_JWT config/.env.*
```

### SPIFFE Certificate Validation Failures

**Symptoms:** `Certificate path mismatch`, `Invalid SPIFFE ID`

**Causes:**

- Welcome service placement doesn't match certificate path
- CA service configuration issues
- Root CA trust not established

**Solutions:**

```bash
# Check CA service logs
docker compose logs ca-internal

# Verify root CA exists
ls -la config/certs/root-ca.crt

# Check FAME_CA_CERTS path in .env files
```

### Stickiness Not Working

**Symptoms:** Requests bouncing between replicas

**Causes:**

- Missing wildcard logical: `*.fame.fabric`
- Stickiness manager not configured
- Channel encryption disabled

**Solutions:**

```bash
# Verify agent config includes wildcard
grep "requested_logicals" src/config.ts

# Check sentinel has stickiness manager
grep "AFTLoadBalancerStickinessManager" src/config.ts

# Verify channel encryption enabled
grep "FAME_DEFAULT_ENCRYPTION_LEVEL" config/.env.sentinel
```

---

## Learning Path

**Recommended order for learning:**

1. **Start with gated/** — Understand basic OAuth2 admission
2. **Progress to overlay/** — Add envelope signing and integrity
3. **Try http-connector/** — Understand alternative transports (optional)
4. **Advance to advanced/** — Full enterprise security stack
5. **Finish with stickiness/** — Advanced load balancing patterns

**Skip stickiness** if you don't need load-balanced agents with channel encryption.

**Skip http-connector** if you can use WebSocket (it's simpler).

---

## Additional Resources

- [Naylence Security Documentation](https://naylence.io/docs/security)
- [OAuth2 Client Credentials Flow](https://oauth.net/2/grant-types/client-credentials/)
- [SPIFFE Specification](https://spiffe.io/)
- [X.509 Certificate Standard](https://en.wikipedia.org/wiki/X.509)
- [EdDSA (Ed25519) Algorithm](https://en.wikipedia.org/wiki/EdDSA)
- [ChaCha20-Poly1305 AEAD](https://datatracker.ietf.org/doc/html/rfc8439)
- [Zero Trust Architecture](https://www.nist.gov/publications/zero-trust-architecture)
- [Business Source License FAQ](https://mariadb.com/bsl-faq-mariadb/)

---

## Next Steps

After exploring security examples:

- Review [distributed examples](../distributed/) for multi-agent patterns
- Check [persistence examples](../persistence/) for state management
- Explore [monitoring examples](../monitoring/) for observability
- Try [delivery examples](../delivery/) for reliability patterns
