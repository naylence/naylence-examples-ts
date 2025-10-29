# Hierarchical Fabric (Biomes) Example — Parent/Child Sentinels + Deep-to-Deep Delegation# Distributed · Biomes

This example demonstrates a **hierarchical fabric** where a **main (parent) sentinel** fronts multiple **child sentinels**, each hosting its own agents. In Naylence, everything "behind" a sentinel is a **biome**. Here, two child biomes hang off a single main sentinel. It also showcases **deep-to-deep routing** by delegating a method call from one child biome to another through the main sentinel._Parity target:_ `examples/distributed/biomes`.

---Hierarchical biomes connect parent and child sentinels for deep delegation.

## Architecture## TODO

````- [ ] Docker Compose for multi-sentinel layout

client  →  main sentinel  →  child sentinel 1  →  math-agent1- [ ] Parent + child sentinel configs

                        └→  child sentinel 2  →  math-agent2- [ ] Agent + client scripts

```- [ ] Diagram of envelope flow


The client attaches **only** to the main sentinel. Address resolution and routing traverse the sentinel tree to reach agents located in child biomes.

---

## What This Shows

* **Biomes (hierarchical sentinels):** Model separate domains behind each sentinel and stitch them into a single fabric.
* **Cross-biome routing:** Call agents in child biomes using **logical addresses**; the main sentinel forwards requests to the right child.
* **Deep-to-deep routing (delegation):** `math-agent2` implements **`multiply`** by **delegating** the work to `math-agent1`, demonstrating routing from one child biome to another **through the main sentinel**.
* **Mixed capabilities:** One agent serves arithmetic RPC (add/multiply), the other serves a **streaming** Fibonacci endpoint (and delegated multiply).
* **Simple admission (dev):** Children and agents use **direct (open)** admission for clarity; production can switch to **gated/overlay/strict-overlay** with the same topology.

---

> ⚠️ **Security note:** This demo is intentionally insecure for clarity. There is **no auth, TLS, or overlay security** enabled here. Later examples will layer in secure admission, identities, and sealed channels.

---

## Files

* **`src/common.ts`** — Shared agent addresses
* **`src/sentinel.ts`** — Entrypoint for all sentinels (main and children)
* **`src/math-agent1.ts`** — Arithmetic RPC (`add`, `multiply`) at address **`math1@fame.fabric`**
* **`src/math-agent2.ts`** — Streaming Fibonacci (`fib_stream`) and delegated `multiply` (forwards to `math1@fame.fabric`) at **`math2@fame.fabric`**
* **`src/client.ts`** — Attaches to main sentinel and calls both agents by address
* **`docker-compose.yml`** — Orchestrates main sentinel, two child sentinels, and two agents using a **single shared Docker image**
* **`Dockerfile`** — Multi-stage build creating the shared runtime image
* **`Makefile`** — Convenience targets: `start`, `run`, `run-verbose`, `stop`, `clean`

---

## Docker Compose Configuration

All services (main sentinel, child sentinels, and agents) use a **single shared Docker image** (`naylence-biomes:latest`) built once and reused:

* **Main sentinel:** Exposes port 8000 to the host
* **Child sentinels:** Attach upstream to main sentinel using:
  * `FAME_ADMISSION_PROFILE=open`
  * `FAME_DIRECT_ADMISSION_URL=ws://main-sentinel:8000/fame/v1/attach/ws/downstream`
* **Agents:** Attach to their respective child sentinel with the same `open` profile

The YAML anchor pattern (`x-common-service`) ensures consistent configuration across all services.

---

## Address Propagation & Binding

The **main sentinel** can resolve and route to agent addresses that are "hiding" in downstream child biomes. The client only needs the **logical agent address**—for example, `math1@fame.fabric` and `math2@fame.fabric`—and the fabric handles discovery and routing across the hierarchy.

There is **no centralized dedicated address registry**: child sentinels propagate address announcements **upstream** to the parent, and the parent binds calls dynamically to the correct child biome.

---

## How It Works (Flow)

1. **Main sentinel** starts and exposes `ws://localhost:8000` to the host

2. **Child sentinel 1** and **child sentinel 2** start and **attach upstream** to the main sentinel using **direct (open)** admission

3. **Agents** start and attach to their **local child sentinel**:
   * `math-agent1` → `child-sentinel1`
   * `math-agent2` → `child-sentinel2`

4. **Client** attaches to the **main sentinel** and resolves logical addresses:
   * `math1@fame.fabric` → routed to **child sentinel 1 → math-agent1**
   * `math2@fame.fabric` → routed to **child sentinel 2 → math-agent2**

5. **Deep-to-deep delegated multiply:** The client calls `multiply` on **`math2@fame.fabric`**; `math-agent2` delegates the call to **`math1@fame.fabric`**

   Call path for `multiply`:
````

client (multiply on math2@fame.fabric)
→ main sentinel → child sentinel 2 → math-agent2
→ child sentinel 2 → main sentinel → child sentinel 1 → math-agent1
→ (result returns along the reverse path)

````

6. Requests/replies (and streams) traverse the sentinel tree transparently

---

## Run It

```bash
# Start all services (main sentinel, child sentinels, agents)
make start

# Run client (calls math1.add/multiply, math2.multiply (delegated), then math2.fib_stream)
make run

# Run client with verbose envelope logging
make run-verbose

# View logs
make logs              # All services
make logs-main         # Main sentinel only
make logs-child1       # Child sentinel 1 only
make logs-agent1       # Math agent 1 only

# Stop all services
make stop

# Clean up everything
make clean
````

> The client uses `FAME_DIRECT_ADMISSION_URL=ws://localhost:8000/fame/v1/attach/ws/downstream` to attach to the main sentinel.

---

## Expected Output

```bash
$ make run
7                    # add(3, 4) on math-agent1
42                   # multiply(6, 7) on math-agent2 (delegated to math-agent1)
0 1 1 2 3 5 8 13 21 34  # fib_stream(10) on math-agent2
```

---

## Observing the Hierarchy

- **Envelope logs:** Use `make run-verbose` to watch routing metadata as calls traverse **main → child → agent** and back
- **Delegation in action:** Run `make run` and observe that a `multiply` requested on `math2@fame.fabric` ultimately executes on `math1@fame.fabric` in the other biome
- **Service isolation:** Stop one child sentinel and note that only the agent in that biome becomes unreachable; the other biome continues to serve
- **Streaming across biomes:** `fib_stream` demonstrates a streaming response flowing **up** from a child biome to the client with no code changes

---

## When to Use Hierarchical Fabrics

- **Network or organizational boundaries** where each biome (child sentinel) represents an environment, team, or region
- **Blast-radius control:** Faults or restarts in one biome don't take down others
- **Policy and security segmentation:** Each biome can run its own admission/security profile while still joining a larger fabric through the main sentinel

---

## Security Notes

This demo uses **`open`** admission for simplicity. In real deployments:

- Prefer **`gated`** (OAuth2/JWT) or **`overlay`** (signed envelopes) for OSS stacks
- Use **`strict-overlay`** (with the Advanced Security add-on) for SPIFFE/X.509 identities and sealed overlay encryption; the hierarchical topology is unchanged

---

## Troubleshooting

- **Client can't connect** → Confirm the main sentinel is healthy on port **8000** and the client's `FAME_DIRECT_ADMISSION_URL` points to it
- **Agent 1 not reachable** → Check that **child-sentinel1** attached to the main sentinel (healthcheck) and that **math-agent1** attached to **child-sentinel1**
- **Agent 2 not reachable** → Same as above, but for **child-sentinel2/math-agent2**
- **Delegated multiply fails** → Confirm `math-agent1` is healthy and reachable; check that `math-agent2` delegates to the correct logical address (`math1@fame.fabric`)
- **Streams don't print** → Run with `make run-verbose` to confirm messages; ensure `fib_stream` is called with `{ stream: true }` option

---

## What to Tweak Next

- Add a **third child biome** and another agent to see fan-out
- Switch the child biomes to **`gated`** or **`overlay`** profiles
- Introduce **wildcard logicals** and the **stickiness** manager (advanced security) to load-balance replicas in a child biome
- Place agents on separate hosts; set `FAME_PUBLIC_URL` on sentinels if your ingress sits behind TLS/hostnames

---

## Single Docker Image Architecture

This example uses a **single shared Docker image** (`naylence-biomes:latest`) for all services:

- **Benefits:**
  - Faster builds (image built once, used by all services)
  - Less disk space (no duplicate layers)
  - Easier maintenance (single Dockerfile, single build process)
  - Consistent environment (all services guaranteed to use identical runtime)

- **Implementation:**
  - YAML anchor (`x-common-service`) defines shared configuration
  - Each service overrides only the `command` and service-specific environment variables
  - All services mount the same compiled code from `./dist`
