[![Join our Discord](https://img.shields.io/badge/Discord-Join%20Chat-blue?logo=discord)](https://discord.gg/nwZAeqdv7y)

# Naylence Examples (TypeScript)

This workspace ports the Python example catalog to TypeScript so you can exercise the Naylence Agent SDK, runtime, and Fame protocol end-to-end without leaving the Node.js ecosystem.

The initial milestone provides a working TypeScript toolchain and mirrors the Python layout so future ports can land incrementally.

---

## Project layout

```
examples/
  simple/                      # single-process, zero-config building blocks
  distributed/                 # multi-process + fabric topologies (soon)
  llm/                         # model-backed agents (soon)
  monitoring/                  # observability setups (soon)
  persistence/                 # durable agent state patterns (soon)
  delivery/                    # delivery semantics walkthroughs (soon)
  security/                    # progressive security tiers (soon)
```

Each example folder will receive a focused `README.md`, TypeScript sources, and helper scripts as their ports land. The structure stays aligned with the Python version for side-by-side learning.

---

## Requirements

- Node.js 18+
- Local checkout of the Naylence TypeScript packages (`naylence-agent-sdk-ts`, `naylence-runtime-ts`, `naylence-core-ts`, `naylence-factory-ts`)

Install dependencies from this directory:

```bash
npm install
```

---

## Quick start

Run any of the single-process examples. The npm scripts export `FAME_PLUGINS=naylence-runtime` for you, matching the quickstart in `naylence-agent-sdk-ts`:

```bash
npm run example:simple:function      # Agent.fromHandler timestamp demo
npm run example:simple:echo          # Minimal BaseAgent echo
npm run example:simple:bg-task       # Background task + polling
npm run example:simple:rpc           # RPC operations + streaming Fibonacci
npm run example:simple:a2a           # Minimal A2A completed task
npm run example:simple:ping-pong     # Ping forwards to Pong and returns reply
```

More folders will light up as additional ports land.

---

## Contributing

1. Create or pick the matching folder under `examples/`
2. Add TypeScript sources that mirror the Python behavior
3. Document usage in the folder `README.md`
4. Keep examples Node.js and browser friendly unless noted otherwise

When in doubt, check the Python version for behavior and notes.
